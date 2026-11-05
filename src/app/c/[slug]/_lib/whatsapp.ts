// Builds the WhatsApp messages a customer sends to the business: orders, service requests and
// table reservations. Used in the browser and by the orders API (which adds the order number).

import type { Language } from "@/types";
import { formatPrice, formatTotal, type PriceConfig } from "@/lib/catalog/price";
import { getDictionary, localized } from "./i18n";
import { variantName } from "@/lib/catalog/dish-info";
import { MODULES, ADDRESS_ORDER_TYPES, type ModuleId, type OrderType } from "@/lib/modules/registry";
import { resolveOrderTypes } from "@/lib/modules/resolve";
import { feeLine } from "@/lib/orders/delivery";
import { discountLine } from "@/lib/orders/coupons";
import { nightsBetween } from "@/lib/orders/stays";

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
  /** Delivery fee for the chosen area (0 = free), in deliveryCurrency */
  deliveryFee?: number | null;
  deliveryCurrency?: string | null;
  /** cash, card, whish or omt */
  paymentMethod?: string | null;
  /** The customer's order status page */
  statusUrl?: string | null;
  /** Coupon discount on the items, in discountCurrency */
  discount?: number | null;
  discountCurrency?: string | null;
  couponCode?: string | null;
  /** Stays: the day guests leave (YYYY-MM-DD); check-in is the date in `when` */
  checkOut?: string | null;
  /** Stays: how many guests */
  guests?: number | null;
}

/** "Fri 12 Jun" / "الجمعة 12 حزيران": a stay's dates, with Western digits */
export function stayDate(date: string, lang: Language, weekday: "short" | "long" = "short"): string {
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-LB-u-nu-latn" : "en-GB", {
    weekday: lang === "ar" ? "long" : weekday,
    day: "numeric",
    month: lang === "ar" ? "long" : "short",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
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
  const stay = details.checkOut && details.when ? { checkIn: details.when.slice(0, 10), time: details.when.slice(11, 16), checkOut: details.checkOut } : null;
  if (stay) {
    const nights = nightsBetween(stay.checkIn, stay.checkOut);
    out.push(`*${t.checkIn}:* ${stayDate(stay.checkIn, lang)}${stay.time ? ` · ${stay.time}` : ""}`);
    out.push(`*${t.checkOut}:* ${stayDate(stay.checkOut, lang)}`);
    out.push(`*${t.stay}:* ${t.nightsCount(nights)}${details.guests ? ` · ${t.guestsCount(details.guests)}` : ""}`);
  } else out.push(`*${t.msgOrderType}:* ${t[details.orderType]}`);
  if (details.orderType === "dine_in" && details.table) out.push(`*${t.msgTable}:* ${details.table}`);
  if (ADDRESS_ORDER_TYPES.includes(details.orderType)) {
    if (details.address) out.push(`*${t.msgAddress}:* ${details.address}`);
    if (details.area) out.push(`*${t.msgArea}:* ${details.area}`);
  }
  if (details.when && !stay) out.push(`*${t.msgWhen}:* ${formatWhen(details.when)}`);
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

  if (details.deliveryFee != null && details.orderType === "delivery") {
    const fee = details.deliveryFee > 0 ? formatPrice(details.deliveryFee, details.deliveryCurrency, priceConfig, lang).primary : t.freeDelivery;
    out.push(`• ${t.msgDelivery} — ${fee}`);
  }

  if (details.discount && details.discount > 0) {
    const off = formatPrice(details.discount, details.discountCurrency, priceConfig, lang).primary;
    out.push(`• ${t.msgDiscount}${details.couponCode ? ` (${details.couponCode})` : ""} — −${off}`);
  }

  const total = formatTotal(
    [...lines, ...feeLine(details.deliveryFee, details.deliveryCurrency), ...discountLine(details.discount, details.discountCurrency)],
    priceConfig,
    lang
  );
  out.push("");
  out.push(`*${t.msgTotal}:* ${total.primary}${total.secondary ? ` (${total.secondary})` : ""}`);
  if (details.paymentMethod) out.push(`*${t.msgPayment}:* ${t.payMethods[details.paymentMethod] ?? details.paymentMethod}`);

  if (details.notes) {
    out.push("");
    out.push(`*${t.msgNotes}:* ${details.notes}`);
  }
  if (details.statusUrl) {
    out.push("");
    out.push(`${t.msgTrack}: ${details.statusUrl}`);
  }

  return out.join("\n");
}

/** Which customer-facing step a status is: "ready" reads as "on its way" for deliveries */
export function customerStep(status: string, orderType: string | null): string {
  if (status !== "ready") return status;
  if (orderType === "delivery" || orderType === "home_visit") return "onTheWay";
  if (orderType === "pickup" || orderType === "takeaway") return "readyPickup";
  return "ready";
}

/** The WhatsApp message the team sends the customer after changing an order's status */
export function buildCustomerUpdate(
  order: { number: number; status: string; order_type: string | null; lang: string | null },
  businessName: string,
  module: ModuleId,
  statusUrl: string | null
): string {
  const t = getDictionary(order.lang === "ar" ? "ar" : "en", module);
  const line = (t.custUpdate[customerStep(order.status, order.order_type)] ?? t.custUpdate.new)(order.number, businessName);
  return statusUrl ? `${line}\n${t.custTrack(statusUrl)}` : line;
}

/** A reminder of a booking or appointment, in the customer's language: "Sat 8 Nov" at "14:30" */
export function buildReminder(
  order: { requested_for: string | null; lang: string | null },
  businessName: string,
  module: ModuleId
): string | null {
  if (!order.requested_for) return null;
  const lang = order.lang === "ar" ? "ar" : "en";
  const t = getDictionary(lang, module);
  const date = new Intl.DateTimeFormat(lang === "ar" ? "ar-LB-u-nu-latn" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${order.requested_for.slice(0, 10)}T12:00:00Z`));
  return t.custReminder(businessName, date, order.requested_for.slice(11, 16));
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
