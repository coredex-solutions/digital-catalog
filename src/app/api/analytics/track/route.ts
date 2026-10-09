import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';
import { getDb } from '@/lib/db/client';
import { v4 as uuidv4 } from 'uuid';

// Days are counted in the restaurants' time zone, not the server's (UTC)
const beirutDay = (date: Date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Beirut' }).format(date); // YYYY-MM-DD

// Which daily counter each event adds to
const EVENT_COLUMNS = {
  page_view: { page_views: 1, whatsapp_order_clicks: 0, booking_confirm_clicks: 0 },
  whatsapp_click: { page_views: 0, whatsapp_order_clicks: 1, booking_confirm_clicks: 0 },
  booking_confirm: { page_views: 0, whatsapp_order_clicks: 0, booking_confirm_clicks: 1 },
} as const;
type TrackedEvent = keyof typeof EVENT_COLUMNS;

async function handler(request: NextRequest) {
  try {
    const { catalog_id, event, fingerprint } = await request.json();

    if (typeof catalog_id !== 'string' || !(event in EVENT_COLUMNS)) {
      return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
    }
    const counts = EVENT_COLUMNS[event as TrackedEvent];
    const visitor = typeof fingerprint === 'string' && fingerprint ? fingerprint.slice(0, 128) : null;

    const db = getDb();
    const now = new Date();
    const today = beirutDay(now);

    const catalogCheck = await db.execute({
      sql: 'SELECT id FROM catalogs WHERE id = ? AND is_active = 1 AND is_suspended = 0',
      args: [catalog_id],
    });
    if (catalogCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Catalog not found' }, { status: 404 });
    }

    // A visitor counts once per day: new to this menu, or last seen on an earlier day
    let uniqueToday = 0;
    if (event === 'page_view' && visitor) {
      const previous = await db.execute({
        sql: 'SELECT last_visit FROM catalog_visitors WHERE catalog_id = ? AND fingerprint = ?',
        args: [catalog_id, visitor],
      });
      const lastVisit = previous.rows[0]?.last_visit;
      // last_visit is stored as SQLite UTC datetime ("YYYY-MM-DD HH:MM:SS")
      const lastDay = lastVisit ? beirutDay(new Date(String(lastVisit).replace(' ', 'T') + 'Z')) : null;
      uniqueToday = lastDay === today ? 0 : 1;

      await db.execute({
        sql: `
          INSERT INTO catalog_visitors (id, catalog_id, fingerprint, first_visit, last_visit, visit_count)
          VALUES (?, ?, ?, datetime('now'), datetime('now'), 1)
          ON CONFLICT(catalog_id, fingerprint)
          DO UPDATE SET last_visit = datetime('now'), visit_count = visit_count + 1
        `,
        args: [uuidv4(), catalog_id, visitor],
      });
    }

    // One row per catalog per day; concurrent events add up instead of racing on insert
    await db.execute({
      sql: `
        INSERT INTO catalog_analytics (id, catalog_id, date, page_views, unique_visitors, whatsapp_order_clicks, booking_confirm_clicks, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(catalog_id, date) DO UPDATE SET
          page_views = page_views + excluded.page_views,
          unique_visitors = unique_visitors + excluded.unique_visitors,
          whatsapp_order_clicks = whatsapp_order_clicks + excluded.whatsapp_order_clicks,
          booking_confirm_clicks = booking_confirm_clicks + excluded.booking_confirm_clicks
      `,
      args: [uuidv4(), catalog_id, today, counts.page_views, uniqueToday, counts.whatsapp_order_clicks, counts.booking_confirm_clicks],
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Analytics tracking error:', error);
    // Return success anyway to not break user experience
    return NextResponse.json({ success: true });
  }
}

export async function POST(request: NextRequest) {
  return withRateLimit(request, () => handler(request), RATE_LIMITS.analytics);
}
