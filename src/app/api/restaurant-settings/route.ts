import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { getDb } from '../../../../lib/db/client';
import { requireAuth } from '../../../../lib/auth/middleware';

// GET - Public endpoint
export async function GET() {
  try {
    const result = await getDb().execute({
      sql: 'SELECT * FROM restaurant_settings WHERE id = ?',
      args: ['main'],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({});
    }

    const settings = result.rows[0];
    return NextResponse.json({
      google_map_iframe_url: settings.google_map_iframe_url,
      phone_reservation: settings.phone_reservation,
      phone_checkout: settings.phone_checkout,
      whatsapp: settings.whatsapp,
      email: settings.email,
      address_ar: settings.address_ar,
      address_en: settings.address_en,
      address_fr: settings.address_fr,
    });
  } catch (error) {
    console.error('Error fetching restaurant settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update settings (requires auth)
export async function PUT(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if ('error' in auth) {
      return auth.error;
    }

    const body = await request.json();

    await getDb().execute({
      sql: `UPDATE restaurant_settings 
            SET google_map_iframe_url = ?, phone_reservation = ?, phone_checkout = ?, whatsapp = ?, email = ?,
                address_ar = ?, address_en = ?, address_fr = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = 'main'`,
      args: [
        body.google_map_iframe_url || null,
        body.phone_reservation || null,
        body.phone_checkout || null,
        body.whatsapp || null,
        body.email || null,
        body.address_ar || null,
        body.address_en || null,
        body.address_fr || null,
      ],
    });

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
    console.error('Error updating restaurant settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

