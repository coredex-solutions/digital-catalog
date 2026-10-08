import { NextRequest, NextResponse } from 'next/server';
import { requireCatalogAdmin } from '@/lib/auth/catalog-admin-middleware';
import { getCatalogBySlug, getCatalogSettings, getCatalogSubscription } from '@/lib/catalog/queries';
import { getDb } from '@/lib/db/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Get catalog by slug
  const catalog = await getCatalogBySlug(slug);
  if (!catalog) {
    return NextResponse.json(
      { error: 'Catalog not found' },
      { status: 404 }
    );
  }

  // Verify admin token
  const auth = await requireCatalogAdmin(request, catalog.id);
  if (!auth.success) {
    return auth.response;
  }

  // Get fresh user data
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT id, email, name, role, created_at, last_login FROM catalog_admins WHERE id = ?',
    args: [auth.admin.id],
  });

  if (result.rows.length === 0) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }

  // Get subscription features
  const [settings, subscription] = await Promise.all([
    getCatalogSettings(catalog.id),
    getCatalogSubscription(catalog.id),
  ]);

  // Check if subscription is expired
  const isExpired = subscription?.expires_at
    ? new Date(subscription.expires_at) < new Date()
    : false;

  return NextResponse.json({
    valid: true,
    user: result.rows[0],
    catalog: {
      id: catalog.id,
      slug: catalog.slug,
      name: catalog.name,
      business_type: catalog.business_type,
    },
    features: {
      multi_language_enabled: subscription?.multi_language_enabled || false,
      booking_enabled: subscription?.booking_enabled || false,
      analytics_enabled: subscription?.analytics_enabled || false,
      ai_waiter_enabled: Boolean(settings?.ai_waiter_enabled),
      ai_image_enhancement_limit: subscription?.ai_image_enhancement_limit || 0,
      ai_image_enhancement_used: subscription?.ai_image_enhancement_used || 0,
      max_items: (subscription as any)?.max_items || 200,
      max_categories: (subscription as any)?.max_categories || 20,
      enabled_languages: settings?.enabled_languages || 'en',
      default_language: settings?.default_language || 'en',
      is_expired: isExpired,
      subscription_type: subscription?.subscription_type || 'essential',
    },
  });
}
