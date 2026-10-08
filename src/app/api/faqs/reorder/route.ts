import { NextRequest, NextResponse } from "next/server";
import { getDb } from "../../../../../lib/db/client";
import { requireAuth } from "../../../../../lib/auth/middleware";

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if ("error" in auth) {
      return auth.error;
    }

    const body = await request.json();
    const { items } = body; // Array of { id, display_order }

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: "Items must be an array" },
        { status: 400 }
      );
    }

    // Update all items in a transaction
    for (const item of items) {
      await getDb().execute({
        sql: "UPDATE faqs SET display_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        args: [item.display_order, item.id],
      });
    }

    // Revalidate all pages
    await fetch(`${request.nextUrl.origin}/api/revalidate`, {
      method: "POST",
      headers: {
        Authorization: request.headers.get("authorization") || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type: "all" }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering FAQs:", error);
    return NextResponse.json(
      { error: "Failed to reorder FAQs" },
      { status: 500 }
    );
  }
}
