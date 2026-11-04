import { NextRequest, NextResponse } from "next/server";
import { requireCatalogAdmin } from "@/lib/auth/catalog-admin-middleware";
import { getCatalogBySlug } from "@/lib/catalog/queries";
import { countOrders } from "@/lib/orders/store";

/** GET: how many orders are new and in progress (polled by the dashboard navigation) */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const catalog = await getCatalogBySlug(slug);
  if (!catalog) return NextResponse.json({ error: "Catalog not found" }, { status: 404 });

  const auth = await requireCatalogAdmin(request, catalog.id);
  if (!auth.success) return auth.response;

  return NextResponse.json(await countOrders(catalog.id), { headers: { "Cache-Control": "no-store" } });
}
