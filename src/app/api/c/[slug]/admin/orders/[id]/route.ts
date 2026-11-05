import { NextRequest, NextResponse } from "next/server";
import { requireCatalogAdmin } from "@/lib/auth/catalog-admin-middleware";
import { getCatalogBySlug } from "@/lib/catalog/queries";
import { ORDER_STATUSES, getOrder, setOrderPaid, setOrderStatus, type OrderStatus } from "@/lib/orders/store";

/** GET: one order, for the printed ticket */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const catalog = await getCatalogBySlug(slug);
  if (!catalog) return NextResponse.json({ error: "Catalog not found" }, { status: 404 });

  const auth = await requireCatalogAdmin(request, catalog.id, { allowExpired: true });
  if (!auth.success) return auth.response;

  const order = await getOrder(catalog.id, id);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json({ order });
}

/**
 * PATCH { status } or { paid }: confirm, mark ready, complete, cancel or reopen an order (cancelling
 * gives stock back, reopening takes it again), or mark it paid / not paid.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const catalog = await getCatalogBySlug(slug);
  if (!catalog) return NextResponse.json({ error: "Catalog not found" }, { status: 404 });

  // Orders that arrived before the plan ended can still be handled afterwards
  const auth = await requireCatalogAdmin(request, catalog.id, { allowExpired: true });
  if (!auth.success) return auth.response;

  let body: { status?: unknown; paid?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (typeof body.paid === "boolean") {
    const order = await setOrderPaid(catalog.id, id, body.paid);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json({ order });
  }

  const status = ORDER_STATUSES.find((s) => s === body.status) as OrderStatus | undefined;
  if (!status) return NextResponse.json({ error: "Unknown order status" }, { status: 400 });

  const result = await setOrderStatus(catalog.id, id, status);
  if (!result.ok) {
    if (result.code === "not_found") return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (result.code === "out_of_stock") {
      return NextResponse.json({ error: "Not enough stock left to reopen this order", code: "out_of_stock" }, { status: 409 });
    }
    return NextResponse.json({ error: "This order can't be changed to that status" }, { status: 409 });
  }
  return NextResponse.json({ order: result.order });
}
