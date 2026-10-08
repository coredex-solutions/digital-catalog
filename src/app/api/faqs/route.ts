import { NextRequest, NextResponse } from "next/server";
import { getDb } from "../../../../lib/db/client";
import { requireAuth } from "../../../../lib/auth/middleware";

export async function GET() {
  try {
    const result = await getDb().execute({
      sql: "SELECT * FROM faqs ORDER BY display_order ASC, created_at ASC",
    });

    const faqs = result.rows.map((row) => ({
      id: row.id as string,
      question_ar: row.question_ar as string,
      question_en: row.question_en as string,
      question_fr: row.question_fr as string,
      answer_ar: row.answer_ar as string,
      answer_en: row.answer_en as string,
      answer_fr: row.answer_fr as string,
      display_order: row.display_order as number,
      is_active: (row.is_active as number) === 1,
    }));

    return NextResponse.json(faqs);
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    return NextResponse.json(
      { error: "Failed to fetch FAQs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if ("error" in auth) {
      return auth.error;
    }

    const body = await request.json();
    const {
      id,
      question_ar,
      question_en,
      question_fr,
      answer_ar,
      answer_en,
      answer_fr,
      display_order,
    } = body;

    // Get max display_order if not provided
    let order = display_order;
    if (order === undefined || order === null) {
      const maxResult = await getDb().execute({
        sql: "SELECT MAX(display_order) as max_order FROM faqs",
      });
      order = ((maxResult.rows[0]?.max_order as number) || 0) + 1;
    }

    await getDb().execute({
      sql: `INSERT INTO faqs 
            (id, question_ar, question_en, question_fr, answer_ar, answer_en, answer_fr, display_order, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      args: [
        id,
        question_ar,
        question_en,
        question_fr,
        answer_ar,
        answer_en,
        answer_fr,
        order,
      ],
    });

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
    console.error("Error creating FAQ:", error);
    return NextResponse.json(
      { error: "Failed to create FAQ" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if ("error" in auth) {
      return auth.error;
    }

    const body = await request.json();
    const {
      id,
      question_ar,
      question_en,
      question_fr,
      answer_ar,
      answer_en,
      answer_fr,
      display_order,
      is_active,
    } = body;

    await getDb().execute({
      sql: `UPDATE faqs SET
            question_ar = ?, question_en = ?, question_fr = ?,
            answer_ar = ?, answer_en = ?, answer_fr = ?,
            display_order = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
      args: [
        question_ar,
        question_en,
        question_fr,
        answer_ar,
        answer_en,
        answer_fr,
        display_order,
        is_active ? 1 : 0,
        id,
      ],
    });

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
    console.error("Error updating FAQ:", error);
    return NextResponse.json(
      { error: "Failed to update FAQ" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if ("error" in auth) {
      return auth.error;
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "FAQ ID is required" },
        { status: 400 }
      );
    }

    await getDb().execute({
      sql: "DELETE FROM faqs WHERE id = ?",
      args: [id],
    });

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
    console.error("Error deleting FAQ:", error);
    return NextResponse.json(
      { error: "Failed to delete FAQ" },
      { status: 500 }
    );
  }
}
