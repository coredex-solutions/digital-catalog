"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { MessageCircle } from "lucide-react";
import { useCatalog } from "../../_providers/CatalogProvider";
import { trackEvent } from "../AnalyticsTracker";
import { localized } from "../../_lib/i18n";
import { buildOrderMessage, whatsappLink, type OrderType } from "../../_lib/whatsapp";
import { Price } from "./Price";
import { Sheet } from "./Sheet";
import { cn } from "@/utils/helpers";

// Saved on this device so returning diners don't retype their details
const DETAILS_KEY = "menu_diner_details";

interface Details {
  name: string;
  phone: string;
  address: string;
  area: string;
}

export function Field({
  label,
  error,
  children,
  hint,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: (props: { id: string; "aria-invalid": boolean; "aria-describedby"?: string }) => ReactNode;
}) {
  const id = useId();
  const messageId = `${id}-message`;
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <div className="mt-1.5">
        {children({ id, "aria-invalid": !!error, "aria-describedby": error || hint ? messageId : undefined })}
      </div>
      {(error || hint) && (
        <p id={messageId} className={cn("mt-1 text-sm", error ? "text-menu-danger" : "text-menu-muted")}>
          {error || hint}
        </p>
      )}
    </div>
  );
}

export const inputClass =
  "w-full min-h-12 rounded-control border border-menu-input-border bg-menu-surface px-4 text-base placeholder:text-menu-muted focus:border-brand-ink focus:outline-none aria-[invalid=true]:border-menu-danger";

export function CheckoutSheet() {
  const {
    activeSheet,
    closeSheet,
    openSheet,
    catalog,
    contact,
    settings,
    cart,
    cartTotal,
    priceConfig,
    lang,
    t,
    orderTypes,
    orderType,
    setOrderType,
    table,
    setTable,
    clearCart,
  } = useCatalog();
  const open = activeSheet === "checkout";

  const [details, setDetails] = useState<Details>({ name: "", phone: "", address: "", area: "" });
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof Details | "table", string>>>({});
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSent(false);
    setErrors({});
    try {
      const saved = JSON.parse(localStorage.getItem(DETAILS_KEY) || "{}");
      setDetails((prev) => ({ ...prev, ...saved }));
    } catch {
      // Nothing saved yet
    }
  }, [open]);

  const update = (field: keyof Details, value: string) => setDetails((prev) => ({ ...prev, [field]: value }));

  const deliveryNote = localized(settings || {}, "delivery_note", lang);

  const submit = () => {
    const next: typeof errors = {};
    if (!details.name.trim()) next.name = t.required;
    if (details.phone.replace(/\D/g, "").length < 7) next.phone = t.required;
    if (orderType === "dine_in" && !table.trim()) next.table = t.required;
    if (orderType === "delivery" && !details.address.trim()) next.address = t.required;
    setErrors(next);
    if (Object.keys(next).length > 0 || !contact?.phone_whatsapp) return;

    try {
      localStorage.setItem(DETAILS_KEY, JSON.stringify(details));
    } catch {
      // Storage unavailable; ordering still works
    }

    const message = buildOrderMessage(
      cart,
      {
        restaurantName: localized(catalog, "name", lang) || catalog.name,
        orderType,
        table: table.trim(),
        address: details.address.trim(),
        area: details.area.trim(),
        name: details.name.trim(),
        phone: details.phone.trim(),
        notes: notes.trim(),
      },
      priceConfig,
      lang
    );

    trackEvent(catalog.id, "whatsapp_click");
    // Same-tab navigation: popup blockers on iOS Safari block window.open after async work
    window.location.href = whatsappLink(contact.phone_whatsapp, message);
    setSent(true);
  };

  // Opening WhatsApp is a handoff, not a placed order: say so, and let the diner reopen it
  // or clear the order once they've actually sent it
  const footer = sent ? (
    <div>
      <div role="status" className="mb-3 rounded-control bg-menu-subtle px-4 py-3">
        <p className="flex items-center gap-2 font-semibold">
          <MessageCircle className="h-5 w-5 shrink-0" aria-hidden />
          {t.handoffTitle}
        </p>
        <p className="mt-1 text-sm text-menu-muted">{t.handoffBody}</p>
      </div>
      <div className="flex flex-col gap-2">
        <button type="button" onClick={submit} className="flex min-h-12 items-center justify-center gap-2 rounded-control bg-brand px-4 font-semibold text-brand-fg">
          {t.handoffAgain}
        </button>
        <button
          type="button"
          onClick={() => {
            clearCart();
            closeSheet();
          }}
          className="flex min-h-12 items-center justify-center rounded-control border border-menu-input-border px-4 font-semibold"
        >
          {t.handoffDone}
        </button>
      </div>
    </div>
  ) : (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <span className="text-menu-muted">{t.subtotal}</span>
        <Price value={cartTotal} className="text-lg" />
      </div>
      <button
        type="button"
        onClick={submit}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-control bg-brand px-4 font-semibold text-brand-fg transition-transform active:scale-[0.99]"
      >
        <MessageCircle className="h-5 w-5" aria-hidden />
        {t.sendWhatsApp}
      </button>
      <p className="mt-2 text-center text-xs text-menu-muted">{t.whatsappHint}</p>
    </div>
  );

  return (
    <Sheet open={open} onClose={() => openSheet("cart")} title={t.checkout} footer={footer}>
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        noValidate
      >
        {orderTypes.length > 1 && (
          <fieldset>
            <legend className="text-sm font-semibold">{t.orderType}</legend>
            <div className="mt-1.5 grid gap-1 rounded-[12px] bg-menu-raised p-1" style={{ gridTemplateColumns: `repeat(${orderTypes.length}, minmax(0, 1fr))` }}>
              {orderTypes.map((type: OrderType) => (
                <label
                  key={type}
                  className={cn(
                    "flex min-h-11 cursor-pointer items-center justify-center rounded-control px-2 text-center text-sm font-semibold transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--brand-ink)]",
                    orderType === type ? "bg-menu-surface text-menu-ink shadow-menu-sm ring-1 ring-[var(--menu-input-border)]" : "text-menu-muted"
                  )}
                >
                  <input
                    type="radio"
                    name="order-type"
                    value={type}
                    checked={orderType === type}
                    onChange={() => setOrderType(type)}
                    className="sr-only"
                  />
                  {t[type]}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {orderType === "dine_in" && (
          <Field label={t.tableNumber} error={errors.table}>
            {(props) => (
              <input
                {...props}
                value={table}
                onChange={(event) => setTable(event.target.value.slice(0, 10))}
                placeholder={t.tablePlaceholder}
                inputMode="numeric"
                className={inputClass}
              />
            )}
          </Field>
        )}

        {orderType === "delivery" && (
          <>
            <Field label={t.address} error={errors.address}>
              {(props) => (
                <input
                  {...props}
                  value={details.address}
                  onChange={(event) => update("address", event.target.value.slice(0, 200))}
                  placeholder={t.addressPlaceholder}
                  autoComplete="street-address"
                  className={inputClass}
                />
              )}
            </Field>
            <Field label={t.area}>
              {(props) => (
                <input
                  {...props}
                  value={details.area}
                  onChange={(event) => update("area", event.target.value.slice(0, 80))}
                  placeholder={t.areaPlaceholder}
                  className={inputClass}
                />
              )}
            </Field>
            {deliveryNote && <p className="rounded-2xl bg-brand-soft px-4 py-3 text-sm leading-relaxed">{deliveryNote}</p>}
          </>
        )}

        <Field label={t.name} error={errors.name}>
          {(props) => (
            <input
              {...props}
              value={details.name}
              onChange={(event) => update("name", event.target.value.slice(0, 80))}
              autoComplete="name"
              className={inputClass}
            />
          )}
        </Field>

        <Field label={t.phone} error={errors.phone}>
          {(props) => (
            <input
              {...props}
              type="tel"
              dir="ltr"
              value={details.phone}
              onChange={(event) => update("phone", event.target.value.slice(0, 20))}
              placeholder={t.phonePlaceholder}
              autoComplete="tel"
              inputMode="tel"
              className={cn(inputClass, lang === "ar" && "text-end")}
            />
          )}
        </Field>

        <Field label={t.notes}>
          {(props) => (
            <textarea
              {...props}
              value={notes}
              onChange={(event) => setNotes(event.target.value.slice(0, 300))}
              placeholder={t.notesPlaceholder}
              rows={2}
              className={cn(inputClass, "resize-none py-3")}
            />
          )}
        </Field>

        {/* Lets the keyboard's Go/Enter key submit */}
        <button type="submit" className="sr-only" tabIndex={-1}>
          {t.sendWhatsApp}
        </button>
      </form>
    </Sheet>
  );
}
