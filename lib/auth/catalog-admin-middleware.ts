import { NextRequest, NextResponse } from 'next/server';
import { verifyCatalogAdminToken } from './jwt';
import { CatalogAdminJWTPayload } from '../db/types';
import { getDb } from '../db/client';

/**
 * Middleware to require catalog admin authentication
 * Verifies the admin has access to the specified catalog
 */
export async function requireCatalogAdmin(
  request: NextRequest,
  catalogId?: string
): Promise<{ success: true; admin: CatalogAdminJWTPayload } | { success: false; response: NextResponse }> {
  // Get token from Authorization header
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Missing or invalid Authorization header' },
        { status: 401 }
      ),
    };
  }

  const token = authHeader.substring(7);
  const payload = verifyCatalogAdminToken(token);

  if (!payload) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      ),
    };
  }

  // If catalogId is specified, verify access
  if (catalogId && payload.catalog_id !== catalogId) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Access denied to this catalog' },
        { status: 403 }
      ),
    };
  }

  // Verify admin still exists and is active
  const db = getDb();
  const result = await db.execute({
    sql: `
      SELECT ca.id, ca.is_active, c.is_active as catalog_active, c.is_suspended
      FROM catalog_admins ca
      JOIN catalogs c ON c.id = ca.catalog_id
      WHERE ca.id = ?
    `,
    args: [payload.id],
  });

  if (result.rows.length === 0) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Admin not found' },
        { status: 401 }
      ),
    };
  }

  const admin = result.rows[0];
  
  if (!admin.is_active) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 403 }
      ),
    };
  }

  if (!admin.catalog_active || admin.is_suspended) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Catalog is suspended or inactive' },
        { status: 403 }
      ),
    };
  }

  return { success: true, admin: payload };
}

/**
 * Helper to extract catalog admin from cookie (for SSR pages)
 */
export async function getCatalogAdminFromCookie(
  cookieValue: string | undefined
): Promise<CatalogAdminJWTPayload | null> {
  if (!cookieValue) return null;
  
  const payload = verifyCatalogAdminToken(cookieValue);
  if (!payload) return null;

  // Verify still active
  const db = getDb();
  const result = await db.execute({
    sql: `
      SELECT ca.id, ca.is_active, c.is_active as catalog_active, c.is_suspended
      FROM catalog_admins ca
      JOIN catalogs c ON c.id = ca.catalog_id
      WHERE ca.id = ? AND ca.is_active = 1 AND c.is_active = 1 AND c.is_suspended = 0
    `,
    args: [payload.id],
  });

  if (result.rows.length === 0) return null;

  return payload;
}

/**
 * Get catalog subscription features
 */
export async function getCatalogFeatures(catalogId: string): Promise<{
  multi_language_enabled: boolean;
  booking_enabled: boolean;
  analytics_enabled: boolean;
  custom_domain_enabled: boolean;
  is_expired: boolean;
} | null> {
  const db = getDb();
  
  const result = await db.execute({
    sql: `
      SELECT 
        multi_language_enabled,
        booking_enabled,
        analytics_enabled,
        custom_domain_enabled,
        expires_at,
        CASE 
          WHEN expires_at IS NULL THEN 0
          WHEN expires_at > datetime('now') THEN 0
          ELSE 1
        END as is_expired
      FROM catalog_subscriptions
      WHERE catalog_id = ? AND is_active = 1
    `,
    args: [catalogId],
  });

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    multi_language_enabled: Boolean(row.multi_language_enabled),
    booking_enabled: Boolean(row.booking_enabled),
    analytics_enabled: Boolean(row.analytics_enabled),
    custom_domain_enabled: Boolean(row.custom_domain_enabled),
    is_expired: Boolean(row.is_expired),
  };
}

