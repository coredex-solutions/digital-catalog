import { NextRequest, NextResponse } from "next/server";
import { requireCatalogAdmin } from "@/lib/auth/catalog-admin-middleware";
import { getCatalogBySlug } from "@/lib/catalog/queries";
import { ORDER_STATUSES, setOrderStatus, type OrderStatus } from "@/lib/orders/store";

/** PATCH { status }: confirm, mark ready, complete or cancel an order (cancelling gives stock back) */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const catalog = await getCatalogBySlug(slug);
  if (!catalog) return NextResponse.json({ error: "Catalog not found" }, { status: 404 });

  // Orders that arrived before the plan ended can still be handled afterwards
  const auth = await requireCatalogAdmin(request, catalog.id, { allowExpired: true });
  if (!auth.success) return auth.response;

  let body: { status?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const status = ORDER_STATUSES.find((s) => s === body.status) as OrderStatus | undefined;
  if (!status) return NextResponse.json({ error: "Unknown order status" }, { status: 400 });

  const result = await setOrderStatus(catalog.id, id, status);
  if (!result.ok) {
    return result.code === "not_found"
      ? NextResponse.json({ error: "Order not found" }, { status: 404 })
      : NextResponse.json({ error: "This order can't be changed to that status" }, { status: 409 });
  }
  return NextResponse.json({ order: result.order });
}
