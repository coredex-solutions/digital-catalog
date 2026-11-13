"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { Loader2, MessageCircle } from "lucide-react";
import { useCatalog } from "../../_providers/CatalogProvider";
import { trackEvent } from "../AnalyticsTracker";
import { localized } from "../../_lib/i18n";
import { buildReservationMessage, whatsappLink } from "../../_lib/whatsapp";
import { newClientKey, sendOrder, type SentOrder } from "../../_lib/send-order";
import { trackSent } from "../../_lib/tracking";
import { depositInstructions, Field, inputClass, SavedNotice, todayInBeirut } from "./form-parts";
import { SlotPicker } from "./SlotPicker";
import { parseBookingConfig } from "@/lib/orders/slots";
import { parsePaymentConfig } from "@/lib/orders/payment";
import { QuantityStepper } from "./QuantityStepper";
import { Sheet } from "./Sheet";

const DETAILS_KEY = "menu_diner_details";

/**
 * Table reservation (restaurants and cafés). The request is saved for the owner's dashboard,
 * then sent on WhatsApp when the business has a number.
 */
export function ReservationSheet() {
  const { activeSheet, closeSheet, catalog, contact, settings, priceConfig, lang, t, module } = useCatalog();
  const settingsRow = settings as unknown as Record<string, unknown> | null;
  const booking = useMemo(() => parseBookingConfig(settingsRow?.booking_config), [settingsRow?.booking_config]);
  const payment = useMemo(() => parsePaymentConfig(settingsRow?.payment_config), [settingsRow?.payment_config]);
  const depositText = booking.enabled ? depositInstructions(booking, payment, priceConfig, lang, t) : null;
  const [slotsKey, setSlotsKey] = useState(0);
  const open = activeSheet === "reservation";
  const ar = lang === "ar";
  const businessName = localized(catalog, "name", lang) || catalog.name;

  const [form, setForm] = useState({ name: "", phone: "", date: "", time: "", notes: "" });
  const [guests, setGuests] = useState(2);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [saved, setSaved] = useState<SentOrder | null>(null);
  const [clientKey, setClientKey] = useState("");

  // Each time the sheet opens: clear old errors and pre-fill the customer's saved details
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setErrors({});
      setFailure(null);
      setSaved(null);
      setClientKey(newClientKey());
      try {
        const stored = JSON.parse(localStorage.getItem(DETAILS_KEY) || "{}");
        setForm((prev) => ({ ...prev, name: prev.name || stored.name || "", phone: prev.phone || stored.phone || "" }));
      } catch {
        // Nothing saved yet
      }
    }
  }

  const update = (field: keyof typeof form, value: string) => setForm((prev) => ({ ...prev, [field]: value }));
  const setWhen = useCallback((next: { date: string; time: string }) => setForm((prev) => ({ ...prev, ...next })), []);

  const openWhatsApp = (link: string) => {
    trackEvent(catalog.id, "booking_confirm");
    window.location.href = link;
  };

  const submit = async () => {
    if (sending) return;
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = t.required;
    if (form.phone.replace(/\D/g, "").length < 7) next.phone = t.required;
    if (!form.date) next.date = t.required;
    if (!form.time) next.time = t.required;
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSending(true);
    setFailure(null);
    const result = await sendOrder(catalog.slug, {
      kind: "booking",
      name: form.name.trim(),
      phone: form.phone.trim(),
      date: form.date,
      time: form.time,
      partySize: guests,
      note: form.notes.trim(),
      lang,
      clientKey,
    });
    setSending(false);

    if (result.ok) {
      setSaved(result.order);
      trackSent(result.order.kind, `${catalog.slug}-${result.order.number}`, null);
      if (result.order.whatsapp) openWhatsApp(result.order.whatsapp);
      return;
    }
    if (result.code === "slot_unavailable") {
      // Someone else just took the time: load the free times again
      setErrors({ time: t.slotTaken });
      setForm((prev) => ({ ...prev, time: "" }));
      setSlotsKey((n) => n + 1);
      return;
    }
    if (result.field === "when") {
      setErrors({ date: t.required, time: t.required });
      return;
    }
    if (result.field) {
      setErrors({ [result.field]: t.required });
      return;
    }
    setFailure(t.saveFailed);
  };

  const localMessage = () =>
    buildReservationMessage(
      {
        restaurantName: businessName,
        name: form.name.trim(),
        phone: form.phone.trim(),
        date: form.date,
        time: form.time,
        guests: String(guests),
        notes: form.notes.trim(),
      },
      lang,
      module.id
    );

  let footer: ReactNode;
  if (saved) {
    footer = (
      <div>
        <SavedNotice title={t.reserveSaved(saved.number)} body={saved.whatsapp ? t.reserveHint : t.savedNoWhatsapp} />
        <div className="flex flex-col gap-2">
          {saved.whatsapp && (
            <button
              type="button"
              onClick={() => openWhatsApp(saved.whatsapp!)}
              className="flex min-h-12 items-center justify-center gap-2 rounded-control bg-brand px-4 font-semibold text-brand-fg"
            >
              <MessageCircle className="h-5 w-5" aria-hidden />
              {t.handoffAgain}
            </button>
          )}
          <button type="button" onClick={closeSheet} className="flex min-h-12 items-center justify-center rounded-control border border-menu-input-border px-4 font-semibold">
            {t.done}
          </button>
        </div>
      </div>
    );
  } else {
    footer = (
      <div>
        {failure && (
          <div role="alert" className="mb-3 rounded-control border border-menu-danger px-4 py-3 text-sm text-menu-danger">
            {failure}
            {contact?.phone_whatsapp && (
              <button
                type="button"
                onClick={() => openWhatsApp(whatsappLink(contact.phone_whatsapp!, localMessage()))}
                className="mt-2 block font-semibold underline underline-offset-4"
              >
                {t.sendWithoutSaving}
              </button>
            )}
          </div>
        )}
        <button
          type="button"
          onClick={submit}
          disabled={sending}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-control bg-brand px-4 font-semibold text-brand-fg transition-transform active:scale-[0.99] disabled:opacity-70"
        >
          {sending ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : contact?.phone_whatsapp ? <MessageCircle className="h-5 w-5" aria-hidden /> : null}
          {sending ? t.sending : failure ? t.saveRetry : contact?.phone_whatsapp ? t.reserveSend : t.send}
        </button>
        <p className="mt-2 text-center text-xs text-menu-muted">
          {contact?.phone_whatsapp ? `${t.reserveHint} ` : ""}
          {t.privacyNote(businessName)}
        </p>
      </div>
    );
  }

  return (
    <Sheet open={open} onClose={closeSheet} title={t.reserveTitle} footer={footer}>
      <form
        className="space-y-5"
        noValidate
        inert={saved ? true : undefined}
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        {booking.enabled && (
          <div>
            <SlotPicker config={booking} date={form.date} time={form.time} onChange={setWhen} error={errors.time || errors.date} refreshKey={slotsKey} />
            {depositText && <p className="mt-3 rounded-2xl bg-brand-soft px-4 py-3 text-sm leading-relaxed"><bdi>{depositText}</bdi></p>}
          </div>
        )}

        <div className={booking.enabled ? "hidden" : "grid grid-cols-2 gap-3"}>
          <Field label={t.reserveDate} error={errors.date}>
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
          <Field label={t.reserveTime} error={errors.time}>
            {(props) => (
              <input {...props} type="time" step={900} value={form.time} onChange={(event) => update("time", event.target.value)} className={inputClass} />
            )}
          </Field>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold" id="guests-label">
            {t.reserveGuests}
          </span>
          <QuantityStepper value={guests} onChange={setGuests} label={t.reserveGuests} />
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
              placeholder={t.reserveNotesPlaceholder}
              className={`${inputClass} resize-none py-3`}
            />
          )}
        </Field>

        <button type="submit" className="sr-only" tabIndex={-1}>
          {t.send}
        </button>
      </form>
    </Sheet>
  );
}
