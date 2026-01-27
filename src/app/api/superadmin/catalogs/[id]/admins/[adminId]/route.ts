import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/super-admin-middleware';
import { getDb } from '@/lib/db/client';
import bcrypt from 'bcryptjs';

// PUT: Update an admin
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; adminId: string }> }
) {
    const auth = await requireSuperAdmin(request);
    if (!auth.success) return auth.response;

    const { id, adminId } = await params;
    const body = await request.json();
    const db = getDb();

    // Check admin exists and belongs to this catalog
    const existing = await db.execute({
        sql: 'SELECT id, email FROM catalog_admins WHERE id = ? AND catalog_id = ?',
        args: [adminId, id],
    });

    if (existing.rows.length === 0) {
        return NextResponse.json(
            { error: 'Admin not found' },
            { status: 404 }
        );
    }

    const updates: string[] = [];
    const args: (string | number)[] = [];

    // Update name
    if (body.name !== undefined) {
        updates.push('name = ?');
        args.push(body.name);
    }

    // Update email (check for duplicates)
    if (body.email !== undefined && body.email !== existing.rows[0].email) {
        const emailCheck = await db.execute({
            sql: 'SELECT id FROM catalog_admins WHERE catalog_id = ? AND email = ? AND id != ?',
            args: [id, body.email, adminId],
        });

        if (emailCheck.rows.length > 0) {
            return NextResponse.json(
                { error: 'Email already in use by another admin' },
                { status: 409 }
            );
        }

        updates.push('email = ?');
        args.push(body.email);
    }

    // Update role
    if (body.role !== undefined) {
        updates.push('role = ?');
        args.push(body.role);
    }

    // Update password if provided
    if (body.password && body.password.length >= 8) {
        const passwordHash = await bcrypt.hash(body.password, 12);
        updates.push('password_hash = ?');
        args.push(passwordHash);
    }

    if (updates.length === 0) {
        return NextResponse.json({ success: true, message: 'No changes made' });
    }

    updates.push("updated_at = datetime('now')");
    args.push(adminId);
    args.push(id);

    await db.execute({
        sql: `UPDATE catalog_admins SET ${updates.join(', ')} WHERE id = ? AND catalog_id = ?`,
        args,
    });

    return NextResponse.json({ success: true });
}

// DELETE: Remove an admin
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; adminId: string }> }
) {
    const auth = await requireSuperAdmin(request);
    if (!auth.success) return auth.response;

    const { id, adminId } = await params;
    const db = getDb();

    // Check admin exists
    const existing = await db.execute({
        sql: 'SELECT id FROM catalog_admins WHERE id = ? AND catalog_id = ?',
        args: [adminId, id],
    });

    if (existing.rows.length === 0) {
        return NextResponse.json(
            { error: 'Admin not found' },
            { status: 404 }
        );
    }

    // Check if this is the last admin
    const adminCount = await db.execute({
        sql: 'SELECT COUNT(*) as count FROM catalog_admins WHERE catalog_id = ?',
        args: [id],
    });

    if (Number(adminCount.rows[0].count) <= 1) {
        return NextResponse.json(
            { error: 'Cannot delete the last admin of a catalog' },
            { status: 400 }
        );
    }

    // Delete admin
    await db.execute({
        sql: 'DELETE FROM catalog_admins WHERE id = ? AND catalog_id = ?',
        args: [adminId, id],
    });

    return NextResponse.json({ success: true });
}
