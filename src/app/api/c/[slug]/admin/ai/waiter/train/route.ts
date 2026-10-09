import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { parseAIJson, AI_CONSTRAINTS } from "@/lib/ai-utils";
import { requireCatalogAdmin } from "@/lib/auth/catalog-admin-middleware";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const MODEL = "gemini-2.0-flash";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const db = getDb();

  try {
    const catalogRes = await db.execute({
      sql: "SELECT id FROM catalogs WHERE slug = ?",
      args: [slug]
    });

    if (catalogRes.rows.length === 0) {
      return NextResponse.json({ error: "Catalog not found" }, { status: 404 });
    }

    const catalogId = catalogRes.rows[0].id as string;

    const auth = await requireCatalogAdmin(request, catalogId);
    if (!auth.success) return auth.response;

    // Fetch existing questions in the training queue
    const queueRes = await db.execute({
      sql: "SELECT * FROM catalog_ai_training_queue WHERE catalog_id = ? ORDER BY created_at ASC",
      args: [catalogId]
    });

    return NextResponse.json({ questions: queueRes.rows });
  } catch (error: any) {
    console.error("Fetch Training Queue Error:", error);
    return NextResponse.json({ error: "Failed to fetch training queue" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const db = getDb();

  try {
    const body = await request.json();
    const { action = 'answer', question_id, question_en, answer, category, source_type = 'manual' } = body;

    const catalogRes = await db.execute({
      sql: "SELECT id, name, business_type FROM catalogs WHERE slug = ?",
      args: [slug]
    });

    if (catalogRes.rows.length === 0) {
      return NextResponse.json({ error: "Catalog not found" }, { status: 404 });
    }

    const catalogId = catalogRes.rows[0].id as string;

    const auth = await requireCatalogAdmin(request, catalogId);
    if (!auth.success) return auth.response;

    const businessName = catalogRes.rows[0].name as string;
    const businessType = catalogRes.rows[0].business_type as string;

    if (action === 'generate') {
      // 1. Fetch current context to avoid duplicates and be specific
      const categoriesRes = await db.execute({
        sql: "SELECT id, name_en, name_ar FROM categories WHERE catalog_id = ? AND is_active = 1",
        args: [catalogId]
      });

      const itemsRes = await db.execute({
        sql: "SELECT id, category_id, name_en, name_ar, description_en, description_ar, price FROM menu_items WHERE catalog_id = ? AND is_active = 1",
        args: [catalogId]
      });

      const existingKnowledgeRes = await db.execute({
        sql: "SELECT question FROM catalog_ai_knowledge WHERE catalog_id = ?",
        args: [catalogId]
      });

      const existingQueueRes = await db.execute({
        sql: "SELECT question_en FROM catalog_ai_training_queue WHERE catalog_id = ?",
        args: [catalogId]
      });

      const categories = categoriesRes.rows;
      const items = itemsRes.rows;
      const existingQuestions = [
        ...existingKnowledgeRes.rows.map(r => r.question),
        ...existingQueueRes.rows.map(r => r.question_en)
      ];

      // Shuffle items for better menu coverage in large catalogs
      const shuffledItems = [...items].sort(() => Math.random() - 0.5);

      const menuSummary = shuffledItems.map(item => ({
        name: item.name_en,
        category: categories.find(c => c.id === item.category_id)?.name_en || "Unknown",
        description: item.description_en || "No description",
        price: item.price
      }));

      // Calculate how many questions to generate based on item count
      // Min 8 questions, max 20 per batch for better performance/quality
      const targetCount = Math.min(Math.max(8, Math.ceil(items.length * 1.5)), 20);

      const systemPrompt = `You are an expert Restaurant Consultant training an AI Waiter. 
Analyze the provided menu data and identify specific knowledge gaps for individual items.

STRICT RULES:
1. BE SPECIFIC: Never ask broad questions like "list all ingredients" or "what are the allergens for all dishes".
2. NAME DROPPING: You MUST mention at least 4 specific dish names from the provided menu in your questions.
3. QUALITY OVER QUANTITY: Ask about unique selling points, spiciness levels, preparation methods, or recommended pairings for SPECIFIC items you see in the data.
4. ANALYZE DESCRIPTIONS: If a dish description is short, ask for missing details (e.g., "What comes inside the [Dish Name] sandwich?").
5. FOCUS ON NEW: Avoid items mentioned in the "Existing Knowledge" list. Focus on unexplored parts of the menu.

${AI_CONSTRAINTS}

Return exactly ${targetCount} high-value, item-specific questions as a JSON array of objects.
[
  {
    "id": "generated_id",
    "question_en": "Question mentioning [Item Name]",
    "question_ar": "Question in Arabic",
    "category": "menu",
    "priority": 1-5,
    "context": "Context for why this item needs more detail"
  }
]`;

      const prompt = `Business: ${businessName} (${businessType})
Existing Knowledge/Queue: ${JSON.stringify(existingQuestions.slice(-100))}
Menu Data Samples: ${JSON.stringify(menuSummary.slice(0, 150))}

Based on this data, find the biggest knowledge gaps. Focus on items NOT in the existing knowledge. Generate exactly ${targetCount} questions.`;

      if (!GOOGLE_API_KEY) {
        throw new Error("Gemini API key not configured");
      }

      const aiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent?key=${GOOGLE_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\n${prompt}` }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 8192,
            }
          })
        }
      );

      if (!aiRes.ok) {
        const errorBody = await aiRes.text();
        throw new Error(`AI API error: ${aiRes.statusText} - ${errorBody}`);
      }

      const aiData = await aiRes.json();
      const aiText = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const questions = parseAIJson(aiText);

      if (!questions || !Array.isArray(questions)) {
        throw new Error("Failed to parse AI-generated questions");
      }

      // 2. Save new questions to queue
      for (const q of questions) {
        const id = `tq_${Math.random().toString(36).substring(2, 11)}`;
        // question_fr is NOT NULL in the schema; French is no longer generated, so it is stored empty
        await db.execute({
          sql: "INSERT INTO catalog_ai_training_queue (id, catalog_id, question_en, question_ar, question_fr, category, priority, context) VALUES (?, ?, ?, ?, '', ?, ?, ?)",
          args: [id, catalogId, q.question_en, q.question_ar, q.category || 'menu', q.priority || 3, q.context || '']
        });
      }

      // Return the updated queue
      const finalQueueRes = await db.execute({
        sql: "SELECT * FROM catalog_ai_training_queue WHERE catalog_id = ? ORDER BY created_at ASC",
        args: [catalogId]
      });

      return NextResponse.json({ questions: finalQueueRes.rows });
    }

    // Default: Save answer and remove from queue
    if (action === 'answer') {
      const knowledgeId = `ak_${Math.random().toString(36).substring(2, 11)}`;

      await db.execute({
        sql: "INSERT INTO catalog_ai_knowledge (id, catalog_id, question, answer, category, source_type) VALUES (?, ?, ?, ?, ?, ?)",
        args: [knowledgeId, catalogId, question_en, answer, category || 'menu', source_type]
      });

      // Remove from queue
      if (question_id) {
        await db.execute({
          sql: "DELETE FROM catalog_ai_training_queue WHERE catalog_id = ? AND (id = ? OR question_en = ?)",
          args: [catalogId, question_id, question_en]
        });
      }

      return NextResponse.json({ success: true, id: knowledgeId });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    // Upstream AI errors can carry request details, so they are only logged
    console.error("AI Training Action Error:", error);
    return NextResponse.json({ error: "Failed to process training action" }, { status: 500 });
  }
}
