// Checking an order, booking or service request sent from a catalog page. Pure (no database):
// the caller passes the published items and the catalog's settings, so this is easy to test.
//
// Prices, names and availability always come from the published items, never from the browser.

import { ADDRESS_ORDER_TYPES, type ModuleDefinition, type OrderType } from "../modules/registry";
import { resolveOrderTypes } from "../modules/resolve";
import { readVariants } from "../catalog/dish-info";
import type { PriceConfig } from "../catalog/price";
import { feeLine, quoteDelivery, zoneName, type DeliveryConfig } from "./delivery";
import { PAY_AT_TABLE, type PaymentConfig, type PaymentMethod } from "./payment";

export type OrderKind = "order" | "booking";

/** One published item as the validator needs it */
export interface OrderableItem {
  id: string;
  name_en: string;
  name_ar: string;
  price: number;
  currency: string;
  is_available: boolean;
  /** Units left; null = not tracked */
  stock_qty: number | null;
  variants: unknown;
}

export interface OrderContext {
  module: ModuleDefinition;
  items: OrderableItem[];
  /** catalog_settings.order_types (raw) */
  orderTypesSetting: string | null;
  orderingEnabled: boolean;
  bookingEnabled: boolean;
  /** Stock add-on on: tracked items can't be ordered beyond what is left */
  trackStock: boolean;
  priceConfig: PriceConfig;
  /** Delivery areas and fees (no areas = free-text area, no fee) */
  delivery: DeliveryConfig;
  /** How customers can pay */
  payment: PaymentConfig;
  /** Today in Beirut, YYYY-MM-DD (passed in so tests are stable) */
  today: string;
}

export interface OrderLineSnapshot {
  item_id: string;
  name_en: string;
  name_ar: string;
  variant_id: string | null;
  variant_en: string | null;
  variant_ar: string | null;
  price: number;
  currency: string;
  quantity: number;
  note: string | null;
  /** Units taken from stock (given back if the order is cancelled) */
  reserved: number;
}

export interface ValidOrder {
  kind: OrderKind | "request";
  orderType: OrderType | null;
  name: string;
  phone: string;
  table: string | null;
  address: string | null;
  area: string | null;
  /** 'YYYY-MM-DD HH:MM' */
  requestedFor: string | null;
  partySize: number | null;
  note: string | null;
  lang: "ar" | "en";
  lines: OrderLineSnapshot[];
  /** Delivery fee worked out here from the chosen area (never sent by the page); null = none */
  deliveryFee: number | null;
  deliveryCurrency: string | null;
  /** How the customer will pay; null for bookings and dine-in */
  paymentMethod: PaymentMethod | null;
  /** Items plus delivery, in USD */
  totalUsd: number | null;
  clientKey: string | null;
}

/**
 * Error codes the page turns into its own words. `field` names the input to fix.
 * stock_changed: an item sold out or has fewer left than asked; the page reloads its items.
 */
export type OrderErrorCode =
  | "closed"
  | "invalid"
  | "empty"
  | "too_many_lines"
  | "item_unavailable"
  | "stock_changed"
  | "option_required"
  | "order_type"
  | "below_minimum"
  | "required";

export type OrderValidation =
  | { ok: true; order: ValidOrder }
  | { ok: false; code: OrderErrorCode; field?: string; message: string };

export const MAX_ORDER_LINES = 50;
export const MAX_LINE_QUANTITY = 99;
export const MAX_PARTY_SIZE = 50;

const text = (value: unknown, max: number) => (typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, max) : "");
const longText = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");

function fail(code: OrderErrorCode, message: string, field?: string): OrderValidation {
  return { ok: false, code, message, ...(field ? { field } : {}) };
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/** A real calendar date (rejects 2026-02-31) */
function isRealDate(value: string): boolean {
  if (!DATE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/** Date + time from the request, or null; `past` when the date is before today */
function readWhen(date: unknown, time: unknown, today: string): { value: string | null; problem?: "invalid" | "past" } {
  const d = typeof date === "string" ? date.trim() : "";
  const t = typeof time === "string" ? time.trim().slice(0, 5) : "";
  if (!d && !t) return { value: null };
  if (!isRealDate(d) || !TIME.test(t)) return { value: null, problem: "invalid" };
  if (d < today) return { value: null, problem: "past" };
  return { value: `${d} ${t}` };
}

/** Today's date in Beirut as YYYY-MM-DD */
export function beirutToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Beirut" }).format(now);
}

/** Total in USD for reports; null when an LBP line can't be converted (no rate) or another currency is used */
export function totalInUsd(lines: { price: number; currency?: string | null; quantity: number }[], config: PriceConfig): number | null {
  let total = 0;
  for (const line of lines) {
    const amount = line.price * line.quantity;
    const code = (line.currency || "USD").toUpperCase();
    if (code === "USD") total += amount;
    else if (code === "LBP" && config.lbpRate) total += amount / config.lbpRate;
    else return null;
  }
  return Math.round(total * 100) / 100;
}

export function validateOrder(body: unknown, ctx: OrderContext): OrderValidation {
  if (!body || typeof body !== "object") return fail("invalid", "Invalid request");
  const input = body as Record<string, unknown>;
  const kind: OrderKind = input.kind === "booking" ? "booking" : "order";

  const name = text(input.name, 80);
  const phone = text(input.phone, 20);
  if (!name) return fail("required", "Name is required", "name");
  const phoneDigits = phone.replace(/\D/g, "").length;
  if (phoneDigits < 7 || phoneDigits > 15) return fail("required", "A valid phone number is required", "phone");
  const note = longText(input.note, 300) || null;
  const lang = input.lang === "ar" ? "ar" : "en";
  const clientKey = typeof input.clientKey === "string" && /^[A-Za-z0-9_-]{8,64}$/.test(input.clientKey) ? input.clientKey : null;

  // ---- Table booking (restaurants and cafés) ----
  if (kind === "booking") {
    if (!ctx.module.tableBooking || !ctx.bookingEnabled) return fail("closed", "Bookings are not available");
    const when = readWhen(input.date, input.time, ctx.today);
    if (when.problem || !when.value) return fail("required", "Choose a date and time", "when");
    const partySize = Math.floor(Number(input.partySize));
    if (!Number.isFinite(partySize) || partySize < 1 || partySize > MAX_PARTY_SIZE) {
      return fail("required", "Choose the number of guests", "partySize");
    }
    return {
      ok: true,
      order: {
        kind: "booking",
        orderType: null,
        name,
        phone,
        table: null,
        address: null,
        area: null,
        requestedFor: when.value,
        partySize,
        note,
        lang,
        lines: [],
        deliveryFee: null,
        deliveryCurrency: null,
        paymentMethod: null,
        totalUsd: null,
        clientKey,
      },
    };
  }

  // ---- Orders and service requests ----
  const orderTypes = resolveOrderTypes(ctx.module, ctx.orderTypesSetting);
  if (!ctx.orderingEnabled || orderTypes.length === 0) return fail("closed", "Ordering is not available");
  const orderType = orderTypes.find((type) => type === input.orderType);
  if (!orderType) return fail("order_type", "Choose how you want to receive your order", "orderType");

  const table = orderType === "dine_in" ? text(input.table, 10) : "";
  if (orderType === "dine_in" && !table) return fail("required", "Table number is required", "table");
  const needsAddress = ADDRESS_ORDER_TYPES.includes(orderType);
  const address = needsAddress ? text(input.address, 200) : "";
  let area = needsAddress ? text(input.area, 80) : "";
  if (needsAddress && !address) return fail("required", "Address is required", "address");
  // Delivery with areas set up: the customer picks one of them (its fee is added below)
  const zoned = orderType === "delivery" && ctx.delivery.zones.length > 0;
  if (zoned && !ctx.delivery.zones.some((zone) => zone.id === input.zoneId)) {
    return fail("required", "Choose your area", "area");
  }

  // Payment: one of the owner's methods; asked only when there's a choice, never at the table
  let paymentMethod: PaymentMethod | null = null;
  if (!PAY_AT_TABLE.includes(orderType)) {
    const methods = ctx.payment.methods;
    paymentMethod = methods.find((method) => method === input.paymentMethod) ?? (methods.length === 1 ? methods[0] : null);
    if (!paymentMethod) return fail("required", "Choose how you'll pay", "payment");
  }

  let requestedFor: string | null = null;
  if (ctx.module.schedule !== "none") {
    const when = readWhen(input.date, input.time, ctx.today);
    if (when.problem) return fail("required", "Choose a valid date and time", "when");
    if (ctx.module.schedule === "required" && !when.value) return fail("required", "Choose a date and time", "when");
    requestedFor = when.value;
  }

  // Lines: priced from the published items
  const rawLines = Array.isArray(input.lines) ? input.lines : [];
  if (rawLines.length === 0) return fail("empty", "The order is empty");
  if (rawLines.length > MAX_ORDER_LINES) return fail("too_many_lines", "Too many lines in one order");

  const byId = new Map(ctx.items.map((item) => [item.id, item]));
  const lines: OrderLineSnapshot[] = [];
  const wantedPerItem = new Map<string, number>();

  for (const raw of rawLines) {
    const line = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
    const item = byId.get(String(line.itemId ?? ""));
    if (!item || !item.is_available) return fail("item_unavailable", "An item in the order is no longer available");
    const quantity = Math.floor(Number(line.quantity));
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > MAX_LINE_QUANTITY) return fail("invalid", "Invalid quantity");

    const variants = readVariants(item.variants);
    let variant: (typeof variants)[number] | undefined;
    if (variants.length > 0) {
      variant = variants.find((v) => v.id === line.variantId);
      if (!variant) return fail("option_required", "Choose an option for each item");
    }

    wantedPerItem.set(item.id, (wantedPerItem.get(item.id) || 0) + quantity);
    lines.push({
      item_id: item.id,
      name_en: item.name_en || "",
      name_ar: item.name_ar || "",
      variant_id: variant?.id ?? null,
      variant_en: variant?.name_en ?? null,
      variant_ar: variant?.name_ar ?? null,
      price: variant ? variant.price : item.price,
      currency: (item.currency || "USD").toUpperCase(),
      quantity,
      note: longText(line.note, 200) || null,
      reserved: 0,
    });
  }

  // Stock: only for tracked items, and only when the stock add-on is on
  if (ctx.trackStock) {
    for (const [itemId, wanted] of wantedPerItem) {
      const stock = byId.get(itemId)!.stock_qty;
      if (stock !== null && wanted > stock) return fail("stock_changed", "Not enough stock for an item");
    }
    for (const line of lines) {
      if (byId.get(line.item_id)!.stock_qty !== null) line.reserved = line.quantity;
    }
  }

  let deliveryFee: number | null = null;
  let deliveryCurrency: string | null = null;
  if (zoned) {
    const quote = quoteDelivery(ctx.delivery, String(input.zoneId), lines, ctx.priceConfig.lbpRate)!;
    if (quote.belowMinimum) return fail("below_minimum", "The order is under the minimum for this area", "area");
    area = zoneName(quote.zone, lang);
    deliveryFee = quote.fee;
    deliveryCurrency = quote.currency;
  }

  return {
    ok: true,
    order: {
      kind: ctx.module.id === "services" ? "request" : "order",
      orderType,
      name,
      phone,
      table: table || null,
      address: address || null,
      area: area || null,
      requestedFor,
      partySize: null,
      note,
      lang,
      lines,
      deliveryFee,
      deliveryCurrency,
      paymentMethod,
      totalUsd: totalInUsd([...lines, ...feeLine(deliveryFee, deliveryCurrency)], ctx.priceConfig),
      clientKey,
    },
  };
}

/** How much stock each tracked item takes for an order (summed over its lines) */
export function stockToReserve(lines: Pick<OrderLineSnapshot, "item_id" | "reserved">[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const line of lines) {
    if (line.reserved > 0) out.set(line.item_id, (out.get(line.item_id) || 0) + line.reserved);
  }
  return out;
}
