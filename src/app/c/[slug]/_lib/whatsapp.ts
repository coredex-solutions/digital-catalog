// Builds the WhatsApp messages a customer sends to the business: orders, service requests and
// table reservations. Used in the browser and by the orders API (which adds the order number).

import type { Language } from "@/types";
import { formatPrice, formatTotal, type PriceConfig } from "@/lib/catalog/price";
import { getDictionary, localized } from "./i18n";
import { variantName } from "@/lib/catalog/dish-info";
import { MODULES, ADDRESS_ORDER_TYPES, type ModuleId, type OrderType } from "@/lib/modules/registry";
import { resolveOrderTypes } from "@/lib/modules/resolve";

export type { OrderType };

/** The order types a catalog offers (catalog_settings.order_types), limited to its module */
export function parseOrderTypes(value?: string | null, module: ModuleId = "restaurant"): OrderType[] {
  return resolveOrderTypes(MODULES[module], value ?? null);
}

/** wa.me link for a Lebanese or international number; local 0-prefixed numbers get +961 */
export function whatsappLink(phone: string, text?: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = `961${digits.slice(1)}`;
  else if (digits.length <= 8) digits = `961${digits}`;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export interface OrderLine {
  name_ar: string;
  name_en: string;
  /** Ignored; older callers still pass it. Messages are only built in Arabic or English. */
  name_fr?: string;
  price: number;
  currency?: string | null;
  quantity: number;
  note?: string;
  /** The chosen option, shown after the item name: "Chicken shawarma (Large)" */
  variant?: { name_en: string; name_ar: string };
}

export interface OrderDetails {
  /** The business name (kept as restaurantName for older callers) */
  restaurantName: string;
  orderType: OrderType;
  table?: string;
  address?: string;
  area?: string;
  name: string;
  phone: string;
  notes?: string;
  /** 'YYYY-MM-DD HH:MM': pre-order or appointment time */
  when?: string;
  /** Set once the order is saved: "Order #12" */
  orderNumber?: number;
}

/** "2026-11-05 14:30" → "2026-11-05 · 14:30" (Western digits, as Lebanese menus write them) */
function formatWhen(when: string): string {
  return when.replace(" ", " · ");
}

export function buildOrderMessage(
  lines: OrderLine[],
  details: OrderDetails,
  priceConfig: PriceConfig,
  lang: Language,
  module: ModuleId = "restaurant"
): string {
  const t = getDictionary(lang, module);
  const out: string[] = [];

  const number = details.orderNumber ? ` #${details.orderNumber}` : "";
  out.push(`*${t.msgNewOrder}${number} · ${details.restaurantName}*`);
  out.push("");
  out.push(`*${t.msgOrderType}:* ${t[details.orderType]}`);
  if (details.orderType === "dine_in" && details.table) out.push(`*${t.msgTable}:* ${details.table}`);
  if (ADDRESS_ORDER_TYPES.includes(details.orderType)) {
    if (details.address) out.push(`*${t.msgAddress}:* ${details.address}`);
    if (details.area) out.push(`*${t.msgArea}:* ${details.area}`);
  }
  if (details.when) out.push(`*${t.msgWhen}:* ${formatWhen(details.when)}`);
  out.push(`*${t.msgName}:* ${details.name}`);
  out.push(`*${t.msgPhone}:* ${details.phone}`);
  out.push("");
  out.push(`*${t.msgItems}:*`);

  for (const line of lines) {
    const price = formatPrice(line.price * line.quantity, line.currency, priceConfig, lang);
    const option = line.variant ? ` (${variantName(line.variant, lang)})` : "";
    out.push(`• ${line.quantity} × ${localized(line, "name", lang)}${option} — ${price.primary}`);
    if (line.note) out.push(`   ${t.msgNote}: ${line.note}`);
  }

  const total = formatTotal(lines, priceConfig, lang);
  out.push("");
  out.push(`*${t.msgTotal}:* ${total.primary}${total.secondary ? ` (${total.secondary})` : ""}`);

  if (details.notes) {
    out.push("");
    out.push(`*${t.msgNotes}:* ${details.notes}`);
  }

  return out.join("\n");
}

export interface ReservationDetails {
  restaurantName: string;
  name: string;
  phone: string;
  date: string;
  time: string;
  guests: string;
  notes?: string;
  orderNumber?: number;
}

export function buildReservationMessage(details: ReservationDetails, lang: Language, module: ModuleId = "restaurant"): string {
  const t = getDictionary(lang, module);
  const number = details.orderNumber ? ` #${details.orderNumber}` : "";
  const out = [
    `*${t.msgReservation}${number} · ${details.restaurantName}*`,
    "",
    `*${t.msgName}:* ${details.name}`,
    `*${t.msgPhone}:* ${details.phone}`,
    `*${t.msgDate}:* ${details.date}`,
    `*${t.msgTime}:* ${details.time}`,
    `*${t.msgGuests}:* ${details.guests}`,
  ];
  if (details.notes) out.push(`*${t.msgNotes}:* ${details.notes}`);
  return out.join("\n");
}
