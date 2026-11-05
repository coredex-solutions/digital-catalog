// Stays (guesthouses, chalets, hotels): rooms and chalets booked by the night. Pure, so the page,
// the availability API and the order check agree. The final "is it still free" check happens
// inside the save (store.ts), so two guests can't book the last room for the same night.
//
// A stay from check-in day A to check-out day B takes the nights A, A+1, ... B-1.

export interface StayConfig {
  /** Check-in from (HH:MM) */
  check_in: string;
  /** Check-out by (HH:MM) */
  check_out: string;
  /** Shortest stay, in nights */
  min_nights: number;
  /** Longest stay, in nights */
  max_nights: number;
  /** How many days ahead guests can book */
  max_days: number;
  /** Nights the place takes no bookings (YYYY-MM-DD) */
  blocked_dates: string[];
  /** Part of the total paid to confirm, by Whish or OMT (0 = no deposit) */
  deposit_percent: number;
}

export const MAX_STAY_NIGHTS = 90;
export const MAX_STAY_DAYS = 540;
export const MAX_UNITS = 50;
export const MAX_GUESTS = 50;
export const MAX_BLOCKED_NIGHTS = 200;

export const DEFAULT_STAY: StayConfig = {
  check_in: "14:00",
  check_out: "12:00",
  min_nights: 1,
  max_nights: 30,
  max_days: 365,
  blocked_dates: [],
  deposit_percent: 0,
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const int = (value: unknown, min: number, max: number, fallback: number) => {
  const n = Math.round(Number(value));
  return value !== null && value !== "" && Number.isFinite(n) && n >= min && n <= max ? n : fallback;
};

/** A real calendar date (rejects 2026-02-31) */
export function isRealDate(value: unknown): value is string {
  if (typeof value !== "string" || !DATE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/** Read (or clean, from the settings form) a stay config */
export function parseStayConfig(raw: unknown): StayConfig {
  let value = raw;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return DEFAULT_STAY;
    }
  }
  if (!value || typeof value !== "object") return DEFAULT_STAY;
  const input = value as Record<string, unknown>;
  const min = int(input.min_nights, 1, MAX_STAY_NIGHTS, DEFAULT_STAY.min_nights);
  const blocked = Array.isArray(input.blocked_dates)
    ? [...new Set(input.blocked_dates.filter(isRealDate))].sort().slice(0, MAX_BLOCKED_NIGHTS)
    : [];
  return {
    check_in: typeof input.check_in === "string" && TIME.test(input.check_in) ? input.check_in : DEFAULT_STAY.check_in,
    check_out: typeof input.check_out === "string" && TIME.test(input.check_out) ? input.check_out : DEFAULT_STAY.check_out,
    min_nights: min,
    max_nights: Math.max(min, int(input.max_nights, 1, MAX_STAY_NIGHTS, DEFAULT_STAY.max_nights)),
    max_days: int(input.max_days, 7, MAX_STAY_DAYS, DEFAULT_STAY.max_days),
    blocked_dates: blocked,
    deposit_percent: int(input.deposit_percent, 0, 100, 0),
  };
}

/** YYYY-MM-DD plus n days */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** Nights between check-in and check-out (0 or less when the order is wrong) */
export function nightsBetween(checkIn: string, checkOut: string): number {
  const ms = Date.parse(`${checkOut}T00:00:00Z`) - Date.parse(`${checkIn}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

/** The nights of a stay, as the dates they start on */
export function stayNights(checkIn: string, checkOut: string): string[] {
  const count = nightsBetween(checkIn, checkOut);
  return Array.from({ length: Math.max(0, Math.min(count, MAX_STAY_DAYS)) }, (_, i) => addDays(checkIn, i));
}

/** Friday and Saturday nights cost the weekend price */
export function isWeekendNight(date: string): boolean {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return day === 5 || day === 6;
}

export interface StayPricing {
  /** The item's normal price per night */
  price: number;
  /** Price on Friday and Saturday nights; null = same as price */
  weekend_price?: number | null;
  currency?: string | null;
}

/**
 * Price of one room or chalet for the whole stay. `nightly` is the price per night of the chosen
 * option (or the item's price); a weekend price adds the same difference on top of it.
 */
export function stayLinePrice(item: StayPricing, nightly: number, nights: string[]): number {
  const extra = item.weekend_price != null && item.weekend_price > 0 ? item.weekend_price - item.price : 0;
  const total = nights.reduce((sum, night) => sum + Math.max(0, nightly + (isWeekendNight(night) ? extra : 0)), 0);
  return (item.currency || "USD").toUpperCase() === "LBP" ? Math.round(total) : Math.round(total * 100) / 100;
}

export type StayDateProblem = "invalid" | "past" | "too_short" | "too_long" | "too_far" | "closed";

/** Whether guests may book these dates (free rooms are checked separately) */
export function checkStayDates(config: StayConfig, checkIn: unknown, checkOut: unknown, today: string): StayDateProblem | null {
  if (!isRealDate(checkIn) || !isRealDate(checkOut)) return "invalid";
  const nights = nightsBetween(checkIn, checkOut);
  if (nights < 1) return "invalid";
  if (checkIn < today) return "past";
  if (nights < config.min_nights) return "too_short";
  if (nights > config.max_nights) return "too_long";
  if (checkIn > addDays(today, config.max_days)) return "too_far";
  if (stayNights(checkIn, checkOut).some((night) => config.blocked_dates.includes(night))) return "closed";
  return null;
}

/** A saved stay as availability needs it */
export interface StayBooking {
  check_in: string;
  check_out: string;
  lines: { item_id: string; quantity: number }[];
}

/** Rooms taken per item per night: { itemId: { date: count } } */
export function bookedByNight(bookings: StayBooking[], from?: string, to?: string): Record<string, Record<string, number>> {
  const out: Record<string, Record<string, number>> = {};
  for (const booking of bookings) {
    for (const night of stayNights(booking.check_in, booking.check_out)) {
      if ((from && night < from) || (to && night >= to)) continue;
      for (const line of booking.lines) {
        const quantity = Math.max(0, Math.floor(Number(line.quantity) || 0));
        if (!quantity) continue;
        const nights = (out[line.item_id] ||= {});
        nights[night] = (nights[night] || 0) + quantity;
      }
    }
  }
  return out;
}

/** How many of an item are free for every night of a stay */
export function freeUnits(unitCount: number, booked: Record<string, number> | undefined, nights: string[]): number {
  let free = unitCount;
  for (const night of nights) free = Math.min(free, unitCount - (booked?.[night] || 0));
  return Math.max(0, free);
}

/** Rooms of an item (unit_count NULL = 1) */
export function unitsOf(item: { unit_count?: number | null }): number {
  const n = Math.floor(Number(item.unit_count));
  return Number.isFinite(n) && n >= 1 ? Math.min(n, MAX_UNITS) : 1;
}

/** Deposit for a total, in the total's currency; null when there's none */
export function stayDeposit(config: StayConfig, total: number, currency: string): number | null {
  if (!config.deposit_percent || total <= 0) return null;
  const amount = (total * config.deposit_percent) / 100;
  return currency.toUpperCase() === "LBP" ? Math.round(amount) : Math.round(amount * 100) / 100;
}
