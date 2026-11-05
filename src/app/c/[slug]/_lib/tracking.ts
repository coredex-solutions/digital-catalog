// Events for the business's own Meta Pixel and Google Analytics, when they've added them in
// Settings → Marketing (see _components/MarketingTags.tsx). Without them these do nothing.

type Fbq = (command: "track", event: string, data?: Record<string, unknown>) => void;
type Gtag = (command: "event", event: string, data?: Record<string, unknown>) => void;

function send(meta: string | null, google: string, data: Record<string, unknown>, googleData: Record<string, unknown> = data) {
  if (typeof window === "undefined") return;
  const w = window as unknown as { fbq?: Fbq; gtag?: Gtag };
  try {
    if (meta) w.fbq?.("track", meta, data);
    w.gtag?.("event", google, googleData);
  } catch {
    // Tracking must never break the page
  }
}

/** Amounts in dollars; Meta and Google both take an ISO currency */
const money = (valueUsd: number | null) => (valueUsd !== null && valueUsd > 0 ? { value: Math.round(valueUsd * 100) / 100, currency: "USD" } : {});

export function trackAddToCart(item: { id: string; name: string }, valueUsd: number | null, quantity: number) {
  send(
    "AddToCart",
    "add_to_cart",
    { content_ids: [item.id], content_name: item.name, content_type: "product", ...money(valueUsd) },
    { ...money(valueUsd), items: [{ item_id: item.id, item_name: item.name, quantity }] }
  );
}

export function trackCheckout(valueUsd: number | null, count: number) {
  send("InitiateCheckout", "begin_checkout", { num_items: count, ...money(valueUsd) }, { ...money(valueUsd) });
}

/**
 * An order or booking was sent. Orders count as a purchase; bookings and appointments as a
 * booking (Meta "Schedule") or a lead in Google, since nothing has been paid yet.
 */
export function trackSent(kind: "order" | "booking" | "request", reference: string, valueUsd: number | null) {
  if (kind === "order") {
    // A purchase always carries a value and currency (Meta requires both)
    const paid = { value: money(valueUsd).value ?? 0, currency: "USD" };
    send("Purchase", "purchase", paid, { transaction_id: reference, ...paid });
  } else {
    send("Schedule", "generate_lead", { ...money(valueUsd) }, { ...money(valueUsd) });
  }
}
