import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/super-admin-middleware';
import { getDb } from '@/lib/db/client';
import { hashPassword } from '@/lib/auth/password';

// GET: Get single admin
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin(request);
  if (!auth.success) return auth.response;

  const { id } = await params;
  const db = getDb();

  const result = await db.execute({
    sql: `
      SELECT ca.*, c.name as catalog_name, c.slug as catalog_slug
      FROM catalog_admins ca
      JOIN catalogs c ON c.id = ca.catalog_id
      WHERE ca.id = ?
    `,
    args: [id],
  });

  if (result.rows.length === 0) {
    return NextResponse.json(
      { error: 'Admin not found' },
      { status: 404 }
    );
  }

  // Don't return password hash
  const admin = { ...result.rows[0] };
  delete (admin as any).password_hash;

  return NextResponse.json({ admin });
}

// PUT: Update admin
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin(request);
  if (!auth.success) return auth.response;

  const { id } = await params;
  const body = await request.json();
  const db = getDb();

  // Check admin exists
  const existing = await db.execute({
    sql: 'SELECT id, catalog_id FROM catalog_admins WHERE id = ?',
    args: [id],
  });

  if (existing.rows.length === 0) {
    return NextResponse.json(
      { error: 'Admin not found' },
      { status: 404 }
    );
  }

  // Build update query
  const updates: string[] = [];
  const args: (string | number | null)[] = [];

  if (body.name !== undefined) {
    updates.push('name = ?');
    args.push(body.name);
  }

  if (body.email !== undefined) {
    // Check email uniqueness
    const emailCheck = await db.execute({
      sql: 'SELECT id FROM catalog_admins WHERE catalog_id = ? AND email = ? AND id != ?',
      args: [existing.rows[0].catalog_id, body.email.toLowerCase().trim(), id],
    });

    if (emailCheck.rows.length > 0) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 409 }
      );
    }

    updates.push('email = ?');
    args.push(body.email.toLowerCase().trim());
  }

  if (body.password !== undefined && body.password.length >= 8) {
    const passwordHash = await hashPassword(body.password);
    updates.push('password_hash = ?');
    args.push(passwordHash);
  }

  if (body.role !== undefined) {
    updates.push('role = ?');
    args.push(body.role);
  }

  if (body.is_active !== undefined) {
    updates.push('is_active = ?');
    args.push(body.is_active ? 1 : 0);
  }

  if (updates.length === 0) {
    return NextResponse.json(
      { error: 'No fields to update' },
      { status: 400 }
    );
  }

  args.push(id);

  await db.execute({
    sql: `UPDATE catalog_admins SET ${updates.join(', ')} WHERE id = ?`,
    args,
  });

  return NextResponse.json({ success: true });
}

// DELETE: Delete admin
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin(request);
  if (!auth.success) return auth.response;

  const { id } = await params;
  const db = getDb();

  const result = await db.execute({
    sql: 'DELETE FROM catalog_admins WHERE id = ?',
    args: [id],
  });

  if (result.rowsAffected === 0) {
    return NextResponse.json(
      { error: 'Admin not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}

