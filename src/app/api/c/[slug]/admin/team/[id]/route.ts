import { NextRequest, NextResponse } from "next/server";
import { isOwnerRole, requireCatalogAdmin } from "@/lib/auth/catalog-admin-middleware";
import { getCatalogBySlug } from "@/lib/catalog/queries";
import { getDb } from "@/lib/db/client";
import { hashPassword, temporaryPassword } from "@/lib/auth/password";

const TEAM_ROLES = ["editor", "viewer"];

type Params = { params: Promise<{ slug: string; id: string }> };

/** The member, if they belong to this catalog and aren't the owner (owners can't be edited here) */
async function loadMember(catalogId: string, id: string) {
  const result = await getDb().execute({
    sql: "SELECT id, role FROM catalog_admins WHERE id = ? AND catalog_id = ?",
    args: [id, catalogId],
  });
  return result.rows[0] ?? null;
}

// PATCH: change a member { role?: 'editor'|'viewer', is_active?: boolean, reset_password?: true }
export async function PATCH(request: NextRequest, { params }: Params) {
  const { slug, id } = await params;
  const catalog = await getCatalogBySlug(slug);
  if (!catalog) return NextResponse.json({ error: "Catalog not found" }, { status: 404 });

  const auth = await requireCatalogAdmin(request, catalog.id, { ownerOnly: true });
  if (!auth.success) return auth.response;

  const member = await loadMember(catalog.id, id);
  if (!member) return NextResponse.json({ error: "Team member not found" }, { status: 404 });
  if (isOwnerRole(member.role)) {
    return NextResponse.json({ error: "The owner's access can't be changed here" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const updates: string[] = [];
  const args: (string | number)[] = [];
  let password: string | null = null;

  if (body?.role !== undefined) {
    if (!TEAM_ROLES.includes(body.role)) return NextResponse.json({ error: "Choose Editor or Viewer" }, { status: 400 });
    updates.push("role = ?");
    args.push(body.role);
  }
  if (body?.is_active !== undefined) {
    updates.push("is_active = ?");
    args.push(body.is_active ? 1 : 0);
  }
  if (body?.reset_password === true) {
    password = temporaryPassword();
    updates.push("password_hash = ?");
    args.push(await hashPassword(password));
  }
  if (updates.length === 0) return NextResponse.json({ error: "Nothing to change" }, { status: 400 });

  await getDb().execute({
    sql: `UPDATE catalog_admins SET ${updates.join(", ")} WHERE id = ? AND catalog_id = ?`,
    args: [...args, id, catalog.id],
  });
  return NextResponse.json({ success: true, ...(password ? { password } : {}) });
}

// DELETE: remove a member's access entirely
export async function DELETE(request: NextRequest, { params }: Params) {
  const { slug, id } = await params;
  const catalog = await getCatalogBySlug(slug);
  if (!catalog) return NextResponse.json({ error: "Catalog not found" }, { status: 404 });

  const auth = await requireCatalogAdmin(request, catalog.id, { ownerOnly: true });
  if (!auth.success) return auth.response;

  const member = await loadMember(catalog.id, id);
  if (!member) return NextResponse.json({ error: "Team member not found" }, { status: 404 });
  if (isOwnerRole(member.role)) return NextResponse.json({ error: "The owner can't be removed" }, { status: 400 });

  await getDb().execute({ sql: "DELETE FROM catalog_admins WHERE id = ? AND catalog_id = ?", args: [id, catalog.id] });
  return NextResponse.json({ success: true });
}
