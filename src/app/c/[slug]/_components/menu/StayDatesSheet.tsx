"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import { needsVariant, useCatalog, type StayAvailability } from "../../_providers/CatalogProvider";
import { addDays, freeUnits, nightsBetween, stayNights, MAX_GUESTS } from "@/lib/orders/stays";
import { localized } from "../../_lib/i18n";
import { stayDate } from "../../_lib/whatsapp";
import { Sheet } from "./Sheet";
import { cn } from "@/utils/helpers";

/** Today in Beirut (YYYY-MM-DD) */
function beirutToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Beirut" }).format(new Date());
}

/** Rooms of one item free for every given night (unknown availability counts as free) */
export function freeFor(availability: StayAvailability | null, itemId: string, units: number, nights: string[]): number {
  if (!availability) return units;
  return freeUnits(availability.units[itemId] ?? units, availability.booked[itemId], nights);
}

const monthOf = (date: string) => date.slice(0, 7);
function shiftMonth(month: string, by: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + by, 1));
  return d.toISOString().slice(0, 7);
}

/**
 * Picking a stay: guests, then check-in and check-out on a month calendar. Nights that are full
 * (for the chosen room, or for every room) or closed can't be picked, and a stay can't run
 * through one. Opened from the dates bar (then it shows the free rooms) or from a room (then
 * that room is booked for the dates).
 */
export function StayDatesSheet() {
  const { activeSheet, closeSheet, openItem, t, lang, stay, setStay, stayRules, stayAvailability, datesFor, menuItems, addToCart } = useCatalog();
  const open = activeSheet === "dates";
  const rules = stayAvailability?.rules ?? stayRules;
  const today = stayAvailability?.today ?? beirutToday();
  const lastCheckIn = addDays(today, rules.max_days);

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [month, setMonth] = useState(monthOf(today));

  // Each time the sheet opens: start from the dates already chosen
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setCheckIn(stay?.checkIn ?? "");
      setCheckOut(stay?.checkOut ?? "");
      setGuests(stay?.guests ?? Math.min(2, datesFor?.max_guests ?? 2));
      setMonth(monthOf(stay?.checkIn && stay.checkIn >= today ? stay.checkIn : today));
    }
  }

  // The rooms that count: the one asked about, or every room that can be booked
  const rooms = useMemo(
    () => (datesFor ? [datesFor] : menuItems.filter((item) => item.is_available !== false)),
    [datesFor, menuItems]
  );
  const blocked = useMemo(() => new Set(rules.blocked_dates), [rules.blocked_dates]);
  /** A room is free for every night in the list */
  const someRoomFree = (nights: string[]) =>
    nights.every((night) => !blocked.has(night)) && rooms.some((room) => freeFor(stayAvailability, room.id, room.unit_count ?? 1, nights) > 0);
  const nightOpen = (night: string) => night >= today && someRoomFree([night]);

  const canCheckIn = (date: string) => date >= today && date <= lastCheckIn && nightOpen(date);
  const canCheckOut = (date: string) => {
    if (!checkIn || date <= checkIn) return false;
    const nights = nightsBetween(checkIn, date);
    return nights >= rules.min_nights && nights <= rules.max_nights && someRoomFree(stayNights(checkIn, date));
  };

  const choose = (date: string) => {
    if (checkIn && !checkOut && canCheckOut(date)) {
      setCheckOut(date);
      return;
    }
    if (canCheckIn(date)) {
      setCheckIn(date);
      setCheckOut("");
    }
  };

  // The month grid, weeks starting on Monday
  const days = useMemo(() => {
    const first = `${month}-01`;
    const weekday = (new Date(`${first}T00:00:00Z`).getUTCDay() + 6) % 7;
    const length = nightsBetween(first, `${shiftMonth(month, 1)}-01`);
    return [...Array<string | null>(weekday).fill(null), ...Array.from({ length }, (_, i) => addDays(first, i))];
  }, [month]);
  const locale = lang === "ar" ? "ar-LB-u-nu-latn" : "en-GB";
  const monthLabel = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${month}-15T12:00:00Z`));
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { weekday: lang === "ar" ? "narrow" : "short", timeZone: "UTC" }).format(new Date(Date.UTC(2026, 0, 5 + i)))
  );
  const lastMonth = monthOf(addDays(lastCheckIn, rules.max_nights));

  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;
  const ready = nights > 0;
  const guestLimit = datesFor?.max_guests ? Math.min(MAX_GUESTS, datesFor.max_guests * (datesFor.unit_count ?? 1)) : MAX_GUESTS;

  const confirm = () => {
    if (!ready) return;
    setStay({ checkIn, checkOut, guests });
    if (datesFor) {
      // A room with options is booked from its sheet, where the option is chosen
      if (needsVariant(datesFor)) {
        openItem(datesFor);
        return;
      }
      addToCart(datesFor, 1);
    }
    closeSheet();
  };

  const hint = !checkIn ? t.pickCheckIn : !checkOut ? t.pickCheckOut : `${stayDate(checkIn, lang)} ${lang === "ar" ? "←" : "→"} ${stayDate(checkOut, lang)} · ${t.nightsCount(nights)}`;

  const footer = (
    <div>
      <p className="mb-2 text-sm font-semibold" aria-live="polite">
        {hint}
      </p>
      <div className="flex gap-2">
        {stay && (
          <button
            type="button"
            onClick={() => {
              setStay(null);
              closeSheet();
            }}
            className="flex min-h-12 items-center justify-center rounded-control border border-menu-input-border px-4 font-semibold"
          >
            {t.clearDates}
          </button>
        )}
        <button
          type="button"
          disabled={!ready}
          onClick={confirm}
          className="flex min-h-12 flex-1 items-center justify-center rounded-control bg-brand px-4 font-semibold text-brand-fg transition-transform active:scale-[0.99] disabled:opacity-50"
        >
          {datesFor ? t.bookForDates : t.showRooms}
        </button>
      </div>
    </div>
  );

  return (
    <Sheet open={open} onClose={closeSheet} title={datesFor ? localized(datesFor, "name", lang) : t.chooseDates} description={datesFor ? t.chooseDates : undefined} footer={footer}>
      {/* Guests */}
      <div className="flex items-center justify-between gap-3 rounded-control bg-menu-raised px-4 py-2">
        <span className="font-semibold">{t.guestsLabel}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setGuests((n) => Math.max(1, n - 1))}
            disabled={guests <= 1}
            aria-label={t.fewerGuests}
            className="flex h-11 w-11 items-center justify-center rounded-control text-menu-ink hover:bg-menu-surface disabled:opacity-35"
          >
            <Minus className="h-4 w-4" aria-hidden />
          </button>
          <span className="min-w-20 text-center font-semibold tabular-nums" aria-live="polite">
            {t.guestsCount(guests)}
          </span>
          <button
            type="button"
            onClick={() => setGuests((n) => Math.min(guestLimit, n + 1))}
            disabled={guests >= guestLimit}
            aria-label={t.moreGuests}
            className="flex h-11 w-11 items-center justify-center rounded-control text-menu-ink hover:bg-menu-surface disabled:opacity-35"
          >
            <Plus className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      {/* Month */}
      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonth((m) => shiftMonth(m, -1))}
          disabled={month <= monthOf(today)}
          aria-label={t.prevMonth}
          className="flex h-11 w-11 items-center justify-center rounded-control hover:bg-menu-raised disabled:opacity-30"
        >
          <ChevronLeft className="h-5 w-5 rtl:-scale-x-100" aria-hidden />
        </button>
        <p className="font-semibold" aria-live="polite">
          {monthLabel}
        </p>
        <button
          type="button"
          onClick={() => setMonth((m) => shiftMonth(m, 1))}
          disabled={month >= lastMonth}
          aria-label={t.nextMonth}
          className="flex h-11 w-11 items-center justify-center rounded-control hover:bg-menu-raised disabled:opacity-30"
        >
          <ChevronRight className="h-5 w-5 rtl:-scale-x-100" aria-hidden />
        </button>
      </div>

      <div className="mt-2 grid grid-cols-7 text-center text-xs font-semibold text-menu-muted" aria-hidden>
        {weekdays.map((day, i) => (
          <span key={i} className="py-1">
            {day}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {days.map((date, i) => {
          if (!date) return <span key={`blank-${i}`} />;
          const pickingOut = Boolean(checkIn && !checkOut);
          const allowed = pickingOut ? canCheckOut(date) || canCheckIn(date) : canCheckIn(date);
          const isStart = date === checkIn;
          const isEnd = date === checkOut;
          const inside = checkIn && checkOut && date > checkIn && date < checkOut;
          const full = date >= today && !nightOpen(date);
          const label = `${stayDate(date, lang, "long")}${full ? ` · ${t.nightFull}` : ""}`;
          return (
            <button
              key={date}
              type="button"
              onClick={() => choose(date)}
              disabled={!allowed && !isStart}
              aria-pressed={isStart || isEnd}
              aria-label={label}
              className={cn(
                "relative flex h-11 items-center justify-center text-sm font-semibold tabular-nums transition-colors",
                inside && "bg-brand-soft",
                (isStart || isEnd) && "rounded-control bg-brand text-brand-fg",
                !isStart && !isEnd && allowed && "rounded-control hover:bg-menu-raised",
                !allowed && !isStart && !isEnd && "text-menu-muted opacity-40",
                full && !isEnd && "line-through"
              )}
            >
              {Number(date.slice(8))}
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-sm text-menu-muted">
        {[rules.min_nights > 1 ? t.minNightsHint(t.nightsCount(rules.min_nights)) : "", t.checkInFrom(rules.check_in), t.checkOutBy(rules.check_out)]
          .filter(Boolean)
          .join(" · ")}
      </p>
    </Sheet>
  );
}
