// Coupon codes (table `coupons`): a percentage or an amount off the items, with an optional
// minimum, dates and number of uses. Pure rules, used by the checkout preview and the server;
// the server's answer is the one saved, and uses are counted when the order is saved.

import { totalIn, type FeeCurrency, type PricedAmount } from "./delivery";

export interface Coupon {
  id: string;
  code: string;
  kind: "percent" | "amount";
  /** Percent off (1–100) or the amount off, in `currency` */
  value: number;
  /** Currency of an amount off and of the minimum */
  currency: FeeCurrency;
  min_order: number | null;
  /** Beirut dates, inclusive; null = no limit */
  starts_on: string | null;
  ends_on: string | null;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
}

/** What the checkout needs to work out a coupon (no counts or dates) */
export type CouponTerms = Pick<Coupon, "code" | "kind" | "value" | "currency" | "min_order">;

export const MAX_COUPONS = 100;

/** Codes are kept in capitals without spaces: "summer 10" → "SUMMER10" */
export function normalizeCode(value: unknown): string {
  return typeof value === "string" ? value.toUpperCase().replace(/\s+/g, "").replace(/[^A-Z0-9_-]/g, "").slice(0, 20) : "";
}

export function rowToCoupon(row: Record<string, unknown>): Coupon {
  const num = (v: unknown) => (v == null ? null : Number(v));
  return {
    id: String(row.id),
    code: String(row.code),
    kind: row.kind === "amount" ? "amount" : "percent",
    value: Number(row.value),
    currency: row.currency === "LBP" ? "LBP" : "USD",
    min_order: num(row.min_order),
    starts_on: row.starts_on ? String(row.starts_on) : null,
    ends_on: row.ends_on ? String(row.ends_on) : null,
    max_uses: num(row.max_uses),
    used_count: Number(row.used_count ?? 0),
    is_active: Boolean(Number(row.is_active ?? 1)),
  };
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const amount = (v: unknown) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 && n < 100_000_000 ? Math.round(n * 100) / 100 : NaN;
};

export type CouponInput = Omit<Coupon, "id" | "used_count">;

/** Check a coupon from the dashboard form; an error names the field to fix */
export function parseCouponInput(raw: unknown): { ok: true; coupon: CouponInput } | { ok: false; field: string; error: string } {
  const input = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const code = normalizeCode(input.code);
  if (code.length < 3) return { ok: false, field: "code", error: "A code needs 3 to 20 letters or numbers" };
  const kind = input.kind === "amount" ? "amount" : "percent";
  const value = Number(input.value);
  if (!Number.isFinite(value) || value <= 0 || (kind === "percent" ? value > 100 : value >= 100_000_000)) {
    return { ok: false, field: "value", error: kind === "percent" ? "Enter a percentage from 1 to 100" : "Enter the amount off" };
  }
  const min_order = amount(input.min_order);
  if (Number.isNaN(min_order)) return { ok: false, field: "min_order", error: "Enter a valid minimum order" };
  const starts_on = typeof input.starts_on === "string" && DATE.test(input.starts_on) ? input.starts_on : null;
  const ends_on = typeof input.ends_on === "string" && DATE.test(input.ends_on) ? input.ends_on : null;
  if (starts_on && ends_on && ends_on < starts_on) return { ok: false, field: "ends_on", error: "The end date is before the start date" };
  const uses = input.max_uses === null || input.max_uses === undefined || input.max_uses === "" ? null : Math.floor(Number(input.max_uses));
  if (uses !== null && (!Number.isFinite(uses) || uses < 1 || uses > 1_000_000)) return { ok: false, field: "max_uses", error: "Enter a valid number of uses" };
  return {
    ok: true,
    coupon: {
      code,
      kind,
      value: Math.round(value * 100) / 100,
      currency: input.currency === "LBP" ? "LBP" : "USD",
      min_order,
      starts_on,
      ends_on,
      max_uses: uses,
      is_active: input.is_active === undefined ? true : Boolean(input.is_active),
    },
  };
}

export type CouponProblem = "invalid" | "inactive" | "not_started" | "expired" | "used_up" | "below_minimum";

/** Can the coupon be used today (dates, uses, switched on)? */
export function couponUsable(coupon: Coupon, today: string): CouponProblem | null {
  if (!coupon.is_active) return "inactive";
  if (coupon.starts_on && today < coupon.starts_on) return "not_started";
  if (coupon.ends_on && today > coupon.ends_on) return "expired";
  if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) return "used_up";
  return null;
}

/**
 * The discount on these items, in the coupon's currency: never more than the items cost.
 * LBP discounts are whole pounds. Fails when the items are under the minimum or can't be
 * totalled in the coupon's currency (mixed currencies with no rate).
 */
export function couponDiscount(
  terms: CouponTerms,
  lines: PricedAmount[],
  lbpRate: number | null
): { ok: true; discount: number; currency: FeeCurrency } | { ok: false; problem: CouponProblem } {
  const subtotal = totalIn(lines, terms.currency, lbpRate);
  if (subtotal === null || subtotal <= 0) return { ok: false, problem: "invalid" };
  if (terms.min_order !== null && subtotal + 0.005 < terms.min_order) return { ok: false, problem: "below_minimum" };
  let discount = terms.kind === "percent" ? (subtotal * terms.value) / 100 : terms.value;
  discount = Math.min(discount, subtotal);
  discount = terms.currency === "LBP" ? Math.round(discount) : Math.round(discount * 100) / 100;
  return { ok: true, discount, currency: terms.currency };
}

/** The discount as a priced line (negative), so totals include it */
export function discountLine(discount: number | null | undefined, currency: string | null | undefined): PricedAmount[] {
  return discount && discount > 0 ? [{ price: -discount, currency: currency || "USD", quantity: 1 }] : [];
}
