import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { getDb } from '../../../../../lib/db/client';
import { requireAuth } from '../../../../../lib/auth/middleware';

// PUT - Update menu item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(request);
    if ('error' in auth) {
      return auth.error;
    }

    const { id } = await params;
    const body = await request.json();
    const { category_id, name_ar, name_en, name_fr, description_ar, description_en, description_fr, price, display_order, is_active } = body;

    await getDb().execute({
      sql: `UPDATE menu_items 
            SET category_id = ?, name_ar = ?, name_en = ?, name_fr = ?, description_ar = ?, description_en = ?, description_fr = ?, 
                price = ?, display_order = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
      args: [category_id, name_ar, name_en, name_fr, description_ar || null, description_en || null, description_fr || null, 
             price, display_order || 0, is_active ? 1 : 0, id],
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
    console.error('Error updating menu item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete menu item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(request);
    if ('error' in auth) {
      return auth.error;
    }

    const { id } = await params;
    // Get category_id before deleting
    const itemResult = await getDb().execute({
      sql: 'SELECT category_id FROM menu_items WHERE id = ?',
      args: [id],
    });

    await getDb().execute({
      sql: 'DELETE FROM menu_items WHERE id = ?',
      args: [id],
    });

    const categoryId = itemResult.rows[0]?.category_id;

    // Revalidate
    if (categoryId) {
      await fetch(`${request.nextUrl.origin}/api/revalidate`, {
        method: 'POST',
        headers: {
          'Authorization': request.headers.get('authorization') || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'page', path: `/menu/${categoryId}` }),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

