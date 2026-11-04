import { NextRequest, NextResponse } from "next/server";
import { requireCatalogAdmin } from "@/lib/auth/catalog-admin-middleware";
import { getCatalogBySlug } from "@/lib/catalog/queries";
import { getDb } from "@/lib/db/client";

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

  const db = getDb();

  const [categoriesResult, itemsResult, analyticsResult, recentItemsResult, ordersResult] =
    await Promise.all([
      // Category count
      db.execute({
        sql: "SELECT COUNT(*) as count FROM categories WHERE catalog_id = ?",
        args: [catalog.id],
      }),

      // Item count
      db.execute({
        sql: "SELECT COUNT(*) as count FROM menu_items WHERE catalog_id = ?",
        args: [catalog.id],
      }),

      // Analytics totals
      db.execute({
        sql: `
          SELECT 
            SUM(page_views) as total_views,
            SUM(unique_visitors) as total_unique,
            SUM(whatsapp_order_clicks) as total_whatsapp,
            SUM(booking_confirm_clicks) as total_bookings
          FROM catalog_analytics
          WHERE catalog_id = ?
        `,
        args: [catalog.id],
      }),

      // Recent items
      db.execute({
        sql: `
          SELECT id, name_en, price, created_at
          FROM menu_items
          WHERE catalog_id = ?
          ORDER BY created_at DESC
          LIMIT 5
        `,
        args: [catalog.id],
      }),

      // Saved orders and bookings in the last 30 days (cancelled ones not counted)
      db.execute({
        sql: `
          SELECT
            SUM(CASE WHEN kind != 'booking' THEN 1 ELSE 0 END) AS orders,
            SUM(CASE WHEN kind = 'booking' THEN 1 ELSE 0 END) AS bookings,
            SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) AS waiting,
            ROUND(SUM(COALESCE(total_usd, 0)), 2) AS revenue_usd
          FROM orders
          WHERE catalog_id = ? AND status != 'cancelled' AND created_at >= datetime('now', '-30 days')
        `,
        args: [catalog.id],
      }).catch(() => null),
    ]);

  return NextResponse.json({
    categories: Number(categoriesResult.rows[0]?.count || 0),
    items: Number(itemsResult.rows[0]?.count || 0),
    analytics: analyticsResult.rows[0] || {
      total_views: 0,
      total_unique: 0,
      total_whatsapp: 0,
      total_bookings: 0,
    },
    recent_items: recentItemsResult.rows,
    // Last 30 days; revenue only counts orders whose total could be put in dollars
    orders_30d: {
      orders: Number(ordersResult?.rows[0]?.orders || 0),
      bookings: Number(ordersResult?.rows[0]?.bookings || 0),
      waiting: Number(ordersResult?.rows[0]?.waiting || 0),
      revenue_usd: Number(ordersResult?.rows[0]?.revenue_usd || 0),
    },
  });
}

