import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { getDb } from "../../../../../lib/db/client";
import { requireAuth } from "../../../../../lib/auth/middleware";

// PUT - Update category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(request);
    if ("error" in auth) {
      return auth.error;
    }

    const { id } = await params;
    const body = await request.json();
    const {
      name_ar,
      name_en,
      name_fr,
      image_url,
      icon_name,
      display_order,
      is_active,
    } = body;

    await getDb().execute({
      sql: `UPDATE categories 
            SET name_ar = ?, name_en = ?, name_fr = ?, image_url = ?, icon_name = ?, display_order = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
      args: [
        name_ar,
        name_en,
        name_fr,
        image_url || null,
        icon_name || "Utensils",
        display_order || 0,
        is_active ? 1 : 0,
        id,
      ],
    });

    // Revalidate in background without blocking response
    fetch(`${request.nextUrl.origin}/api/revalidate`, {
      method: "POST",
      headers: {
        Authorization: request.headers.get("authorization") || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type: "page", path: "/categories" }),
    }).catch((err) => console.error("Revalidation error:", err));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(request);
    if ("error" in auth) {
      return auth.error;
    }

    const { id } = await params;
    await getDb().execute({
      sql: "DELETE FROM categories WHERE id = ?",
      args: [id],
    });

    // Revalidate in background without blocking response
    fetch(`${request.nextUrl.origin}/api/revalidate`, {
      method: "POST",
      headers: {
        Authorization: request.headers.get("authorization") || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type: "page", path: "/categories" }),
    }).catch((err) => console.error("Revalidation error:", err));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
