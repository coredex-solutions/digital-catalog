"use client";

import { useId, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, MessageCircle } from "lucide-react";
import { useCatalog } from "../../_providers/CatalogProvider";
import { trackEvent } from "../AnalyticsTracker";
import { localized } from "../../_lib/i18n";
import { buildOrderMessage, whatsappLink, type OrderType } from "../../_lib/whatsapp";
import { newClientKey, sendOrder, type SentOrder } from "../../_lib/send-order";
import { ADDRESS_ORDER_TYPES } from "@/lib/modules/registry";
import { Price } from "./Price";
import { Sheet } from "./Sheet";
import { cn } from "@/utils/helpers";

// Saved on this device so returning customers don't retype their details
const DETAILS_KEY = "menu_diner_details";

interface Details {
  name: string;
  phone: string;
  address: string;
  area: string;
}

type FieldName = keyof Details | "table" | "when" | "orderType";

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

/** Today's date in Beirut as YYYY-MM-DD, for date pickers' minimum */
export function todayInBeirut(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Beirut" }).format(new Date());
}

/** Saved order shown after sending: the number, then WhatsApp (when the business has it) */
export function SavedNotice({ title, body }: { title: string; body: string }) {
  return (
    <div role="status" className="mb-3 rounded-control bg-menu-subtle px-4 py-3">
      <p className="flex items-center gap-2 font-semibold">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-ink" aria-hidden />
        {title}
      </p>
      <p className="mt-1 text-sm text-menu-muted">{body}</p>
    </div>
  );
}

export function CheckoutSheet() {
  const router = useRouter();
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
    module,
    orderTypes,
    orderType,
    setOrderType,
    table,
    setTable,
    clearCart,
  } = useCatalog();
  const open = activeSheet === "checkout";
  const businessName = localized(catalog, "name", lang) || catalog.name;

  const [details, setDetails] = useState<Details>({ name: "", phone: "", address: "", area: "" });
  const [when, setWhen] = useState({ date: "", time: "" });
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [sending, setSending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [saved, setSaved] = useState<SentOrder | null>(null);
  const [clientKey, setClientKey] = useState("");

  // Each time the sheet opens: start fresh and pre-fill the customer's saved details
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setSaved(null);
      setFailure(null);
      setErrors({});
      setClientKey(newClientKey());
      try {
        const stored = JSON.parse(localStorage.getItem(DETAILS_KEY) || "{}");
        setDetails((prev) => ({ ...prev, ...stored }));
      } catch {
        // Nothing saved yet
      }
    }
  }

  const update = (field: keyof Details, value: string) => setDetails((prev) => ({ ...prev, [field]: value }));

  const deliveryNote = localized(settings || {}, "delivery_note", lang);
  const needsAddress = ADDRESS_ORDER_TYPES.includes(orderType);
  // Cafés: optional pre-order time (not for eating in). Services: required appointment time.
  const askWhen = module.schedule === "required" || (module.schedule === "optional" && orderType !== "dine_in");
  const whenRequired = module.schedule === "required";

  const localMessage = (orderNumber?: number) =>
    buildOrderMessage(
      cart,
      {
        restaurantName: businessName,
        orderType,
        table: table.trim(),
        address: details.address.trim(),
        area: details.area.trim(),
        name: details.name.trim(),
        phone: details.phone.trim(),
        notes: notes.trim(),
        when: askWhen && when.date && when.time ? `${when.date} ${when.time}` : undefined,
        orderNumber,
      },
      priceConfig,
      lang,
      module.id
    );

  const openWhatsApp = (link: string) => {
    trackEvent(catalog.id, "whatsapp_click");
    // Same-tab navigation: popup blockers on iOS Safari block window.open after async work
    window.location.href = link;
  };

  const submit = async () => {
    if (sending) return;
    const next: typeof errors = {};
    if (!details.name.trim()) next.name = t.required;
    if (details.phone.replace(/\D/g, "").length < 7) next.phone = t.required;
    if (orderType === "dine_in" && !table.trim()) next.table = t.required;
    if (needsAddress && !details.address.trim()) next.address = t.required;
    if (askWhen && (whenRequired || when.date || when.time) && !(when.date && when.time)) next.when = t.required;
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    try {
      localStorage.setItem(DETAILS_KEY, JSON.stringify(details));
    } catch {
      // Storage unavailable; ordering still works
    }

    setSending(true);
    setFailure(null);
    const result = await sendOrder(catalog.slug, {
      kind: "order",
      orderType,
      lines: cart.map((line) => ({ itemId: line.id, variantId: line.variant?.id, quantity: line.quantity, note: line.note })),
      name: details.name.trim(),
      phone: details.phone.trim(),
      table: table.trim(),
      address: details.address.trim(),
      area: details.area.trim(),
      date: askWhen ? when.date : "",
      time: askWhen ? when.time : "",
      note: notes.trim(),
      lang,
      clientKey,
    });
    setSending(false);

    if (result.ok) {
      setSaved(result.order);
      if (result.order.whatsapp) openWhatsApp(result.order.whatsapp);
      return;
    }
    if (result.code === "stock_changed" || result.code === "item_unavailable") {
      setFailure(t.stockChanged);
      // Reload the items so sold-out and stock changes show
      router.refresh();
      return;
    }
    if (result.field) {
      setErrors({ [result.field]: t.required } as typeof errors);
      return;
    }
    setFailure(t.saveFailed);
  };

  let footer: ReactNode;
  if (saved) {
    footer = (
      <div>
        <SavedNotice title={t.savedTitle(saved.number)} body={saved.whatsapp ? t.savedBody : t.savedNoWhatsapp} />
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
          <button
            type="button"
            onClick={() => {
              clearCart();
              closeSheet();
            }}
            className="flex min-h-12 items-center justify-center rounded-control border border-menu-input-border px-4 font-semibold"
          >
            {saved.whatsapp ? t.handoffDone : t.done}
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
            {failure === t.saveFailed && contact?.phone_whatsapp && (
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
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <span className="text-menu-muted">{t.subtotal}</span>
          <Price value={cartTotal} className="text-lg" />
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={sending || cart.length === 0}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-control bg-brand px-4 font-semibold text-brand-fg transition-transform active:scale-[0.99] disabled:opacity-70"
        >
          {sending ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : contact?.phone_whatsapp ? <MessageCircle className="h-5 w-5" aria-hidden /> : null}
          {sending ? t.sending : failure === t.saveFailed ? t.saveRetry : contact?.phone_whatsapp ? t.sendWhatsApp : t.checkout}
        </button>
        <p className="mt-2 text-center text-xs text-menu-muted">
          {contact?.phone_whatsapp ? `${t.whatsappHint} ` : ""}
          {t.privacyNote(businessName)}
        </p>
      </div>
    );
  }

  return (
    <Sheet open={open} onClose={() => (saved ? closeSheet() : openSheet("cart"))} title={t.checkout} footer={footer}>
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        noValidate
        inert={saved ? true : undefined}
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

        {needsAddress && (
          <>
            <Field label={orderType === "home_visit" ? t.visitAddress : t.address} error={errors.address}>
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
            {orderType === "delivery" && deliveryNote && (
              <p className="rounded-2xl bg-brand-soft px-4 py-3 text-sm leading-relaxed">{deliveryNote}</p>
            )}
          </>
        )}

        {askWhen && (
          <fieldset>
            <legend className="text-sm font-semibold">{whenRequired ? t.appointmentLabel : t.whenLabel}</legend>
            <div className="mt-1.5 grid grid-cols-2 gap-3">
              <input
                type="date"
                min={todayInBeirut()}
                value={when.date}
                onChange={(event) => setWhen((prev) => ({ ...prev, date: event.target.value }))}
                aria-invalid={!!errors.when}
                aria-label={t.preferredDate}
                className={inputClass}
              />
              <input
                type="time"
                step={900}
                value={when.time}
                onChange={(event) => setWhen((prev) => ({ ...prev, time: event.target.value }))}
                aria-invalid={!!errors.when}
                aria-label={t.preferredTime}
                className={inputClass}
              />
            </div>
            <p className={cn("mt-1 text-sm", errors.when ? "text-menu-danger" : "text-menu-muted")}>
              {errors.when || (whenRequired ? t.appointmentHint : t.whenHint)}
            </p>
          </fieldset>
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
