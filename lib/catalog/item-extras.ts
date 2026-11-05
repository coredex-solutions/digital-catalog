// Item fields for shops, services and stays (migrations 20261105_modules, 20261109_stays): stock,
// SKU, old price, service duration, and for rooms: how many, guests and weekend price. All
// optional; null or "" clears a field.

import { parseItemPrice } from "./price";
import { MAX_GUESTS, MAX_UNITS } from "../orders/stays";

export const MAX_STOCK = 1_000_000;
export const MAX_SKU = 40;
/** A service takes between 5 minutes and 24 hours */
export const MIN_DURATION = 5;
export const MAX_DURATION = 24 * 60;

export interface ItemExtras {
  stock_qty?: number | null;
  sku?: string | null;
  compare_at_price?: number | null;
  duration_minutes?: number | null;
  unit_count?: number | null;
  max_guests?: number | null;
  weekend_price?: number | null;
}

type Parsed = { ok: true; value: ItemExtras } | { ok: false; error: string };

const empty = (value: unknown) => value === null || (typeof value === "string" && value.trim() === "");

function wholeNumber(value: unknown): number | null {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value.trim()) : NaN;
  return Number.isInteger(n) ? n : null;
}

/** Only the fields present in the body are returned, so a partial update leaves the others alone */
export function parseItemExtras(body: Record<string, unknown>): Parsed {
  const value: ItemExtras = {};

  if (body.stock_qty !== undefined) {
    if (empty(body.stock_qty)) value.stock_qty = null;
    else {
      const n = wholeNumber(body.stock_qty);
      if (n === null || n < 0 || n > MAX_STOCK) return { ok: false, error: "Stock must be a whole number of 0 or more" };
      value.stock_qty = n;
    }
  }

  if (body.sku !== undefined) {
    value.sku = empty(body.sku) ? null : String(body.sku).trim().slice(0, MAX_SKU);
  }

  if (body.compare_at_price !== undefined) {
    if (empty(body.compare_at_price)) value.compare_at_price = null;
    else {
      const price = parseItemPrice(body.compare_at_price);
      if (price === null) return { ok: false, error: "The old price must be a number of 0 or more" };
      value.compare_at_price = price;
    }
  }

  if (body.duration_minutes !== undefined) {
    if (empty(body.duration_minutes)) value.duration_minutes = null;
    else {
      const n = wholeNumber(body.duration_minutes);
      if (n === null || n < MIN_DURATION || n > MAX_DURATION) {
        return { ok: false, error: "Duration must be between 5 minutes and 24 hours" };
      }
      value.duration_minutes = n;
    }
  }

  // Stays: identical rooms or chalets, most guests in one, and the Friday/Saturday price
  if (body.unit_count !== undefined) {
    if (empty(body.unit_count)) value.unit_count = null;
    else {
      const n = wholeNumber(body.unit_count);
      if (n === null || n < 1 || n > MAX_UNITS) return { ok: false, error: "The number of rooms must be between 1 and 50" };
      value.unit_count = n;
    }
  }

  if (body.max_guests !== undefined) {
    if (empty(body.max_guests)) value.max_guests = null;
    else {
      const n = wholeNumber(body.max_guests);
      if (n === null || n < 1 || n > MAX_GUESTS) return { ok: false, error: "Guests must be between 1 and 50" };
      value.max_guests = n;
    }
  }

  if (body.weekend_price !== undefined) {
    if (empty(body.weekend_price)) value.weekend_price = null;
    else {
      const price = parseItemPrice(body.weekend_price);
      if (price === null) return { ok: false, error: "The weekend price must be a number of 0 or more" };
      value.weekend_price = price;
    }
  }

  return { ok: true, value };
}
