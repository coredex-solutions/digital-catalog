import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { transcribeAudio } from "@/lib/ai-voice";
import { checkRateLimit } from "../../../../../../../../lib/ratelimit";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const MODEL = "gemini-2.0-flash";

const MAX_HISTORY_MESSAGES = 10;
const MAX_USER_TEXT_LENGTH = 500;
const RATE_LIMIT_REQUESTS = 15;
const RATE_LIMIT_WINDOW = 60000;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const db = getDb();

  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (!checkRateLimit(ip, RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW)) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  try {
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
      const audioBuffer = Buffer.from(await audio.arrayBuffer());
      userText = await transcribeAudio(audioBuffer, audio.type);
    }

    if (!userText || userText.length > MAX_USER_TEXT_LENGTH) {
      return NextResponse.json({
        error: userText ? "Message too long" : "No message provided"
      }, { status: 400 });
    }

    const catalogRes = await db.execute({
      sql: "SELECT id, name, business_type FROM catalogs WHERE slug = ? AND is_active = 1",
      args: [slug]
    });

    if (catalogRes.rows.length === 0) {
      return NextResponse.json({ error: "Catalog not found" }, { status: 404 });
    }

    const catalogId = catalogRes.rows[0].id as string;
    const businessName = catalogRes.rows[0].name as string;

    const [knowledgeRes, itemsRes] = await Promise.all([
      db.execute({
        sql: "SELECT question, answer FROM catalog_ai_knowledge WHERE catalog_id = ? AND is_active = 1 LIMIT 50",
        args: [catalogId]
      }),
      db.execute({
        sql: "SELECT id, name_en, name_ar, description_en, description_ar, price FROM menu_items WHERE catalog_id = ? AND is_active = 1 LIMIT 100",
        args: [catalogId]
      })
    ]);

    const knowledgeBase = knowledgeRes.rows.map(r => `Q: ${r.question}\nA: ${r.answer}`).join("\n\n");
    const menuItems = itemsRes.rows.map(r => `- [ID: ${r.id}] ${r.name_en} (${r.price} USD)`).join("\n");
    const cartDisplay = currentCart.map((c: any) => `- ${c.name_en} (ID: ${c.id}, Qty: ${c.quantity})`).join("\n") || "Cart is currently empty.";

    const systemPrompt = `You are a professional, charming, and helpful AI Waiter at "${businessName}".

CORE RULES:
1. ONLY answer questions about "${businessName}" using the provided Knowledge Base and Menu.
2. Be concise (2-3 sentences max).

ACTIONS - CART MANAGEMENT:
You can manage the user's cart using these exact tags at the end of your response:

1. ADD NEW ITEM: [ACTION: ADD_TO_CART, ID: item_id, QTY: number]
2. UPDATE QUANTITY: [ACTION: UPDATE_CART, ID: item_id, QTY: number] (Set total quantity for an item already in cart)
3. REMOVE ITEM: [ACTION: REMOVE_FROM_CART, ID: item_id]

RULES FOR ACTIONS:
- ONLY trigger actions if the user explicitly asks to add, update, or remove an item.
- For UPDATE: If user says "add one more", look at current cart qty and add 1. If cart has 1, the action should be QTY: 2.
- For REMOVE: Use if they say "remove", "delete", or "cancel" a specific item.
- Confirm the change to the user in text before the tag.

CURRENT CART:
${cartDisplay}

KNOWLEDGE BASE:
${knowledgeBase}

MENU (Use IDs for actions):
${menuItems}

LANGUAGE: Respond in the language of the latest message. For ARABIC, use full diacritics (Harakat).`;

    const chatMessages = [
      ...history.map((h: any) => ({
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: h.content }]
      })),
      { role: "user", parts: [{ text: userText }] }
    ];

    if (!GOOGLE_API_KEY) throw new Error("AI Service Unavailable");

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
