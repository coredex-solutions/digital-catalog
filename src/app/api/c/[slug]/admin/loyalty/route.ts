import { NextRequest, NextResponse } from "next/server";
import { requireCatalogAdmin } from "@/lib/auth/catalog-admin-middleware";
import { getCatalogBySlug, getCatalogSettings } from "@/lib/catalog/queries";
import { getDb } from "@/lib/db/client";
import { parseLoyaltyConfig } from "@/lib/orders/loyalty";

const read = async (catalogId: string) =>
  parseLoyaltyConfig((await getCatalogSettings(catalogId) as unknown as Record<string, unknown> | null)?.loyalty_config);

/** GET: the loyalty card settings */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const catalog = await getCatalogBySlug(slug);
  if (!catalog) return NextResponse.json({ error: "Catalog not found" }, { status: 404 });
  const auth = await requireCatalogAdmin(request, catalog.id);
  if (!auth.success) return auth.response;
  return NextResponse.json({ loyalty: await read(catalog.id) });
}

/** PUT { enabled, every, reward_en, reward_ar }: save the loyalty card (it needs a reward to turn on) */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const catalog = await getCatalogBySlug(slug);
  if (!catalog) return NextResponse.json({ error: "Catalog not found" }, { status: 404 });
  const auth = await requireCatalogAdmin(request, catalog.id);
  if (!auth.success) return auth.response;

  const body = await request.json().catch(() => null);
  const loyalty = parseLoyaltyConfig(body);
  if (body?.enabled && !loyalty.enabled) return NextResponse.json({ error: "Add a reward to turn on the loyalty card", field: "reward" }, { status: 400 });
  await getDb().execute({
    sql: "UPDATE catalog_settings SET loyalty_config = ?, updated_at = datetime('now') WHERE catalog_id = ?",
    args: [JSON.stringify(loyalty), catalog.id],
  });
  return NextResponse.json({ loyalty });
}
