// Repeat bookings for the appointments calendar (services). Pure, so it can be tested.

/** How often a repeat booking comes back, in weeks */
export const REPEAT_WEEKS = [1, 2, 4] as const;
/** Most appointments one repeat booking makes (the first included) */
export const MAX_REPEATS = 12;

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** The dates of a repeat booking: the first, then every `weeks` weeks, `count` in all */
export function repeatDates(date: string, weeks: number, count: number): string[] {
  const every = (REPEAT_WEEKS as readonly number[]).includes(weeks) ? weeks : 1;
  const times = Math.min(Math.max(Math.floor(count) || 1, 1), MAX_REPEATS);
  return Array.from({ length: times }, (_, i) => addDays(date, i * every * 7));
}
