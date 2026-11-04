import { NextRequest, NextResponse } from "next/server";
import { requireCatalogAdmin } from "@/lib/auth/catalog-admin-middleware";
import { getCatalogBySlug } from "@/lib/catalog/queries";
import { getDb } from "@/lib/db/client";
import { getModule, parseAddonsInput } from "@/lib/modules/resolve";

/** PUT { addons: ["stock", …] }: which add-ons this catalog has on (limited to its module's) */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const catalog = await getCatalogBySlug(slug);
  if (!catalog) return NextResponse.json({ error: "Catalog not found" }, { status: 404 });

  const auth = await requireCatalogAdmin(request, catalog.id);
  if (!auth.success) return auth.response;

  let body: { addons?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const addons = parseAddonsInput(getModule(catalog), body.addons);
  if (addons === null) return NextResponse.json({ error: "Add-ons must be a list" }, { status: 400 });

  await getDb().execute({
    sql: "UPDATE catalogs SET addons = ?, updated_at = datetime('now') WHERE id = ?",
    args: [addons.join(","), catalog.id],
  });
  return NextResponse.json({ addons });
}
