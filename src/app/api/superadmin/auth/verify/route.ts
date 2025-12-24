import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/super-admin-middleware';
import { getDb } from '@/lib/db/client';

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  
  if (!auth.success) {
    return auth.response;
  }

  // Get fresh user data
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT id, email, name, created_at, last_login FROM super_admins WHERE id = ?',
    args: [auth.superAdmin.id],
  });

  if (result.rows.length === 0) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    valid: true,
    user: result.rows[0],
  });
}

