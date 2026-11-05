import { NextRequest, NextResponse } from "next/server";
import { requireCatalogAdmin } from "@/lib/auth/catalog-admin-middleware";
import { getCatalogBySlug, getCatalogSettings } from "@/lib/catalog/queries";
import { parseLoyaltyConfig } from "@/lib/orders/loyalty";
import { listCustomers } from "@/lib/orders/customers";

/** GET: the business's customers, gathered from its orders by phone number */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const catalog = await getCatalogBySlug(slug);
  if (!catalog) return NextResponse.json({ error: "Catalog not found" }, { status: 404 });

  const auth = await requireCatalogAdmin(request, catalog.id, { allowExpired: true });
  if (!auth.success) return auth.response;

  const [customers, settings] = await Promise.all([listCustomers(catalog.id), getCatalogSettings(catalog.id)]);
  const loyalty = parseLoyaltyConfig((settings as unknown as Record<string, unknown> | null)?.loyalty_config);
  // Stamps are shown when the loyalty card is on
  return NextResponse.json({ customers, loyaltyEvery: loyalty.enabled ? loyalty.every : null });
}
