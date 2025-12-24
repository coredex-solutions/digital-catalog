import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { getDb } from '../../../../../lib/db/client';
import { requireAuth } from '../../../../../lib/auth/middleware';

// GET - Admin endpoint for fetching all categories (including inactive)
export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if ('error' in auth) {
      return auth.error;
    }

    const result = await getDb().execute({
      sql: 'SELECT * FROM categories ORDER BY display_order ASC',
    });

    const categories = result.rows.map((row) => ({
      id: row.id,
      name_ar: row.name_ar,
      name_en: row.name_en,
      name_fr: row.name_fr,
      image_url: row.image_url,
      icon_name: row.icon_name,
      display_order: row.display_order,
      is_active: (row.is_active as number) === 1,
    }));

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

