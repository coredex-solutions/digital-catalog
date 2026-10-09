import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { isOwnerRole, requireCatalogAdmin } from "@/lib/auth/catalog-admin-middleware";
import { getCatalogBySlug } from "@/lib/catalog/queries";
import { getDb } from "@/lib/db/client";
import { hashPassword, temporaryPassword } from "@/lib/auth/password";

// Roles: owner (everything), editor (menu content, hours, FAQs, publishing; not settings,
// billing or the team), viewer (read only)
const TEAM_ROLES = ["editor", "viewer"] as const;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MEMBERS = 20;

// GET: everyone with access to this menu
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const catalog = await getCatalogBySlug(slug);
  if (!catalog) return NextResponse.json({ error: "Catalog not found" }, { status: 404 });

  const auth = await requireCatalogAdmin(request, catalog.id, { allowExpired: true });
  if (!auth.success) return auth.response;

  const result = await getDb().execute({
    sql: `SELECT id, name, email, role, is_active, created_at, last_login
          FROM catalog_admins WHERE catalog_id = ?
          ORDER BY CASE WHEN role IS NULL OR role IN ('owner', 'admin') THEN 0 ELSE 1 END, datetime(created_at) ASC`,
    args: [catalog.id],
  });
  return NextResponse.json({
    members: result.rows.map((row) => ({
      id: String(row.id),
      name: String(row.name || ""),
      email: String(row.email),
      role: isOwnerRole(row.role) ? "owner" : String(row.role),
      is_active: Number(row.is_active ?? 1) === 1,
      created_at: row.created_at,
      last_login: row.last_login,
      is_you: String(row.id) === auth.admin.id,
    })),
    can_manage: isOwnerRole(auth.admin.role),
  });
}

// POST: add a member { name, email, role } → returns a temporary password, once
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const catalog = await getCatalogBySlug(slug);
  if (!catalog) return NextResponse.json({ error: "Catalog not found" }, { status: 404 });

  const auth = await requireCatalogAdmin(request, catalog.id, { ownerOnly: true });
  if (!auth.success) return auth.response;

  const body = await request.json().catch(() => ({}));
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 80) : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const role = (TEAM_ROLES as readonly string[]).includes(body?.role) ? body.role : null;

  if (!name) return NextResponse.json({ error: "Enter the person's name" }, { status: 400 });
  if (!EMAIL_REGEX.test(email)) return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  if (!role) return NextResponse.json({ error: "Choose Editor or Viewer" }, { status: 400 });

  const db = getDb();
  const count = await db.execute({ sql: "SELECT COUNT(*) AS n FROM catalog_admins WHERE catalog_id = ?", args: [catalog.id] });
  if (Number(count.rows[0]?.n ?? 0) >= MAX_MEMBERS) {
    return NextResponse.json({ error: `A menu can have up to ${MAX_MEMBERS} team members` }, { status: 400 });
  }

  const password = temporaryPassword();
  try {
    await db.execute({
      sql: `INSERT INTO catalog_admins (id, catalog_id, email, password_hash, name, role, is_active, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'))`,
      args: [uuidv4(), catalog.id, email, await hashPassword(password), name, role],
    });
  } catch (error) {
    if (String((error as Error)?.message).includes("UNIQUE")) {
      return NextResponse.json({ error: "Someone with this email already has access" }, { status: 409 });
    }
    console.error("Add team member error:", error);
    return NextResponse.json({ error: "Could not add this person. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ success: true, email, password }, { status: 201 });
}
