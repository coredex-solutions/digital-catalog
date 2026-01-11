import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/super-admin-middleware";
import { getDb } from "@/lib/db/client";
import { hashPassword } from "@/lib/auth/password";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; adminId: string }> }
) {
  const { id: catalogId, adminId } = await params;
  
  const auth = await requireSuperAdmin(request);
  if (!auth.success) return auth.response;

  try {
    const { password } = await request.json();

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    const db = getDb();
    const hashedPassword = await hashPassword(password);

    const result = await db.execute({
      sql: "UPDATE catalog_admins SET password_hash = ? WHERE id = ? AND catalog_id = ?",
      args: [hashedPassword, adminId, catalogId],
    });

    if (result.rowsAffected === 0) {
      return NextResponse.json(
        { error: "Admin not found or does not belong to this catalog" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Failed to reset password:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
