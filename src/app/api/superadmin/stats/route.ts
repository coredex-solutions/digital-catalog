import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/super-admin-middleware';
import { getDb } from '@/lib/db/client';

// GET: Dashboard stats for super admin
export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (!auth.success) return auth.response;

  const db = getDb();

  // Get overall stats
  const [
    catalogStats,
    subscriptionStats,
    analyticsStats,
    recentCatalogs,
  ] = await Promise.all([
    // Catalog counts
    db.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_active = 1 AND is_suspended = 0 THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN is_suspended = 1 THEN 1 ELSE 0 END) as suspended
      FROM catalogs
    `),

    // Subscription stats
    db.execute(`
      SELECT 
        subscription_type,
        COUNT(*) as count,
        SUM(CASE 
          WHEN expires_at IS NULL THEN 0
          WHEN expires_at < datetime('now') THEN 1
          ELSE 0
        END) as expired
      FROM catalog_subscriptions
      GROUP BY subscription_type
    `),

    // Analytics totals (last 30 days)
    db.execute(`
      SELECT 
        SUM(page_views) as total_views,
        SUM(unique_visitors) as total_unique,
        SUM(whatsapp_order_clicks) as total_whatsapp,
        SUM(booking_confirm_clicks) as total_bookings
      FROM catalog_analytics
      WHERE date >= date('now', '-30 days')
    `),

    // Recent catalogs
    db.execute(`
      SELECT 
        c.id, c.slug, c.name, c.business_type, c.created_at,
        cs.subscription_type, cs.expires_at
      FROM catalogs c
      LEFT JOIN catalog_subscriptions cs ON cs.catalog_id = c.id
      ORDER BY c.created_at DESC
      LIMIT 10
    `),
  ]);

  // Get expiring soon (within 30 days)
  const expiringSoon = await db.execute(`
    SELECT 
      c.id, c.slug, c.name, cs.expires_at
    FROM catalogs c
    JOIN catalog_subscriptions cs ON cs.catalog_id = c.id
    WHERE cs.expires_at IS NOT NULL
      AND cs.expires_at > datetime('now')
      AND cs.expires_at <= datetime('now', '+30 days')
    ORDER BY cs.expires_at ASC
  `);

  return NextResponse.json({
    catalogs: catalogStats.rows[0],
    subscriptions: subscriptionStats.rows,
    analytics: analyticsStats.rows[0] || {
      total_views: 0,
      total_unique: 0,
      total_whatsapp: 0,
      total_bookings: 0,
    },
    recent_catalogs: recentCatalogs.rows,
    expiring_soon: expiringSoon.rows,
  });
}

