import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCatalogBySlug } from "@/lib/catalog/queries";
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
    created_at: order.created_at,
  };

  return <OrderStatusView order={publicOrder} />;
}
