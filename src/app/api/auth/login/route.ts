import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { verifyPassword } from '@/lib/auth/password';
import { signCatalogAdminToken } from '@/lib/auth/jwt';
import { checkRateLimit, rateLimitResponse, withRateLimit } from '@/lib/rate-limit/middleware';

// Per address (staff often share one restaurant connection) and per email (stops guessing
// one account's password from many addresses)
const PER_IP = { windowMs: 15 * 60 * 1000, maxRequests: 10, keyPrefix: 'login' };
const PER_EMAIL = { windowMs: 15 * 60 * 1000, maxRequests: 8, keyPrefix: 'login-email' };

// POST { email, password, slug? }: owner and team sign-in from one place (/login).
// Without a slug, the email is looked up across every restaurant; one email can belong to
// several, so every restaurant where the password matches is returned for the person to pick.
async function handler(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.toLowerCase().trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  const slug = typeof body?.slug === 'string' ? body.slug.trim() : '';

  if (!email || !password) {
    return NextResponse.json({ error: 'Enter your email and password.' }, { status: 400 });
  }

  const perEmail = await checkRateLimit(request, PER_EMAIL, `email:${email}`);
  if (!perEmail.allowed) return rateLimitResponse(PER_EMAIL, perEmail.resetAt);

  try {
    const db = getDb();
    const result = await db.execute({
      sql: `
        SELECT ca.id, ca.email, ca.name, ca.role, ca.password_hash, ca.is_active,
               c.id AS catalog_id, c.slug, c.name AS catalog_name, c.is_suspended
        FROM catalog_admins ca
        JOIN catalogs c ON c.id = ca.catalog_id
        WHERE LOWER(ca.email) = ? AND (? = '' OR c.slug = ?)
        ORDER BY c.name
      `,
      args: [email, slug, slug],
    });

    // Check the password before saying anything about the account, so the replies don't
    // reveal which emails are registered
    const matches = [];
    for (const row of result.rows) {
      if (await verifyPassword(password, row.password_hash as string)) matches.push(row);
    }
    if (matches.length === 0) {
      return NextResponse.json({ error: 'That email and password don’t match.' }, { status: 401 });
    }

    const usable = matches.filter((row) => row.is_active && !row.is_suspended);
    if (usable.length === 0) {
      const paused = matches.some((row) => !row.is_active);
      return NextResponse.json(
        { error: paused ? 'Your access has been paused. Ask the restaurant owner to turn it back on.' : 'This restaurant is suspended. Contact Coredex.' },
        { status: 403 }
      );
    }

    await db.batch(
      usable.map((row) => ({ sql: "UPDATE catalog_admins SET last_login = datetime('now') WHERE id = ?", args: [row.id] })),
      'write'
    );

    const accounts = usable.map((row) => ({
      slug: row.slug as string,
      name: row.catalog_name as string,
      role: row.role as string,
      token: signCatalogAdminToken({
        id: row.id as string,
        catalog_id: row.catalog_id as string,
        email: row.email as string,
        role: row.role as 'admin' | 'editor' | 'owner' | 'viewer',
      }),
    }));

    return NextResponse.json({ success: true, accounts });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Sign-in failed. Please try again.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return withRateLimit(request, () => handler(request), PER_IP);
}
