import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { getDb } from '../../../../../lib/db/client';
import { requireAuth } from '../../../../../lib/auth/middleware';

// GET - Admin endpoint for fetching all menu items (including inactive)
export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if ('error' in auth) {
      return auth.error;
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    let sql = 'SELECT * FROM menu_items';
    let args: any[] = [];

    if (categoryId) {
      sql += ' WHERE category_id = ?';
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
      is_active: (row.is_active as number) === 1,
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

