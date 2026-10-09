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
  variantsToDb,
} from "@/lib/catalog/dish-info";

// PUT: Update item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;

  const catalog = await getCatalogBySlug(slug);
  if (!catalog) {
    return NextResponse.json({ error: "Catalog not found" }, { status: 404 });
  }

  const auth = await requireCatalogAdmin(request, catalog.id);
  if (!auth.success) return auth.response;

  try {
    const body = await request.json();

    // Normalize price and currency before anything is written
    if (body.price !== undefined) {
      const price = parseItemPrice(body.price);
      if (price === null) {
        return NextResponse.json({ error: "Price must be a number of 0 or more" }, { status: 400 });
      }
      body.price = price;
    }
    if (body.currency !== undefined) {
      const currency = parseItemCurrency(body.currency);
      if (currency === null) {
        return NextResponse.json({ error: "Currency must be USD or LBP" }, { status: 400 });
      }
      body.currency = currency;
    }

    // Options, dietary tags and allergens are validated and stored as JSON text. Allergens:
    // null marks them not checked (unknown), an array (even empty) is the owner's verified list.
    if (body.variants !== undefined) {
      const variants = parseVariantsInput(body.variants);
      if (!variants.ok) return NextResponse.json({ error: variants.error }, { status: 400 });
      body.variants = variantsToDb(variants.value);
      // With options, the item's price is the cheapest option (for sorting and "from" prices)
      const lowest = lowestVariantPrice(variants.value);
      if (lowest !== null) body.price = lowest;
    }
    if (body.dietary !== undefined) {
      const dietary = parseDietaryInput(body.dietary);
      if (!dietary.ok) return NextResponse.json({ error: dietary.error }, { status: 400 });
      body.dietary = dietaryToDb(dietary.value);
    }
    if (body.allergens !== undefined) {
      const allergens = parseAllergensInput(body.allergens);
      if (!allergens.ok) return NextResponse.json({ error: allergens.error }, { status: 400 });
      body.allergens = allergensToDb(allergens.value);
    }

    const db = getDb();

    // Verify item belongs to this catalog
    const check = await db.execute({
      sql: "SELECT id FROM menu_items WHERE id = ? AND catalog_id = ?",
      args: [id, catalog.id],
    });

    if (check.rows.length === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // A moved item must stay inside this catalog's own categories
    if (body.category_id !== undefined) {
      const categoryCheck = await db.execute({
        sql: "SELECT id FROM categories WHERE id = ? AND catalog_id = ?",
        args: [body.category_id, catalog.id],
      });
      if (categoryCheck.rows.length === 0) {
        return NextResponse.json({ error: "Category not found" }, { status: 404 });
      }
    }

    // Build update query dynamically
    const updates: string[] = [];
    const args: any[] = [];

    const fields = [
      "category_id",
      "name_ar",
      "name_en",
      "description_ar",
      "description_en",
      "price",
      "currency",
      "image_url",
      "is_active",
      "is_featured",
      "is_available",
      "variants",
      "dietary",
      "allergens",
    ];

    for (const field of fields) {
      // JSON fields are already converted; null clears them (allergens: null = not checked)
      if (field === "variants" || field === "dietary" || field === "allergens") {
        if (body[field] !== undefined) {
          updates.push(`${field} = ?`);
          args.push(body[field]);
        }
        continue;
      }
      if (body[field] !== undefined) {
        updates.push(`${field} = ?`);
        if (field === "is_active" || field === "is_featured" || field === "is_available") {
          args.push(body[field] ? 1 : 0);
        } else if (field === "image_url" && !body[field]) {
          args.push(null);
        } else {
          args.push(body[field]);
        }
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    updates.push("updated_at = datetime('now')");
    args.push(id);
    args.push(catalog.id);

    await db.execute({
      sql: `UPDATE menu_items SET ${updates.join(", ")} WHERE id = ? AND catalog_id = ?`,
      args,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Update item error:", error);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

// DELETE: Delete item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;

  const catalog = await getCatalogBySlug(slug);
  if (!catalog) {
    return NextResponse.json({ error: "Catalog not found" }, { status: 404 });
  }

  const auth = await requireCatalogAdmin(request, catalog.id);
  if (!auth.success) return auth.response;

  const db = getDb();

  const result = await db.execute({
    sql: "DELETE FROM menu_items WHERE id = ? AND catalog_id = ?",
    args: [id, catalog.id],
  });

  if (result.rowsAffected === 0) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

