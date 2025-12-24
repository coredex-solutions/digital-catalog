import { NextRequest, NextResponse } from "next/server";
import { requireCatalogAdmin } from "@/lib/auth/catalog-admin-middleware";
import { getCatalogBySlug } from "@/lib/catalog/queries";
import { getDb } from "@/lib/db/client";
import { v4 as uuidv4 } from "uuid";

// GET: Get FAQs
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  
  const catalog = await getCatalogBySlug(slug);
  if (!catalog) {
    return NextResponse.json({ error: "Catalog not found" }, { status: 404 });
  }

  const auth = await requireCatalogAdmin(request, catalog.id);
  if (!auth.success) return auth.response;

  try {
    const db = getDb();
    const result = await db.execute({
      sql: `
        SELECT * FROM catalog_faqs 
        WHERE catalog_id = ? 
        ORDER BY display_order ASC
      `,
      args: [catalog.id],
    });

    return NextResponse.json({ faqs: result.rows });
  } catch (error) {
    console.error("Failed to fetch FAQs:", error);
    return NextResponse.json({ error: "Failed to fetch FAQs" }, { status: 500 });
  }
}

// PUT: Update FAQs
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  
  const catalog = await getCatalogBySlug(slug);
  if (!catalog) {
    return NextResponse.json({ error: "Catalog not found" }, { status: 404 });
  }

  const auth = await requireCatalogAdmin(request, catalog.id);
  if (!auth.success) return auth.response;

  try {
    const { faqs } = await request.json();
    const db = getDb();

    // Transaction: Delete all and re-insert (simplest way to handle reordering and updates)
    await db.execute({
      sql: "DELETE FROM catalog_faqs WHERE catalog_id = ?",
      args: [catalog.id],
    });

    for (const [index, faq] of faqs.entries()) {
      await db.execute({
        sql: `
          INSERT INTO catalog_faqs (
            id, catalog_id, 
            question_ar, question_en, question_fr,
            answer_ar, answer_en, answer_fr,
            display_order, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `,
        args: [
          uuidv4(),
          catalog.id,
          faq.question_ar || "",
          faq.question_en || "",
          faq.question_fr || "",
          faq.answer_ar || "",
          faq.answer_en || "",
          faq.answer_fr || "",
          index,
        ],
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update FAQs:", error);
    return NextResponse.json({ error: "Failed to update FAQs" }, { status: 500 });
  }
}
