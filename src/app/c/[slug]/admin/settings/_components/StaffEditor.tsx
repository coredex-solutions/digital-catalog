"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { useCatalogAdmin } from "../../_components/CatalogAdminShell";
import { useAdminLang, useCopy, useFormat } from "../../_lib/i18n";
import { MAX_STAFF, MAX_STAFF_DATES_OFF, newStaffId, type StaffMember } from "@/lib/orders/staff";

const en = {
  title: "Staff",
  body: "Add the people who take appointments. Customers can choose a person or “Anyone”, and each person takes one appointment at a time, so nobody is booked twice.",
  empty: "No staff added. Bookings follow “Bookings at the same time” above.",
  add: "Add a person",
  nameEn: "Name in English",
  nameAr: "Name in Arabic",
  active: "Takes bookings",
  activeHint: "Off: kept here, but customers can't choose them.",
  services: "Services",
  allServices: "All services",
  someServices: "Only some services",
  noServices: "Add your services first, under Services.",
  daysOff: "Weekly days off",
  hours: "Working hours",
  sameHours: "Same as the opening hours",
  from: "From",
  to: "To",
  datesOff: "Holidays and days off",
  addDate: "Add",
  removeDate: (d: string) => `Remove ${d}`,
  remove: (name: string) => `Remove ${name || "this person"}`,
  person: (n: number) => `Person ${n}`,
  limit: `Up to ${MAX_STAFF} people.`,
};
const ar: typeof en = {
  title: "الفريق",
  body: "أضف الأشخاص الذين يستقبلون المواعيد. يختار الزبون شخصاً معيّناً أو «أيّ شخص متاح»، ويأخذ كل شخص موعداً واحداً في الوقت نفسه، فلا يُحجز أحد مرتين.",
  empty: "لم تُضف أحداً بعد. تتبع الحجوزات «عدد الحجوزات في الوقت نفسه» أعلاه.",
  add: "إضافة شخص",
  nameEn: "الاسم بالإنكليزية",
  nameAr: "الاسم بالعربية",
  active: "يستقبل حجوزات",
  activeHint: "عند الإيقاف: يبقى هنا، لكن لا يستطيع الزبائن اختياره.",
  services: "الخدمات",
  allServices: "كل الخدمات",
  someServices: "بعض الخدمات فقط",
  noServices: "أضف خدماتك أولاً من قسم الخدمات.",
  daysOff: "أيام العطلة الأسبوعية",
  hours: "ساعات العمل",
  sameHours: "مثل ساعات العمل",
  from: "من",
  to: "إلى",
  datesOff: "العطل وأيام الإجازة",
  addDate: "إضافة",
  removeDate: (d) => `إزالة ${d}`,
  remove: (name) => `إزالة ${name || "هذا الشخص"}`,
  person: (n) => `الشخص ${n}`,
  limit: `حتى ${MAX_STAFF} شخصاً.`,
};

const input =
  "w-full min-h-11 px-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink focus:outline-none focus:border-ui-primary transition-all";

interface Service {
  id: string;
  name_en: string;
  name_ar: string;
}

/** Sunday first, as the dates are stored (0 = Sunday); shown Monday first */
const WEEK = [1, 2, 3, 4, 5, 6, 0];

export function StaffEditor({ value, onChange }: { value: StaffMember[]; onChange: (next: StaffMember[]) => void }) {
  const t = useCopy({ en, ar });
  const lang = useAdminLang();
  const f = useFormat();
  const { slug, fetchWithAuth } = useCatalogAdmin();
  const [services, setServices] = useState<Service[] | null>(null);
  const [newDate, setNewDate] = useState<Record<string, string>>({});

  // The services to choose from (the draft list, so new ones show before publishing)
  useEffect(() => {
    let cancelled = false;
    fetchWithAuth(`/api/c/${slug}/admin/items/`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { items?: Record<string, unknown>[] }) => {
        if (cancelled) return;
        setServices((data.items ?? []).map((row) => ({ id: String(row.id), name_en: String(row.name_en ?? ""), name_ar: String(row.name_ar ?? "") })));
      })
      .catch(() => !cancelled && setServices([]));
    return () => {
      cancelled = true;
    };
  }, [fetchWithAuth, slug]);

  const update = (id: string, patch: Partial<StaffMember>) => onChange(value.map((person) => (person.id === id ? { ...person, ...patch } : person)));
  const serviceName = (service: Service) => (lang === "ar" ? service.name_ar || service.name_en : service.name_en || service.name_ar) || "—";
  const dayName = (day: number) => f.date(`2026-11-${String(15 + day).padStart(2, "0")}T12:00:00Z`, { weekday: "short", timeZone: "UTC" });
  const dateLabel = (date: string) => f.date(`${date}T12:00:00Z`, { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

  const add = () =>
    onChange([
      ...value,
      { id: newStaffId(), name_en: "", name_ar: "", service_ids: [], days_off: [], from: null, to: null, dates_off: [], active: true },
    ]);

  return (
    <div className="space-y-4" aria-labelledby="staff-title">
      <div>
        <p id="staff-title" className="text-sm font-semibold text-ui-ink">{t.title}</p>
        <p className="mt-1 text-xs text-ui-muted">{t.body}</p>
      </div>

      {value.length === 0 && <p className="rounded-panel border border-dashed border-ui-line px-4 py-3 text-sm text-ui-muted">{t.empty}</p>}

      <ul className="space-y-3">
        {value.map((person, index) => {
          const shown = (lang === "ar" ? person.name_ar || person.name_en : person.name_en || person.name_ar) || t.person(index + 1);
          const some = person.service_ids.length > 0;
          const ownHours = person.from !== null;
          return (
            <li key={person.id} className="space-y-4 rounded-panel border border-ui-line bg-ui-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="pt-2 font-semibold text-ui-heading">{shown}</p>
                <button
                  type="button"
                  onClick={() => onChange(value.filter((p) => p.id !== person.id))}
                  aria-label={t.remove(shown)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-ui-muted hover:bg-ui-subtle hover:text-ui-danger"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor={`${person.id}-en`} className="block text-sm font-semibold">{t.nameEn}</label>
                  <input id={`${person.id}-en`} dir="ltr" maxLength={40} value={person.name_en} onChange={(e) => update(person.id, { name_en: e.target.value })} className={input} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor={`${person.id}-ar`} className="block text-sm font-semibold">{t.nameAr}</label>
                  <input id={`${person.id}-ar`} dir="rtl" maxLength={40} value={person.name_ar} onChange={(e) => update(person.id, { name_ar: e.target.value })} className={input} />
                </div>
              </div>

              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={person.active} onChange={(e) => update(person.id, { active: e.target.checked })} className="mt-1 h-5 w-5 shrink-0 accent-[var(--ui-primary)]" />
                <span>
                  <span className="block text-sm font-semibold">{t.active}</span>
                  <span className="block text-xs text-ui-muted">{t.activeHint}</span>
                </span>
              </label>

              <fieldset className="space-y-2">
                <legend className="text-sm font-semibold">{t.services}</legend>
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                  <label className="flex min-h-11 cursor-pointer items-center gap-2">
                    <input type="radio" name={`${person.id}-services`} checked={!some} onChange={() => update(person.id, { service_ids: [] })} className="h-4 w-4 accent-[var(--ui-primary)]" />
                    {t.allServices}
                  </label>
                  <label className="flex min-h-11 cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name={`${person.id}-services`}
                      checked={some}
                      disabled={!services || services.length === 0}
                      onChange={() => services?.[0] && update(person.id, { service_ids: [services[0].id] })}
                      className="h-4 w-4 accent-[var(--ui-primary)]"
                    />
                    {t.someServices}
                  </label>
                </div>
                {services && services.length === 0 && <p className="text-xs text-ui-muted">{t.noServices}</p>}
                {some && services && (
                  <div className="grid gap-1 sm:grid-cols-2">
                    {services.map((service) => (
                      <label key={service.id} className="flex min-h-10 cursor-pointer items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={person.service_ids.includes(service.id)}
                          onChange={(e) => {
                            const next = e.target.checked ? [...person.service_ids, service.id] : person.service_ids.filter((id) => id !== service.id);
                            // Unticking the last one means "all services" again
                            update(person.id, { service_ids: next });
                          }}
                          className="h-4 w-4 shrink-0 accent-[var(--ui-primary)]"
                        />
                        <span className="min-w-0 truncate">{serviceName(service)}</span>
                      </label>
                    ))}
                  </div>
                )}
              </fieldset>

              <fieldset>
                <legend className="text-sm font-semibold">{t.daysOff}</legend>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {WEEK.map((day) => {
                    const off = person.days_off.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        aria-pressed={off}
                        onClick={() => update(person.id, { days_off: off ? person.days_off.filter((d) => d !== day) : [...person.days_off, day].sort() })}
                        className={
                          off
                            ? "min-h-10 min-w-14 rounded-control border border-ui-primary bg-ui-subtle px-3 text-sm font-semibold text-ui-primary"
                            : "min-h-10 min-w-14 rounded-control border border-ui-line px-3 text-sm hover:bg-ui-subtle"
                        }
                      >
                        {dayName(day)}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset className="space-y-2">
                <legend className="text-sm font-semibold">{t.hours}</legend>
                <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!ownHours}
                    onChange={(e) => update(person.id, e.target.checked ? { from: null, to: null } : { from: "09:00", to: "17:00" })}
                    className="h-4 w-4 accent-[var(--ui-primary)]"
                  />
                  {t.sameHours}
                </label>
                {ownHours && (
                  <div className="grid max-w-sm grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label htmlFor={`${person.id}-from`} className="block text-xs font-semibold text-ui-muted">{t.from}</label>
                      <input id={`${person.id}-from`} type="time" step={900} dir="ltr" value={person.from ?? ""} onChange={(e) => update(person.id, { from: e.target.value || null })} className={input} />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor={`${person.id}-to`} className="block text-xs font-semibold text-ui-muted">{t.to}</label>
                      <input id={`${person.id}-to`} type="time" step={900} dir="ltr" value={person.to ?? ""} onChange={(e) => update(person.id, { to: e.target.value || null })} className={input} />
                    </div>
                  </div>
                )}
              </fieldset>

              <div className="space-y-2">
                <p className="text-sm font-semibold">{t.datesOff}</p>
                {person.dates_off.length > 0 && (
                  <ul className="flex flex-wrap gap-2">
                    {person.dates_off.map((date) => (
                      <li key={date} className="inline-flex items-center gap-1 rounded-full border border-ui-line bg-ui-bg ps-3 text-sm">
                        {dateLabel(date)}
                        <button
                          type="button"
                          onClick={() => update(person.id, { dates_off: person.dates_off.filter((d) => d !== date) })}
                          aria-label={t.removeDate(dateLabel(date))}
                          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-ui-subtle"
                        >
                          <X className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {person.dates_off.length < MAX_STAFF_DATES_OFF && (
                  <div className="flex max-w-xs gap-2">
                    <input
                      type="date"
                      value={newDate[person.id] ?? ""}
                      onChange={(e) => setNewDate((prev) => ({ ...prev, [person.id]: e.target.value }))}
                      aria-label={`${t.datesOff} · ${shown}`}
                      lang={lang}
                      className={input}
                    />
                    <button
                      type="button"
                      disabled={!newDate[person.id]}
                      onClick={() => {
                        update(person.id, { dates_off: [...new Set([...person.dates_off, newDate[person.id]])].sort() });
                        setNewDate((prev) => ({ ...prev, [person.id]: "" }));
                      }}
                      className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-control border border-ui-line px-3 text-sm font-semibold hover:bg-ui-subtle disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4" aria-hidden />
                      {t.addDate}
                    </button>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {value.length < MAX_STAFF ? (
        <button type="button" onClick={add} className="inline-flex min-h-11 items-center gap-2 rounded-control border border-ui-line px-4 text-sm font-semibold hover:bg-ui-subtle">
          <Plus className="h-4 w-4" aria-hidden />
          {t.add}
        </button>
      ) : (
        <p className="text-xs text-ui-muted">{t.limit}</p>
      )}
    </div>
  );
}
