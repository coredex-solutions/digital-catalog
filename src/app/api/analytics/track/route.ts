import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';
import { getDb } from '@/lib/db/client';
import { v4 as uuidv4 } from 'uuid';

async function handler(request: NextRequest) {
  try {
    const { catalog_id, event, fingerprint } = await request.json();

    if (!catalog_id || !event) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = getDb();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Check if catalog exists and is active
    const catalogCheck = await db.execute({
      sql: 'SELECT id FROM catalogs WHERE id = ? AND is_active = 1 AND is_suspended = 0',
      args: [catalog_id],
    });

    if (catalogCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Catalog not found' }, { status: 404 });
    }

    // Handle different event types
    if (event === 'page_view') {
      // Check if this is a unique visitor
      let isUnique = false;
      
      if (fingerprint) {
        const visitorCheck = await db.execute({
          sql: 'SELECT id FROM catalog_visitors WHERE catalog_id = ? AND fingerprint = ?',
          args: [catalog_id, fingerprint],
        });

        if (visitorCheck.rows.length === 0) {
          // New visitor
          isUnique = true;
          await db.execute({
            sql: `
              INSERT INTO catalog_visitors (id, catalog_id, fingerprint, first_visit, last_visit, visit_count)
              VALUES (?, ?, ?, datetime('now'), datetime('now'), 1)
            `,
            args: [uuidv4(), catalog_id, fingerprint],
          });
        } else {
          // Returning visitor - update last visit
          await db.execute({
            sql: `
              UPDATE catalog_visitors 
              SET last_visit = datetime('now'), visit_count = visit_count + 1
              WHERE catalog_id = ? AND fingerprint = ?
            `,
            args: [catalog_id, fingerprint],
          });
        }
      }

      // Update or insert daily analytics
      const existing = await db.execute({
        sql: 'SELECT id, page_views, unique_visitors FROM catalog_analytics WHERE catalog_id = ? AND date = ?',
        args: [catalog_id, today],
      });

      if (existing.rows.length > 0) {
        // Update existing record
        await db.execute({
          sql: `
            UPDATE catalog_analytics 
            SET page_views = page_views + 1${isUnique ? ', unique_visitors = unique_visitors + 1' : ''}
            WHERE catalog_id = ? AND date = ?
          `,
          args: [catalog_id, today],
        });
      } else {
        // Create new record for today
        await db.execute({
          sql: `
            INSERT INTO catalog_analytics (id, catalog_id, date, page_views, unique_visitors, whatsapp_order_clicks, booking_confirm_clicks, created_at)
            VALUES (?, ?, ?, 1, ?, 0, 0, datetime('now'))
          `,
          args: [uuidv4(), catalog_id, today, isUnique ? 1 : 0],
        });
      }
    } else if (event === 'whatsapp_click') {
      // Update WhatsApp clicks
      const existing = await db.execute({
        sql: 'SELECT id FROM catalog_analytics WHERE catalog_id = ? AND date = ?',
        args: [catalog_id, today],
      });

      if (existing.rows.length > 0) {
        await db.execute({
          sql: 'UPDATE catalog_analytics SET whatsapp_order_clicks = whatsapp_order_clicks + 1 WHERE catalog_id = ? AND date = ?',
          args: [catalog_id, today],
        });
      } else {
        await db.execute({
          sql: `
            INSERT INTO catalog_analytics (id, catalog_id, date, page_views, unique_visitors, whatsapp_order_clicks, booking_confirm_clicks, created_at)
            VALUES (?, ?, ?, 0, 0, 1, 0, datetime('now'))
          `,
          args: [uuidv4(), catalog_id, today],
        });
      }
    } else if (event === 'booking_confirm') {
      // Update booking confirmation clicks
      const existing = await db.execute({
        sql: 'SELECT id FROM catalog_analytics WHERE catalog_id = ? AND date = ?',
        args: [catalog_id, today],
      });

      if (existing.rows.length > 0) {
        await db.execute({
          sql: 'UPDATE catalog_analytics SET booking_confirm_clicks = booking_confirm_clicks + 1 WHERE catalog_id = ? AND date = ?',
          args: [catalog_id, today],
        });
      } else {
        await db.execute({
          sql: `
            INSERT INTO catalog_analytics (id, catalog_id, date, page_views, unique_visitors, whatsapp_order_clicks, booking_confirm_clicks, created_at)
            VALUES (?, ?, ?, 0, 0, 0, 1, datetime('now'))
          `,
          args: [uuidv4(), catalog_id, today],
        });
      }
    }

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
