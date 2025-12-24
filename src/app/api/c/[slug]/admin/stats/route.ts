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

  const [categoriesResult, itemsResult, analyticsResult, recentItemsResult] =
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
  });
}

