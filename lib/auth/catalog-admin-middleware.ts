import { NextRequest, NextResponse } from 'next/server';
import { verifyCatalogAdminToken } from './jwt';
import { CatalogAdminJWTPayload } from '../db/types';
import { getDb } from '../db/client';
import { SQL_GRACE_MODIFIER } from "@/lib/plans";

// Methods that never change data
const READ_METHODS = ['GET', 'HEAD', 'OPTIONS'];

/**
 * Middleware to require catalog admin authentication
 * Verifies the admin has access to the specified catalog.
 * Writes are refused once the catalog's subscription has expired, unless allowExpired is set
 * (e.g. for submitting an upgrade request); reads (GET) stay available.
 * Admins with the 'viewer' role (as stored now, not as in the token) can only read.
 */
export async function requireCatalogAdmin(
  request: NextRequest,
  catalogId?: string,
  options: { allowExpired?: boolean; ownerOnly?: boolean } = {}
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
      SELECT ca.id, ca.is_active, ca.role, c.is_active as catalog_active, c.is_suspended,
        EXISTS (
          SELECT 1 FROM catalog_subscriptions cs
          WHERE cs.catalog_id = ca.catalog_id AND cs.is_active = 1
            AND cs.expires_at IS NOT NULL AND datetime(cs.expires_at, ?) <= datetime('now')
        ) as is_expired
      FROM catalog_admins ca
      JOIN catalogs c ON c.id = ca.catalog_id
      WHERE ca.id = ?
    `,
    // Writes stay open during the grace period after the plan ends
    args: [SQL_GRACE_MODIFIER, payload.id],
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

  const isRead = READ_METHODS.includes(request.method);

  if (admin.role === 'viewer' && !isRead) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Your account has view-only access' },
        { status: 403 }
      ),
    };
  }

  // Settings, billing and the team are the owner's: editors and viewers can only read them
  if (options.ownerOnly && !isRead && !isOwnerRole(admin.role)) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Only the owner can change this' },
        { status: 403 }
      ),
    };
  }

  if (admin.is_expired && !isRead && !options.allowExpired) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Subscription has expired. Please renew to make changes.' },
        { status: 402 }
      ),
    };
  }

  // The role as stored now (a changed role applies immediately, not at the next login)
  return { success: true, admin: { ...payload, role: (admin.role || 'admin') as CatalogAdminJWTPayload['role'] } };
}

/** 'owner' and the original 'admin' role both mean the restaurant's owner */
export function isOwnerRole(role: unknown): boolean {
  return role === 'owner' || role === 'admin' || role === null || role === undefined;
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
          WHEN datetime(expires_at, ?) > datetime('now') THEN 0
          ELSE 1
        END as is_expired
      FROM catalog_subscriptions
      WHERE catalog_id = ? AND is_active = 1
    `,
    args: [SQL_GRACE_MODIFIER, catalogId],
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

