import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";
import { getDb } from "../../../../lib/db/client";
import { requireAuth } from "../../../../lib/auth/middleware";

// GET - Public endpoint for fetching categories
export async function GET() {
  try {
    const result = await getDb().execute({
      sql: "SELECT * FROM categories WHERE is_active = 1 ORDER BY display_order ASC",
    });

    const categories = result.rows.map((row) => ({
      id: row.id,
      name_ar: row.name_ar,
      name_en: row.name_en,
      name_fr: row.name_fr,
      image_url: row.image_url,
      icon_name: row.icon_name,
      display_order: row.display_order,
    }));

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create category (requires auth)
export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if ("error" in auth) {
      return auth.error;
    }

    const body = await request.json();
    const { name_ar, name_en, name_fr, image_url, icon_name, display_order } =
      body;

    // Generate unique ID
    const id = randomUUID();

    await getDb().execute({
      sql: `INSERT INTO categories (id, name_ar, name_en, name_fr, image_url, icon_name, display_order, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      args: [
        id,
        name_ar,
        name_en,
        name_fr,
        image_url || null,
        icon_name || "Utensils",
        display_order || 0,
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

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
