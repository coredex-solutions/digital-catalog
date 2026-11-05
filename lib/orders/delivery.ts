// Delivery areas: each has a fee, an optional minimum order and an estimated time, set by the
// owner in Settings (catalog_settings.delivery_config). Pure, so the checkout and the server
// work out the same fee; the server's answer is the one saved.

export type FeeCurrency = "USD" | "LBP";

export interface DeliveryZone {
  id: string;
  name_en: string;
  name_ar: string;
  /** Fee in the config's currency; 0 = free */
  fee: number;
  /** Smallest order (items only) accepted for this area; null = none */
  min_order: number | null;
  /** Typical time to arrive, shown to the customer; null = not shown */
  eta_minutes: number | null;
}

export interface DeliveryConfig {
  /** Currency of every fee and minimum */
  currency: FeeCurrency;
  /** Orders at or above this (items only) get free delivery; null = never */
  free_over: number | null;
  zones: DeliveryZone[];
}

export const MAX_ZONES = 60;
const MAX_AMOUNT = 100_000_000;

export const EMPTY_DELIVERY: DeliveryConfig = { currency: "USD", free_over: null, zones: [] };

const amount = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n < MAX_AMOUNT ? Math.round(n * 100) / 100 : null;
};
const label = (value: unknown) => (typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, 60) : "");

/**
 * Read (or clean, from the settings form) a delivery config. Tolerates anything: bad areas are
 * dropped, an area needs a name in at least one language, ids are kept stable so orders and the
 * checkout agree on which area was chosen.
 */
export function parseDeliveryConfig(raw: unknown): DeliveryConfig {
  let value = raw;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return EMPTY_DELIVERY;
    }
  }
  if (!value || typeof value !== "object") return EMPTY_DELIVERY;
  const input = value as Record<string, unknown>;
  const zones: DeliveryZone[] = [];
  const seen = new Set<string>();
  for (const rawZone of Array.isArray(input.zones) ? input.zones.slice(0, MAX_ZONES) : []) {
    if (!rawZone || typeof rawZone !== "object") continue;
    const zone = rawZone as Record<string, unknown>;
    const name_en = label(zone.name_en);
    const name_ar = label(zone.name_ar);
    if (!name_en && !name_ar) continue;
    let id = typeof zone.id === "string" && /^[A-Za-z0-9_-]{1,40}$/.test(zone.id) ? zone.id : "";
    // New areas from the form have no id yet; numbered ones are stable from then on
    for (let n = zones.length + 1; !id || seen.has(id); n++) id = `area-${n}`;
    seen.add(id);
    const eta = Math.floor(Number(zone.eta_minutes));
    zones.push({
      id,
      name_en,
      name_ar,
      fee: amount(zone.fee) ?? 0,
      min_order: amount(zone.min_order) || null,
      eta_minutes: Number.isFinite(eta) && eta > 0 && eta <= 24 * 60 ? eta : null,
    });
  }
  return {
    currency: input.currency === "LBP" ? "LBP" : "USD",
    free_over: amount(input.free_over) || null,
    zones,
  };
}

export interface PricedAmount {
  price: number;
  currency?: string | null;
  quantity: number;
}

/**
 * The lines' total in `currency`, converting USD and LBP through the rate. Null when a line
 * can't be converted (no rate set, or another currency).
 */
export function totalIn(lines: PricedAmount[], currency: FeeCurrency, lbpRate: number | null): number | null {
  let total = 0;
  for (const line of lines) {
    const code = (line.currency || "USD").toUpperCase();
    const value = line.price * line.quantity;
    if (code === currency) total += value;
    else if (lbpRate && code === "USD" && currency === "LBP") total += value * lbpRate;
    else if (lbpRate && code === "LBP" && currency === "USD") total += value / lbpRate;
    else return null;
  }
  return total;
}

export interface DeliveryQuote {
  zone: DeliveryZone;
  /** What the customer pays for delivery (0 when free) */
  fee: number;
  currency: FeeCurrency;
  /** The order is under this area's minimum (items only) */
  belowMinimum: boolean;
  /** Free because the order reached free_over */
  freeOver: boolean;
}

/**
 * Fee and minimum for an order to one area. When the items can't be totalled in the fee's
 * currency (mixed currencies and no rate), the minimum and free-delivery rules can't be checked:
 * the full fee applies and the minimum is not enforced.
 */
export function quoteDelivery(
  config: DeliveryConfig,
  zoneId: string | null | undefined,
  lines: PricedAmount[],
  lbpRate: number | null
): DeliveryQuote | null {
  const zone = config.zones.find((z) => z.id === zoneId);
  if (!zone) return null;
  const subtotal = totalIn(lines, config.currency, lbpRate);
  // A cent of slack so 9.999… from a currency conversion still counts as 10
  const reaches = (limit: number | null) => limit !== null && subtotal !== null && subtotal + 0.005 >= limit;
  const freeOver = config.free_over !== null && reaches(config.free_over);
  return {
    zone,
    fee: freeOver ? 0 : zone.fee,
    currency: config.currency,
    belowMinimum: zone.min_order !== null && subtotal !== null && !reaches(zone.min_order),
    freeOver,
  };
}

/** The delivery fee as a priced line, so totals (formatTotal, totalInUsd) include it */
export function feeLine(fee: number | null | undefined, currency: string | null | undefined): PricedAmount[] {
  return fee && fee > 0 ? [{ price: fee, currency: currency || "USD", quantity: 1 }] : [];
}

/** Area name in a language, falling back to the other one */
export function zoneName(zone: Pick<DeliveryZone, "name_en" | "name_ar">, lang: string): string {
  return (lang === "ar" ? zone.name_ar || zone.name_en : zone.name_en || zone.name_ar) || "";
}
