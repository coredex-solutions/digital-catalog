// The people who take appointments (salons, clinics, trainers…). Kept in
// catalog_settings.booking_config.staff (see slots.ts) and set up in Settings → Booking times.
// With staff set up, each person takes one appointment at a time: a customer books a person or
// "anyone", and the free times are worked out per person (slots.ts: staffSlots).

export interface StaffMember {
  id: string;
  name_en: string;
  name_ar: string;
  /** The services this person does (item ids); empty = every service */
  service_ids: string[];
  /** Weekly days off, 0 = Sunday … 6 = Saturday */
  days_off: number[];
  /** Working hours each day ('HH:MM'); null = the opening hours */
  from: string | null;
  to: string | null;
  /** Holidays and days off (YYYY-MM-DD) */
  dates_off: string[];
  /** Off: kept, but not offered to customers */
  active: boolean;
}

/** Who a booking went to, as saved with it */
export interface StaffPick {
  id: string;
  name_en: string;
  name_ar: string;
}

export const MAX_STAFF = 30;
export const MAX_STAFF_DATES_OFF = 60;
const MAX_SERVICES_PER_STAFF = 300;

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const ID = /^[A-Za-z0-9_-]{4,40}$/;

const name = (value: unknown) => (typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, 40) : "");

/** A new id for a person added in Settings */
export function newStaffId(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return `st${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

/** Read (or clean, from the settings form) the staff list. People without a name are dropped. */
export function parseStaffList(raw: unknown): StaffMember[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: StaffMember[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const input = entry as Record<string, unknown>;
    const id = typeof input.id === "string" && ID.test(input.id) ? input.id : null;
    const name_en = name(input.name_en);
    const name_ar = name(input.name_ar);
    if (!id || seen.has(id) || (!name_en && !name_ar)) continue;
    seen.add(id);
    let from = typeof input.from === "string" && TIME.test(input.from) ? input.from : null;
    let to = typeof input.to === "string" && TIME.test(input.to) ? input.to : null;
    // Hours only count as a pair that makes sense
    if (!from || !to || to <= from) from = to = null;
    out.push({
      id,
      name_en,
      name_ar,
      service_ids: Array.isArray(input.service_ids)
        ? [...new Set(input.service_ids.filter((s): s is string => typeof s === "string" && s.length > 0 && s.length <= 80))].slice(0, MAX_SERVICES_PER_STAFF)
        : [],
      days_off: Array.isArray(input.days_off)
        ? [...new Set(input.days_off.map(Number).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))].sort()
        : [],
      from,
      to,
      dates_off: Array.isArray(input.dates_off)
        ? [...new Set(input.dates_off.filter((d): d is string => typeof d === "string" && DATE.test(d)))].sort().slice(0, MAX_STAFF_DATES_OFF)
        : [],
      active: input.active === undefined ? true : Boolean(input.active),
    });
    if (out.length >= MAX_STAFF) break;
  }
  return out;
}

export function staffName(person: { name_en: string; name_ar: string }, lang: "ar" | "en" | string): string {
  return (lang === "ar" ? person.name_ar || person.name_en : person.name_en || person.name_ar) || "";
}

/** Does this person do every one of these services? */
export function doesServices(person: StaffMember, itemIds: string[]): boolean {
  return person.service_ids.length === 0 || itemIds.every((id) => person.service_ids.includes(id));
}

/** The people customers can book for these services, in the owner's order */
export function bookableStaff(staff: StaffMember[], itemIds: string[]): StaffMember[] {
  return staff.filter((person) => person.active && doesServices(person, itemIds));
}

/** Does this person work on this date (not a weekly day off or a holiday)? */
export function worksOn(person: StaffMember, date: string): boolean {
  if (!DATE.test(date) || person.dates_off.includes(date)) return false;
  return !person.days_off.includes(new Date(`${date}T12:00:00Z`).getUTCDay());
}

/** The person's working hours in minutes since midnight, or null for the opening hours */
export function staffWindow(person: StaffMember): [number, number] | null {
  if (!person.from || !person.to) return null;
  const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
  return [minutes(person.from), minutes(person.to)];
}

export function toPick(person: StaffMember): StaffPick {
  return { id: person.id, name_en: person.name_en, name_ar: person.name_ar };
}
