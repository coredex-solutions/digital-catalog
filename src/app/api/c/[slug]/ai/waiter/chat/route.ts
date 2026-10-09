import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { transcribeAudio } from "@/lib/ai-voice";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit/middleware";
import { getAiWaiterCatalog } from "@/lib/catalog/ai-access";
import { getPublicMenu } from "@/lib/catalog/publishing";
import { readVariants } from "@/lib/catalog/dish-info";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MODEL = "gemini-2.0-flash";

const MAX_HISTORY_MESSAGES = 10;
const MAX_USER_TEXT_LENGTH = 500;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const db = getDb();

  const rateLimit = await checkRateLimit(request, RATE_LIMITS.aiChat);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  try {
    // Only catalogs that switched the waiter on and are paid up may spend AI credits
    const catalog = await getAiWaiterCatalog(slug);
    if (!catalog) {
      return NextResponse.json({ error: "Catalog not found" }, { status: 404 });
    }
    if (!catalog.aiWaiterEnabled || !catalog.subscriptionLive) {
      return NextResponse.json({ error: "The AI waiter is not available for this menu" }, { status: 403 });
    }

    if (!GOOGLE_API_KEY) {
      return NextResponse.json({ error: "The AI waiter is not configured on this server" }, { status: 503 });
    }

    const formData = await request.formData();
    const message = formData.get("message") as string;
    const audio = formData.get("audio") as Blob | null;
    const rawHistory = formData.get("history") as string;
    const rawCart = formData.get("cart") as string;

    let history = [];
    try { history = JSON.parse(rawHistory || "[]").slice(-MAX_HISTORY_MESSAGES); } catch { history = []; }

    let currentCart = [];
    try { currentCart = JSON.parse(rawCart || "[]"); } catch { currentCart = []; }

    let userText = message;
    if (audio) {
      if (audio.size > 2 * 1024 * 1024) {
        return NextResponse.json({ error: "Audio file too large" }, { status: 400 });
      }
      if (!OPENAI_API_KEY) {
        return NextResponse.json({ error: "Voice messages are not configured on this server" }, { status: 503 });
      }
      const audioBuffer = Buffer.from(await audio.arrayBuffer());
      userText = await transcribeAudio(audioBuffer, audio.type);
    }

    if (!userText || userText.length > MAX_USER_TEXT_LENGTH) {
      return NextResponse.json({
        error: userText ? "Message too long" : "No message provided"
      }, { status: 400 });
    }

    const catalogId = catalog.id;
    const businessName = catalog.name;

    const [knowledgeRes, publicMenu] = await Promise.all([
      db.execute({
        sql: "SELECT question, answer FROM catalog_ai_knowledge WHERE catalog_id = ? AND is_active = 1 LIMIT 50",
        args: [catalogId]
      }),
      // The published menu guests see (not the owner's draft)
      getPublicMenu(catalogId),
    ]);

    const knowledgeBase = knowledgeRes.rows.map(r => `Q: ${r.question}\nA: ${r.answer}`).join("\n\n");
    // Sold-out items cannot be ordered, so the waiter never sees them. Dishes with options
    // list them, so the waiter can mention the choice (the guest picks it on the dish).
    const menuItems = publicMenu.items
      .filter((r) => Number(r.is_available ?? 1) === 1)
      .slice(0, 100)
      .map((r) => {
        const options = readVariants(r.variants);
        const currency = String(r.currency || "USD");
        const optionText = options.length ? `; options: ${options.map((o) => `${o.name_en || o.name_ar} ${o.price} ${currency}`).join(", ")}` : "";
        return `- [ID: ${r.id}] ${r.name_en} (${r.price} ${currency}${optionText})`;
      })
      .join("\n");
    const cartDisplay = currentCart.map((c: any) => `- ${c.name_en} (ID: ${c.id}, Qty: ${c.quantity})`).join("\n") || "Cart is currently empty.";

    const settingsRes = await db.execute({
      sql: "SELECT ai_waiter_name, ai_waiter_persona FROM catalog_settings WHERE catalog_id = ?",
      args: [catalogId]
    });
    const settings = settingsRes.rows[0] as any;
    const aiName = settings?.ai_waiter_name || "AI Waiter";
    const aiPersona = settings?.ai_waiter_persona || "You are a professional, charming, and helpful AI Waiter.";

    const systemPrompt = `${aiPersona} Your name is ${aiName}. You work at "${businessName}".

CORE RULES:
1. ONLY answer questions about "${businessName}" using the provided Knowledge Base and Menu.
2. Be concise (2-3 sentences max).

ACTIONS - CART MANAGEMENT:
You can manage the user's cart using these exact tags at the end of your response:

1. ADD NEW ITEM: [ACTION: ADD_TO_CART, ID: item_id, QTY: number]
2. UPDATE QUANTITY: [ACTION: UPDATE_CART, ID: item_id, QTY: number] (Set total quantity for an item already in cart)
3. REMOVE ITEM: [ACTION: REMOVE_FROM_CART, ID: item_id]

RULES FOR ACTIONS:
- STRICT INTENT: ONLY trigger actions if the user explicitly expresses a clear desire to buy, order, or add an item (e.g., "I'll take...", "Order me...", "Add to cart").
- NO AUTO-ADD ON INQUIRY: NEVER trigger ADD_TO_CART if the user is just asking about an item's ingredients, price, or description (e.g., if user asks "What is the Baklava?", DO NOT add it. Just explain it).
- AMBIGUITY: If you are unsure if the user wants to order, politely ask: "Would you like me to add that to your cart?" instead of triggering the action.
- For UPDATE: If user says "add one more", look at current cart qty and add 1.
- Confirm the change to the user in text before the tag.

CURRENT CART:
${cartDisplay}

KNOWLEDGE BASE:
${knowledgeBase}

MENU (Use IDs for actions):
${menuItems}

LANGUAGE: Respond only in Arabic or English. If the latest message is in Arabic (including Lebanese dialect or Arabizi), respond in Arabic with full diacritics (Harakat); otherwise respond in English.`;

    const chatMessages = [
      ...history.map((h: any) => ({
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: h.content }]
      })),
      { role: "user", parts: [{ text: userText }] }
    ];

    const aiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: chatMessages,
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { temperature: 0.4, maxOutputTokens: 500, topP: 0.8, topK: 40 }
        })
      }
    );

    if (!aiRes.ok) throw new Error("AI Engine Busy");

    const aiData = await aiRes.json();
    let aiResponse = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "I apologize, I missed that. Could you repeat?";

    // Action detection & Cleaning
    const actions: any[] = [];

    // Global regex to find all actions
    const allActionsRegex = /\[ACTION:.*?\]/gi;
    const foundActionTags = aiResponse.match(allActionsRegex) || [];

    for (const tag of foundActionTags) {
      const addMatch = tag.match(/ADD_TO_CART.*?ID:.*?([^,\]\s]+).*?QTY:.*?(\d+)/i);
      const updateMatch = tag.match(/UPDATE_CART.*?ID:.*?([^,\]\s]+).*?QTY:.*?(\d+)/i);
      const removeMatch = tag.match(/REMOVE_FROM_CART.*?ID:.*?([^,\]\s]+)/i);

      if (addMatch) {
        actions.push({ type: "ADD_TO_CART", itemId: addMatch[1].trim(), quantity: parseInt(addMatch[2]) || 1 });
      } else if (updateMatch) {
        actions.push({ type: "UPDATE_CART", itemId: updateMatch[1].trim(), quantity: parseInt(updateMatch[2]) || 1 });
      } else if (removeMatch) {
        actions.push({ type: "REMOVE_FROM_CART", itemId: removeMatch[1].trim() });
      }
    }

    aiResponse = aiResponse.replace(/\[ACTION:.*?\]/gi, "").trim();
    const detectedLang = /[\u0600-\u06FF]/.test(aiResponse) ? "ar" : "en";

    return NextResponse.json({
      text: aiResponse,
      userText: userText,
      detectedLang,
      actions // Now returning plural actions
    });

  } catch (error: any) {
    console.error("AI Waiter Security/Logic Error:", error);
    return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 500 });
  }
}
