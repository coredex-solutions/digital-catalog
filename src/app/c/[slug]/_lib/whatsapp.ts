// Builds the WhatsApp messages the diner sends to the restaurant (orders and table requests).

import type { Language } from "@/types";
import { formatPrice, formatTotal, type PriceConfig } from "@/lib/catalog/price";
import { getDictionary, localized } from "./i18n";

export type OrderType = "dine_in" | "takeaway" | "delivery";

export const ALL_ORDER_TYPES: OrderType[] = ["dine_in", "takeaway", "delivery"];

export function parseOrderTypes(value?: string | null): OrderType[] {
  const types = (value ?? "dine_in,takeaway")
    .split(",")
    .map((s) => s.trim())
    .filter((t): t is OrderType => (ALL_ORDER_TYPES as string[]).includes(t));
  return ALL_ORDER_TYPES.filter((t) => types.includes(t));
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
  name_fr: string;
  price: number;
  currency?: string | null;
  quantity: number;
  note?: string;
}

export interface OrderDetails {
  restaurantName: string;
  orderType: OrderType;
  table?: string;
  address?: string;
  area?: string;
  name: string;
  phone: string;
  notes?: string;
}

export function buildOrderMessage(
  lines: OrderLine[],
  details: OrderDetails,
  priceConfig: PriceConfig,
  lang: Language
): string {
  const t = getDictionary(lang);
  const out: string[] = [];

  out.push(`*${t.msgNewOrder} · ${details.restaurantName}*`);
  out.push("");
  out.push(`*${t.msgOrderType}:* ${t[details.orderType]}`);
  if (details.orderType === "dine_in" && details.table) out.push(`*${t.msgTable}:* ${details.table}`);
  if (details.orderType === "delivery") {
    if (details.address) out.push(`*${t.msgAddress}:* ${details.address}`);
    if (details.area) out.push(`*${t.msgArea}:* ${details.area}`);
  }
  out.push(`*${t.msgName}:* ${details.name}`);
  out.push(`*${t.msgPhone}:* ${details.phone}`);
  out.push("");
  out.push(`*${t.msgItems}:*`);

  for (const line of lines) {
    const price = formatPrice(line.price * line.quantity, line.currency, priceConfig, lang);
    out.push(`• ${line.quantity} × ${localized(line, "name", lang)} — ${price.primary}`);
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
}

export function buildReservationMessage(details: ReservationDetails, lang: Language): string {
  const ar = lang === "ar";
  const out = [
    `*${ar ? "طلب حجز طاولة" : "Table reservation request"} · ${details.restaurantName}*`,
    "",
    `*${ar ? "الاسم" : "Name"}:* ${details.name}`,
    `*${ar ? "الهاتف" : "Phone"}:* ${details.phone}`,
    `*${ar ? "التاريخ" : "Date"}:* ${details.date}`,
    `*${ar ? "الوقت" : "Time"}:* ${details.time}`,
    `*${ar ? "عدد الأشخاص" : "Guests"}:* ${details.guests}`,
  ];
  if (details.notes) out.push(`*${ar ? "ملاحظات" : "Notes"}:* ${details.notes}`);
  return out.join("\n");
}
