import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/super-admin-middleware";
import { getDb } from "@/lib/db/client";

// GET: Get all catalog admins
export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (!auth.success) return auth.response;

  try {
    const db = getDb();
    const result = await db.execute({
      sql: `
        SELECT 
          ca.id,
          ca.catalog_id,
          c.name as catalog_name,
          c.slug as catalog_slug,
          ca.name,
          ca.email,
          ca.role,
          ca.is_active,
          ca.created_at,
          ca.last_login
        FROM catalog_admins ca
        LEFT JOIN catalogs c ON ca.catalog_id = c.id
        ORDER BY ca.created_at DESC
      `,
      args: [],
    });

    return NextResponse.json({
      admins: result.rows.map((row: any) => ({
        id: row.id,
        catalog_id: row.catalog_id,
        catalog_name: row.catalog_name || "Unknown",
        catalog_slug: row.catalog_slug || "",
        name: row.name,
        email: row.email,
        role: row.role,
        is_active: Boolean(row.is_active),
        created_at: row.created_at,
        last_login: row.last_login,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch admins:", error);
    return NextResponse.json(
      { error: "Failed to fetch admins" },
      { status: 500 }
    );
  }
}
