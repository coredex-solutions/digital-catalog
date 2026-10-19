import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { hashPassword } from '@/lib/auth/password';
import { passwordFingerprint, verifyPasswordResetToken } from '@/lib/auth/jwt';
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit/middleware';

const MIN_PASSWORD_LENGTH = 8;

async function findAdmin(token: string) {
  const claims = verifyPasswordResetToken(token);
  if (!claims) return null;
  const result = await getDb().execute({
    sql: `
      SELECT ca.id, ca.email, ca.password_hash, c.slug, c.name AS catalog_name
      FROM catalog_admins ca
      JOIN catalogs c ON c.id = ca.catalog_id
      WHERE ca.id = ? AND ca.is_active = 1 AND c.is_suspended = 0
    `,
    args: [claims.adminId],
  });
  const admin = result.rows[0];
  // A link stops working once the password has changed (it was used, or reset another way)
  if (!admin || passwordFingerprint(admin.password_hash as string) !== claims.fp) return null;
  return admin;
}

const EXPIRED = 'This reset link has expired or was already used. Ask for a new one.';

// GET ?token=: is the link still valid? (lets the page say so before the person types anything)
export async function GET(request: NextRequest) {
  const admin = await findAdmin(request.nextUrl.searchParams.get('token') || '');
  if (!admin) return NextResponse.json({ error: EXPIRED }, { status: 400 });
  return NextResponse.json({ email: admin.email, restaurant: admin.catalog_name });
}

// POST { token, password }: set the new password
export async function POST(request: NextRequest) {
  const limit = await checkRateLimit(request, { ...RATE_LIMITS.auth, keyPrefix: 'reset-password' });
  if (!limit.allowed) return rateLimitResponse(RATE_LIMITS.auth, limit.resetAt);

  const body = await request.json().catch(() => null);
  const token = typeof body?.token === 'string' ? body.token : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json({ error: `Use at least ${MIN_PASSWORD_LENGTH} characters.` }, { status: 400 });
  }

  try {
    const admin = await findAdmin(token);
    if (!admin) return NextResponse.json({ error: EXPIRED }, { status: 400 });

    const hash = await hashPassword(password);
    // Only update if the password is still the one the link was issued for (single use)
    const updated = await getDb().execute({
      sql: 'UPDATE catalog_admins SET password_hash = ? WHERE id = ? AND password_hash = ?',
      args: [hash, admin.id, admin.password_hash],
    });
    if (updated.rowsAffected === 0) return NextResponse.json({ error: EXPIRED }, { status: 400 });

    return NextResponse.json({ success: true, slug: admin.slug, email: admin.email });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Could not change the password. Please try again.' }, { status: 500 });
  }
}
