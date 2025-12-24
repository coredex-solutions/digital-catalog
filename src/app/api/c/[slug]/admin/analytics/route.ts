import { NextRequest, NextResponse } from "next/server";
import { requireCatalogAdmin } from "@/lib/auth/catalog-admin-middleware";
import { getCatalogBySlug } from "@/lib/catalog/queries";
import { getDb } from "@/lib/db/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "30d";

  const catalog = await getCatalogBySlug(slug);
  if (!catalog) {
    return NextResponse.json({ error: "Catalog not found" }, { status: 404 });
  }

  const auth = await requireCatalogAdmin(request, catalog.id);
  if (!auth.success) return auth.response;

  // Calculate date ranges
  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  // Previous period for comparison
  const prevEndDate = new Date(startDate);
  prevEndDate.setDate(prevEndDate.getDate() - 1);
  const prevStartDate = new Date(prevEndDate);
  prevStartDate.setDate(prevStartDate.getDate() - days);

  const db = getDb();

  // Current period data
  const currentResult = await db.execute({
    sql: `
      SELECT 
        date,
        page_views,
        unique_visitors,
        whatsapp_order_clicks,
        booking_confirm_clicks
      FROM catalog_analytics
      WHERE catalog_id = ?
        AND date >= ?
        AND date <= ?
      ORDER BY date DESC
    `,
    args: [
      catalog.id,
      startDate.toISOString().split("T")[0],
      endDate.toISOString().split("T")[0],
    ],
  });

  // Current period totals
  const currentTotals = await db.execute({
    sql: `
      SELECT 
        COALESCE(SUM(page_views), 0) as page_views,
        COALESCE(SUM(unique_visitors), 0) as unique_visitors,
        COALESCE(SUM(whatsapp_order_clicks), 0) as whatsapp_order_clicks,
        COALESCE(SUM(booking_confirm_clicks), 0) as booking_confirm_clicks
      FROM catalog_analytics
      WHERE catalog_id = ?
        AND date >= ?
        AND date <= ?
    `,
    args: [
      catalog.id,
      startDate.toISOString().split("T")[0],
      endDate.toISOString().split("T")[0],
    ],
  });

  // Previous period totals for comparison
  const prevTotals = await db.execute({
    sql: `
      SELECT 
        COALESCE(SUM(page_views), 0) as page_views,
        COALESCE(SUM(unique_visitors), 0) as unique_visitors,
        COALESCE(SUM(whatsapp_order_clicks), 0) as whatsapp_order_clicks,
        COALESCE(SUM(booking_confirm_clicks), 0) as booking_confirm_clicks
      FROM catalog_analytics
      WHERE catalog_id = ?
        AND date >= ?
        AND date <= ?
    `,
    args: [
      catalog.id,
      prevStartDate.toISOString().split("T")[0],
      prevEndDate.toISOString().split("T")[0],
    ],
  });

  const current = currentTotals.rows[0] as any;
  const prev = prevTotals.rows[0] as any;

  // Calculate percentage changes
  const calcChange = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  };

  return NextResponse.json({
    period,
    daily: currentResult.rows,
    totals: {
      page_views: Number(current?.page_views || 0),
      unique_visitors: Number(current?.unique_visitors || 0),
      whatsapp_order_clicks: Number(current?.whatsapp_order_clicks || 0),
      booking_confirm_clicks: Number(current?.booking_confirm_clicks || 0),
    },
    comparison: {
      page_views_change: calcChange(
        Number(current?.page_views || 0),
        Number(prev?.page_views || 0)
      ),
      unique_visitors_change: calcChange(
        Number(current?.unique_visitors || 0),
        Number(prev?.unique_visitors || 0)
      ),
      whatsapp_change: calcChange(
        Number(current?.whatsapp_order_clicks || 0),
        Number(prev?.whatsapp_order_clicks || 0)
      ),
      booking_change: calcChange(
        Number(current?.booking_confirm_clicks || 0),
        Number(prev?.booking_confirm_clicks || 0)
      ),
    },
  });
}

