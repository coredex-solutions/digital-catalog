import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/super-admin-middleware';
import { getDb } from '@/lib/db/client';
import { v4 as uuidv4 } from 'uuid';
import type { SubscriptionType } from '@/lib/db/types';

// GET: List all subscriptions
export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (!auth.success) return auth.response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status'); // 'active', 'expired', 'expiring'

  const db = getDb();

  let sql = `
    SELECT 
      cs.*,
      c.slug as catalog_slug,
      c.name as catalog_name,
      c.is_active as catalog_active,
      CASE 
        WHEN cs.expires_at IS NULL THEN 'forever'
        WHEN cs.expires_at < datetime('now') THEN 'expired'
        WHEN cs.expires_at <= datetime('now', '+30 days') THEN 'expiring'
        ELSE 'active'
      END as status
    FROM catalog_subscriptions cs
    JOIN catalogs c ON c.id = cs.catalog_id
  `;

  if (status === 'expired') {
    sql += " WHERE cs.expires_at IS NOT NULL AND cs.expires_at < datetime('now')";
  } else if (status === 'expiring') {
    sql += " WHERE cs.expires_at IS NOT NULL AND cs.expires_at > datetime('now') AND cs.expires_at <= datetime('now', '+30 days')";
  } else if (status === 'active') {
    sql += " WHERE cs.expires_at IS NULL OR cs.expires_at > datetime('now')";
  }

  sql += ' ORDER BY cs.expires_at ASC NULLS LAST';

  const result = await db.execute(sql);

  return NextResponse.json({ subscriptions: result.rows });
}

// POST: Create/replace subscription for a catalog
export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (!auth.success) return auth.response;

  try {
    const {
      catalog_id,
      subscription_type,
      custom_years,
      amount_paid,
      currency = 'USD',
      payment_method,
      payment_notes,
      multi_language_enabled = false,
      booking_enabled = true,
      analytics_enabled = true,
      custom_domain_enabled = false,
    } = await request.json();

    if (!catalog_id || !subscription_type) {
      return NextResponse.json(
        { error: 'Catalog ID and subscription type are required' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Check catalog exists
    const catalogCheck = await db.execute({
      sql: 'SELECT id FROM catalogs WHERE id = ?',
      args: [catalog_id],
    });

    if (catalogCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Catalog not found' },
        { status: 404 }
      );
    }

    // Calculate dates
    const startsAt = new Date().toISOString();
    let expiresAt: string | null = null;

    if (subscription_type === 'yearly') {
      const expires = new Date();
      expires.setFullYear(expires.getFullYear() + 1);
      expiresAt = expires.toISOString();
    } else if (subscription_type === 'custom_years' && custom_years) {
      const expires = new Date();
      expires.setFullYear(expires.getFullYear() + custom_years);
      expiresAt = expires.toISOString();
    }

    // Delete existing subscription
    await db.execute({
      sql: 'DELETE FROM catalog_subscriptions WHERE catalog_id = ?',
      args: [catalog_id],
    });

    // Create new subscription
    const id = uuidv4();
    await db.execute({
      sql: `
        INSERT INTO catalog_subscriptions (
          id, catalog_id, subscription_type, custom_years, starts_at, expires_at,
          multi_language_enabled, booking_enabled, analytics_enabled, custom_domain_enabled,
          amount_paid, currency, payment_method, payment_notes, is_active, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
      `,
      args: [
        id, catalog_id, subscription_type as SubscriptionType, custom_years || null,
        startsAt, expiresAt,
        multi_language_enabled ? 1 : 0, booking_enabled ? 1 : 0, 
        analytics_enabled ? 1 : 0, custom_domain_enabled ? 1 : 0,
        amount_paid || null, currency, payment_method || null, payment_notes || null,
      ],
    });

    return NextResponse.json({
      success: true,
      subscription: {
        id,
        catalog_id,
        subscription_type,
        starts_at: startsAt,
        expires_at: expiresAt,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}

