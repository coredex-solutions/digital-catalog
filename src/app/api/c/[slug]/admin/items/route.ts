import { NextRequest, NextResponse } from "next/server";
import { requireCatalogAdmin } from "@/lib/auth/catalog-admin-middleware";
import { getCatalogBySlug } from "@/lib/catalog/queries";
import { getDb } from "@/lib/db/client";
import { parseItemCurrency, parseItemPrice } from "@/lib/catalog/price";
import {
  allergensToDb,
  dietaryToDb,
  lowestVariantPrice,
  parseAllergensInput,
  parseDietaryInput,
  parseVariantsInput,
  readDishInfo,
  variantsToDb,
} from "@/lib/catalog/dish-info";
import { PLAN_CONFIG } from "@/lib/plans";
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

  // Options, dietary tags and allergens are stored as JSON text; send them parsed
  const items = result.rows.map((row) => ({ ...row, ...readDishInfo(row) }));

  return NextResponse.json({ items });
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
      description_ar,
      description_en,
      price,
      currency = "USD",
      image_url,
      is_featured = false,
    } = body;

    const variants = parseVariantsInput(body.variants);
    if (!variants.ok) return NextResponse.json({ error: variants.error }, { status: 400 });
    const dietary = parseDietaryInput(body.dietary);
    if (!dietary.ok) return NextResponse.json({ error: dietary.error }, { status: 400 });
    // Omitted means not checked: allergens stay unknown until the owner verifies them
    const allergens = parseAllergensInput(body.allergens === undefined ? null : body.allergens);
    if (!allergens.ok) return NextResponse.json({ error: allergens.error }, { status: 400 });

    // With options, the item's price is the cheapest option (for sorting and "from" prices)
    const lowest = lowestVariantPrice(variants.value);

    if (!category_id || !name_en || (price === undefined && lowest === null)) {
      return NextResponse.json(
        { error: "Category, name, and price are required" },
        { status: 400 }
      );
    }

    const parsedPrice = lowest ?? parseItemPrice(price);
    if (parsedPrice === null) {
      return NextResponse.json(
        { error: "Price must be a number of 0 or more" },
        { status: 400 }
      );
    }
    const parsedCurrency = parseItemCurrency(currency);
    if (parsedCurrency === null) {
      return NextResponse.json(
        { error: "Currency must be USD or LBP" },
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

    // Enforce the plan's item limit (Essential's limit when no subscription row has one)
    const limitResult = await db.execute({
      sql: `
        SELECT
          (SELECT COUNT(*) FROM menu_items WHERE catalog_id = ?) as current_count,
          (SELECT max_items FROM catalog_subscriptions WHERE catalog_id = ? AND is_active = 1) as max_allowed
      `,
      args: [catalog.id, catalog.id],
    });
    const currentCount = Number(limitResult.rows[0]?.current_count || 0);
    const maxAllowed = Number(limitResult.rows[0]?.max_allowed ?? 0) || PLAN_CONFIG.essential.limits.max_items;
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

    // The option columns are only written when used, so plain dishes can still be created on
    // a database that hasn't run migration 20261010_dish_options yet
    const extraColumns: string[] = [];
    const extraArgs: (string | null)[] = [];
    if (variants.value.length > 0) {
      extraColumns.push("variants");
      extraArgs.push(variantsToDb(variants.value));
    }
    if (dietary.value.length > 0) {
      extraColumns.push("dietary");
      extraArgs.push(dietaryToDb(dietary.value));
    }
    if (allergens.value !== null) {
      extraColumns.push("allergens");
      extraArgs.push(allergensToDb(allergens.value));
    }
    const extraSql = extraColumns.map((c) => `, ${c}`).join("");
    const extraValues = extraColumns.map(() => ", ?").join("");

    await db.execute({
      sql: `
        INSERT INTO menu_items (
          id, catalog_id, category_id, name_ar, name_en, name_fr,
          description_ar, description_en, description_fr,
          price, currency, image_url, display_order, is_active, is_featured,
          created_at, updated_at${extraSql}
        )
        VALUES (?, ?, ?, ?, ?, '', ?, ?, NULL, ?, ?, ?, ?, 1, ?, datetime('now'), datetime('now')${extraValues})
      `,
      args: [
        id,
        catalog.id,
        category_id,
        name_ar || name_en,
        name_en,
        description_ar || null,
        description_en || null,
        parsedPrice,
        parsedCurrency,
        image_url || null,
        nextOrder,
        is_featured ? 1 : 0,
        ...extraArgs,
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
          price: parsedPrice,
          variants: variants.value,
          dietary: dietary.value,
          allergens: allergens.value,
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

