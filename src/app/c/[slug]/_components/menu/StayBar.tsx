"use client";

import { CalendarDays, ChevronRight } from "lucide-react";
import { useCatalog } from "../../_providers/CatalogProvider";
import { nightsBetween } from "@/lib/orders/stays";
import { stayDate } from "../../_lib/whatsapp";

/** Stays: the chosen dates and guests above the rooms, or a prompt to choose them */
export function StayBar() {
  const { t, lang, stay, stayRules, openDates } = useCatalog();

  return (
    <div className="mx-auto max-w-xl px-4 pt-4">
      <button
        type="button"
        onClick={() => openDates()}
        className="flex w-full items-center gap-3 rounded-panel border border-menu-line bg-menu-surface p-4 text-start shadow-menu-sm transition-colors hover:border-brand-ink"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-ink">
          <CalendarDays className="h-5 w-5" aria-hidden />
        </span>
        {stay ? (
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">
              {stayDate(stay.checkIn, lang)} {lang === "ar" ? "←" : "→"} {stayDate(stay.checkOut, lang)}
            </span>
            <span className="block text-sm text-menu-muted">
              {t.nightsCount(nightsBetween(stay.checkIn, stay.checkOut))} · {t.guestsCount(stay.guests)}
            </span>
          </span>
        ) : (
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">{t.chooseDates}</span>
            <span className="block text-sm text-menu-muted">{t.pickDatesFirst}</span>
          </span>
        )}
        {stay ? (
          <span className="shrink-0 text-sm font-semibold text-brand-ink underline underline-offset-4">{t.changeDates}</span>
        ) : (
          <ChevronRight className="h-5 w-5 shrink-0 text-menu-muted rtl:-scale-x-100" aria-hidden />
        )}
      </button>
      <p className="mt-2 px-1 text-xs text-menu-muted">
        {t.checkInFrom(stayRules.check_in)} · {t.checkOutBy(stayRules.check_out)}
      </p>
    </div>
  );
}
