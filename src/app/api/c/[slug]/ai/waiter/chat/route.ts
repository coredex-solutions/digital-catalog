import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { transcribeAudio, synthesizeSpeech } from "@/lib/ai-voice";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const MODEL = "gemini-1.5-flash";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const db = getDb();

  try {
    const formData = await request.formData();
    const message = formData.get("message") as string;
    const audio = formData.get("audio") as Blob | null;
    const history = JSON.parse((formData.get("history") as string) || "[]");

    // 1. Get catalog context
    const catalogRes = await db.execute({
      sql: "SELECT id, name, business_type FROM catalogs WHERE slug = ?",
      args: [slug]
    });

    if (catalogRes.rows.length === 0) {
      return NextResponse.json({ error: "Catalog not found" }, { status: 404 });
    }

    const catalogId = catalogRes.rows[0].id as string;
    const businessName = catalogRes.rows[0].name as string;

    // 2. STT if audio is provided
    let userText = message;
    if (audio) {
      const audioBuffer = Buffer.from(await audio.arrayBuffer());
      userText = await transcribeAudio(audioBuffer, audio.type);
    }

    if (!userText) {
      return NextResponse.json({ error: "No message provided" }, { status: 400 });
    }

    // 3. Fetch Knowledge Base for RAG
    // Simple search: In a real app we'd use vector embeddings, but for a catalog 
    // we can fetch all or do a keyword search. Since knowledge base is small (10-50 q's), we fetch all.
    const knowledgeRes = await db.execute({
      sql: "SELECT question, answer FROM catalog_ai_knowledge WHERE catalog_id = ? AND is_active = 1",
      args: [catalogId]
    });

    const itemsRes = await db.execute({
      sql: "SELECT name_en, name_ar, description_en, description_ar, price FROM menu_items WHERE catalog_id = ? AND is_active = 1",
      args: [catalogId]
    });

    const knowledgeBase = knowledgeRes.rows.map(r => `Q: ${r.question}\nA: ${r.answer}`).join("\n\n");
    const menuItems = itemsRes.rows.map(r => `- ${r.name_en} (${r.price} USD): ${r.description_en}`).join("\n");

    // 4. Brain (Gemini)
    const systemPrompt = `You are a professional, charming, and helpful AI Waiter at "${businessName}".
Your goals:
1. Answer customer questions using only the Knowledge Base and Menu Items provided.
2. If you don't know something, be honest but polite (e.g., "Let me ask the human waiter for you").
3. Be concise and conversational, like a real waiter.
4. Try to upsell naturally when appropriate.
5. You can speak English, Arabic, and French. Use the language the user speaks.

KNOWLEDGE BASE:
${knowledgeBase}

MENU ITEMS:
${menuItems}

STRICT RULE: Do not make up information that is not in the knowledge base or menu.`;

    const chatMessages = [
      ...history.map((h: any) => ({
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: h.content }]
      })),
      { role: "user", parts: [{ text: userText }] }
    ];

    if (!GOOGLE_API_KEY) {
      throw new Error("Gemini API key not configured");
    }

    const aiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: chatMessages,
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          }
        })
      }
    );

    if (!aiRes.ok) {
      throw new Error(`AI API error: ${aiRes.statusText}`);
    }

    const aiData = await aiRes.json();
    const aiResponse = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I'm having trouble thinking right now.";

    // 5. TTS (Optional: Return audio if needed, but we can do it on demand 
    // to save costs/latency for every message)
    // For this implementation, we'll return text + a flag if voice is requested.

    return NextResponse.json({
      text: aiResponse,
      userText: userText,
    });

  } catch (error: any) {
    console.error("AI Waiter Chat Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process chat" }, { status: 500 });
  }
}
