"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useAdminLang, useCopy, useFormat } from "../../_lib/i18n";
import { MAX_BLOCKED_NIGHTS, type StayConfig } from "@/lib/orders/stays";

/** As edited; the server cleans it (lib/orders/stays.ts) */
export type StayRulesDraft = StayConfig;

const en = {
  title: "Stay rules",
  body: "Guests pick check-in and check-out dates and see which rooms are free. A room that's booked for a night can't be booked again for it.",
  checkIn: "Check-in from",
  checkOut: "Check-out by",
  minNights: "Shortest stay",
  maxNights: "Longest stay",
  nights: (n: number) => (n === 1 ? "1 night" : `${n} nights`),
  ahead: "Guests can book up to",
  days: (n: number) => (n % 30 === 0 && n >= 60 ? `${n / 30} months ahead` : `${n} days ahead`),
  closedNights: "Nights with no bookings",
  closedNightsHint: "Nights you're closed or fully booked elsewhere. A stay can't include one.",
  add: "Add",
  remove: (d: string) => `Remove ${d}`,
  deposit: "Deposit to confirm a booking",
  depositHint: "A part of the total. Guests see how to send it by Whish or OMT (set up under Payment); you mark it paid on the Bookings page.",
  depositNone: "No deposit",
  percent: (n: number) => `${n}% of the total`,
};
const ar: typeof en = {
  title: "قواعد الإقامة",
  body: "يختار الضيوف تاريخ الوصول والمغادرة ويرون الغرف المتاحة. الغرفة المحجوزة لليلة لا يمكن حجزها مرة أخرى لتلك الليلة.",
  checkIn: "الوصول من الساعة",
  checkOut: "المغادرة حتى الساعة",
  minNights: "أقصر إقامة",
  maxNights: "أطول إقامة",
  nights: (n) => (n === 1 ? "ليلة واحدة" : n === 2 ? "ليلتان" : n <= 10 ? `${n} ليالٍ` : `${n} ليلة`),
  ahead: "يمكن الحجز حتى",
  days: (n) => (n % 30 === 0 && n >= 60 ? `${n / 30} أشهر مسبقاً` : `${n} يوماً مسبقاً`),
  closedNights: "ليالٍ بلا حجوزات",
  closedNightsHint: "الليالي التي تكون فيها مغلقاً أو محجوزاً من مكان آخر. لا يمكن أن تشملها أي إقامة.",
  add: "إضافة",
  remove: (d) => `إزالة ${d}`,
  deposit: "عربون لتثبيت الحجز",
  depositHint: "جزء من المجموع. يرى الضيوف كيف يرسلونه عبر Whish أو OMT (من إعدادات الدفع)، وتُعلِّمه كمدفوع في صفحة الحجوزات.",
  depositNone: "بلا عربون",
  percent: (n) => `${n}% من المجموع`,
};

const input =
  "w-full min-h-11 px-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink focus:outline-none focus:border-ui-primary transition-all";

export function StayRulesEditor({ value, onChange }: { value: StayRulesDraft; onChange: (next: StayRulesDraft) => void }) {
  const t = useCopy({ en, ar });
  const lang = useAdminLang();
  const f = useFormat();
  const [newNight, setNewNight] = useState("");
  const set = <K extends keyof StayRulesDraft>(key: K, v: StayRulesDraft[K]) => onChange({ ...value, [key]: v });
  // Keep a saved value that isn't in the usual list
  const withCurrent = (list: number[], current: number) => [...new Set([...list, current])].sort((a, b) => a - b);
  const select = (id: string, label: string, current: number, options: [number, string][], key: keyof StayRulesDraft) => (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-ui-ink">{label}</label>
      <select id={id} value={current} onChange={(e) => set(key, Number(e.target.value) as never)} className={input}>
        {options.map(([v, text]) => (
          <option key={v} value={v}>{text}</option>
        ))}
      </select>
    </div>
  );
  const time = (id: string, label: string, key: "check_in" | "check_out") => (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-ui-ink">{label}</label>
      <input id={id} type="time" dir="ltr" step={1800} value={value[key]} onChange={(e) => e.target.value && set(key, e.target.value)} className={input} />
    </div>
  );

  return (
    <section className="space-y-5 border-t border-ui-line pt-8" aria-labelledby="stay-rules-title">
      <div>
        <h4 id="stay-rules-title" className="text-base font-bold text-ui-heading">{t.title}</h4>
        <p className="mt-1 text-sm text-ui-muted">{t.body}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {time("stay-check-in", t.checkIn, "check_in")}
        {time("stay-check-out", t.checkOut, "check_out")}
        {select("stay-min", t.minNights, value.min_nights, withCurrent([1, 2, 3, 5, 7], value.min_nights).map((n) => [n, t.nights(n)]), "min_nights")}
        {select("stay-max", t.maxNights, value.max_nights, withCurrent([7, 14, 30, 60, 90], value.max_nights).filter((n) => n >= value.min_nights).map((n) => [n, t.nights(n)]), "max_nights")}
        {select("stay-ahead", t.ahead, value.max_days, withCurrent([30, 90, 180, 365, 540], value.max_days).map((n) => [n, t.days(n)]), "max_days")}
        {select("stay-deposit", t.deposit, value.deposit_percent, withCurrent([0, 10, 20, 25, 30, 50, 100], value.deposit_percent).map((n) => [n, n === 0 ? t.depositNone : t.percent(n)]), "deposit_percent")}
      </div>
      <p className="-mt-2 text-xs text-ui-muted">{t.depositHint}</p>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-ui-ink">{t.closedNights}</p>
        <p className="text-xs text-ui-muted">{t.closedNightsHint}</p>
        {value.blocked_dates.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {value.blocked_dates.map((night) => {
              const label = f.date(`${night}T12:00:00Z`, { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
              return (
                <li key={night} className="inline-flex items-center gap-1 rounded-full border border-ui-line bg-ui-surface ps-3 text-sm">
                  {label}
                  <button
                    type="button"
                    onClick={() => set("blocked_dates", value.blocked_dates.filter((d) => d !== night))}
                    aria-label={t.remove(label)}
                    className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-ui-subtle"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {value.blocked_dates.length < MAX_BLOCKED_NIGHTS && (
          <div className="flex max-w-xs gap-2">
            <input type="date" value={newNight} onChange={(e) => setNewNight(e.target.value)} aria-label={t.closedNights} lang={lang} className={input} />
            <button
              type="button"
              disabled={!newNight}
              onClick={() => {
                set("blocked_dates", [...new Set([...value.blocked_dates, newNight])].sort());
                setNewNight("");
              }}
              className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-control border border-ui-line px-3 text-sm font-semibold hover:bg-ui-subtle disabled:opacity-50"
            >
              <Plus className="h-4 w-4" aria-hidden />
              {t.add}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
