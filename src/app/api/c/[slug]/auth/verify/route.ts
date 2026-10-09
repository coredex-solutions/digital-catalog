import { NextRequest, NextResponse } from 'next/server';
import { requireCatalogAdmin } from '@/lib/auth/catalog-admin-middleware';
import { getCatalogBySlug, getCatalogSettings, getCatalogSubscription } from '@/lib/catalog/queries';
import { getPlanForSubscriptionType, getSubscriptionState } from '@/lib/plans';
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

  // Paused only after the grace period; during it the owner is warned but nothing stops
  const { state: subscriptionState, expiresAt, offlineAt } = getSubscriptionState(subscription?.expires_at);
  const isExpired = subscriptionState === 'expired';

  const enabledLanguages = (['ar', 'en'].filter((l) => String(settings?.enabled_languages || '').split(',').map((s) => s.trim()).includes(l)).join(',')) || 'ar,en';

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
      booking_enabled: subscription?.booking_enabled || false,
      analytics_enabled: subscription?.analytics_enabled || false,
      ai_waiter_enabled: Boolean(settings?.ai_waiter_enabled),
      ai_image_enhancement_limit: subscription?.ai_image_enhancement_limit || 0,
      ai_image_enhancement_used: subscription?.ai_image_enhancement_used || 0,
      max_items: (subscription as any)?.max_items || getPlanForSubscriptionType(subscription?.subscription_type).limits.max_items,
      max_categories: (subscription as any)?.max_categories || getPlanForSubscriptionType(subscription?.subscription_type).limits.max_categories,
      // Menus are Arabic and English only; legacy values such as "fr" are dropped
      enabled_languages: enabledLanguages,
      default_language: ['ar', 'en'].includes(String(settings?.default_language)) && enabledLanguages.split(',').includes(String(settings?.default_language))
        ? String(settings?.default_language)
        : enabledLanguages.split(',')[0],
      is_expired: isExpired,
      in_grace: subscriptionState === 'grace',
      plan_ended_at: subscriptionState === 'active' ? null : expiresAt?.toISOString() ?? null,
      offline_at: offlineAt?.toISOString() ?? null,
      subscription_type: subscription?.subscription_type || 'essential',
    },
  });
}
