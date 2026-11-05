"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useAdminLang, useCopy, useFormat } from "../../_lib/i18n";
import { MAX_BLOCKED_DATES, MAX_CAPACITY, SLOT_STEPS, type BookingConfig } from "@/lib/orders/slots";

/** As edited: numbers may be text while typing; the server cleans them (lib/orders/slots.ts) */
export type BookingTimesDraft = Omit<BookingConfig, "capacity" | "deposit"> & { capacity: number | string; deposit: number | string | null };

const en = {
  title: "Booking times",
  body: "Offer set times based on your opening hours. Times that are full don't show, so two customers can't book the same one.",
  bodyServices: "Offer set appointment times based on your opening hours and each service's length. Times that are full don't show, so two customers can't book the same one.",
  enable: "Offer set times",
  enableHint: "Off: customers suggest any date and time, and you confirm it.",
  step: "A booking can start every",
  minutes: (n: number) => `${n} minutes`,
  capacity: "Bookings at the same time",
  capacityHint: "For example the number of tables, chairs or staff.",
  lead: "Earliest booking",
  leadOptions: { 0: "Any time", 30: "30 minutes ahead", 60: "1 hour ahead", 120: "2 hours ahead", 240: "4 hours ahead", 1440: "1 day ahead" } as Record<number, string>,
  ahead: "Customers can book up to",
  days: (n: number) => `${n} days ahead`,
  tableLength: "A table booking lasts",
  serviceLength: "Length of a service with none set",
  closedDays: "Days with no bookings",
  closedDaysHint: "Holidays and days off. Your weekly closed days from Opening hours already count.",
  addDay: "Add",
  removeDay: (d: string) => `Remove ${d}`,
  deposit: "Deposit to confirm a booking",
  depositHint: "Optional. Customers see how to send it by Whish or OMT (set up under Payment); you mark it paid on the Orders page.",
  none: "None",
};
const ar: typeof en = {
  title: "أوقات الحجز",
  body: "اعرض أوقاتاً محددة حسب ساعات العمل. الأوقات المحجوزة بالكامل لا تظهر، فلا يحجز زبونان الوقت نفسه.",
  bodyServices: "اعرض مواعيد محددة حسب ساعات العمل ومدة كل خدمة. الأوقات المحجوزة بالكامل لا تظهر، فلا يحجز زبونان الوقت نفسه.",
  enable: "عرض أوقات محددة",
  enableHint: "عند الإيقاف: يقترح الزبائن أي تاريخ ووقت، وتؤكده أنت.",
  step: "يبدأ الحجز كل",
  minutes: (n) => `${n} دقيقة`,
  capacity: "عدد الحجوزات في الوقت نفسه",
  capacityHint: "مثلاً عدد الطاولات أو الكراسي أو الموظفين.",
  lead: "أقرب موعد للحجز",
  leadOptions: { 0: "في أي وقت", 30: "قبل 30 دقيقة", 60: "قبل ساعة", 120: "قبل ساعتين", 240: "قبل 4 ساعات", 1440: "قبل يوم" },
  ahead: "يمكن الحجز حتى",
  days: (n) => `${n} يوماً مسبقاً`,
  tableLength: "مدة حجز الطاولة",
  serviceLength: "مدة الخدمة إن لم تُحدَّد",
  closedDays: "أيام بلا حجوزات",
  closedDaysHint: "العطل وأيام الإجازة. أيام الإغلاق الأسبوعية في ساعات العمل محتسبة أصلاً.",
  addDay: "إضافة",
  removeDay: (d) => `إزالة ${d}`,
  deposit: "عربون لتثبيت الحجز",
  depositHint: "اختياري. يرى الزبائن كيف يرسلونه عبر Whish أو OMT (من إعدادات الدفع)، وتُعلِّمه كمدفوع في صفحة الطلبات.",
  none: "بلا",
};

const input =
  "w-full min-h-11 px-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink focus:outline-none focus:border-ui-primary transition-all";

export function BookingTimesEditor({
  value,
  onChange,
  forServices,
}: {
  value: BookingTimesDraft;
  onChange: (next: BookingTimesDraft) => void;
  forServices: boolean;
}) {
  const t = useCopy({ en, ar });
  const lang = useAdminLang();
  const f = useFormat();
  const [newDay, setNewDay] = useState("");
  const set = <K extends keyof BookingTimesDraft>(key: K, v: BookingTimesDraft[K]) => onChange({ ...value, [key]: v });
  const select = (id: string, label: string, current: number, options: [number, string][], key: keyof BookingTimesDraft) => (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-ui-ink">{label}</label>
      <select id={id} value={current} onChange={(e) => set(key, Number(e.target.value) as never)} className={input}>
        {options.map(([v, text]) => (
          <option key={v} value={v}>{text}</option>
        ))}
      </select>
    </div>
  );
  // Keep a saved value that isn't in the usual list
  const withCurrent = (list: number[], current: number) => [...new Set([...list, current])].sort((a, b) => a - b);

  return (
    <section className="space-y-5 border-t border-ui-line pt-8" aria-labelledby="booking-times-title">
      <div>
        <h4 id="booking-times-title" className="text-base font-bold text-ui-heading">{t.title}</h4>
        <p className="mt-1 text-sm text-ui-muted">{forServices ? t.bodyServices : t.body}</p>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-panel border border-ui-line bg-ui-surface p-4">
        <input type="checkbox" checked={value.enabled} onChange={(e) => set("enabled", e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-[var(--ui-primary)]" />
        <span>
          <span className="block font-semibold text-ui-ink">{t.enable}</span>
          <span className="block text-sm text-ui-muted">{t.enableHint}</span>
        </span>
      </label>

      {value.enabled && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {select("booking-step", t.step, value.slot_minutes, SLOT_STEPS.map((n) => [n, t.minutes(n)]), "slot_minutes")}
            <div className="space-y-1.5">
              <label htmlFor="booking-capacity" className="block text-sm font-semibold text-ui-ink">{t.capacity}</label>
              <input
                id="booking-capacity"
                type="number"
                inputMode="numeric"
                dir="ltr"
                min={1}
                max={MAX_CAPACITY}
                value={value.capacity}
                onChange={(e) => set("capacity", e.target.value)}
                aria-describedby="booking-capacity-hint"
                className={input}
              />
              <p id="booking-capacity-hint" className="text-xs text-ui-muted">{t.capacityHint}</p>
            </div>
            {select("booking-lead", t.lead, value.lead_minutes, withCurrent([0, 30, 60, 120, 240, 1440], value.lead_minutes).map((n) => [n, t.leadOptions[n] ?? t.minutes(n)]), "lead_minutes")}
            {select("booking-ahead", t.ahead, value.max_days, withCurrent([7, 14, 30, 60, 90], value.max_days).map((n) => [n, t.days(n)]), "max_days")}
            {forServices
              ? select("booking-service", t.serviceLength, value.default_minutes, withCurrent([15, 30, 45, 60, 90, 120], value.default_minutes).map((n) => [n, t.minutes(n)]), "default_minutes")
              : select("booking-table", t.tableLength, value.table_minutes, withCurrent([60, 90, 120, 150, 180], value.table_minutes).map((n) => [n, t.minutes(n)]), "table_minutes")}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-ui-ink">{t.closedDays}</p>
            <p className="text-xs text-ui-muted">{t.closedDaysHint}</p>
            {value.blocked_dates.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {value.blocked_dates.map((day) => {
                  const label = f.date(`${day}T12:00:00Z`, { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
                  return (
                    <li key={day} className="inline-flex items-center gap-1 rounded-full border border-ui-line bg-ui-surface ps-3 text-sm">
                      {label}
                      <button
                        type="button"
                        onClick={() => set("blocked_dates", value.blocked_dates.filter((d) => d !== day))}
                        aria-label={t.removeDay(label)}
                        className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-ui-subtle"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {value.blocked_dates.length < MAX_BLOCKED_DATES && (
              <div className="flex max-w-xs gap-2">
                <input type="date" value={newDay} onChange={(e) => setNewDay(e.target.value)} aria-label={t.closedDays} lang={lang} className={input} />
                <button
                  type="button"
                  disabled={!newDay}
                  onClick={() => {
                    set("blocked_dates", [...new Set([...value.blocked_dates, newDay])].sort());
                    setNewDay("");
                  }}
                  className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-control border border-ui-line px-3 text-sm font-semibold hover:bg-ui-subtle disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  {t.addDay}
                </button>
              </div>
            )}
          </div>

          <div className="grid max-w-md grid-cols-[1fr_auto] items-end gap-3">
            <div className="space-y-1.5">
              <label htmlFor="booking-deposit" className="block text-sm font-semibold text-ui-ink">{t.deposit}</label>
              <input
                id="booking-deposit"
                type="number"
                inputMode="decimal"
                dir="ltr"
                min={0}
                step="any"
                value={value.deposit ?? ""}
                placeholder={t.none}
                onChange={(e) => set("deposit", e.target.value)}
                aria-describedby="booking-deposit-hint"
                className={input}
              />
            </div>
            <select
              value={value.deposit_currency}
              onChange={(e) => set("deposit_currency", e.target.value === "LBP" ? "LBP" : "USD")}
              aria-label={t.deposit}
              className={input}
            >
              <option value="USD">$</option>
              <option value="LBP">L.L.</option>
            </select>
            <p id="booking-deposit-hint" className="col-span-2 text-xs text-ui-muted">{t.depositHint}</p>
          </div>
        </>
      )}
    </section>
  );
}
