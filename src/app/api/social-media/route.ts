import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { getDb } from '../../../../lib/db/client';
import { requireAuth } from '../../../../lib/auth/middleware';

// GET - Public endpoint
export async function GET() {
  try {
    const result = await getDb().execute({
      sql: 'SELECT * FROM social_media',
    });

    const social = result.rows.map((row) => ({
      id: row.id,
      platform: row.platform,
      url: row.url,
    }));

    return NextResponse.json(social);
  } catch (error) {
    console.error('Error fetching social media:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update social media (requires auth)
export async function PUT(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if ('error' in auth) {
      return auth.error;
    }

    const body = await request.json();
    const { social } = body; // Array of { id, platform, url }

    for (const item of social) {
      await getDb().execute({
        sql: `UPDATE social_media SET url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        args: [item.url || null, item.id],
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
    console.error('Error updating social media:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

