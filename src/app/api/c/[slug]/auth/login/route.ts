import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { verifyPassword } from '@/lib/auth/password';
import { signCatalogAdminToken } from '@/lib/auth/jwt';
import { getCatalogBySlug } from '@/lib/catalog/queries';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Get catalog by slug
    const catalog = await getCatalogBySlug(slug);
    if (!catalog) {
      return NextResponse.json(
        { error: 'Catalog not found' },
        { status: 404 }
      );
    }

    const db = getDb();

    // Find admin for this catalog
    const result = await db.execute({
      sql: `
        SELECT ca.*, c.is_suspended as catalog_suspended
        FROM catalog_admins ca
        JOIN catalogs c ON c.id = ca.catalog_id
        WHERE ca.catalog_id = ? AND ca.email = ?
      `,
      args: [catalog.id, email.toLowerCase().trim()],
    });

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const admin = result.rows[0];

    if (!admin.is_active) {
      return NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 403 }
      );
    }

    if (admin.catalog_suspended) {
      return NextResponse.json(
        { error: 'Catalog is suspended' },
        { status: 403 }
      );
    }

    // Verify the password using bcrypt
    const passwordValid = await verifyPassword(password, admin.password_hash as string);
    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Update last login timestamp
    await db.execute({
      sql: "UPDATE catalog_admins SET last_login = datetime('now') WHERE id = ?",
      args: [admin.id],
    });

    // Generate JWT token for catalog admin
    const token = signCatalogAdminToken({
      id: admin.id as string,
      catalog_id: catalog.id,
      email: admin.email as string,
      role: admin.role as 'admin' | 'editor' | 'owner' | 'viewer',
    });

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
      catalog: {
        id: catalog.id,
        slug: catalog.slug,
        name: catalog.name,
      },
    });
  } catch (error: unknown) {
    console.error('Catalog admin login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  return withRateLimit(
    request,
    () => handler(request, context),
    RATE_LIMITS.login
  );
}
