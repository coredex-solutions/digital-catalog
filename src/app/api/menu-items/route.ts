import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';
import { getDb } from '../../../../lib/db/client';
import { requireAuth } from '../../../../lib/auth/middleware';

// GET - Public endpoint for fetching menu items
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    let sql = 'SELECT * FROM menu_items WHERE is_active = 1';
    let args: any[] = [];

    if (categoryId) {
      sql += ' AND category_id = ?';
      args.push(categoryId);
    }

    sql += ' ORDER BY display_order ASC';

    const result = await getDb().execute({ sql, args });

    const items = result.rows.map((row) => ({
      id: row.id,
      category_id: row.category_id,
      name_ar: row.name_ar,
      name_en: row.name_en,
      name_fr: row.name_fr,
      description_ar: row.description_ar,
      description_en: row.description_en,
      description_fr: row.description_fr,
      price: row.price,
      display_order: row.display_order,
    }));

    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create menu item (requires auth)
export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if ('error' in auth) {
      return auth.error;
    }

    const body = await request.json();
    const { category_id, name_ar, name_en, name_fr, description_ar, description_en, description_fr, price, display_order } = body;

    // Generate unique ID
    const id = randomUUID();

    await getDb().execute({
      sql: `INSERT INTO menu_items 
            (id, category_id, name_ar, name_en, name_fr, description_ar, description_en, description_fr, price, display_order, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      args: [id, category_id, name_ar, name_en, name_fr, description_ar || null, description_en || null, description_fr || null, price, display_order || 0],
    });

    // Revalidate
    await fetch(`${request.nextUrl.origin}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Authorization': request.headers.get('authorization') || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 'page', path: `/menu/${category_id}` }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating menu item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

