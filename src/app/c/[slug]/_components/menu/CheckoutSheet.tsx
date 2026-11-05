"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, MessageCircle } from "lucide-react";
import { useCatalog } from "../../_providers/CatalogProvider";
import { trackEvent } from "../AnalyticsTracker";
import { localized } from "../../_lib/i18n";
import { buildOrderMessage, whatsappLink, type OrderType } from "../../_lib/whatsapp";
import { newClientKey, sendOrder, type SentOrder } from "../../_lib/send-order";
import { ADDRESS_ORDER_TYPES } from "@/lib/modules/registry";
import { formatPrice, formatTotal } from "@/lib/catalog/price";
import { feeLine, parseDeliveryConfig, quoteDelivery, zoneName } from "@/lib/orders/delivery";
import { PAY_AT_TABLE, parsePaymentConfig, type PaymentMethod } from "@/lib/orders/payment";
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
  /** Chosen delivery area, when the business has set areas up */
  zoneId: string;
  payment: string;
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

  const [details, setDetails] = useState<Details>({ name: "", phone: "", address: "", area: "", zoneId: "", payment: "" });
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
  const settingsRow = settings as unknown as Record<string, unknown> | null;
  const delivery = useMemo(() => parseDeliveryConfig(settingsRow?.delivery_config), [settingsRow?.delivery_config]);
  const payment = useMemo(() => parsePaymentConfig(settingsRow?.payment_config), [settingsRow?.payment_config]);

  // Delivery areas: the customer picks one and its fee is added (the server works it out again)
  const zoned = orderType === "delivery" && delivery.zones.length > 0;
  const quote = zoned ? quoteDelivery(delivery, details.zoneId, cart, priceConfig.lbpRate) : null;
  const fee = quote ? quote.fee : null;
  const money = (amount: number) => formatPrice(amount, delivery.currency, priceConfig, lang).primary;
  const total = quote ? formatTotal([...cart, ...feeLine(quote.fee, quote.currency)], priceConfig, lang) : cartTotal;

  // Payment: asked only when the business offers more than one way, and never at the table
  const askPayment = payment.methods.length > 1 && !PAY_AT_TABLE.includes(orderType);
  const paymentMethod: PaymentMethod | null = PAY_AT_TABLE.includes(orderType)
    ? null
    : (payment.methods.find((m) => m === details.payment) ?? (payment.methods.length === 1 ? payment.methods[0] : null));
  const paymentHint = (method: PaymentMethod) =>
    method === "whish"
      ? t.payWhishHint(payment.whish_phone)
      : method === "omt"
        ? t.payOmtHint([payment.omt_name, payment.omt_phone].filter(Boolean).join(" · "))
        : method === "card"
          ? t.payCardHint
          : t.payCashHint;
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
        area: quote ? zoneName(quote.zone, lang) : details.area.trim(),
        name: details.name.trim(),
        phone: details.phone.trim(),
        notes: notes.trim(),
        when: askWhen && when.date && when.time ? `${when.date} ${when.time}` : undefined,
        orderNumber,
        deliveryFee: fee,
        deliveryCurrency: quote?.currency,
        paymentMethod,
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
    if (zoned && !quote) next.area = t.chooseArea;
    if (quote?.belowMinimum && quote.zone.min_order) next.area = t.belowMinimum(money(quote.zone.min_order));
    if (askPayment && !paymentMethod) next.payment = t.required;
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
      zoneId: zoned ? details.zoneId : undefined,
      paymentMethod: paymentMethod ?? undefined,
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
    if (result.code === "below_minimum" && quote?.zone.min_order) {
      setErrors({ area: t.belowMinimum(money(quote.zone.min_order)) });
      return;
    }
    if (result.field) {
      // The business may have changed its areas since the page loaded
      setErrors({ [result.field]: result.field === "area" ? t.chooseArea : t.required } as typeof errors);
      if (result.field === "area") router.refresh();
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
          {saved.statusUrl && (
            <Link
              href={saved.statusUrl}
              onClick={() => clearCart()}
              className="flex min-h-11 items-center justify-center px-4 text-sm font-semibold text-brand-ink underline underline-offset-4"
            >
              {t.trackOrder}
            </Link>
          )}
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
        {quote && (
          <dl className="mb-2 space-y-1 text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-menu-muted">{t.itemsSubtotal}</dt>
              <dd><Price value={cartTotal} /></dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-menu-muted">{t.deliveryFee}</dt>
              <dd className="font-semibold">{quote.fee > 0 ? <Price amount={quote.fee} currency={quote.currency} /> : t.freeDelivery}</dd>
            </div>
          </dl>
        )}
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <span className="text-menu-muted">{t.subtotal}</span>
          <Price value={total} className="text-lg" />
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
            {zoned ? (
              <Field
                label={t.area}
                error={errors.area}
                hint={
                  quote
                    ? [
                        quote.fee > 0 ? `${t.deliveryFee}: ${money(quote.fee)}` : `${t.deliveryFee}: ${t.freeDelivery}`,
                        quote.zone.eta_minutes ? t.areaEta(quote.zone.eta_minutes) : "",
                        quote.belowMinimum && quote.zone.min_order ? t.belowMinimum(money(quote.zone.min_order)) : "",
                      ]
                        .filter(Boolean)
                        .join(" · ")
                    : delivery.free_over
                      ? t.freeOverHint(money(delivery.free_over))
                      : undefined
                }
              >
                {(props) => (
                  <select
                    {...props}
                    value={quote ? details.zoneId : ""}
                    onChange={(event) => {
                      update("zoneId", event.target.value);
                      setErrors((prev) => ({ ...prev, area: undefined }));
                    }}
                    className={cn(inputClass, "appearance-auto")}
                  >
                    <option value="" disabled>
                      {t.chooseArea}
                    </option>
                    {delivery.zones.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zoneName(zone, lang)}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
            ) : (
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
            )}
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

        {askPayment && (
          <fieldset aria-describedby={errors.payment ? "payment-error" : undefined}>
            <legend className="text-sm font-semibold">{t.payment}</legend>
            <div className="mt-1.5 space-y-2">
              {payment.methods.map((method) => (
                <label
                  key={method}
                  className={cn(
                    "flex min-h-12 cursor-pointer items-start gap-3 rounded-control border px-4 py-3 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--brand-ink)]",
                    paymentMethod === method ? "border-brand-ink bg-brand-soft" : "border-menu-input-border bg-menu-surface"
                  )}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={method}
                    checked={paymentMethod === method}
                    onChange={() => {
                      update("payment", method);
                      setErrors((prev) => ({ ...prev, payment: undefined }));
                    }}
                    className="mt-1 h-4 w-4 shrink-0 accent-[var(--brand-ink)]"
                  />
                  <span className="min-w-0">
                    <span className="block font-semibold">{t.payMethods[method]}</span>
                    <span className="block text-sm text-menu-muted">
                      <bdi>{paymentHint(method)}</bdi>
                    </span>
                  </span>
                </label>
              ))}
            </div>
            {errors.payment && (
              <p id="payment-error" className="mt-1 text-sm text-menu-danger">
                {errors.payment}
              </p>
            )}
          </fieldset>
        )}

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
