import { NextRequest, NextResponse } from "next/server";
import { requireCatalogAdmin } from "@/lib/auth/catalog-admin-middleware";
import { getCatalogBySlug } from "@/lib/catalog/queries";
import { getDb } from "@/lib/db/client";
import { v4 as uuidv4 } from "uuid";

// GET: List all items for this catalog
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("category_id");

  const catalog = await getCatalogBySlug(slug);
  if (!catalog) {
    return NextResponse.json({ error: "Catalog not found" }, { status: 404 });
  }

  const auth = await requireCatalogAdmin(request, catalog.id);
  if (!auth.success) return auth.response;

  const db = getDb();

  let sql = `
    SELECT m.*, c.name_en as category_name
    FROM menu_items m
    LEFT JOIN categories c ON c.id = m.category_id
    WHERE m.catalog_id = ?
  `;
  const args: any[] = [catalog.id];

  if (categoryId) {
    sql += " AND m.category_id = ?";
    args.push(categoryId);
  }

  sql += " ORDER BY m.display_order ASC";

  const result = await db.execute({ sql, args });

  return NextResponse.json({ items: result.rows });
}

// POST: Create a new item
export async function POST(
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
    const body = await request.json();
    const {
      category_id,
      name_ar,
      name_en,
      name_fr,
      description_ar,
      description_en,
      description_fr,
      price,
      currency = "USD",
      image_url,
      is_featured = false,
    } = body;

    if (!category_id || !name_en || price === undefined) {
      return NextResponse.json(
        { error: "Category, name, and price are required" },
        { status: 400 }
      );
    }

    const db = getDb();

    // Verify category belongs to this catalog
    const categoryCheck = await db.execute({
      sql: "SELECT id FROM categories WHERE id = ? AND catalog_id = ?",
      args: [category_id, catalog.id],
    });

    if (categoryCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Enforce the plan's item limit (defaults match /auth/verify)
    const limitResult = await db.execute({
      sql: `
        SELECT
          (SELECT COUNT(*) FROM menu_items WHERE catalog_id = ?) as current_count,
          (SELECT max_items FROM catalog_subscriptions WHERE catalog_id = ? AND is_active = 1) as max_allowed
      `,
      args: [catalog.id, catalog.id],
    });
    const currentCount = Number(limitResult.rows[0]?.current_count || 0);
    const maxAllowed = Number(limitResult.rows[0]?.max_allowed ?? 0) || 200;
    if (currentCount >= maxAllowed) {
      return NextResponse.json(
        { error: `Item limit reached for your plan (${maxAllowed}). Upgrade to add more.`, current: currentCount, max: maxAllowed },
        { status: 403 }
      );
    }

    // Get max display order
    const maxOrderResult = await db.execute({
      sql: "SELECT MAX(display_order) as max_order FROM menu_items WHERE catalog_id = ? AND category_id = ?",
      args: [catalog.id, category_id],
    });
    const nextOrder = (Number(maxOrderResult.rows[0]?.max_order) || 0) + 1;

    const id = uuidv4();

    await db.execute({
      sql: `
        INSERT INTO menu_items (
          id, catalog_id, category_id, name_ar, name_en, name_fr,
          description_ar, description_en, description_fr,
          price, currency, image_url, display_order, is_active, is_featured,
          created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, datetime('now'), datetime('now'))
      `,
      args: [
        id,
        catalog.id,
        category_id,
        name_ar || name_en,
        name_en,
        name_fr || name_en,
        description_ar || null,
        description_en || null,
        description_fr || null,
        price,
        currency,
        image_url || null,
        nextOrder,
        is_featured ? 1 : 0,
      ],
    });

    return NextResponse.json(
      {
        success: true,
        item: {
          id,
          catalog_id: catalog.id,
          category_id,
          name_en,
          price,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create item error:", error);
    return NextResponse.json(
      { error: "Failed to create item" },
      { status: 500 }
    );
  }
}

