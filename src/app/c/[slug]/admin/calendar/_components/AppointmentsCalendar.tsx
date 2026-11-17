"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, Check, ChevronLeft, ChevronRight, Loader2, MessageCircle, Phone, Plus, X } from "lucide-react";
import { clsx } from "clsx";
import { useCatalogAdmin } from "../../_components/CatalogAdminShell";
import { CatalogAdminContent, CatalogAdminHeader } from "../../_components/CatalogAdminSidebar";
import { adminNavLabels } from "../../_components/adminNav";
import { useAdminLang, useCopy, useFormat } from "../../_lib/i18n";
import { useModule } from "../../_lib/module";
import { buildReminder, whatsappLink } from "../../../_lib/whatsapp";
import { MAX_REPEATS, REPEAT_WEEKS } from "@/lib/orders/appointments";
import { addDays } from "@/lib/orders/stays";
import { doesServices, staffName, type StaffMember } from "@/lib/orders/staff";

interface Service {
  id: string;
  name_en: string;
  name_ar: string;
  duration_minutes: number | null;
}

interface Appointment {
  id: string;
  number: number;
  status: string;
  name: string;
  phone: string;
  date: string;
  time: string;
  minutes: number;
  staff_id: string | null;
  staff_name: string | null;
  services: { name_en: string; name_ar: string; quantity: number }[];
  note: string | null;
  lang: "ar" | "en";
  source: string;
  paid: boolean;
  reminded_at: string | null;
}

interface DayData {
  date: string;
  today: string;
  opening: [number, number] | null;
  hasHours: boolean;
  blocked: boolean;
  slotMinutes: number;
  defaultMinutes: number;
  staff: (StaffMember & { works: boolean })[];
  services: Service[];
  appointments: Appointment[];
}

/** Height of one hour in the day grid */
const HOUR_PX = 64;
const UNASSIGNED = "__none";

const en = {
  intro: "Each person's appointments for the day. Add bookings you took by phone, and send each customer a reminder on WhatsApp the day before.",
  add: "Add a booking",
  today: "Today",
  tomorrow: "Tomorrow",
  prev: "Previous day",
  next: "Next day",
  pickDay: "Go to a day",
  everyone: "Appointments",
  unassigned: "Not assigned",
  dayOff: "Day off",
  closed: "Closed this day",
  blocked: "No bookings this day (set under Settings → Booking times)",
  noneToday: "No appointments this day.",
  noHours: "Set your opening hours to see the day laid out by time.",
  legendNew: "New, not confirmed yet",
  legendConfirmed: "Confirmed",
  status: { new: "New", confirmed: "Confirmed", ready: "Confirmed", completed: "Done" } as Record<string, string>,
  minutes: (n: number) => `${n} min`,
  with: "With",
  addedByYou: "Added by you",
  paid: "Paid",
  call: "Call",
  whatsapp: "WhatsApp",
  remind: "Send a reminder",
  reminded: "Reminder sent",
  undoReminded: "Mark as not sent",
  openBookings: "Open on the Bookings page",
  close: "Close",
  remindersTitle: "Reminders",
  remindersBody: "Tap to open WhatsApp with the reminder ready, in the language the customer booked in. Send them the day before.",
  remindersCount: (sent: number, all: number) => `${sent} of ${all} sent`,
  remindersTomorrow: "Tomorrow's reminders",
  noPhone: "No phone number",
  // Form
  formTitle: "Add a booking",
  formHint: "Saved as confirmed. Nobody on your staff is booked twice at the same time.",
  services: "Services",
  person: "With",
  anyone: "Anyone free",
  offThatDay: "day off",
  date: "Day",
  time: "Time",
  name: "Customer name",
  phone: "Phone (optional)",
  note: "Note (optional)",
  repeat: "Repeat",
  noRepeat: "Doesn't repeat",
  everyWeeks: (n: number) => (n === 1 ? "Every week" : `Every ${n} weeks`),
  times: "How many times in all",
  save: "Save booking",
  saving: "Saving…",
  cancel: "Cancel",
  saved: (numbers: number[]) => (numbers.length === 1 ? `Booking #${numbers[0]} saved.` : `${numbers.length} bookings saved.`),
  skipped: (days: string) => `Not saved, already booked: ${days}.`,
  chooseService: "Choose at least one service.",
  failed: "Couldn't load the calendar. Check your connection.",
  saveFailed: "Couldn't save the booking.",
  loading: "Loading…",
};
const ar: typeof en = {
  intro: "مواعيد كل شخص في اليوم. أضف الحجوزات التي أخذتها بالهاتف، وأرسل لكل زبون تذكيراً على واتساب قبل يوم.",
  add: "إضافة حجز",
  today: "اليوم",
  tomorrow: "غداً",
  prev: "اليوم السابق",
  next: "اليوم التالي",
  pickDay: "الانتقال إلى يوم",
  everyone: "المواعيد",
  unassigned: "بلا تحديد",
  dayOff: "عطلة",
  closed: "مغلق في هذا اليوم",
  blocked: "لا حجوزات في هذا اليوم (من الإعدادات ← أوقات الحجز)",
  noneToday: "لا مواعيد في هذا اليوم.",
  noHours: "حدّد ساعات العمل لترى اليوم مرتّباً حسب الوقت.",
  legendNew: "جديد، لم يُؤكَّد بعد",
  legendConfirmed: "مؤكَّد",
  status: { new: "جديد", confirmed: "مؤكَّد", ready: "مؤكَّد", completed: "منتهٍ" },
  minutes: (n) => `${n} د`,
  with: "مع",
  addedByYou: "أضفته أنت",
  paid: "مدفوع",
  call: "اتصال",
  whatsapp: "واتساب",
  remind: "إرسال تذكير",
  reminded: "أُرسل التذكير",
  undoReminded: "التعليم كغير مُرسَل",
  openBookings: "افتحه في صفحة الحجوزات",
  close: "إغلاق",
  remindersTitle: "التذكيرات",
  remindersBody: "اضغط لفتح واتساب والتذكير جاهز، باللغة التي حجز بها الزبون. أرسلها قبل الموعد بيوم.",
  remindersCount: (sent, all) => `أُرسل ${sent} من ${all}`,
  remindersTomorrow: "تذكيرات الغد",
  noPhone: "لا رقم هاتف",
  formTitle: "إضافة حجز",
  formHint: "يُحفظ مؤكَّداً. لا يُحجز أحد من فريقك مرتين في الوقت نفسه.",
  services: "الخدمات",
  person: "مع",
  anyone: "أيّ شخص متاح",
  offThatDay: "عطلة",
  date: "اليوم",
  time: "الوقت",
  name: "اسم الزبون",
  phone: "الهاتف (اختياري)",
  note: "ملاحظة (اختيارية)",
  repeat: "التكرار",
  noRepeat: "بلا تكرار",
  everyWeeks: (n) => (n === 1 ? "كل أسبوع" : n === 2 ? "كل أسبوعين" : `كل ${n} أسابيع`),
  times: "كم مرة بالمجموع",
  save: "حفظ الحجز",
  saving: "جارٍ الحفظ…",
  cancel: "إلغاء",
  saved: (numbers) => (numbers.length === 1 ? `حُفظ الحجز رقم ${numbers[0]}.` : `حُفظ ${numbers.length} حجوزات.`),
  skipped: (days) => `لم يُحفظ، محجوز أصلاً: ${days}.`,
  chooseService: "اختر خدمة واحدة على الأقل.",
  failed: "تعذّر تحميل التقويم. تحقق من الاتصال.",
  saveFailed: "تعذّر حفظ الحجز.",
  loading: "جارٍ التحميل…",
};

const input =
  "w-full min-h-11 px-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink focus:outline-none focus:border-ui-primary transition-all";

const toTime = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
const toMinutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));

/** Side-by-side lanes for appointments that overlap in one column */
function lanes(list: Appointment[]): { appointment: Appointment; lane: number; of: number }[] {
  const sorted = [...list].sort((a, b) => toMinutes(a.time) - toMinutes(b.time));
  const ends: number[] = [];
  const placed = sorted.map((appointment) => {
    const start = toMinutes(appointment.time);
    let lane = ends.findIndex((end) => end <= start);
    if (lane === -1) lane = ends.length;
    ends[lane] = start + appointment.minutes;
    return { appointment, lane };
  });
  return placed.map((p) => ({ ...p, of: Math.max(1, ends.length) }));
}

interface FormState {
  open: boolean;
  itemIds: string[];
  staffId: string;
  date: string;
  time: string;
  name: string;
  phone: string;
  note: string;
  repeatWeeks: number;
  repeatCount: number;
  error: string | null;
  saving: boolean;
}

export function AppointmentsCalendar() {
  const t = useCopy({ en, ar });
  const lang = useAdminLang();
  const f = useFormat();
  const { module } = useModule();
  const { slug, fetchWithAuth, user, catalog } = useCatalogAdmin();
  const canEdit = user?.role !== "viewer";

  const [date, setDate] = useState<string | null>(null);
  const [data, setData] = useState<DayData | null>(null);
  const [failed, setFailed] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    open: false,
    itemIds: [],
    staffId: "any",
    date: "",
    time: "",
    name: "",
    phone: "",
    note: "",
    repeatWeeks: 0,
    repeatCount: 4,
    error: null,
    saving: false,
  });

  const load = useCallback(
    async (day: string | null) => {
      try {
        const res = await fetchWithAuth(`/api/c/${slug}/admin/appointments/${day ? `?date=${day}` : ""}`);
        if (!res.ok) throw new Error();
        const next = (await res.json()) as DayData;
        setFailed(false);
        setData(next);
        setDate(next.date);
      } catch {
        setFailed(true);
      }
    },
    [fetchWithAuth, slug]
  );

  useEffect(() => {
    let cancelled = false;
    fetchWithAuth(`/api/c/${slug}/admin/appointments/`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((next: DayData) => {
        if (cancelled) return;
        setData(next);
        setDate(next.date);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [fetchWithAuth, slug]);

  const serviceName = (s: { name_en: string; name_ar: string }) => (lang === "ar" ? s.name_ar || s.name_en : s.name_en || s.name_ar) || "—";
  const longDay = (day: string) => f.date(`${day}T12:00:00Z`, { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
  const shortDay = (day: string) => f.date(`${day}T12:00:00Z`, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

  // Columns: each person working that day or with appointments, then appointments with no one
  const columns = useMemo(() => {
    if (!data) return [];
    const activeStaff = data.staff.filter((person) => person.active || data.appointments.some((a) => a.staff_id === person.id));
    if (activeStaff.length === 0) return [{ id: UNASSIGNED, label: t.everyone, off: false }];
    const known = new Set(activeStaff.map((person) => person.id));
    const out = activeStaff.map((person) => ({ id: person.id, label: staffName(person, lang) || "—", off: !person.works }));
    if (data.appointments.some((a) => !a.staff_id || !known.has(a.staff_id))) out.push({ id: UNASSIGNED, label: t.unassigned, off: false });
    return out;
  }, [data, lang, t.everyone, t.unassigned]);

  const columnOf = (a: Appointment) => (columns.some((c) => c.id === a.staff_id) ? a.staff_id! : UNASSIGNED);

  // The hours shown: the opening hours, stretched to fit any appointment outside them
  const range = useMemo((): [number, number] => {
    let [from, to] = data?.opening ?? [9 * 60, 18 * 60];
    for (const a of data?.appointments ?? []) {
      from = Math.min(from, toMinutes(a.time));
      to = Math.max(to, toMinutes(a.time) + a.minutes);
    }
    return [Math.floor(from / 60) * 60, Math.min(24 * 60, Math.ceil(to / 60) * 60)];
  }, [data]);
  const hours = Array.from({ length: (range[1] - range[0]) / 60 }, (_, i) => range[0] + i * 60);

  const selected = data?.appointments.find((a) => a.id === selectedId) ?? null;
  const reminderLink = (a: Appointment) =>
    whatsappLink(a.phone, buildReminder({ requested_for: `${a.date} ${a.time}`, lang: a.lang, staff_name: a.staff_name }, catalog?.name || slug, module.id) ?? "");

  const setReminded = async (a: Appointment, reminded: boolean) => {
    // Shown at once; the server keeps the first time it was sent
    setData((prev) => (prev ? { ...prev, appointments: prev.appointments.map((x) => (x.id === a.id ? { ...x, reminded_at: reminded ? x.reminded_at ?? "now" : null } : x)) } : prev));
    try {
      await fetchWithAuth(`/api/c/${slug}/admin/appointments/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: a.id, reminded }),
      });
    } catch {
      // The tick stays on this screen; it is saved again with the next tap
    }
  };

  const openForm = (patch: Partial<FormState> = {}) => {
    setSelectedId(null);
    setForm((prev) => ({ ...prev, open: true, date: prev.date && prev.date >= (data?.today ?? "") ? prev.date : (date ?? ""), error: null, ...patch }));
  };

  /** A tap on an empty part of a column: a booking with that person at that time */
  const tapColumn = (columnId: string, offsetY: number) => {
    if (!canEdit || !data) return;
    const step = data.slotMinutes || 30;
    const minutes = Math.min(range[1] - step, range[0] + Math.floor(((offsetY / HOUR_PX) * 60) / step) * step);
    openForm({ staffId: columnId === UNASSIGNED ? "any" : columnId, date: data.date, time: toTime(minutes) });
  };

  const formServices = form.itemIds;
  const formPeople = (data?.staff ?? []).filter((person) => person.active && doesServices(person, formServices));

  const save = async () => {
    if (form.itemIds.length === 0) {
      setForm((prev) => ({ ...prev, error: t.chooseService }));
      return;
    }
    setForm((prev) => ({ ...prev, saving: true, error: null }));
    try {
      const res = await fetchWithAuth(`/api/c/${slug}/admin/appointments/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemIds: form.itemIds,
          staffId: form.staffId,
          date: form.date,
          time: form.time,
          name: form.name,
          phone: form.phone,
          note: form.note,
          lang,
          ...(form.repeatWeeks ? { repeat: { weeks: form.repeatWeeks, count: form.repeatCount } } : {}),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setForm((prev) => ({ ...prev, saving: false, error: body.error || t.saveFailed }));
        return;
      }
      const numbers = (body.orders ?? []).map((o: { number: number }) => o.number);
      const skipped: string[] = body.skipped ?? [];
      setNotice([t.saved(numbers), skipped.length ? t.skipped(skipped.map(shortDay).join(lang === "ar" ? "، " : ", ")) : ""].filter(Boolean).join(" "));
      setForm((prev) => ({ ...prev, open: false, saving: false, name: "", phone: "", note: "", repeatWeeks: 0 }));
      await load(form.date);
    } catch {
      setForm((prev) => ({ ...prev, saving: false, error: t.saveFailed }));
    }
  };

  const reminders = data && data.date >= data.today ? data.appointments.filter((a) => a.status !== "completed") : [];
  const sent = reminders.filter((a) => a.reminded_at).length;

  return (
    <>
      <CatalogAdminHeader title={adminNavLabels(lang, module).calendar}>
        {canEdit && data && (
          <button
            type="button"
            onClick={() => openForm()}
            className="inline-flex min-h-11 items-center gap-2 rounded-control bg-ui-primary px-4 text-sm font-semibold text-ui-primary-fg hover:bg-ui-primary-hover"
          >
            <Plus className="h-4 w-4" aria-hidden />
            {t.add}
          </button>
        )}
      </CatalogAdminHeader>
      <CatalogAdminContent>
        <div className="space-y-5">
          <p className="max-w-2xl text-sm text-ui-muted">{t.intro}</p>

          {notice && (
            <div role="status" className="flex items-center justify-between gap-3 rounded-control bg-ui-subtle px-4 py-3 text-sm font-semibold">
              {notice}
              <button type="button" onClick={() => setNotice(null)} aria-label={t.close} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control hover:bg-ui-bg">
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          )}

          {failed && (
            <p role="alert" className="rounded-control border border-ui-danger px-4 py-3 text-sm text-ui-danger">
              {t.failed}
            </p>
          )}

          {!data && !failed && (
            <p className="flex items-center gap-2 text-sm text-ui-muted" role="status">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              {t.loading}
            </p>
          )}

          {data && date && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => load(addDays(date, -1))} aria-label={t.prev} className="flex h-11 w-11 items-center justify-center rounded-control border border-ui-line hover:bg-ui-subtle">
                  <ChevronLeft className="h-5 w-5 rtl:-scale-x-100" aria-hidden />
                </button>
                <button type="button" onClick={() => load(addDays(date, 1))} aria-label={t.next} className="flex h-11 w-11 items-center justify-center rounded-control border border-ui-line hover:bg-ui-subtle">
                  <ChevronRight className="h-5 w-5 rtl:-scale-x-100" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => load(data.today)}
                  aria-pressed={date === data.today}
                  className={clsx("min-h-11 rounded-control border px-4 text-sm font-semibold", date === data.today ? "border-ui-primary bg-ui-subtle text-ui-primary" : "border-ui-line hover:bg-ui-subtle")}
                >
                  {t.today}
                </button>
                <button
                  type="button"
                  onClick={() => load(addDays(data.today, 1))}
                  aria-pressed={date === addDays(data.today, 1)}
                  className={clsx(
                    "min-h-11 rounded-control border px-4 text-sm font-semibold",
                    date === addDays(data.today, 1) ? "border-ui-primary bg-ui-subtle text-ui-primary" : "border-ui-line hover:bg-ui-subtle"
                  )}
                >
                  {t.tomorrow}
                </button>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => e.target.value && load(e.target.value)}
                  aria-label={t.pickDay}
                  lang={lang}
                  className="min-h-11 rounded-control border border-ui-input bg-ui-bg px-3 text-ui-ink focus:border-ui-primary focus:outline-none"
                />
              </div>
              <h2 className="text-lg font-semibold text-ui-heading">{longDay(date)}</h2>

              {(data.blocked || (data.hasHours && !data.opening)) && (
                <p className="rounded-control bg-ui-subtle px-4 py-3 text-sm text-ui-muted">{data.blocked ? t.blocked : t.closed}</p>
              )}
              {!data.hasHours && <p className="rounded-control bg-ui-subtle px-4 py-3 text-sm text-ui-muted">{t.noHours}</p>}

              {/* People across, hours down; scrolls sideways inside its box on phones */}
              <div className="min-w-0 overflow-x-auto rounded-panel border border-ui-line bg-ui-surface">
                <div className="flex" style={{ minWidth: `${56 + columns.length * 150}px` }}>
                  <div className="sticky start-0 z-10 w-14 shrink-0 border-e border-ui-line bg-ui-surface">
                    <div className="h-11 border-b border-ui-line" />
                    <div className="relative" style={{ height: hours.length * HOUR_PX }}>
                      {hours.map((h, i) => (
                        <span key={h} dir="ltr" className={clsx("absolute end-2 text-xs tabular-nums text-ui-muted", i > 0 ? "-translate-y-1/2" : "pt-0.5")} style={{ top: i * HOUR_PX }}>
                          {toTime(h)}
                        </span>
                      ))}
                    </div>
                  </div>
                  {columns.map((column) => {
                    const items = lanes(data.appointments.filter((a) => columnOf(a) === column.id));
                    return (
                      <div key={column.id} className="min-w-[150px] flex-1 border-e border-ui-line last:border-e-0">
                        <div className="flex h-11 flex-col justify-center border-b border-ui-line px-2 text-center">
                          <span className="truncate text-sm font-semibold">{column.label}</span>
                          {column.off && <span className="text-[11px] text-ui-muted">{t.dayOff}</span>}
                        </div>
                        <div
                          className={clsx("relative", column.off && "bg-[repeating-linear-gradient(45deg,var(--ui-line)_0_4px,transparent_4px_10px)]", canEdit && "cursor-copy")}
                          style={{ height: hours.length * HOUR_PX }}
                          onClick={(event) => {
                            if (event.target !== event.currentTarget) return;
                            tapColumn(column.id, event.nativeEvent.offsetY);
                          }}
                        >
                          {hours.map((h, i) => (
                            <div key={h} aria-hidden className="pointer-events-none absolute inset-x-0 border-t border-ui-line/70" style={{ top: i * HOUR_PX }} />
                          ))}
                          {items.map(({ appointment: a, lane, of }) => {
                            const top = ((toMinutes(a.time) - range[0]) / 60) * HOUR_PX;
                            const height = Math.max(28, (a.minutes / 60) * HOUR_PX - 2);
                            const services = a.services.map(serviceName).join(lang === "ar" ? "، " : ", ");
                            return (
                              <button
                                key={a.id}
                                type="button"
                                onClick={() => setSelectedId(a.id)}
                                aria-label={`${a.time} · ${a.name} · ${services}`}
                                className={clsx(
                                  "absolute overflow-hidden rounded-[6px] px-2 py-1 text-start text-xs leading-tight",
                                  a.status === "new" ? "bg-ui-subtle text-ui-primary ring-1 ring-inset ring-ui-primary" : "bg-ui-primary text-ui-primary-fg",
                                  selectedId === a.id && "outline outline-2 outline-offset-1 outline-ui-accent"
                                )}
                                style={{ top, height, insetInlineStart: `calc(${(lane / of) * 100}% + 2px)`, width: `calc(${100 / of}% - 4px)` }}
                              >
                                <span dir="ltr" className="font-semibold tabular-nums">{a.time}</span> <span className="font-semibold">{a.name}</span>
                                {height > 40 && <span className="block truncate opacity-90">{services}</span>}
                                {a.reminded_at && <Bell className="absolute end-1 top-1 h-3 w-3" aria-hidden />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-ui-muted">
                <li className="flex items-center gap-2">
                  <span className="h-3 w-5 rounded-[3px] bg-ui-subtle ring-1 ring-inset ring-ui-primary" aria-hidden />
                  {t.legendNew}
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-3 w-5 rounded-[3px] bg-ui-primary" aria-hidden />
                  {t.legendConfirmed}
                </li>
                <li className="flex items-center gap-2">
                  <Bell className="h-3.5 w-3.5" aria-hidden />
                  {t.reminded}
                </li>
              </ul>

              {data.appointments.length === 0 && <p className="text-sm text-ui-muted">{t.noneToday}</p>}
            </>
          )}

          {/* The appointment that was tapped */}
          {selected && (
            <section className="rounded-panel border border-ui-line bg-ui-surface p-4 sm:p-5" aria-label={`#${selected.number}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-lg font-semibold text-ui-heading">
                    #{selected.number} · {selected.name}
                  </p>
                  <p className="text-sm text-ui-muted">
                    <bdi dir="ltr">
                      {selected.time}–{toTime(toMinutes(selected.time) + selected.minutes)}
                    </bdi>{" "}
                    · {t.minutes(selected.minutes)}
                    {selected.staff_name ? ` · ${t.with} ${selected.staff_name}` : ""}
                  </p>
                  <p className="mt-1 text-sm">{selected.services.map((s) => `${s.quantity > 1 ? `${s.quantity} × ` : ""}${serviceName(s)}`).join(lang === "ar" ? "، " : ", ")}</p>
                  {selected.note && <p className="mt-1 text-sm text-ui-muted">{selected.note}</p>}
                  <p className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-ui-subtle px-2.5 py-1">{t.status[selected.status] ?? selected.status}</span>
                    {selected.paid && <span className="rounded-full bg-ui-bg px-2.5 py-1 text-ui-success ring-1 ring-ui-line">{t.paid}</span>}
                    {selected.source === "admin" && <span className="rounded-full bg-ui-bg px-2.5 py-1 text-ui-muted ring-1 ring-ui-line">{t.addedByYou}</span>}
                    {selected.reminded_at && <span className="rounded-full bg-ui-bg px-2.5 py-1 text-ui-muted ring-1 ring-ui-line">{t.reminded}</span>}
                  </p>
                </div>
                <button type="button" onClick={() => setSelectedId(null)} aria-label={t.close} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control hover:bg-ui-subtle">
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {selected.phone && (
                  <>
                    <a href={`tel:${selected.phone}`} className="inline-flex min-h-10 items-center gap-1.5 rounded-control border border-ui-line px-3 text-sm font-medium hover:bg-ui-subtle">
                      <Phone className="h-4 w-4" aria-hidden />
                      {t.call}
                    </a>
                    <a href={whatsappLink(selected.phone)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1.5 rounded-control border border-ui-line px-3 text-sm font-medium hover:bg-ui-subtle">
                      <MessageCircle className="h-4 w-4" aria-hidden />
                      {t.whatsapp}
                    </a>
                    {canEdit && data && selected.date >= data.today && (
                      <ReminderButton appointment={selected} link={reminderLink(selected)} onSent={setReminded} t={t} />
                    )}
                  </>
                )}
                <Link href={`/c/${slug}/admin/orders/`} className="inline-flex min-h-10 items-center rounded-control px-3 text-sm font-semibold text-ui-primary underline-offset-4 hover:underline">
                  {t.openBookings}
                </Link>
              </div>
            </section>
          )}

          {/* A booking taken by phone or at the desk */}
          {form.open && canEdit && data && (
            <section className="rounded-panel border border-ui-line bg-ui-surface p-4 sm:p-5" aria-labelledby="add-appointment-title">
              <h3 id="add-appointment-title" className="text-lg font-semibold text-ui-heading">
                {t.formTitle}
              </h3>
              <p className="mt-1 text-sm text-ui-muted">{t.formHint}</p>
              <form
                className="mt-4 grid gap-4 sm:grid-cols-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  save();
                }}
              >
                <fieldset className="space-y-1 sm:col-span-2">
                  <legend className="text-sm font-semibold">{t.services}</legend>
                  <div className="grid gap-1 sm:grid-cols-2">
                    {data.services.map((service) => (
                      <label key={service.id} className="flex min-h-10 cursor-pointer items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={form.itemIds.includes(service.id)}
                          onChange={(e) =>
                            setForm((p) => ({ ...p, itemIds: e.target.checked ? [...p.itemIds, service.id] : p.itemIds.filter((id) => id !== service.id), error: null }))
                          }
                          className="h-4 w-4 shrink-0 accent-[var(--ui-primary)]"
                        />
                        <span className="min-w-0 truncate">{serviceName(service)}</span>
                        {service.duration_minutes ? <span className="shrink-0 text-xs text-ui-muted">{t.minutes(service.duration_minutes)}</span> : null}
                      </label>
                    ))}
                  </div>
                </fieldset>
                {data.staff.some((person) => person.active) && (
                  <div className="space-y-1.5">
                    <label htmlFor="appt-staff" className="block text-sm font-semibold">{t.person}</label>
                    <select id="appt-staff" value={form.staffId} onChange={(e) => setForm((p) => ({ ...p, staffId: e.target.value }))} className={input}>
                      <option value="any">{t.anyone}</option>
                      {formPeople.map((person) => (
                        <option key={person.id} value={person.id}>
                          {staffName(person, lang)}
                          {form.date === data.date && !person.works ? ` (${t.offThatDay})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="space-y-1.5">
                  <label htmlFor="appt-date" className="block text-sm font-semibold">{t.date}</label>
                  <input id="appt-date" type="date" required min={data.today} value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} className={input} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="appt-time" className="block text-sm font-semibold">{t.time}</label>
                  <input id="appt-time" type="time" required step={(data.slotMinutes || 15) * 60} dir="ltr" value={form.time} onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))} className={input} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="appt-name" className="block text-sm font-semibold">{t.name}</label>
                  <input id="appt-name" required maxLength={80} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className={input} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="appt-phone" className="block text-sm font-semibold">{t.phone}</label>
                  <input id="appt-phone" type="tel" dir="ltr" maxLength={20} value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} className={input} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="appt-note" className="block text-sm font-semibold">{t.note}</label>
                  <input id="appt-note" maxLength={300} value={form.note} onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))} className={input} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="appt-repeat" className="block text-sm font-semibold">{t.repeat}</label>
                  <select id="appt-repeat" value={form.repeatWeeks} onChange={(e) => setForm((p) => ({ ...p, repeatWeeks: Number(e.target.value) }))} className={input}>
                    <option value={0}>{t.noRepeat}</option>
                    {REPEAT_WEEKS.map((weeks) => (
                      <option key={weeks} value={weeks}>{t.everyWeeks(weeks)}</option>
                    ))}
                  </select>
                </div>
                {form.repeatWeeks > 0 && (
                  <div className="space-y-1.5">
                    <label htmlFor="appt-count" className="block text-sm font-semibold">{t.times}</label>
                    <select id="appt-count" value={form.repeatCount} onChange={(e) => setForm((p) => ({ ...p, repeatCount: Number(e.target.value) }))} className={input}>
                      {Array.from({ length: MAX_REPEATS - 1 }, (_, i) => i + 2).map((n) => (
                        <option key={n} value={n}>{f.number(n)}</option>
                      ))}
                    </select>
                  </div>
                )}
                {form.error && (
                  <p role="alert" className="text-sm text-ui-danger sm:col-span-2">
                    {form.error}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 sm:col-span-2">
                  <button type="submit" disabled={form.saving} className="inline-flex min-h-11 items-center gap-2 rounded-control bg-ui-primary px-5 font-semibold text-ui-primary-fg hover:bg-ui-primary-hover disabled:opacity-60">
                    {form.saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                    {form.saving ? t.saving : t.save}
                  </button>
                  <button type="button" onClick={() => setForm((p) => ({ ...p, open: false, error: null }))} className="min-h-11 rounded-control border border-ui-line px-5 font-semibold hover:bg-ui-subtle">
                    {t.cancel}
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* Reminders for the day shown (from today on) */}
          {data && reminders.length > 0 && (
            <section className="space-y-3" aria-labelledby="reminders-title">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 id="reminders-title" className="text-base font-semibold text-ui-heading">
                  {t.remindersTitle}
                </h3>
                <span className="text-sm text-ui-muted">{t.remindersCount(sent, reminders.length)}</span>
              </div>
              <p className="max-w-2xl text-sm text-ui-muted">{t.remindersBody}</p>
              <ul className="divide-y divide-ui-line rounded-panel border border-ui-line bg-ui-surface">
                {reminders.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="font-semibold">
                        <bdi dir="ltr" className="tabular-nums">{a.time}</bdi> · {a.name}
                      </p>
                      <p className="truncate text-sm text-ui-muted">
                        {a.services.map(serviceName).join(lang === "ar" ? "، " : ", ")}
                        {a.staff_name ? ` · ${t.with} ${a.staff_name}` : ""}
                      </p>
                    </div>
                    {a.phone ? (
                      canEdit ? (
                        <ReminderButton appointment={a} link={reminderLink(a)} onSent={setReminded} t={t} />
                      ) : a.reminded_at ? (
                        <span className="text-sm text-ui-muted">{t.reminded}</span>
                      ) : null
                    ) : (
                      <span className="text-sm text-ui-muted">{t.noPhone}</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {data && date === data.today && (
            <button type="button" onClick={() => load(addDays(data.today, 1))} className="inline-flex min-h-11 items-center gap-2 rounded-control border border-ui-line px-4 text-sm font-semibold hover:bg-ui-subtle">
              <Bell className="h-4 w-4" aria-hidden />
              {t.remindersTomorrow}
            </button>
          )}
        </div>
      </CatalogAdminContent>
    </>
  );
}

/** Opens WhatsApp with the reminder ready and marks it sent; once sent, offers to undo the mark */
function ReminderButton({
  appointment,
  link,
  onSent,
  t,
}: {
  appointment: Appointment;
  link: string;
  onSent: (a: Appointment, reminded: boolean) => void;
  t: typeof en;
}) {
  if (appointment.reminded_at) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-ui-success">
          <Check className="h-4 w-4" aria-hidden />
          {t.reminded}
        </span>
        <button type="button" onClick={() => onSent(appointment, false)} className="min-h-10 rounded-control px-2 text-xs text-ui-muted underline-offset-4 hover:underline">
          {t.undoReminded}
        </button>
      </span>
    );
  }
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => onSent(appointment, true)}
      className="inline-flex min-h-10 items-center gap-1.5 rounded-control bg-ui-primary px-3 text-sm font-semibold text-ui-primary-fg hover:bg-ui-primary-hover"
    >
      <Bell className="h-4 w-4" aria-hidden />
      {t.remind}
    </a>
  );
}

