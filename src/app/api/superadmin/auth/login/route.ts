import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { verifyPassword } from '@/lib/auth/password';
import { signSuperAdminToken } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const db = getDb();
    const result = await db.execute({
      sql: 'SELECT id, email, password_hash, name, is_active FROM super_admins WHERE email = ?',
      args: [email.toLowerCase().trim()],
    });

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const superAdmin = result.rows[0];

    if (!superAdmin.is_active) {
      return NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 403 }
      );
    }

    const isValid = await verifyPassword(password, superAdmin.password_hash as string);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Update last login
    await db.execute({
      sql: "UPDATE super_admins SET last_login = datetime('now') WHERE id = ?",
      args: [superAdmin.id],
    });

    // Generate token
    const token = signSuperAdminToken({
      id: superAdmin.id as string,
      email: superAdmin.email as string,
    });

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: superAdmin.id,
        email: superAdmin.email,
        name: superAdmin.name,
      },
    });
  } catch (error: any) {
    console.error('Super admin login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}

