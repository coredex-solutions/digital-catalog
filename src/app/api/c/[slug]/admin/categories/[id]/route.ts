import { NextRequest, NextResponse } from "next/server";
import { requireCatalogAdmin } from "@/lib/auth/catalog-admin-middleware";
import { getCatalogBySlug } from "@/lib/catalog/queries";
import { getDb } from "@/lib/db/client";

// PUT: Update category
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
    const { name_ar, name_en, image_url, icon_name, is_active } = body;

    const db = getDb();

    // Verify category belongs to this catalog
    const check = await db.execute({
      sql: "SELECT id FROM categories WHERE id = ? AND catalog_id = ?",
      args: [id, catalog.id],
    });

    if (check.rows.length === 0) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Build update query dynamically
    const updates: string[] = [];
    const args: any[] = [];

    if (name_ar !== undefined) {
      updates.push("name_ar = ?");
      args.push(name_ar);
    }
    if (name_en !== undefined) {
      updates.push("name_en = ?");
      args.push(name_en);
    }
    if (image_url !== undefined) {
      updates.push("image_url = ?");
      args.push(image_url || null);
    }
    if (icon_name !== undefined) {
      updates.push("icon_name = ?");
      args.push(icon_name);
    }
    if (is_active !== undefined) {
      updates.push("is_active = ?");
      args.push(is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    updates.push("updated_at = datetime('now')");
    args.push(id);
    args.push(catalog.id);

    await db.execute({
      sql: `UPDATE categories SET ${updates.join(", ")} WHERE id = ? AND catalog_id = ?`,
      args,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Update category error:", error);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

// DELETE: Delete category
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

  // Delete category (items will cascade)
  const result = await db.execute({
    sql: "DELETE FROM categories WHERE id = ? AND catalog_id = ?",
    args: [id, catalog.id],
  });

  if (result.rowsAffected === 0) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

