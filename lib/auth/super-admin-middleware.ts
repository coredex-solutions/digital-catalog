import { NextRequest, NextResponse } from 'next/server';
import { verifySuperAdminToken } from './jwt';
import { SuperAdminJWTPayload } from '../db/types';
import { getDb } from '../db/client';

export interface AuthenticatedSuperAdminRequest extends NextRequest {
  superAdmin: SuperAdminJWTPayload;
}

/**
 * Middleware to require super admin authentication
 * Use in API routes that should only be accessible to super admins
 */
export async function requireSuperAdmin(
  request: NextRequest
): Promise<{ success: true; superAdmin: SuperAdminJWTPayload } | { success: false; response: NextResponse }> {
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
  const payload = verifySuperAdminToken(token);

  if (!payload) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      ),
    };
  }

  // Verify super admin still exists and is active
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT id, is_active FROM super_admins WHERE id = ?',
    args: [payload.id],
  });

  if (result.rows.length === 0) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Super admin not found' },
        { status: 401 }
      ),
    };
  }

  const superAdmin = result.rows[0];
  if (!superAdmin.is_active) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 403 }
      ),
    };
  }

  return { success: true, superAdmin: payload };
}

/**
 * Helper to extract super admin from cookie (for SSR pages)
 */
export async function getSuperAdminFromCookie(
  cookieValue: string | undefined
): Promise<SuperAdminJWTPayload | null> {
  if (!cookieValue) return null;
  
  const payload = verifySuperAdminToken(cookieValue);
  if (!payload) return null;

  // Verify still active
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT id, is_active FROM super_admins WHERE id = ? AND is_active = 1',
    args: [payload.id],
  });

  if (result.rows.length === 0) return null;

  return payload;
}

