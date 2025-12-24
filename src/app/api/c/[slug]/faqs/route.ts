import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";

// PUBLIC GET: Get FAQs for a catalog slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const db = getDb();
    
    // Get catalog ID first
    const catalogRes = await db.execute({
      sql: "SELECT id FROM catalogs WHERE slug = ?",
      args: [slug]
    });

    if (catalogRes.rows.length === 0) {
      return NextResponse.json({ error: "Catalog not found" }, { status: 404 });
    }

    const catalogId = catalogRes.rows[0].id;

    // Get FAQs
    const result = await db.execute({
      sql: `
        SELECT * FROM catalog_faqs 
        WHERE catalog_id = ? 
        ORDER BY display_order ASC
      `,
      args: [catalogId],
    });

    return NextResponse.json({ faqs: result.rows });
  } catch (error) {
    console.error("Failed to fetch FAQs:", error);
    return NextResponse.json({ error: "Failed to fetch FAQs" }, { status: 500 });
  }
}
