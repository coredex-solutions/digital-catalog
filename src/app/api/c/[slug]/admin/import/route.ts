import { NextRequest, NextResponse } from "next/server";
import type { InStatement } from "@libsql/client";
import { v4 as uuidv4 } from "uuid";
import { requireCatalogAdmin } from "@/lib/auth/catalog-admin-middleware";
import { getCatalogBySlug } from "@/lib/catalog/queries";
import { getDb } from "@/lib/db/client";
import { parseItemCurrency, parseItemPrice } from "@/lib/catalog/price";
import { lowestVariantPrice, parseVariantsInput, variantsToDb } from "@/lib/catalog/dish-info";
import { IMPORT_LIMITS } from "@/lib/catalog/import";
import { PLAN_CONFIG } from "@/lib/plans";

const KEY_PATTERN = /^[A-Za-z0-9-]{8,64}$/;
const text = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");

interface DishRow {
  categoryIndex: number;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  price: number;
  currency: string;
  variants: string | null;
}

/**
 * POST { importKey, source: "spreadsheet" | "photo", categories: [{ existingId?, name_en, name_ar,
 * dishes: [{ name_en, name_ar, description_en, description_ar, price, currency, options? }] }] }
 *
 * Adds the reviewed dishes to the owner's draft menu in one go (guests see them after the next
 * publish). Sending the same importKey again adds nothing and returns the first result.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const catalog = await getCatalogBySlug(slug);
  if (!catalog) return NextResponse.json({ error: "Catalog not found" }, { status: 404 });

  const auth = await requireCatalogAdmin(request, catalog.id);
  if (!auth.success) return auth.response;

  const body = await request.json().catch(() => null);
  const importKey = typeof body?.importKey === "string" ? body.importKey : "";
  const source = body?.source === "photo" ? "photo" : "spreadsheet";
  const categories: unknown[] = Array.isArray(body?.categories) ? body.categories : [];
  if (!KEY_PATTERN.test(importKey) || categories.length === 0) {
    return NextResponse.json({ error: "Nothing to import" }, { status: 400 });
  }

  // ---- Check everything before writing anything ----
  const db = getDb();
  const existing = await db.execute({ sql: "SELECT id FROM categories WHERE catalog_id = ?", args: [catalog.id] });
  const existingIds = new Set(existing.rows.map((r) => String(r.id)));

  const newCategories: { index: number; name_en: string; name_ar: string }[] = [];
  const targetIds: (string | null)[] = [];
  const dishes: DishRow[] = [];
  for (const [index, raw] of categories.entries()) {
    const category = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
    const existingId = typeof category.existingId === "string" ? category.existingId : null;
    if (existingId) {
      if (!existingIds.has(existingId)) return NextResponse.json({ error: "Category not found" }, { status: 404 });
      targetIds.push(existingId);
    } else {
      const name_en = text(category.name_en, IMPORT_LIMITS.name);
      const name_ar = text(category.name_ar, IMPORT_LIMITS.name);
      if (!name_en && !name_ar) {
        return NextResponse.json({ error: `Category ${index + 1} needs a name in Arabic or English` }, { status: 400 });
      }
      newCategories.push({ index, name_en, name_ar });
      targetIds.push(null);
    }

    for (const rawDish of Array.isArray(category.dishes) ? category.dishes : []) {
      const dish = rawDish && typeof rawDish === "object" ? (rawDish as Record<string, unknown>) : {};
      const n = dishes.length + 1;
      const name_en = text(dish.name_en, IMPORT_LIMITS.name);
      const name_ar = text(dish.name_ar, IMPORT_LIMITS.name);
      if (!name_en && !name_ar) return NextResponse.json({ error: `Dish ${n} needs a name in Arabic or English` }, { status: 400 });
      const variants = parseVariantsInput(dish.options ?? null);
      if (!variants.ok) return NextResponse.json({ error: `Dish ${n}: ${variants.error}` }, { status: 400 });
      const price = lowestVariantPrice(variants.value) ?? parseItemPrice(dish.price);
      if (price === null) return NextResponse.json({ error: `Dish ${n} needs a price of 0 or more` }, { status: 400 });
      const currency = parseItemCurrency(dish.currency ?? "USD");
      if (!currency) return NextResponse.json({ error: "Currency must be USD or LBP" }, { status: 400 });
      dishes.push({
        categoryIndex: index,
        name_en,
        name_ar,
        description_en: text(dish.description_en, IMPORT_LIMITS.description),
        description_ar: text(dish.description_ar, IMPORT_LIMITS.description),
        price,
        currency,
        variants: variants.value.length ? variantsToDb(variants.value) : null,
      });
      if (dishes.length > IMPORT_LIMITS.dishes) {
        return NextResponse.json({ error: `At most ${IMPORT_LIMITS.dishes} dishes can be imported at once` }, { status: 400 });
      }
    }
  }
  if (dishes.length === 0) return NextResponse.json({ error: "Nothing to import" }, { status: 400 });

  // The plan's limits apply to the menu after the import
  const limits = await db.execute({
    sql: `SELECT
            (SELECT COUNT(*) FROM menu_items WHERE catalog_id = ?) AS items,
            (SELECT COUNT(*) FROM categories WHERE catalog_id = ?) AS categories,
            (SELECT max_items FROM catalog_subscriptions WHERE catalog_id = ? AND is_active = 1) AS max_items,
            (SELECT max_categories FROM catalog_subscriptions WHERE catalog_id = ? AND is_active = 1) AS max_categories`,
    args: [catalog.id, catalog.id, catalog.id, catalog.id],
  });
  const row = limits.rows[0] ?? {};
  const maxItems = Number(row.max_items ?? 0) || PLAN_CONFIG.essential.limits.max_items;
  const maxCategories = Number(row.max_categories ?? 0) || PLAN_CONFIG.essential.limits.max_categories;
  if (Number(row.items ?? 0) + dishes.length > maxItems) {
    return NextResponse.json(
      { error: `This import would go over your plan's limit of ${maxItems} dishes. You have ${Number(row.items ?? 0)} and are adding ${dishes.length}.` },
      { status: 403 }
    );
  }
  if (Number(row.categories ?? 0) + newCategories.length > maxCategories) {
    return NextResponse.json(
      { error: `This import would go over your plan's limit of ${maxCategories} categories. You have ${Number(row.categories ?? 0)} and are adding ${newCategories.length}.` },
      { status: 403 }
    );
  }

  // ---- Claim the key, so a repeated request adds nothing ----
  const importId = uuidv4();
  const claim = await db.execute({
    sql: `INSERT INTO menu_imports (id, catalog_id, import_key, source, category_count, dish_count, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(catalog_id, import_key) DO NOTHING`,
    args: [importId, catalog.id, importKey, source, newCategories.length, dishes.length, auth.admin.email],
  });
  if (claim.rowsAffected === 0) {
    const first = await db.execute({
      sql: "SELECT category_count, dish_count FROM menu_imports WHERE catalog_id = ? AND import_key = ?",
      args: [catalog.id, importKey],
    });
    return NextResponse.json({
      success: true,
      duplicate: true,
      categories: Number(first.rows[0]?.category_count ?? 0),
      dishes: Number(first.rows[0]?.dish_count ?? 0),
    });
  }

  // ---- Everything in one transaction, added after what is already there ----
  const orders = await db.execute({
    sql: `SELECT 'c' AS kind, NULL AS category_id, MAX(display_order) AS max_order FROM categories WHERE catalog_id = ?
          UNION ALL
          SELECT 'i', category_id, MAX(display_order) FROM menu_items WHERE catalog_id = ? GROUP BY category_id`,
    args: [catalog.id, catalog.id],
  });
  let nextCategoryOrder = 0;
  const nextDishOrder = new Map<string, number>();
  for (const r of orders.rows) {
    if (r.kind === "c") nextCategoryOrder = (Number(r.max_order) || 0) + 1;
    else nextDishOrder.set(String(r.category_id), (Number(r.max_order) || 0) + 1);
  }

  const statements: InStatement[] = [];
  for (const category of newCategories) {
    const id = uuidv4();
    targetIds[category.index] = id;
    statements.push({
      sql: `INSERT INTO categories (id, catalog_id, name_ar, name_en, name_fr, image_url, icon_name, display_order, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, '', NULL, 'Folder', ?, 1, datetime('now'), datetime('now'))`,
      args: [id, catalog.id, category.name_ar, category.name_en, nextCategoryOrder++],
    });
  }
  for (const dish of dishes) {
    const categoryId = targetIds[dish.categoryIndex]!;
    const order = nextDishOrder.get(categoryId) ?? 1;
    nextDishOrder.set(categoryId, order + 1);
    // The options column is only written when used (older databases may not have it)
    const withVariants = dish.variants !== null;
    statements.push({
      sql: `INSERT INTO menu_items (
              id, catalog_id, category_id, name_ar, name_en, name_fr, description_ar, description_en, description_fr,
              price, currency, image_url, display_order, is_active, is_featured, created_at, updated_at${withVariants ? ", variants" : ""}
            ) VALUES (?, ?, ?, ?, ?, '', ?, ?, NULL, ?, ?, NULL, ?, 1, 0, datetime('now'), datetime('now')${withVariants ? ", ?" : ""})`,
      args: [
        uuidv4(), catalog.id, categoryId, dish.name_ar, dish.name_en, dish.description_ar || null, dish.description_en || null,
        dish.price, dish.currency, order, ...(withVariants ? [dish.variants] : []),
      ],
    });
  }

  try {
    await db.batch(statements, "write");
  } catch (error) {
    console.error("Menu import failed:", error);
    await db.execute({ sql: "DELETE FROM menu_imports WHERE id = ?", args: [importId] }).catch(() => {});
    return NextResponse.json({ error: "Could not import. Nothing was added. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ success: true, categories: newCategories.length, dishes: dishes.length }, { status: 201 });
}
