import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCatalogBySlug, getCatalogSettings } from "@/lib/catalog/queries";
import { countFor, finishedOrdersByPhone, isRewardOrder, loyaltyProgress, parseLoyaltyConfig } from "@/lib/orders/loyalty";
import { findByPublicToken } from "@/lib/orders/store";
import { OrderStatusView, type PublicOrder } from "./OrderStatusView";

// Always fresh: the page shows the order's live status
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string; token: string }> }): Promise<Metadata> {
  const { slug, token } = await params;
  const catalog = await getCatalogBySlug(slug);
  const order = catalog ? await findByPublicToken(catalog.id, token) : null;
  return {
    title: order ? `#${order.number}` : "Not Found",
    // Private to whoever has the link
    robots: { index: false, follow: false },
    referrer: "no-referrer",
  };
}

/** The customer's order status page, opened from the link after ordering or in a WhatsApp update */
export default async function OrderStatusPage({ params }: { params: Promise<{ slug: string; token: string }> }) {
  const { slug, token } = await params;
  const catalog = await getCatalogBySlug(slug);
  if (!catalog) notFound();
  const order = await findByPublicToken(catalog.id, token);
  if (!order) notFound();

  // Loyalty stamps for this phone number (finished orders), and whether this order earns the reward
  const loyaltyConfig = parseLoyaltyConfig((await getCatalogSettings(catalog.id) as unknown as Record<string, unknown> | null)?.loyalty_config);
  let loyalty: PublicOrder["loyalty"] = null;
  if (loyaltyConfig.enabled && order.kind !== "booking") {
    const finished = await finishedOrdersByPhone(catalog.id);
    const total = countFor(finished, order.customer_phone);
    const before = countFor(finished, order.customer_phone, order.created_at);
    loyalty = { ...loyaltyProgress(total, loyaltyConfig.every), every: loyaltyConfig.every, rewardOrder: isRewardOrder(before, loyaltyConfig.every) };
  }

  // Only what the customer needs to see; no phone number or address
  const publicOrder: PublicOrder = {
    number: order.number,
    kind: order.kind,
    status: order.status,
    order_type: order.order_type,
    area: order.area,
    table_label: order.table_label,
    requested_for: order.requested_for,
    party_size: order.party_size,
    check_out: order.check_out,
    lines: order.lines.map((line) => ({
      name_en: line.name_en,
      name_ar: line.name_ar,
      variant_en: line.variant_en,
      variant_ar: line.variant_ar,
      price: line.price,
      currency: line.currency,
      quantity: line.quantity,
    })),
    price_config: order.price_config,
    delivery_fee: order.delivery_fee,
    delivery_currency: order.delivery_currency,
    payment_method: order.payment_method,
    paid: Boolean(order.paid_at),
    discount: order.discount,
    discount_currency: order.discount_currency,
    coupon_code: order.coupon_code,
    loyalty,
    created_at: order.created_at,
  };

  return <OrderStatusView order={publicOrder} />;
}
