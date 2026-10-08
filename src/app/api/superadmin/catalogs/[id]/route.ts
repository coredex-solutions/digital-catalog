import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/super-admin-middleware';
import { getDb } from '@/lib/db/client';

// GET: Get single catalog with all details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin(request);
  if (!auth.success) return auth.response;

  const { id } = await params;
  const db = getDb();

  // Get catalog with subscription
  const catalogResult = await db.execute({
    sql: `
      SELECT 
        c.*,
        cs.id as subscription_id,
        cs.subscription_type,
        cs.custom_years,
        cs.starts_at,
        cs.expires_at,
        cs.multi_language_enabled,
        cs.booking_enabled,
        cs.analytics_enabled,
        cs.custom_domain_enabled,
        cs.amount_paid,
        cs.currency,
        cs.payment_method,
        cs.payment_notes,
        cs.ai_image_enhancement_limit,
        cs.ai_image_enhancement_used,
        cs.max_items,
        cs.max_categories,
        cs.is_active as subscription_active
      FROM catalogs c
      LEFT JOIN catalog_subscriptions cs ON cs.catalog_id = c.id
      WHERE c.id = ?
    `,
    args: [id],
  });

  if (catalogResult.rows.length === 0) {
    return NextResponse.json(
      { error: 'Catalog not found' },
      { status: 404 }
    );
  }

  // Get admins
  const admins = await db.execute({
    sql: 'SELECT id, email, name, role, is_active, created_at, last_login FROM catalog_admins WHERE catalog_id = ?',
    args: [id],
  });

  // Get settings
  const settings = await db.execute({
    sql: 'SELECT * FROM catalog_settings WHERE catalog_id = ?',
    args: [id],
  });

  // Get contact
  const contact = await db.execute({
    sql: 'SELECT * FROM catalog_contact WHERE catalog_id = ?',
    args: [id],
  });

  // Get analytics summary
  const analytics = await db.execute({
    sql: `
      SELECT 
        SUM(page_views) as total_views,
        SUM(unique_visitors) as total_unique,
        SUM(whatsapp_order_clicks) as total_whatsapp,
        SUM(booking_confirm_clicks) as total_bookings
      FROM catalog_analytics
      WHERE catalog_id = ?
    `,
    args: [id],
  });

  // Get content counts
  const counts = await db.execute({
    sql: `
      SELECT 
        (SELECT COUNT(*) FROM categories WHERE catalog_id = ?) as categories,
        (SELECT COUNT(*) FROM menu_items WHERE catalog_id = ?) as items,
        (SELECT COUNT(*) FROM branches WHERE catalog_id = ?) as branches,
        (SELECT COUNT(*) FROM faqs WHERE catalog_id = ?) as faqs
    `,
    args: [id, id, id, id],
  });

  return NextResponse.json({
    catalog: catalogResult.rows[0],
    admins: admins.rows,
    settings: settings.rows[0] || null,
    contact: contact.rows[0] || null,
    analytics: analytics.rows[0] || { total_views: 0, total_unique: 0, total_whatsapp: 0, total_bookings: 0 },
    counts: counts.rows[0] || { categories: 0, items: 0, branches: 0, faqs: 0 },
  });
}

// PUT: Update catalog
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin(request);
  if (!auth.success) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const db = getDb();

    // Check catalog exists
    const existing = await db.execute({
      sql: 'SELECT id, slug FROM catalogs WHERE id = ?',
      args: [id],
    });

    if (existing.rows.length === 0) {
      return NextResponse.json(
        { error: 'Catalog not found' },
        { status: 404 }
      );
    }

    // If updating slug, check it's unique
    if (body.slug && body.slug !== existing.rows[0].slug) {
      const slugCheck = await db.execute({
        sql: 'SELECT id FROM catalogs WHERE slug = ? AND id != ?',
        args: [body.slug, id],
      });

      if (slugCheck.rows.length > 0) {
        return NextResponse.json(
          { error: 'Slug is already taken' },
          { status: 409 }
        );
      }
    }

    // 1. Update Catalog Table
    const catalogUpdates: string[] = [];
    const catalogArgs: (string | number | null)[] = [];
    const allowedCatalogFields = ['slug', 'name', 'business_type', 'description', 'logo_url', 'is_active', 'is_suspended', 'suspension_reason'];

    for (const field of allowedCatalogFields) {
      if (body[field] !== undefined) {
        catalogUpdates.push(`${field} = ?`);
        // Convert boolean to 1/0 for SQLite
        const val = typeof body[field] === 'boolean' ? (body[field] ? 1 : 0) : body[field];
        catalogArgs.push(val);
      }
    }

    if (catalogUpdates.length > 0) {
      catalogUpdates.push("updated_at = datetime('now')");
      catalogArgs.push(id);

      await db.execute({
        sql: `UPDATE catalogs SET ${catalogUpdates.join(', ')} WHERE id = ?`,
        args: catalogArgs,
      });
    }

    // 2. Update Subscription Table
    const subUpdates: string[] = [];
    const subArgs: (string | number | null)[] = [];
    const allowedSubFields = [
      'subscription_type', 'starts_at', 'expires_at',
      'multi_language_enabled', 'booking_enabled', 'analytics_enabled', 'custom_domain_enabled',
      'ai_image_enhancement_limit', 'max_items', 'max_categories',
      'amount_paid', 'payment_method', 'payment_notes'
    ];

    for (const field of allowedSubFields) {
      if (body[field] !== undefined) {
        subUpdates.push(`${field} = ?`);
        // Convert boolean to 1/0 for SQLite
        const val = typeof body[field] === 'boolean' ? (body[field] ? 1 : 0) : body[field];
        subArgs.push(val);
      }
    }

    if (subUpdates.length > 0) {
      subUpdates.push("updated_at = datetime('now')");
      subArgs.push(id);

      await db.execute({
        sql: `UPDATE catalog_subscriptions SET ${subUpdates.join(', ')} WHERE catalog_id = ?`,
        args: subArgs,
      });
    }

    // 3. Update Settings Table (Added for languages management)
    const settingsUpdates: string[] = [];
    const settingsArgs: (string | number | null)[] = [];
    const allowedSettingsFields = ['enabled_languages', 'default_language'];

    for (const field of allowedSettingsFields) {
      if (body[field] !== undefined) {
        settingsUpdates.push(`${field} = ?`);
        settingsArgs.push(body[field]);
      }
    }

    if (settingsUpdates.length > 0) {
      settingsUpdates.push("updated_at = datetime('now')");
      settingsArgs.push(id);

      await db.execute({
        sql: `UPDATE catalog_settings SET ${settingsUpdates.join(', ')} WHERE catalog_id = ?`,
        args: settingsArgs,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to update catalog:', error);
    return NextResponse.json(
      { error: error.code === 'UND_ERR_CONNECT_TIMEOUT' ? 'Database connection timeout. Please try again.' : 'Failed to update catalog' },
      { status: 500 }
    );
  }
}

// DELETE: Delete catalog (soft delete by suspending, or hard delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin(request);
  if (!auth.success) return auth.response;

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const hardDelete = searchParams.get('hard') === 'true';

  const db = getDb();

  // Check catalog exists
  const existing = await db.execute({
    sql: 'SELECT id FROM catalogs WHERE id = ?',
    args: [id],
  });

  if (existing.rows.length === 0) {
    return NextResponse.json(
      { error: 'Catalog not found' },
      { status: 404 }
    );
  }

  if (hardDelete) {
    // Hard delete - cascade will handle related records
    await db.execute({
      sql: 'DELETE FROM catalogs WHERE id = ?',
      args: [id],
    });

    return NextResponse.json({ success: true, message: 'Catalog permanently deleted' });
  } else {
    // Soft delete - suspend the catalog
    await db.execute({
      sql: `
        UPDATE catalogs 
        SET is_suspended = 1, suspension_reason = 'Deleted by super admin', updated_at = datetime('now')
        WHERE id = ?
      `,
      args: [id],
    });

    return NextResponse.json({ success: true, message: 'Catalog suspended' });
  }
}

