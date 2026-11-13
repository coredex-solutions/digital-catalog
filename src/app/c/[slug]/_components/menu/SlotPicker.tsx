"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useCatalog } from "../../_providers/CatalogProvider";
import { beirutNow, openingFor, type BookingConfig, type SlotsResult } from "@/lib/orders/slots";
import { cn } from "@/utils/helpers";
import { inputClass } from "./form-parts";

/** Days shown as chips; customers can book up to the owner's limit, the first few weeks are listed */
const MAX_DAY_CHIPS = 21;

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Set booking times: a row of days, then the free times on the chosen day (from the slots API,
 * so times already booked don't show). `minutes` is the appointment's length (ignored for tables).
 */
export function SlotPicker({
  config,
  date,
  time,
  minutes,
  onChange,
  error,
  refreshKey = 0,
}: {
  config: BookingConfig;
  date: string;
  time: string;
  minutes?: number;
  onChange: (next: { date: string; time: string }) => void;
  error?: string;
  /** Bump to load the times again (e.g. after a time was just taken) */
  refreshKey?: number;
}) {
  const { catalog, operatingHours, lang, t } = useCatalog();
  const [result, setResult] = useState<SlotsResult | { state: "loading" } | { state: "failed" }>({ state: "loading" });

  // The days customers can pick: closed and blocked days are shown but can't be chosen
  const days = useMemo(() => {
    const today = beirutNow().date;
    const count = Math.min(config.max_days + 1, MAX_DAY_CHIPS);
    const locale = lang === "ar" ? "ar-LB-u-nu-latn" : "en-GB";
    return Array.from({ length: count }, (_, i) => {
      const value = addDays(today, i);
      const d = new Date(`${value}T12:00:00Z`);
      const closed = config.blocked_dates.includes(value) || openingFor(operatingHours, value) === null;
      const top = i === 0 ? t.slotsToday : i === 1 ? t.slotsTomorrow : new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(d);
      const bottom = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" }).format(d);
      return { value, top, bottom, closed };
    });
  }, [config, operatingHours, lang, t]);

  // Start on the first open day
  const chosen = date || days.find((d) => !d.closed)?.value || "";
  useEffect(() => {
    if (!date && chosen) onChange({ date: chosen, time: "" });
  }, [date, chosen, onChange]);

  useEffect(() => {
    if (!chosen) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- shows the spinner while the day's times load
    setResult({ state: "loading" });
    const params = new URLSearchParams({ date: chosen, minutes: String(Math.round(minutes || config.default_minutes)) });
    fetch(`/api/c/${catalog.slug}/slots/?${params}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: SlotsResult | { state: "off" }) => {
        if (cancelled) return;
        setResult(data.state === "off" ? { state: "free" } : data);
      })
      .catch(() => !cancelled && setResult({ state: "failed" }));
    return () => {
      cancelled = true;
    };
  }, [catalog.slug, chosen, minutes, config.default_minutes, refreshKey]);

  // A time that is no longer free is cleared
  useEffect(() => {
    if (time && result.state === "open" && !result.times.includes(time)) onChange({ date: chosen, time: "" });
  }, [result, time, chosen, onChange]);

  return (
    // min-w-0: a fieldset otherwise grows to fit the whole row of days instead of letting it scroll
    <fieldset className="min-w-0">
      <legend className="text-sm font-semibold">{t.pickDay}</legend>
      <div className="mt-1.5 flex gap-2 overflow-x-auto pb-1" role="radiogroup" aria-label={t.pickDay}>
        {days.map((day) => (
          <button
            key={day.value}
            type="button"
            role="radio"
            aria-checked={chosen === day.value}
            disabled={day.closed}
            onClick={() => onChange({ date: day.value, time: "" })}
            className={cn(
              "flex min-h-14 min-w-[4.25rem] shrink-0 flex-col items-center justify-center rounded-control border px-2 text-sm",
              chosen === day.value ? "border-brand-ink bg-brand-soft font-semibold" : "border-menu-input-border bg-menu-surface",
              day.closed && "opacity-45 line-through"
            )}
          >
            <span>{day.top}</span>
            <span className="text-xs text-menu-muted">{day.closed ? t.slotsClosed : day.bottom}</span>
          </button>
        ))}
      </div>

      <p className="mt-4 text-sm font-semibold">{t.pickTime}</p>
      <div className="mt-1.5" aria-live="polite">
        {result.state === "loading" ? (
          <p className="flex items-center gap-2 py-3 text-sm text-menu-muted">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            {t.slotsLoading}
          </p>
        ) : result.state === "free" ? (
          // No opening hours set: any time, as without set times
          <input
            type="time"
            step={900}
            value={time}
            aria-label={t.preferredTime}
            aria-invalid={!!error}
            onChange={(event) => onChange({ date: chosen, time: event.target.value })}
            className={inputClass}
          />
        ) : result.state === "open" && result.times.length > 0 ? (
          <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label={t.pickTime}>
            {result.times.map((slot) => (
              <button
                key={slot}
                type="button"
                role="radio"
                aria-checked={time === slot}
                onClick={() => onChange({ date: chosen, time: slot })}
                dir="ltr"
                className={cn(
                  "min-h-11 rounded-control border text-sm tabular-nums",
                  time === slot ? "border-brand bg-brand font-semibold text-brand-fg" : "border-menu-input-border bg-menu-surface"
                )}
              >
                {slot}
              </button>
            ))}
          </div>
        ) : (
          <p className="rounded-control bg-menu-subtle px-4 py-3 text-sm text-menu-muted">
            {result.state === "failed" ? t.slotsFailed : t.slotsNone}
          </p>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-menu-danger">{error}</p>}
    </fieldset>
  );
}
