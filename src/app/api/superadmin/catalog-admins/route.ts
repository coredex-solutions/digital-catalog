import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/super-admin-middleware';
import { getDb } from '@/lib/db/client';
import { hashPassword } from '@/lib/auth/password';
import { v4 as uuidv4 } from 'uuid';

// Never select password_hash: these rows are sent to the browser
const ADMIN_COLUMNS = 'ca.id, ca.catalog_id, ca.email, ca.name, ca.role, ca.is_active, ca.created_at, ca.last_login';

// GET: List admins (optionally by catalog)
export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (!auth.success) return auth.response;

  const { searchParams } = new URL(request.url);
  const catalogId = searchParams.get('catalog_id');

  const db = getDb();

  let result;
  if (catalogId) {
    result = await db.execute({
      sql: `
        SELECT ${ADMIN_COLUMNS}, c.name as catalog_name, c.slug as catalog_slug
        FROM catalog_admins ca
        JOIN catalogs c ON c.id = ca.catalog_id
        WHERE ca.catalog_id = ?
        ORDER BY ca.created_at DESC
      `,
      args: [catalogId],
    });
  } else {
    result = await db.execute(`
      SELECT ${ADMIN_COLUMNS}, c.name as catalog_name, c.slug as catalog_slug
      FROM catalog_admins ca
      JOIN catalogs c ON c.id = ca.catalog_id
      ORDER BY ca.created_at DESC
    `);
  }

  return NextResponse.json({ admins: result.rows });
}

// POST: Create new catalog admin
export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (!auth.success) return auth.response;

  try {
    const { catalog_id, email, password, name, role = 'admin' } = await request.json();

    if (!catalog_id || !email || !password || !name) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
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

    // Check email not already used for this catalog
    const emailCheck = await db.execute({
      sql: 'SELECT id FROM catalog_admins WHERE catalog_id = ? AND email = ?',
      args: [catalog_id, email.toLowerCase().trim()],
    });

    if (emailCheck.rows.length > 0) {
      return NextResponse.json(
        { error: 'An admin with this email already exists for this catalog' },
        { status: 409 }
      );
    }

    const id = uuidv4();
    const passwordHash = await hashPassword(password);

    await db.execute({
      sql: `
        INSERT INTO catalog_admins (id, catalog_id, email, password_hash, name, role, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'))
      `,
      args: [id, catalog_id, email.toLowerCase().trim(), passwordHash, name, role],
    });

    return NextResponse.json({
      success: true,
      admin: { id, catalog_id, email: email.toLowerCase().trim(), name, role },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create catalog admin error:', error);
    return NextResponse.json(
      { error: 'Failed to create admin' },
      { status: 500 }
    );
  }
}

