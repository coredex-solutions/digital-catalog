import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/super-admin-middleware";
import { getDb } from "@/lib/db/client";

/** Today's calendar day in Beirut (YYYY-MM-DD): the day catalog_analytics.date is recorded under */
const beirutToday = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Beirut" }).format(new Date());

/** Shift a YYYY-MM-DD day by whole days (calendar arithmetic, no timezone involved) */
function shiftDay(day: string, deltaDays: number): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

// GET: Get platform-wide analytics
export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (!auth.success) return auth.response;

  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "30d";

  // Calculate date range
  let daysBack = 30;
  if (range === "7d") daysBack = 7;
  else if (range === "90d") daysBack = 90;

  // Beirut calendar days, matching how catalog_analytics.date is recorded
  const today = beirutToday();
  const periodStart = shiftDay(today, -daysBack);
  const prevPeriodStart = shiftDay(today, -daysBack * 2);

  try {
    const db = getDb();

    // Get total views for current period
    const viewsResult = await db.execute({
      sql: `
        SELECT SUM(page_views) as total
        FROM catalog_analytics
        WHERE date >= ?
      `,
      args: [periodStart],
    });

    // Get views for previous period (for comparison)
    const prevViewsResult = await db.execute({
      sql: `
        SELECT SUM(page_views) as total
        FROM catalog_analytics
        WHERE date >= ?
          AND date < ?
      `,
      args: [prevPeriodStart, periodStart],
    });

    // Get WhatsApp clicks
    const whatsappResult = await db.execute({
      sql: `
        SELECT SUM(whatsapp_order_clicks) as total
        FROM catalog_analytics
        WHERE date >= ?
      `,
      args: [periodStart],
    });

    const prevWhatsappResult = await db.execute({
      sql: `
        SELECT SUM(whatsapp_order_clicks) as total
        FROM catalog_analytics
        WHERE date >= ?
          AND date < ?
      `,
      args: [prevPeriodStart, periodStart],
    });

    // Get bookings
    const bookingsResult = await db.execute({
      sql: `
        SELECT SUM(booking_confirm_clicks) as total
        FROM catalog_analytics
        WHERE date >= ?
      `,
      args: [periodStart],
    });

    const prevBookingsResult = await db.execute({
      sql: `
        SELECT SUM(booking_confirm_clicks) as total
        FROM catalog_analytics
        WHERE date >= ?
          AND date < ?
      `,
      args: [prevPeriodStart, periodStart],
    });

    // Top catalogs
    const topCatalogsResult = await db.execute({
      sql: `
        SELECT 
          c.id,
          c.name,
          c.slug,
          COALESCE(SUM(ca.page_views), 0) as views,
          COALESCE(SUM(ca.whatsapp_order_clicks), 0) as whatsapp_clicks,
          COALESCE(SUM(ca.booking_confirm_clicks), 0) as bookings
        FROM catalogs c
        LEFT JOIN catalog_analytics ca ON c.id = ca.catalog_id
          AND ca.date >= ?
        GROUP BY c.id
        ORDER BY views DESC
        LIMIT 10
      `,
      args: [periodStart],
    });

    // Helper to calculate percentage change
    const calcChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const totalViews = Number((viewsResult.rows[0] as any)?.total || 0);
    const prevViews = Number((prevViewsResult.rows[0] as any)?.total || 0);
    const totalWhatsapp = Number((whatsappResult.rows[0] as any)?.total || 0);
    const prevWhatsapp = Number((prevWhatsappResult.rows[0] as any)?.total || 0);
    const totalBookings = Number((bookingsResult.rows[0] as any)?.total || 0);
    const prevBookings = Number((prevBookingsResult.rows[0] as any)?.total || 0);

    return NextResponse.json({
      total_views: totalViews,
      views_change: calcChange(totalViews, prevViews),
      total_whatsapp_clicks: totalWhatsapp,
      whatsapp_change: calcChange(totalWhatsapp, prevWhatsapp),
      total_bookings: totalBookings,
      bookings_change: calcChange(totalBookings, prevBookings),
      top_catalogs: topCatalogsResult.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        views: Number(row.views || 0),
        whatsapp_clicks: Number(row.whatsapp_clicks || 0),
        bookings: Number(row.bookings || 0),
      })),
      daily_stats: [],
    });
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
