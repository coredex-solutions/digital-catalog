"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Loader2, MessageCircle, Phone, Plus, X } from "lucide-react";
import { CatalogAdminShell, useCatalogAdmin } from "../_components/CatalogAdminShell";
import { CatalogAdminContent, CatalogAdminHeader } from "../_components/CatalogAdminSidebar";
import { adminNavLabels } from "../_components/adminNav";
import { useAdminLang, useCopy, useFormat, plural, type AdminLang } from "../_lib/i18n";
import { useModule } from "../_lib/module";
import { whatsappLink } from "../../_lib/whatsapp";
import { addDays, nightsBetween } from "@/lib/orders/stays";
import { clsx } from "clsx";

interface Unit {
  id: string;
  name_en: string;
  name_ar: string;
  unit_count: number;
  max_guests: number | null;
}

interface Stay {
  id: string;
  number: number;
  status: string;
  name: string;
  phone: string;
  check_in: string;
  check_out: string;
  guests: number | null;
  source: string;
  paid: boolean;
  lines: { item_id: string; quantity: number }[];
}

interface CalendarData {
  from: string;
  today: string;
  units: Unit[];
  stays: Stay[];
  closed: string[];
}

const DAYS = 14;

const en = {
  intro: "Which rooms are taken on which nights. Add stays you took by phone or on another site, so the page never books them twice.",
  add: "Add a booking",
  today: "Today",
  prev: "Earlier",
  next: "Later",
  room: "Room",
  closed: "Closed",
  free: "Free",
  taken: (taken: number, all: number) => `${taken} of ${all} taken`,
  legendNew: "New, not confirmed yet",
  legendConfirmed: "Confirmed",
  legendClosed: "Closed night",
  nights: (n: number, lang: AdminLang) => plural(lang, n, { one: "1 night", other: "# nights" }),
  guests: (n: number, lang: AdminLang) => plural(lang, n, { one: "1 guest", other: "# guests" }),
  addedByYou: "Added by you",
  paid: "Paid",
  status: { new: "New", confirmed: "Confirmed", ready: "Confirmed", completed: "Done" } as Record<string, string>,
  call: "Call",
  whatsapp: "WhatsApp",
  openBookings: "Open on the Bookings page",
  close: "Close",
  formTitle: "Add a booking",
  formHint: "It's saved as confirmed and blocks the room for these nights.",
  roomLabel: "Room",
  howMany: "How many",
  checkIn: "Check-in",
  checkOut: "Check-out",
  name: "Guest name or source",
  namePlaceholder: "e.g. Rami (Airbnb)",
  phone: "Phone (optional)",
  guestsLabel: "Guests (optional)",
  note: "Note (optional)",
  save: "Save booking",
  saving: "Saving…",
  cancel: "Cancel",
  saved: (n: number) => `Booking #${n} saved.`,
  noRooms: "Add your rooms or chalets first, under Rooms.",
  failed: "Couldn't load the calendar. Check your connection.",
  saveFailed: "Couldn't save the booking.",
  loading: "Loading…",
};
const ar: typeof en = {
  intro: "أي الغرف محجوزة في أي ليالٍ. أضف الإقامات التي أخذتها بالهاتف أو من موقع آخر، كي لا تُحجز مرتين من الصفحة.",
  add: "إضافة حجز",
  today: "اليوم",
  prev: "قبل",
  next: "بعد",
  room: "الغرفة",
  closed: "مغلق",
  free: "متاحة",
  taken: (taken, all) => `${taken} من ${all} محجوزة`,
  legendNew: "جديد، لم يُؤكَّد بعد",
  legendConfirmed: "مؤكَّد",
  legendClosed: "ليلة مغلقة",
  nights: (n, lang) => plural(lang, n, { one: "ليلة واحدة", two: "ليلتان", few: "# ليالٍ", many: "# ليلة", other: "# ليلة" }),
  guests: (n, lang) => plural(lang, n, { one: "ضيف واحد", two: "ضيفان", few: "# ضيوف", many: "# ضيفاً", other: "# ضيف" }),
  addedByYou: "أضفته أنت",
  paid: "مدفوع",
  status: { new: "جديد", confirmed: "مؤكَّد", ready: "مؤكَّد", completed: "منتهٍ" },
  call: "اتصال",
  whatsapp: "واتساب",
  openBookings: "افتحه في صفحة الحجوزات",
  close: "إغلاق",
  formTitle: "إضافة حجز",
  formHint: "يُحفظ مؤكَّداً ويحجز الغرفة لهذه الليالي.",
  roomLabel: "الغرفة",
  howMany: "العدد",
  checkIn: "الوصول",
  checkOut: "المغادرة",
  name: "اسم الضيف أو المصدر",
  namePlaceholder: "مثلاً: رامي (Airbnb)",
  phone: "الهاتف (اختياري)",
  guestsLabel: "الضيوف (اختياري)",
  note: "ملاحظة (اختيارية)",
  save: "حفظ الحجز",
  saving: "جارٍ الحفظ…",
  cancel: "إلغاء",
  saved: (n) => `حُفظ الحجز رقم ${n}.`,
  noRooms: "أضف غرفك أو شاليهاتك أولاً من قسم الغرف.",
  failed: "تعذّر تحميل التقويم. تحقق من الاتصال.",
  saveFailed: "تعذّر حفظ الحجز.",
  loading: "جارٍ التحميل…",
};

const input =
  "w-full min-h-11 px-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink focus:outline-none focus:border-ui-primary transition-all";

function CalendarView() {
  const t = useCopy({ en, ar });
  const lang = useAdminLang();
  const f = useFormat();
  const { module } = useModule();
  const { slug, fetchWithAuth, user } = useCatalogAdmin();
  const canEdit = user?.role !== "viewer";

  const [from, setFrom] = useState<string | null>(null);
  const [data, setData] = useState<CalendarData | null>(null);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<Stay | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState<{ open: boolean; itemId: string; quantity: string; checkIn: string; checkOut: string; name: string; phone: string; guests: string; note: string; error: string | null; saving: boolean }>({
    open: false,
    itemId: "",
    quantity: "1",
    checkIn: "",
    checkOut: "",
    name: "",
    phone: "",
    guests: "",
    note: "",
    error: null,
    saving: false,
  });

  const load = useCallback(
    async (start: string | null) => {
      try {
        const res = await fetchWithAuth(`/api/c/${slug}/admin/stays/?days=${DAYS}${start ? `&from=${start}` : ""}`);
        if (!res.ok) throw new Error();
        setFailed(false);
        const next = (await res.json()) as CalendarData;
        setData(next);
        setFrom(next.from);
      } catch {
        setFailed(true);
      }
    },
    [fetchWithAuth, slug]
  );

  // First load: from today
  useEffect(() => {
    let cancelled = false;
    fetchWithAuth(`/api/c/${slug}/admin/stays/?days=${DAYS}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((next: CalendarData) => {
        if (cancelled) return;
        setData(next);
        setFrom(next.from);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [fetchWithAuth, slug]);

  const days = useMemo(() => (from ? Array.from({ length: DAYS }, (_, i) => addDays(from, i)) : []), [from]);
  const closed = useMemo(() => new Set(data?.closed ?? []), [data?.closed]);
  const unitName = (unit: Unit) => (lang === "ar" ? unit.name_ar || unit.name_en : unit.name_en || unit.name_ar) || "—";

  /** The stays on a room for one night */
  const staysOn = (unitId: string, night: string) =>
    (data?.stays ?? []).filter((stay) => stay.check_in <= night && stay.check_out > night && stay.lines.some((line) => line.item_id === unitId));
  const roomsTaken = (unitId: string, stays: Stay[]) =>
    stays.reduce((sum, stay) => sum + stay.lines.filter((line) => line.item_id === unitId).reduce((n, line) => n + line.quantity, 0), 0);

  const move = (by: number) => from && load(addDays(from, by));
  const dayLabel = (date: string) => f.date(`${date}T12:00:00Z`, { weekday: "short", timeZone: "UTC" });
  const longDay = (date: string) => f.date(`${date}T12:00:00Z`, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

  const openForm = (itemId?: string, night?: string) => {
    setSelected(null);
    setForm((prev) => ({
      ...prev,
      open: true,
      itemId: itemId ?? prev.itemId ?? data?.units[0]?.id ?? "",
      checkIn: night ?? prev.checkIn,
      checkOut: night ? addDays(night, 1) : prev.checkOut,
      error: null,
    }));
  };

  const save = async () => {
    setForm((prev) => ({ ...prev, saving: true, error: null }));
    try {
      const res = await fetchWithAuth(`/api/c/${slug}/admin/stays/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: form.itemId || data?.units[0]?.id,
          quantity: Number(form.quantity) || 1,
          checkIn: form.checkIn,
          checkOut: form.checkOut,
          name: form.name,
          phone: form.phone,
          guests: form.guests,
          note: form.note,
          lang,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setForm((prev) => ({ ...prev, saving: false, error: body.error || t.saveFailed }));
        return;
      }
      setForm((prev) => ({ ...prev, open: false, saving: false, name: "", phone: "", guests: "", note: "" }));
      setNotice(t.saved(body.order?.number ?? 0));
      await load(from);
    } catch {
      setForm((prev) => ({ ...prev, saving: false, error: t.saveFailed }));
    }
  };

  const selectedUnits = selected ? (data?.units ?? []).filter((unit) => selected.lines.some((line) => line.item_id === unit.id)) : [];
  const formUnit = data?.units.find((unit) => unit.id === (form.itemId || data?.units[0]?.id));

  return (
    <>
      <CatalogAdminHeader title={adminNavLabels(lang, module).calendar}>
        {canEdit && data && data.units.length > 0 && (
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
              <button type="button" onClick={() => setNotice(null)} aria-label={t.close} className="flex h-9 w-9 items-center justify-center rounded-control hover:bg-ui-bg">
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

          {data && data.units.length === 0 && <p className="rounded-panel border border-ui-line bg-ui-surface p-6 text-center text-ui-muted">{t.noRooms}</p>}

          {data && data.units.length > 0 && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => move(-7)} aria-label={t.prev} className="flex h-11 w-11 items-center justify-center rounded-control border border-ui-line hover:bg-ui-subtle">
                  <ChevronLeft className="h-5 w-5 rtl:-scale-x-100" aria-hidden />
                </button>
                <button type="button" onClick={() => move(7)} aria-label={t.next} className="flex h-11 w-11 items-center justify-center rounded-control border border-ui-line hover:bg-ui-subtle">
                  <ChevronRight className="h-5 w-5 rtl:-scale-x-100" aria-hidden />
                </button>
                <button type="button" onClick={() => load(null)} className="min-h-11 rounded-control border border-ui-line px-4 text-sm font-semibold hover:bg-ui-subtle">
                  {t.today}
                </button>
                <p className="text-sm font-semibold text-ui-heading">
                  {longDay(days[0])} – {longDay(days[days.length - 1])}
                </p>
              </div>

              {/* Rooms down the side, nights across; scrolls sideways inside its box on phones */}
              <div className="min-w-0 overflow-x-auto rounded-panel border border-ui-line bg-ui-surface">
                <table className="w-full min-w-[720px] border-collapse text-sm">
                  <thead>
                    <tr>
                      <th scope="col" className="sticky start-0 z-10 w-36 border-b border-ui-line bg-ui-surface px-3 py-2 text-start font-semibold">
                        {t.room}
                      </th>
                      {days.map((day) => (
                        <th
                          key={day}
                          scope="col"
                          className={clsx("border-b border-ui-line px-1 py-2 text-center text-xs font-semibold", day === data.today ? "text-ui-primary" : "text-ui-muted")}
                        >
                          <span className="block">{dayLabel(day)}</span>
                          <span className="block text-base tabular-nums text-ui-ink">{Number(day.slice(8))}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.units.map((unit) => (
                      <tr key={unit.id}>
                        <th scope="row" className="sticky start-0 z-10 border-b border-ui-line bg-ui-surface px-3 py-2 text-start font-semibold">
                          <span className="line-clamp-2">{unitName(unit)}</span>
                          {unit.unit_count > 1 && <span className="block text-xs font-normal text-ui-muted">× {unit.unit_count}</span>}
                        </th>
                        {days.map((day) => {
                          const stays = staysOn(unit.id, day);
                          const taken = roomsTaken(unit.id, stays);
                          const full = taken >= unit.unit_count;
                          const first = stays[0];
                          const isClosed = closed.has(day);
                          const label = `${unitName(unit)} · ${longDay(day)} · ${
                            stays.length ? (unit.unit_count > 1 ? t.taken(taken, unit.unit_count) : first.name) : isClosed ? t.closed : t.free
                          }`;
                          return (
                            <td key={day} className="border-b border-s border-ui-line p-0.5">
                              <button
                                type="button"
                                aria-label={label}
                                disabled={!stays.length && (!canEdit || isClosed)}
                                onClick={() => (first ? setSelected(first) : openForm(unit.id, day))}
                                className={clsx(
                                  "flex h-12 w-full items-center justify-center overflow-hidden rounded-[6px] px-1 text-[11px] font-semibold leading-tight",
                                  stays.length
                                    ? first.status === "new"
                                      ? "bg-ui-subtle text-ui-primary ring-1 ring-inset ring-ui-primary"
                                      : full
                                        ? "bg-ui-primary text-ui-primary-fg"
                                        : "bg-ui-subtle text-ui-heading"
                                    : isClosed
                                      ? "bg-[repeating-linear-gradient(45deg,var(--ui-line)_0_4px,transparent_4px_8px)] text-ui-muted"
                                      : "hover:bg-ui-bg",
                                  selected && stays.some((s) => s.id === selected.id) && "outline outline-2 outline-offset-[-2px] outline-ui-accent"
                                )}
                              >
                                {stays.length > 0 && (unit.unit_count > 1 ? `${taken}/${unit.unit_count}` : first.check_in === day || day === days[0] ? <span className="line-clamp-2">{first.name}</span> : "")}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                  <span className="h-3 w-5 rounded-[3px] bg-[repeating-linear-gradient(45deg,var(--ui-line)_0_4px,transparent_4px_8px)] ring-1 ring-inset ring-ui-line" aria-hidden />
                  {t.legendClosed}
                </li>
              </ul>
            </>
          )}

          {/* The stay that was tapped */}
          {selected && (
            <section className="rounded-panel border border-ui-line bg-ui-surface p-4 sm:p-5" aria-label={`#${selected.number}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-lg font-semibold text-ui-heading">
                    #{selected.number} · {selected.name}
                  </p>
                  <p className="text-sm text-ui-muted">
                    {longDay(selected.check_in)} {lang === "ar" ? "←" : "→"} {longDay(selected.check_out)} · {t.nights(nightsBetween(selected.check_in, selected.check_out), lang)}
                    {selected.guests ? ` · ${t.guests(selected.guests, lang)}` : ""}
                  </p>
                  <p className="mt-1 text-sm">{selectedUnits.map(unitName).join(lang === "ar" ? "، " : ", ")}</p>
                  <p className="mt-1 flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-ui-subtle px-2.5 py-1">{t.status[selected.status] ?? selected.status}</span>
                    {selected.paid && <span className="rounded-full bg-ui-bg px-2.5 py-1 text-ui-success ring-1 ring-ui-line">{t.paid}</span>}
                    {selected.source === "admin" && <span className="rounded-full bg-ui-bg px-2.5 py-1 text-ui-muted ring-1 ring-ui-line">{t.addedByYou}</span>}
                  </p>
                </div>
                <button type="button" onClick={() => setSelected(null)} aria-label={t.close} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control hover:bg-ui-subtle">
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
                  </>
                )}
                <Link href={`/c/${slug}/admin/orders/`} className="inline-flex min-h-10 items-center rounded-control px-3 text-sm font-semibold text-ui-primary underline-offset-4 hover:underline">
                  {t.openBookings}
                </Link>
              </div>
            </section>
          )}

          {/* A stay taken by phone or on another site */}
          {form.open && canEdit && data && (
            <section className="rounded-panel border border-ui-line bg-ui-surface p-4 sm:p-5" aria-labelledby="add-stay-title">
              <h3 id="add-stay-title" className="text-lg font-semibold text-ui-heading">
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
                <div className="space-y-1.5">
                  <label htmlFor="stay-room" className="block text-sm font-semibold">{t.roomLabel}</label>
                  <select id="stay-room" value={form.itemId || data.units[0]?.id} onChange={(e) => setForm((p) => ({ ...p, itemId: e.target.value, quantity: "1" }))} className={input}>
                    {data.units.map((unit) => (
                      <option key={unit.id} value={unit.id}>{unitName(unit)}</option>
                    ))}
                  </select>
                </div>
                {formUnit && formUnit.unit_count > 1 ? (
                  <div className="space-y-1.5">
                    <label htmlFor="stay-qty" className="block text-sm font-semibold">{t.howMany}</label>
                    <select id="stay-qty" value={form.quantity} onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))} className={input}>
                      {Array.from({ length: formUnit.unit_count }, (_, i) => (
                        <option key={i} value={i + 1}>{i + 1}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="hidden sm:block" />
                )}
                <div className="space-y-1.5">
                  <label htmlFor="stay-in" className="block text-sm font-semibold">{t.checkIn}</label>
                  <input id="stay-in" type="date" required value={form.checkIn} onChange={(e) => setForm((p) => ({ ...p, checkIn: e.target.value, checkOut: p.checkOut && p.checkOut > e.target.value ? p.checkOut : e.target.value ? addDays(e.target.value, 1) : "" }))} className={input} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="stay-out" className="block text-sm font-semibold">{t.checkOut}</label>
                  <input id="stay-out" type="date" required min={form.checkIn ? addDays(form.checkIn, 1) : undefined} value={form.checkOut} onChange={(e) => setForm((p) => ({ ...p, checkOut: e.target.value }))} className={input} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="stay-name" className="block text-sm font-semibold">{t.name}</label>
                  <input id="stay-name" required value={form.name} maxLength={80} placeholder={t.namePlaceholder} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className={input} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="stay-phone" className="block text-sm font-semibold">{t.phone}</label>
                  <input id="stay-phone" type="tel" dir="ltr" maxLength={20} value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} className={input} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="stay-guests" className="block text-sm font-semibold">{t.guestsLabel}</label>
                  <input id="stay-guests" type="number" inputMode="numeric" dir="ltr" min={1} max={50} value={form.guests} onChange={(e) => setForm((p) => ({ ...p, guests: e.target.value }))} className={input} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="stay-note" className="block text-sm font-semibold">{t.note}</label>
                  <input id="stay-note" maxLength={300} value={form.note} onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))} className={input} />
                </div>
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
        </div>
      </CatalogAdminContent>
    </>
  );
}

export default function CalendarPage() {
  return (
    <CatalogAdminShell>
      <CalendarView />
    </CatalogAdminShell>
  );
}
