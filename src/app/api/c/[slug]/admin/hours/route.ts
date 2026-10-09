import { NextRequest, NextResponse } from "next/server";
import { requireCatalogAdmin } from "@/lib/auth/catalog-admin-middleware";
import { getCatalogBySlug } from "@/lib/catalog/queries";
import { getDb } from "@/lib/db/client";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface HoursInput {
  day_name: string;
  open_hour: number;
  close_hour: number;
  is_closed: number;
}

/** Read an hour of the day (0-24, fractions for minutes), accepting numeric strings */
function parseHour(value: unknown): number | null {
  if (typeof value !== "number" && (typeof value !== "string" || value.trim() === "")) return null;
  const hour = Number(value);
  return Number.isFinite(hour) && hour >= 0 && hour <= 24 ? hour : null;
}

/**
 * Validate the hours sent by the admin page. A close hour at or before the open hour is an
 * overnight shift (e.g. 18 -> 2), which the menu's open-now logic supports, so it is allowed.
 */
function parseHours(raw: unknown): { hours: HoursInput[] } | { error: string } {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > DAY_NAMES.length) {
    return { error: "Hours must be a list of up to 7 days" };
  }

  const seen = new Set<string>();
  const hours: HoursInput[] = [];
  for (const entry of raw) {
    const day = DAY_NAMES.find((d) => d.toLowerCase() === String(entry?.day_name ?? "").trim().toLowerCase());
    if (!day) return { error: `Unknown day "${entry?.day_name}"` };
    if (seen.has(day)) return { error: `${day} is listed twice` };
    seen.add(day);

    const isClosed = Boolean(entry.is_closed);
    const open = parseHour(entry.open_hour);
    const close = parseHour(entry.close_hour);
    if (!isClosed && (open === null || close === null || open === 24)) {
      return { error: `${day} needs opening and closing hours between 0 and 24` };
    }

    hours.push({
      day_name: day,
      // A closed day keeps whatever valid hours it had so reopening it restores them
      open_hour: open ?? 9,
      close_hour: close ?? 22,
      is_closed: isClosed ? 1 : 0,
    });
  }
  return { hours };
}

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
        SELECT * FROM operating_hours 
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

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = parseHours(body?.hours);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const db = getDb();

    // Update each day in place, inserting the days that have no row yet, all in one transaction
    const statements = parsed.hours.flatMap((hour) => [
      {
        sql: `
          UPDATE operating_hours
          SET open_hour = ?, close_hour = ?, is_closed = ?, updated_at = datetime('now')
          WHERE catalog_id = ? AND lower(day_name) = lower(?)
        `,
        args: [hour.open_hour, hour.close_hour, hour.is_closed, catalog.id, hour.day_name],
      },
      {
        sql: `
          INSERT INTO operating_hours (
            catalog_id, day_name, open_hour, close_hour, is_closed, updated_at
          )
          SELECT ?, ?, ?, ?, ?, datetime('now')
          WHERE NOT EXISTS (
            SELECT 1 FROM operating_hours WHERE catalog_id = ? AND lower(day_name) = lower(?)
          )
        `,
        args: [catalog.id, hour.day_name, hour.open_hour, hour.close_hour, hour.is_closed, catalog.id, hour.day_name],
      },
    ]);

    await db.batch(statements, "write");

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Update hours error:", error);
    return NextResponse.json(
      { error: "Failed to update operating hours" },
      { status: 500 }
    );
  }
}
