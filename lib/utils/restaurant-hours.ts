const DAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

interface HoursRow {
  day_name: string;
  open_hour: number;
  close_hour: number;
  is_closed?: boolean | number | null;
}

// Utility function to check if restaurant is open
export function isRestaurantOpen(operatingHours?: any[]): boolean {
  const now = new Date();
  const currentDay = DAYS[now.getDay()] as string;
  const currentHour = now.getHours() + now.getMinutes() / 60;

  if (operatingHours && operatingHours.length > 0) {
    // Day names are stored capitalised ("Sunday") by signup, so compare case-insensitively
    const todayHours = operatingHours.find((h) => String(h.day_name).toLowerCase() === currentDay);
    if (todayHours) {
      if (todayHours.is_closed) return false;
      return currentHour >= todayHours.open_hour && currentHour < todayHours.close_hour;
    }
  }

  // Fallback to default hours (11-23.5)
  return currentHour >= 11 && currentHour < 23.5;
}

export type OpenStatus =
  | { state: "open"; closesAt: number }
  | { state: "closed"; opensAt: number; opensDayIndex: number; opensToday: boolean }
  | { state: "unknown" };

/** Current weekday index (0 = Sunday) and hour (fractional) in the given time zone */
function nowInZone(timeZone: string, now: Date): { day: number; hour: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(now);
  const weekday = parts.find((p) => p.type === "weekday")?.value || "Sun";
  const hour = Number(parts.find((p) => p.type === "hour")?.value || 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value || 0);
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday);
  return { day: day < 0 ? 0 : day, hour: hour + minute / 60 };
}

/**
 * Open/closed status with the next change, evaluated in the restaurant's time zone
 * (Beirut by default, so it is correct regardless of the server's or visitor's clock).
 * Hours that close at or before they open (e.g. 18 -> 2) run past midnight.
 */
export function getOpenStatus(
  operatingHours: HoursRow[] | undefined,
  timeZone = "Asia/Beirut",
  now = new Date()
): OpenStatus {
  if (!operatingHours || operatingHours.length === 0) return { state: "unknown" };

  const byDay = new Map<number, HoursRow>();
  for (const row of operatingHours) {
    const index = DAYS.indexOf(String(row.day_name).toLowerCase());
    if (index >= 0) byDay.set(index, row);
  }
  if (byDay.size === 0) return { state: "unknown" };

  const { day, hour } = nowInZone(timeZone, now);
  const isOpenDay = (row?: HoursRow) => !!row && !Number(row.is_closed ?? 0);

  // Still inside yesterday's overnight shift?
  const yesterday = byDay.get((day + 6) % 7);
  if (isOpenDay(yesterday) && yesterday!.close_hour <= yesterday!.open_hour && hour < yesterday!.close_hour) {
    return { state: "open", closesAt: yesterday!.close_hour };
  }

  const today = byDay.get(day);
  if (isOpenDay(today)) {
    const overnight = today!.close_hour <= today!.open_hour;
    if (hour >= today!.open_hour && (overnight || hour < today!.close_hour)) {
      return { state: "open", closesAt: today!.close_hour };
    }
    if (hour < today!.open_hour) {
      return { state: "closed", opensAt: today!.open_hour, opensDayIndex: day, opensToday: true };
    }
  }

  // Find the next open day within the coming week
  for (let offset = 1; offset <= 7; offset++) {
    const index = (day + offset) % 7;
    const row = byDay.get(index);
    if (isOpenDay(row)) {
      return { state: "closed", opensAt: row!.open_hour, opensDayIndex: index, opensToday: false };
    }
  }

  return { state: "unknown" };
}

/** Format a fractional hour (e.g. 23.5) as a clock time ("11:30 PM" / "11:30 م" / "23:30") */
export function formatHour(hour: number, lang: string): string {
  const normalized = ((hour % 24) + 24) % 24;
  const h = Math.floor(normalized);
  const m = Math.round((normalized - h) * 60);
  const date = new Date(Date.UTC(2000, 0, 1, h, m));
  const locale = lang === "ar" ? "ar-LB-u-nu-latn" : "en-US";
  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: m ? "2-digit" : undefined,
    timeZone: "UTC",
  }).format(date);
}
