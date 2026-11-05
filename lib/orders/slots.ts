// Bookable times for table bookings and service appointments. The owner sets them up in Settings
// (catalog_settings.booking_config); times come from the opening hours, every slot_minutes, and a
// time is free while fewer than `capacity` bookings overlap it. Pure, so the page, the slots API
// and the order check agree. The final "is it still free" check happens when saving (store.ts).

export interface BookingConfig {
  /** Offer set times instead of a free date and time */
  enabled: boolean;
  /** How often a booking can start */
  slot_minutes: number;
  /** Bookings at the same time (chairs, staff, tables) */
  capacity: number;
  /** Earliest booking, in minutes from now */
  lead_minutes: number;
  /** How many days ahead customers can book */
  max_days: number;
  /** How long a table booking lasts */
  table_minutes: number;
  /** Length of a service with no duration set */
  default_minutes: number;
  /** Days the business takes no bookings (YYYY-MM-DD) */
  blocked_dates: string[];
  /** Deposit asked to confirm a booking (paid by Whish or OMT); null = none */
  deposit: number | null;
  deposit_currency: "USD" | "LBP";
}

export const SLOT_STEPS = [15, 30, 60] as const;
export const MAX_CAPACITY = 50;
export const MAX_BLOCKED_DATES = 100;

export const DEFAULT_BOOKING: BookingConfig = {
  enabled: false,
  slot_minutes: 30,
  capacity: 1,
  lead_minutes: 60,
  max_days: 30,
  table_minutes: 90,
  default_minutes: 30,
  blocked_dates: [],
  deposit: null,
  deposit_currency: "USD",
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const int = (value: unknown, min: number, max: number, fallback: number) => {
  const n = Math.round(Number(value));
  return Number.isFinite(n) && n >= min && n <= max ? n : fallback;
};

/** Read (or clean, from the settings form) a booking config */
export function parseBookingConfig(raw: unknown): BookingConfig {
  let value = raw;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return DEFAULT_BOOKING;
    }
  }
  if (!value || typeof value !== "object") return DEFAULT_BOOKING;
  const input = value as Record<string, unknown>;
  const step = Number(input.slot_minutes);
  const deposit = Number(input.deposit);
  const blocked = Array.isArray(input.blocked_dates)
    ? [...new Set(input.blocked_dates.filter((d): d is string => typeof d === "string" && DATE.test(d)))].sort().slice(0, MAX_BLOCKED_DATES)
    : [];
  return {
    enabled: Boolean(input.enabled),
    slot_minutes: (SLOT_STEPS as readonly number[]).includes(step) ? step : DEFAULT_BOOKING.slot_minutes,
    capacity: int(input.capacity, 1, MAX_CAPACITY, DEFAULT_BOOKING.capacity),
    lead_minutes: int(input.lead_minutes, 0, 7 * 24 * 60, DEFAULT_BOOKING.lead_minutes),
    max_days: int(input.max_days, 1, 365, DEFAULT_BOOKING.max_days),
    table_minutes: int(input.table_minutes, 15, 8 * 60, DEFAULT_BOOKING.table_minutes),
    default_minutes: int(input.default_minutes, 5, 8 * 60, DEFAULT_BOOKING.default_minutes),
    blocked_dates: blocked,
    deposit: input.deposit !== null && input.deposit !== "" && Number.isFinite(deposit) && deposit > 0 && deposit < 100_000_000 ? Math.round(deposit * 100) / 100 : null,
    deposit_currency: input.deposit_currency === "LBP" ? "LBP" : "USD",
  };
}

export interface HoursRow {
  day_name: string;
  open_hour: number;
  close_hour: number;
  is_closed?: boolean | number | null;
}

/** A booking already taken: 'YYYY-MM-DD HH:MM' and how long it lasts */
export interface TakenBooking {
  start: string;
  minutes: number;
}

export interface BeirutNow {
  /** YYYY-MM-DD */
  date: string;
  /** Minutes since midnight */
  minutes: number;
}

/** Today's date and the time of day in Beirut */
export function beirutNow(now = new Date()): BeirutNow {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Beirut",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

/** Days between two YYYY-MM-DD dates (b - a) */
function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

/**
 * Opening minutes for a date: [open, close] since midnight. An overnight shift (close at or
 * before open, e.g. 18 → 2) takes bookings until midnight. Null when closed that day; undefined
 * when the business has no opening hours at all (times can't be offered).
 */
export function openingFor(hours: HoursRow[], date: string): [number, number] | null | undefined {
  if (!hours || hours.length === 0) return undefined;
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  const row = hours.find((h) => String(h.day_name).toLowerCase() === DAY_NAMES[weekday]);
  if (!row || Number(row.is_closed)) return null;
  const open = Math.round(Number(row.open_hour) * 60);
  let close = Math.round(Number(row.close_hour) * 60);
  if (close <= open) close = 24 * 60;
  return [open, Math.min(close, 24 * 60)];
}

const toMinutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
const toTime = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

export type SlotsResult =
  /** The free start times (HH:MM), possibly none */
  | { state: "open"; times: string[] }
  /** Closed that day, blocked, in the past or too far ahead */
  | { state: "closed" }
  /** No opening hours set: the customer picks any time, as without set times */
  | { state: "free" };

/**
 * Free start times on a date for a booking of `minutes`. A time is free while fewer than
 * `capacity` taken bookings overlap [start, start + minutes).
 */
export function availableSlots(input: {
  config: BookingConfig;
  hours: HoursRow[];
  date: string;
  minutes: number;
  now: BeirutNow;
  taken: TakenBooking[];
}): SlotsResult {
  const { config, date, now } = input;
  if (!DATE.test(date)) return { state: "closed" };
  const ahead = daysBetween(now.date, date);
  if (ahead < 0 || ahead > config.max_days || config.blocked_dates.includes(date)) return { state: "closed" };
  const opening = openingFor(input.hours, date);
  if (opening === undefined) return { state: "free" };
  if (opening === null) return { state: "closed" };

  const length = Math.max(5, Math.round(input.minutes));
  // Minutes from the start of today, like the times below once the days ahead are added
  const earliest = now.minutes + config.lead_minutes;
  const taken = input.taken
    .filter((b) => b.start.slice(0, 10) === date)
    .map((b) => ({ from: toMinutes(b.start.slice(11, 16)), to: toMinutes(b.start.slice(11, 16)) + b.minutes }));

  const times: string[] = [];
  const [open, close] = opening;
  // Times line up on the step from the opening time (9:00, 9:30… or 9:15, 9:45… for 9:15)
  for (let start = open; start + length <= close; start += config.slot_minutes) {
    if (start + ahead * 24 * 60 < earliest) continue;
    const overlapping = taken.filter((b) => b.from < start + length && b.to > start).length;
    if (overlapping < config.capacity) times.push(toTime(start));
  }
  return { state: "open", times };
}

/** How long a service request lasts: the items' durations (× quantity), or the default */
export function requestMinutes(lines: { duration_minutes?: number | null; quantity: number }[], config: BookingConfig): number {
  const total = lines.reduce((sum, line) => sum + (line.duration_minutes && line.duration_minutes > 0 ? line.duration_minutes * line.quantity : 0), 0);
  return Math.min(total > 0 ? total : config.default_minutes, 12 * 60);
}

/**
 * Does a time fit the set times (on the step, within the hours, not too soon or far, not
 * blocked)? Capacity is checked when saving. True when no opening hours are set.
 */
export function fitsSlot(config: BookingConfig, hours: HoursRow[], date: string, time: string, minutes: number, now: BeirutNow): boolean {
  const result = availableSlots({ config, hours, date, minutes, now, taken: [] });
  return result.state === "free" || (result.state === "open" && result.times.includes(time.slice(0, 5)));
}
