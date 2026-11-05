import { NextRequest, NextResponse } from "next/server";
import { requireCatalogAdmin } from "@/lib/auth/catalog-admin-middleware";
import { getCatalogBySlug, getCatalogSettings } from "@/lib/catalog/queries";
import { countFor, finishedOrdersByPhone, isRewardOrder, parseLoyaltyConfig } from "@/lib/orders/loyalty";
import { countOrders, listOrders, type OrderTab } from "@/lib/orders/store";
import { beirutNow } from "@/lib/orders/slots";

const TABS: OrderTab[] = ["new", "active", "done"];
const KINDS = ["order", "booking", "request"] as const;

/** GET ?tab=new|active|done&kind=order|booking|request&unpaid=1&upcoming=1&before=<created_at>: orders for the dashboard */
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
  // From today (Beirut) on, so this morning's bookings still show
  const upcoming = search.get("upcoming") === "1" ? { from: `${beirutNow().date} 00:00` } : null;

  const [orders, counts] = await Promise.all([
    listOrders(catalog.id, { tab, kind, unpaid, upcoming, before, limit: 50 }),
    countOrders(catalog.id),
  ]);
  // Loyalty card: which of these orders earn the reward (the customer's Nth finished order)
  const loyalty = parseLoyaltyConfig((await getCatalogSettings(catalog.id) as unknown as Record<string, unknown> | null)?.loyalty_config);
  let rewards: { reward_en: string; reward_ar: string; due: string[] } | null = null;
  if (loyalty.enabled && orders.some((o) => o.kind !== "booking")) {
    const finished = await finishedOrdersByPhone(catalog.id);
    rewards = {
      reward_en: loyalty.reward_en,
      reward_ar: loyalty.reward_ar,
      due: orders
        .filter((o) => o.kind !== "booking" && o.status !== "cancelled" && isRewardOrder(countFor(finished, o.customer_phone, o.created_at), loyalty.every))
        .map((o) => o.id),
    };
  }
  return NextResponse.json({ orders, counts, rewards });
}
