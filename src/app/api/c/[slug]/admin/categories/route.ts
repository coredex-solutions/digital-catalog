import { NextRequest, NextResponse } from "next/server";
import { requireCatalogAdmin } from "@/lib/auth/catalog-admin-middleware";
import { getCatalogBySlug } from "@/lib/catalog/queries";
import { getDb } from "@/lib/db/client";
import { v4 as uuidv4 } from "uuid";
import { PLAN_CONFIG } from "@/lib/plans";
import { planReorder } from "@/lib/catalog/reorder";

// GET: List all categories for this catalog
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

  const db = getDb();

  const result = await db.execute({
    sql: `
      SELECT c.*, 
        (SELECT COUNT(*) FROM menu_items WHERE category_id = c.id) as item_count
      FROM categories c
      WHERE c.catalog_id = ?
      ORDER BY c.display_order ASC, c.id ASC
    `,
    args: [catalog.id],
  });

  return NextResponse.json({ categories: result.rows });
}

// POST: Create a new category
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
      name_ar,
      name_en,
      image_url,
      icon_name = "Folder",
    } = body;

    // A name in at least one language. The other stays empty (not copied), so the guest menu
    // falls back to the one given and the setup list can point out missing Arabic names.
    const nameEn = typeof name_en === "string" ? name_en.trim() : "";
    const nameAr = typeof name_ar === "string" ? name_ar.trim() : "";
    if (!nameEn && !nameAr) {
      return NextResponse.json(
        { error: "Enter a name in Arabic or English" },
        { status: 400 }
      );
    }

    const db = getDb();

    // Enforce the plan's category limit (falls back to Essential's)
    const limitResult = await db.execute({
      sql: `
        SELECT
          (SELECT COUNT(*) FROM categories WHERE catalog_id = ?) as current_count,
          (SELECT max_categories FROM catalog_subscriptions WHERE catalog_id = ? AND is_active = 1) as max_allowed
      `,
      args: [catalog.id, catalog.id],
    });
    const currentCount = Number(limitResult.rows[0]?.current_count || 0);
    const maxAllowed = Number(limitResult.rows[0]?.max_allowed ?? 0) || PLAN_CONFIG.essential.limits.max_categories;
    if (currentCount >= maxAllowed) {
      return NextResponse.json(
        { error: `Category limit reached for your plan (${maxAllowed}). Upgrade to add more.`, current: currentCount, max: maxAllowed },
        { status: 403 }
      );
    }

    // Get max display order
    const maxOrderResult = await db.execute({
      sql: "SELECT MAX(display_order) as max_order FROM categories WHERE catalog_id = ?",
      args: [catalog.id],
    });
    const nextOrder = (Number(maxOrderResult.rows[0]?.max_order) || 0) + 1;

    const id = uuidv4();

    await db.execute({
      sql: `
        INSERT INTO categories (id, catalog_id, name_ar, name_en, name_fr, image_url, icon_name, display_order, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, '', ?, ?, ?, 1, datetime('now'), datetime('now'))
      `,
      args: [
        id,
        catalog.id,
        nameAr,
        nameEn,
        image_url || null,
        icon_name,
        nextOrder,
      ],
    });

    return NextResponse.json(
      {
        success: true,
        category: {
          id,
          catalog_id: catalog.id,
          name_ar: nameAr,
          name_en: nameEn,
          image_url,
          icon_name,
          display_order: nextOrder,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create category error:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}

// PUT: Reorder categories
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
    const body = await request.json().catch(() => null);

    const db = getDb();
    const current = await db.execute({
      sql: "SELECT id, display_order FROM categories WHERE catalog_id = ?",
      args: [catalog.id],
    });
    // Every category exactly once; only the ones that moved are written
    const plan = planReorder(body?.order, new Map(current.rows.map((r) => [String(r.id), Number(r.display_order) || 0])));
    if (!plan) {
      return NextResponse.json(
        { error: "The category list changed. Reload the page and try again." },
        { status: 409 }
      );
    }

    if (plan.length > 0) {
      await db.batch(
        plan.map(([id, position]) => ({
          sql: "UPDATE categories SET display_order = ?, updated_at = datetime('now') WHERE id = ? AND catalog_id = ?",
          args: [position, id, catalog.id],
        })),
        "write"
      );
    }

    return NextResponse.json({ success: true, changed: plan.length });
  } catch (error) {
    console.error("Reorder categories error:", error);
    return NextResponse.json(
      { error: "Failed to reorder categories" },
      { status: 500 }
    );
  }
}

