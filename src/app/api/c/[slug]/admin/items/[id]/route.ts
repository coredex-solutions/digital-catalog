import { NextRequest, NextResponse } from "next/server";
import { requireCatalogAdmin } from "@/lib/auth/catalog-admin-middleware";
import { getCatalogBySlug } from "@/lib/catalog/queries";
import { getDb } from "@/lib/db/client";

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
      "name_fr",
      "description_ar",
      "description_en",
      "description_fr",
      "price",
      "currency",
      "image_url",
      "is_active",
      "is_featured",
    ];

    for (const field of fields) {
      if (body[field] !== undefined) {
        updates.push(`${field} = ?`);
        if (field === "is_active" || field === "is_featured") {
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

