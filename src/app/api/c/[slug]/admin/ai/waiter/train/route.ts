import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { parseAIJson, AI_CONSTRAINTS } from "@/lib/ai-utils";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const MODEL = "gemini-1.5-flash";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const db = getDb();

  try {
    // 1. Get catalog info
    const catalogRes = await db.execute({
      sql: "SELECT id, name, business_type FROM catalogs WHERE slug = ?",
      args: [slug]
    });

    if (catalogRes.rows.length === 0) {
      return NextResponse.json({ error: "Catalog not found" }, { status: 404 });
    }

    const catalogId = catalogRes.rows[0].id as string;
    const businessName = catalogRes.rows[0].name as string;
    const businessType = catalogRes.rows[0].business_type as string;

    // 2. Fetch all items and categories
    const categoriesRes = await db.execute({
      sql: "SELECT id, name_en, name_ar FROM categories WHERE catalog_id = ? AND is_active = 1",
      args: [catalogId]
    });

    const itemsRes = await db.execute({
      sql: "SELECT id, category_id, name_en, name_ar, description_en, description_ar, price FROM menu_items WHERE catalog_id = ? AND is_active = 1",
      args: [catalogId]
    });

    // 3. Fetch existing knowledge to avoid duplicates
    const existingKnowledgeRes = await db.execute({
      sql: "SELECT question FROM catalog_ai_knowledge WHERE catalog_id = ?",
      args: [catalogId]
    });

    const categories = categoriesRes.rows;
    const items = itemsRes.rows;
    const existingQuestions = existingKnowledgeRes.rows.map(r => r.question);

    // 4. Use AI to analyze and generate gaps
    const menuSummary = items.map(item => ({
      name: item.name_en,
      category: categories.find(c => c.id === item.category_id)?.name_en || "Unknown",
      description: item.description_en || "No description",
      price: item.price
    }));

    const systemPrompt = `You are an AI Waiter Specialist. Your goal is to interview a business owner to fill knowledge gaps for an AI Waiter.
Analyze the provided menu data and identify what's missing to provide a premium service (e.g., ingredients, spiciness, pairings, prep time, popularity).

${AI_CONSTRAINTS}

Return exactly 10 high-value questions as a JSON array of objects:
[
  {
    "id": "generated_id",
    "question_en": "Question in English",
    "question_ar": "Question in Arabic",
    "category": "menu" | "policy" | "about",
    "priority": 1-5,
    "context": "Why this is important"
  }
]`;

    const prompt = `Business: ${businessName} (${businessType})
Existing Knowledge Base Questions: ${JSON.stringify(existingQuestions)}
Menu Data: ${JSON.stringify(menuSummary.slice(0, 50))}

Based on this, what are the most important things a waiter needs to know to sell these items effectively and answer customer questions? 
Generate 10 questions the owner should answer to train the AI.`;

    if (!GOOGLE_API_KEY) {
      return NextResponse.json({ error: "Google API key not configured" }, { status: 500 });
    }

    const aiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\n${prompt}` }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
          }
        })
      }
    );

    if (!aiRes.ok) {
      throw new Error(`AI API error: ${aiRes.statusText}`);
    }

    const aiData = await aiRes.json();
    const aiText = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const questions = parseAIJson(aiText);

    if (!questions || !Array.isArray(questions)) {
      throw new Error("Failed to parse AI-generated questions");
    }

    return NextResponse.json({ questions });

  } catch (error: any) {
    console.error("AI Trainer Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate training questions" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const db = getDb();
  const body = await request.json();
  const { question, answer, category, source_type = 'manual' } = body;

  try {
    const catalogRes = await db.execute({
      sql: "SELECT id FROM catalogs WHERE slug = ?",
      args: [slug]
    });

    if (catalogRes.rows.length === 0) {
      return NextResponse.json({ error: "Catalog not found" }, { status: 404 });
    }

    const catalogId = catalogRes.rows[0].id as string;
    const knowledgeId = `ak_${Math.random().toString(36).substring(2, 11)}`;

    await db.execute({
      sql: "INSERT INTO catalog_ai_knowledge (id, catalog_id, question, answer, category, source_type) VALUES (?, ?, ?, ?, ?, ?)",
      args: [knowledgeId, catalogId, question, answer, category, source_type]
    });

    return NextResponse.json({ success: true, id: knowledgeId });
  } catch (error: any) {
    console.error("Save Knowledge Error:", error);
    return NextResponse.json({ error: error.message || "Failed to save knowledge" }, { status: 500 });
  }
}
