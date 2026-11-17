// Waiting lists for fully booked days (services with set times; table booking_waitlist, migration
// 20261118_waitlist.sql). A customer who finds a day full leaves their name and phone; the team
// sees the list on the calendar and messages them on WhatsApp when a time opens.

import { v4 as uuidv4 } from "uuid";
import { getDb } from "../db/client";
import type { ModuleDefinition } from "../modules/registry";
import { staffChoices, usesStaff, type BookingConfig } from "./slots";
import { staffName } from "./staff";

export const WAITLIST_STATUSES = ["waiting", "contacted", "removed"] as const;
export type WaitlistStatus = (typeof WAITLIST_STATUSES)[number];
/** Most people waiting for one day (a full list stops taking names) */
export const MAX_WAITING_PER_DAY = 50;

export interface WaitlistEntry {
  date: string;
  name: string;
  /** Digits only, so the same number typed two ways is one entry */
  phone: string;
  lang: "ar" | "en";
  services: { id: string; name_en: string; name_ar: string }[];
  staff_id: string | null;
  staff_name: string | null;
}

export interface SavedWaitlistEntry extends WaitlistEntry {
  id: string;
  status: WaitlistStatus;
  created_at: string;
  contacted_at: string | null;
}

export type WaitlistCheck =
  | { ok: true; entry: WaitlistEntry }
  | { ok: false; code: "closed" | "date" | "required"; field?: string; message: string };

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function isRealDate(value: unknown): value is string {
  if (typeof value !== "string" || !DATE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);

/** Check a customer's request to join the waiting list for a day */
export function checkWaitlistRequest(
  body: unknown,
  ctx: { module: ModuleDefinition; booking: BookingConfig; items: { id: string; name_en: string | null; name_ar: string | null; is_available: boolean }[]; today: string }
): WaitlistCheck {
  if (ctx.module.schedule !== "required" || ctx.module.nights || !ctx.booking.enabled) {
    return { ok: false, code: "closed", message: "This page has no waiting list" };
  }
  const input = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const date = input.date;
  if (!isRealDate(date) || date < ctx.today || daysBetween(ctx.today, date) > ctx.booking.max_days || ctx.booking.blocked_dates.includes(date)) {
    return { ok: false, code: "date", field: "date", message: "Choose another day" };
  }
  const name = typeof input.name === "string" ? input.name.trim().replace(/\s+/g, " ").slice(0, 80) : "";
  if (!name) return { ok: false, code: "required", field: "name", message: "Name is required" };
  const phone = typeof input.phone === "string" ? input.phone.replace(/\D/g, "") : "";
  if (phone.length < 7 || phone.length > 15) return { ok: false, code: "required", field: "phone", message: "A valid phone number is required" };

  const byId = new Map(ctx.items.filter((item) => item.is_available).map((item) => [item.id, item]));
  const ids = Array.isArray(input.itemIds) ? [...new Set(input.itemIds.filter((id): id is string => typeof id === "string" && byId.has(id)))].slice(0, 10) : [];
  const lang = input.lang === "ar" ? "ar" : "en";

  // The person asked for, if the business books by person and they do these services
  let staff: { id: string; name: string } | null = null;
  if (usesStaff(ctx.booking) && typeof input.staffId === "string" && input.staffId !== "any") {
    const person = staffChoices(ctx.booking, ids, input.staffId)[0];
    if (person) staff = { id: person.id, name: staffName(person, lang) };
  }

  return {
    ok: true,
    entry: {
      date,
      name,
      phone,
      lang,
      services: ids.map((id) => ({ id, name_en: byId.get(id)!.name_en ?? "", name_ar: byId.get(id)!.name_ar ?? "" })),
      staff_id: staff?.id ?? null,
      staff_name: staff?.name ?? null,
    },
  };
}

function toEntry(row: Record<string, unknown>): SavedWaitlistEntry {
  let services: SavedWaitlistEntry["services"] = [];
  try {
    services = JSON.parse(String(row.services ?? "[]"));
  } catch {
    // Unreadable: the entry still shows, without services
  }
  return {
    id: String(row.id),
    date: String(row.date),
    name: String(row.name ?? ""),
    phone: String(row.phone ?? ""),
    lang: row.lang === "ar" ? "ar" : "en",
    services,
    staff_id: row.staff_id == null ? null : String(row.staff_id),
    staff_name: row.staff_name == null ? null : String(row.staff_name),
    status: (WAITLIST_STATUSES as readonly string[]).includes(String(row.status)) ? (row.status as WaitlistStatus) : "waiting",
    created_at: String(row.created_at ?? ""),
    contacted_at: row.contacted_at == null ? null : String(row.contacted_at),
  };
}

/**
 * Add someone to a day's waiting list. Joining again with the same phone updates their entry (and
 * puts them back on the list if they were removed). "full" when the day already has the most
 * people waiting.
 */
export async function joinWaitlist(catalogId: string, entry: WaitlistEntry): Promise<{ ok: true } | { ok: false; code: "full" }> {
  const result = await getDb().execute({
    sql: `INSERT INTO booking_waitlist (id, catalog_id, date, name, phone, lang, services, staff_id, staff_name, status, created_at)
          SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, 'waiting', datetime('now')
          WHERE (SELECT COUNT(*) FROM booking_waitlist WHERE catalog_id = ? AND date = ? AND status = 'waiting' AND phone != ?) < ?
          ON CONFLICT(catalog_id, date, phone) DO UPDATE SET
            name = excluded.name, lang = excluded.lang, services = excluded.services,
            staff_id = excluded.staff_id, staff_name = excluded.staff_name, status = 'waiting', contacted_at = NULL
          RETURNING id`,
    args: [
      uuidv4(),
      catalogId,
      entry.date,
      entry.name,
      entry.phone,
      entry.lang,
      JSON.stringify(entry.services),
      entry.staff_id,
      entry.staff_name,
      catalogId,
      entry.date,
      entry.phone,
      MAX_WAITING_PER_DAY,
    ],
  });
  return result.rows.length > 0 ? { ok: true } : { ok: false, code: "full" };
}

/** A day's waiting list (not removed), first come first */
export async function waitlistFor(catalogId: string, date: string): Promise<SavedWaitlistEntry[]> {
  const result = await getDb().execute({
    sql: `SELECT * FROM booking_waitlist WHERE catalog_id = ? AND date = ? AND status != 'removed' ORDER BY created_at ASC, id ASC LIMIT ?`,
    args: [catalogId, date, MAX_WAITING_PER_DAY],
  });
  return result.rows.map((row) => toEntry(Object.fromEntries(result.columns.map((column) => [column, row[column]]))));
}

/** Days from `from` on with people still waiting, and how many */
export async function upcomingWaitlists(catalogId: string, from: string): Promise<{ date: string; waiting: number }[]> {
  const result = await getDb().execute({
    sql: `SELECT date, COUNT(*) AS n FROM booking_waitlist
          WHERE catalog_id = ? AND date >= ? AND status = 'waiting' GROUP BY date ORDER BY date ASC LIMIT 60`,
    args: [catalogId, from],
  });
  return result.rows.map((row) => ({ date: String(row.date), waiting: Number(row.n) }));
}

/** How many people are still waiting for a day */
export async function waitingCount(catalogId: string, date: string): Promise<number> {
  const result = await getDb().execute({
    sql: "SELECT COUNT(*) AS n FROM booking_waitlist WHERE catalog_id = ? AND date = ? AND status = 'waiting'",
    args: [catalogId, date],
  });
  return Number(result.rows[0]?.n ?? 0);
}

/** Mark an entry contacted, removed, or waiting again */
export async function setWaitlistStatus(catalogId: string, id: string, status: WaitlistStatus): Promise<SavedWaitlistEntry | null> {
  const result = await getDb().execute({
    sql: `UPDATE booking_waitlist SET status = ?,
            contacted_at = CASE WHEN ? = 'contacted' THEN COALESCE(contacted_at, datetime('now')) WHEN ? = 'waiting' THEN NULL ELSE contacted_at END
          WHERE id = ? AND catalog_id = ? RETURNING *`,
    args: [status, status, status, id, catalogId],
  });
  const row = result.rows[0];
  return row ? toEntry(Object.fromEntries(result.columns.map((column) => [column, row[column]]))) : null;
}
