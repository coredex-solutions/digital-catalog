import { NextRequest, NextResponse } from "next/server";
import { requireCatalogAdmin } from "@/lib/auth/catalog-admin-middleware";
import { getCatalogBySlug } from "@/lib/catalog/queries";
import { countOrders, listOrders, type OrderTab } from "@/lib/orders/store";

const TABS: OrderTab[] = ["new", "active", "done"];
const KINDS = ["order", "booking", "request"] as const;

/** GET ?tab=new|active|done&kind=order|booking|request&unpaid=1&before=<created_at>: orders for the dashboard */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const catalog = await getCatalogBySlug(slug);
  if (!catalog) return NextResponse.json({ error: "Catalog not found" }, { status: 404 });

  const auth = await requireCatalogAdmin(request, catalog.id);
  if (!auth.success) return auth.response;

  const search = new URL(request.url).searchParams;
  const tab = TABS.find((t) => t === search.get("tab")) ?? "new";
  const kind = KINDS.find((k) => k === search.get("kind")) ?? null;
  const before = search.get("before");
  const unpaid = search.get("unpaid") === "1";

  const [orders, counts] = await Promise.all([
    listOrders(catalog.id, { tab, kind, unpaid, before, limit: 50 }),
    countOrders(catalog.id),
  ]);
  return NextResponse.json({ orders, counts });
}
