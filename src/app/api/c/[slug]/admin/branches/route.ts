import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { v4 as uuidv4 } from 'uuid';
import { requireCatalogAdmin } from '@/lib/auth/catalog-admin-middleware';
import { getCatalogBySlug } from '@/lib/catalog/queries';

// Helper to verify catalog admin token
async function verifyCatalogAdmin(request: NextRequest, slug: string) {
    const catalog = await getCatalogBySlug(slug);
    if (!catalog) {
        return { success: false as const, response: NextResponse.json({ error: 'Catalog not found' }, { status: 404 }) };
    }

    const auth = await requireCatalogAdmin(request, catalog.id);
    if (!auth.success) {
        return { success: false as const, response: auth.response };
    }

    return { success: true as const, adminId: auth.admin.id, catalogId: catalog.id };
}

// GET: Fetch all branches for a catalog
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    const auth = await verifyCatalogAdmin(request, slug);
    if (!auth.success) return auth.response;

    const db = getDb();

    try {
        const result = await db.execute({
            sql: `SELECT * FROM branches WHERE catalog_id = ? ORDER BY display_order ASC, created_at DESC`,
            args: [auth.catalogId],
        });

        return NextResponse.json({ branches: result.rows });
    } catch (error) {
        console.error('Failed to fetch branches:', error);
        return NextResponse.json({ error: 'Failed to fetch branches' }, { status: 500 });
    }
}

// POST: Create a new branch
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    const auth = await verifyCatalogAdmin(request, slug);
    if (!auth.success) return auth.response;

    const body = await request.json();
    const db = getDb();

    const id = uuidv4();

    try {
        await db.execute({
            sql: `
        INSERT INTO branches (
          id, catalog_id, 
          name_ar, name_en, name_fr,
          address_ar, address_en, address_fr,
          phone_numbers, map_url, display_order, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
            args: [
                id,
                auth.catalogId,
                body.name_ar || '',
                body.name_en || '',
                body.name_fr || '',
                body.address_ar || '',
                body.address_en || '',
                body.address_fr || '',
                body.phone_numbers || null,
                body.map_url || null,
                body.display_order || 0,
                body.is_active !== undefined ? (body.is_active ? 1 : 0) : 1,
            ],
        });

        return NextResponse.json({ success: true, id });
    } catch (error) {
        console.error('Failed to create branch:', error);
        return NextResponse.json({ error: 'Failed to create branch' }, { status: 500 });
    }
}

// PUT: Update a branch
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    const auth = await verifyCatalogAdmin(request, slug);
    if (!auth.success) return auth.response;

    const body = await request.json();
    const db = getDb();

    if (!body.id) {
        return NextResponse.json({ error: 'Branch ID required' }, { status: 400 });
    }

    const updates: string[] = [];
    const args: (string | number | null)[] = [];

    const allowedFields = [
        'name_ar', 'name_en', 'name_fr',
        'address_ar', 'address_en', 'address_fr',
        'phone_numbers', 'map_url', 'display_order', 'is_active'
    ];

    for (const field of allowedFields) {
        if (body[field] !== undefined) {
            updates.push(`${field} = ?`);
            const val = field === 'is_active' ? (body[field] ? 1 : 0) : body[field];
            args.push(val);
        }
    }

    if (updates.length === 0) {
        return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push("updated_at = datetime('now')");
    args.push(body.id, auth.catalogId);

    try {
        await db.execute({
            sql: `UPDATE branches SET ${updates.join(', ')} WHERE id = ? AND catalog_id = ?`,
            args,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to update branch:', error);
        return NextResponse.json({ error: 'Failed to update branch' }, { status: 500 });
    }
}

// DELETE: Remove a branch
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    const auth = await verifyCatalogAdmin(request, slug);
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Branch ID required' }, { status: 400 });
    }

    const db = getDb();

    try {
        await db.execute({
            sql: `DELETE FROM branches WHERE id = ? AND catalog_id = ?`,
            args: [id, auth.catalogId],
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete branch:', error);
        return NextResponse.json({ error: 'Failed to delete branch' }, { status: 500 });
    }
}
