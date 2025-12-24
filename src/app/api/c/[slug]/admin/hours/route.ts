import { NextRequest, NextResponse } from "next/server";
import { requireCatalogAdmin } from "@/lib/auth/catalog-admin-middleware";
import { getCatalogBySlug } from "@/lib/catalog/queries";
import { getDb } from "@/lib/db/client";
import { v4 as uuidv4 } from "uuid";

// GET: Get operating hours
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

  try {
    const db = getDb();
    const result = await db.execute({
      sql: `
        SELECT * FROM catalog_operating_hours 
        WHERE catalog_id = ? 
        ORDER BY CASE 
          WHEN day_name = 'Monday' THEN 1
          WHEN day_name = 'Tuesday' THEN 2
          WHEN day_name = 'Wednesday' THEN 3
          WHEN day_name = 'Thursday' THEN 4
          WHEN day_name = 'Friday' THEN 5
          WHEN day_name = 'Saturday' THEN 6
          WHEN day_name = 'Sunday' THEN 7
        END
      `,
      args: [catalog.id],
    });

    return NextResponse.json({
      hours: result.rows.map((h) => ({
        day_name: h.day_name,
        open_hour: h.open_hour,
        close_hour: h.close_hour,
        is_closed: Boolean(h.is_closed),
      })),
    });
  } catch (error) {
    console.error("Failed to fetch operating hours:", error);
    return NextResponse.json({ error: "Failed to fetch operating hours" }, { status: 500 });
  }
}

// PUT: Update operating hours
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
    const body = await request.json();
    const { hours } = body;

    if (!Array.isArray(hours)) {
      return NextResponse.json({ error: "Invalid hours format" }, { status: 400 });
    }

    const db = getDb();
    
    for (const hour of hours) {
      // Check if exists
      const existing = await db.execute({
        sql: "SELECT id FROM catalog_operating_hours WHERE catalog_id = ? AND day_name = ?",
        args: [catalog.id, hour.day_name],
      });

      if (existing.rows.length > 0) {
        await db.execute({
          sql: `
            UPDATE catalog_operating_hours 
            SET open_hour = ?, close_hour = ?, is_closed = ?, updated_at = datetime('now')
            WHERE id = ?
          `,
          args: [
            hour.open_hour,
            hour.close_hour,
            hour.is_closed ? 1 : 0,
            existing.rows[0].id
          ],
        });
      } else {
        await db.execute({
          sql: `
            INSERT INTO catalog_operating_hours (
              id, catalog_id, day_name, open_hour, close_hour, is_closed, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
          `,
          args: [
            uuidv4(),
            catalog.id,
            hour.day_name,
            hour.open_hour,
            hour.close_hour,
            hour.is_closed ? 1 : 0,
          ],
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Update hours error:", error);
    return NextResponse.json(
      { error: "Failed to update operating hours" },
      { status: 500 }
    );
  }
}
