import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/super-admin-middleware';
import { getDb } from '@/lib/db/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

// POST: Create a new admin for a catalog
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireSuperAdmin(request);
    if (!auth.success) return auth.response;

    const { id } = await params;
    const body = await request.json();
    const db = getDb();

    const { name, email, password, role = 'admin' } = body;

    // Validate required fields
    if (!name || !email || !password) {
        return NextResponse.json(
            { error: 'Name, email, and password are required' },
            { status: 400 }
        );
    }

    if (password.length < 8) {
        return NextResponse.json(
            { error: 'Password must be at least 8 characters' },
            { status: 400 }
        );
    }

    // Check if catalog exists
    const catalog = await db.execute({
        sql: 'SELECT id FROM catalogs WHERE id = ?',
        args: [id],
    });

    if (catalog.rows.length === 0) {
        return NextResponse.json(
            { error: 'Catalog not found' },
            { status: 404 }
        );
    }

    // Check if email already exists for this catalog
    const existing = await db.execute({
        sql: 'SELECT id FROM catalog_admins WHERE catalog_id = ? AND email = ?',
        args: [id, email],
    });

    if (existing.rows.length > 0) {
        return NextResponse.json(
            { error: 'An admin with this email already exists for this catalog' },
            { status: 409 }
        );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create admin
    const adminId = randomUUID();
    await db.execute({
        sql: `
      INSERT INTO catalog_admins (id, catalog_id, email, password_hash, name, role, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'))
    `,
        args: [adminId, id, email, passwordHash, name, role],
    });

    return NextResponse.json({
        success: true,
        admin: { id: adminId, name, email, role }
    });
}
