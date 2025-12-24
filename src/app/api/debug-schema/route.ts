
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';

export async function GET() {
  try {
    const db = getDb();
    const result = await db.execute("PRAGMA table_info(menu_items)");
    return NextResponse.json(result.rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
