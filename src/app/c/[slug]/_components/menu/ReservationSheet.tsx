"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { useCatalog } from "../../_providers/CatalogProvider";
import { trackEvent } from "../AnalyticsTracker";
import { localized } from "../../_lib/i18n";
import { buildReservationMessage, whatsappLink } from "../../_lib/whatsapp";
import { Field, inputClass } from "./CheckoutSheet";
import { QuantityStepper } from "./QuantityStepper";
import { Sheet } from "./Sheet";

const DETAILS_KEY = "menu_diner_details";

/** Today's date in Beirut as YYYY-MM-DD, for the date picker's minimum */
function todayInBeirut(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Beirut" }).format(new Date());
}

/**
 * Table reservation. Sends the request to the restaurant on WhatsApp, so it actually reaches
 * someone (the previous form only pretended to submit).
 */
export function ReservationSheet() {
  const { activeSheet, closeSheet, catalog, contact, lang, t } = useCatalog();
  const open = activeSheet === "reservation";
  const ar = lang === "ar";

  const [form, setForm] = useState({ name: "", phone: "", date: "", time: "", notes: "" });
  const [guests, setGuests] = useState(2);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    try {
      const saved = JSON.parse(localStorage.getItem(DETAILS_KEY) || "{}");
      setForm((prev) => ({ ...prev, name: prev.name || saved.name || "", phone: prev.phone || saved.phone || "" }));
    } catch {
      // Nothing saved yet
    }
  }, [open]);

  const update = (field: keyof typeof form, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const submit = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = t.required;
    if (form.phone.replace(/\D/g, "").length < 7) next.phone = t.required;
    if (!form.date) next.date = t.required;
    if (!form.time) next.time = t.required;
    setErrors(next);
    if (Object.keys(next).length > 0 || !contact?.phone_whatsapp) return;

    const message = buildReservationMessage(
      {
        restaurantName: localized(catalog, "name", lang) || catalog.name,
        name: form.name.trim(),
        phone: form.phone.trim(),
        date: form.date,
        time: form.time,
        guests: String(guests),
        notes: form.notes.trim(),
      },
      lang
    );
    trackEvent(catalog.id, "booking_confirm");
    window.location.href = whatsappLink(contact.phone_whatsapp, message);
  };

  const footer = (
    <div>
      <button
        type="button"
        onClick={submit}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-control bg-brand px-4 font-semibold text-brand-fg transition-transform active:scale-[0.99]"
      >
        <MessageCircle className="h-5 w-5" aria-hidden />
        {ar ? "إرسال طلب الحجز عبر واتساب" : "Send request on WhatsApp"}
      </button>
      <p className="mt-2 text-center text-xs text-menu-muted">
        {ar ? "سيؤكد المطعم حجزك عبر واتساب." : "The restaurant will confirm your table on WhatsApp."}
      </p>
    </div>
  );

  return (
    <Sheet open={open} onClose={closeSheet} title={ar ? "حجز طاولة" : "Reserve a table"} footer={footer}>
      <form
        className="space-y-5"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label={ar ? "التاريخ" : "Date"} error={errors.date}>
            {(props) => (
              <input
                {...props}
                type="date"
                min={todayInBeirut()}
                value={form.date}
                onChange={(event) => update("date", event.target.value)}
                className={inputClass}
              />
            )}
          </Field>
          <Field label={ar ? "الوقت" : "Time"} error={errors.time}>
            {(props) => (
              <input {...props} type="time" step={900} value={form.time} onChange={(event) => update("time", event.target.value)} className={inputClass} />
            )}
          </Field>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold" id="guests-label">
            {ar ? "عدد الأشخاص" : "Guests"}
          </span>
          <QuantityStepper value={guests} onChange={setGuests} label={ar ? "عدد الأشخاص" : "Guests"} />
        </div>

        <Field label={t.name} error={errors.name}>
          {(props) => (
            <input {...props} value={form.name} onChange={(event) => update("name", event.target.value.slice(0, 80))} autoComplete="name" className={inputClass} />
          )}
        </Field>

        <Field label={t.phone} error={errors.phone}>
          {(props) => (
            <input
              {...props}
              type="tel"
              dir="ltr"
              inputMode="tel"
              autoComplete="tel"
              placeholder={t.phonePlaceholder}
              value={form.phone}
              onChange={(event) => update("phone", event.target.value.slice(0, 20))}
              className={`${inputClass} ${ar ? "text-end" : ""}`}
            />
          )}
        </Field>

        <Field label={t.notes}>
          {(props) => (
            <textarea
              {...props}
              rows={2}
              value={form.notes}
              onChange={(event) => update("notes", event.target.value.slice(0, 300))}
              placeholder={ar ? "مناسبة خاصة، كرسي أطفال…" : "Special occasion, high chair…"}
              className={`${inputClass} resize-none py-3`}
            />
          )}
        </Field>

        <button type="submit" className="sr-only" tabIndex={-1}>
          {ar ? "إرسال" : "Send"}
        </button>
      </form>
    </Sheet>
  );
}
