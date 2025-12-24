import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { getDb } from '../../../../lib/db/client';
import { requireAuth } from '../../../../lib/auth/middleware';

// GET - Public endpoint
export async function GET() {
  try {
    const result = await getDb().execute({
      sql: 'SELECT * FROM operating_hours ORDER BY id ASC',
    });

    const hours = result.rows.map((row) => ({
      day_name: row.day_name,
      open_hour: row.open_hour,
      close_hour: row.close_hour,
      is_closed: row.is_closed === 1,
    }));

    return NextResponse.json(hours);
  } catch (error) {
    console.error('Error fetching operating hours:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update operating hours (requires auth)
export async function PUT(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if ('error' in auth) {
      return auth.error;
    }

    const body = await request.json();
    const { hours } = body; // Array of { day_name, open_hour, close_hour, is_closed }

    for (const hour of hours) {
      await getDb().execute({
        sql: `UPDATE operating_hours 
              SET open_hour = ?, close_hour = ?, is_closed = ?, updated_at = CURRENT_TIMESTAMP
              WHERE day_name = ?`,
        args: [hour.open_hour, hour.close_hour, hour.is_closed ? 1 : 0, hour.day_name],
      });
    }

    // Revalidate all pages
    await fetch(`${request.nextUrl.origin}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Authorization': request.headers.get('authorization') || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 'all' }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating operating hours:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

