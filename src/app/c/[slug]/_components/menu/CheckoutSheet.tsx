"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, MessageCircle } from "lucide-react";
import { useCatalog } from "../../_providers/CatalogProvider";
import { trackEvent } from "../AnalyticsTracker";
import { localized } from "../../_lib/i18n";
import { buildOrderMessage, whatsappLink, type OrderType } from "../../_lib/whatsapp";
import { newClientKey, sendOrder, type SentOrder } from "../../_lib/send-order";
import { trackSent } from "../../_lib/tracking";
import { ADDRESS_ORDER_TYPES } from "@/lib/modules/registry";
import { formatPrice, formatTotal } from "@/lib/catalog/price";
import { feeLine, parseDeliveryConfig, quoteDelivery, zoneName } from "@/lib/orders/delivery";
import { PAY_AT_TABLE, parsePaymentConfig, type PaymentMethod } from "@/lib/orders/payment";
import { parseBookingConfig, requestMinutes } from "@/lib/orders/slots";
import { SlotPicker } from "./SlotPicker";
import { depositInstructions, Field, inputClass, SavedNotice, todayInBeirut } from "./form-parts";
import { couponDiscount, discountLine, normalizeCode, type CouponTerms } from "@/lib/orders/coupons";
import { nightsBetween, stayDeposit } from "@/lib/orders/stays";
import { stayDate } from "../../_lib/whatsapp";
import { CalendarDays } from "lucide-react";
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
    stay,
    stayRules,
    openDates,
    refreshStayAvailability,
  } = useCatalog();
  const stayNightsCount = module.nights && stay ? nightsBetween(stay.checkIn, stay.checkOut) : 0;
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
  // Coupon: checked with the server when applied; the discount follows the basket (the server works it out again)
  const [coupon, setCoupon] = useState<{ open: boolean; input: string; applied: CouponTerms | null; error: string | null; checking: boolean }>({
    open: false,
    input: "",
    applied: null,
    error: null,
    checking: false,
  });
  const couponResult = coupon.applied ? couponDiscount(coupon.applied, cart, priceConfig.lbpRate) : null;
  const discount = coupon.applied && couponResult?.ok ? { code: coupon.applied.code, amount: couponResult.discount, currency: couponResult.currency } : null;
  const couponWarning =
    coupon.applied && couponResult && !couponResult.ok
      ? couponResult.problem === "below_minimum" && coupon.applied.min_order
        ? t.couponMinimum(formatPrice(coupon.applied.min_order, coupon.applied.currency, priceConfig, lang).primary)
        : t.couponProblems[couponResult.problem]
      : null;
  const total =
    quote || discount
      ? formatTotal([...cart, ...feeLine(quote?.fee, quote?.currency), ...discountLine(discount?.amount, discount?.currency)], priceConfig, lang)
      : cartTotal;

  const applyCoupon = async () => {
    const code = normalizeCode(coupon.input);
    if (!code) return;
    setCoupon((prev) => ({ ...prev, checking: true, error: null }));
    try {
      const res = await fetch(`/api/c/${catalog.slug}/coupon/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
      const data = await res.json().catch(() => ({}));
      if (data.ok) setCoupon((prev) => ({ ...prev, checking: false, applied: data.coupon, input: data.coupon.code }));
      else setCoupon((prev) => ({ ...prev, checking: false, error: t.couponProblems[data.problem] ?? (res.status === 429 ? t.saveFailed : t.couponProblems.invalid) }));
    } catch {
      setCoupon((prev) => ({ ...prev, checking: false, error: t.saveFailed }));
    }
  };

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
  // Appointments with set times: pick one of the free times instead of any date and time
  const booking = useMemo(() => parseBookingConfig(settingsRow?.booking_config), [settingsRow?.booking_config]);
  const useSlots = whenRequired && booking.enabled;
  const appointmentMinutes = requestMinutes(cart, booking);
  const [slotsKey, setSlotsKey] = useState(0);
  const depositText = useSlots ? depositInstructions(booking, payment, priceConfig, lang, t) : null;

  // Stays: a deposit as a part of the total, when every room is priced in the same currency
  const stayDepositText = (() => {
    if (!module.nights || !stayRules.deposit_percent || cart.length === 0) return null;
    const currency = (cart[0].currency || "USD").toUpperCase();
    if (cart.some((line) => (line.currency || "USD").toUpperCase() !== currency)) return null;
    const off = discount && discount.currency.toUpperCase() === currency ? discount.amount : 0;
    const amount = stayDeposit(stayRules, cart.reduce((sum, line) => sum + line.price * line.quantity, 0) - off, currency);
    if (amount === null) return null;
    const money = formatPrice(amount, currency, priceConfig, lang).primary;
    const how = payment.whish_phone
      ? t.custDepositWhish(money, payment.whish_phone)
      : payment.omt_phone
        ? t.custDepositOmt(money, [payment.omt_name, payment.omt_phone].filter(Boolean).join(" · "))
        : "";
    return [t.stayDepositNote(stayRules.deposit_percent, money), how].filter(Boolean).join(" ");
  })();
  // Stays: every guest needs a bed (rooms without a limit count as enough)
  const beds = cart.reduce((sum, line) => (sum === Infinity || !line.max_guests ? Infinity : sum + line.max_guests * line.quantity), 0);

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
        discount: discount?.amount,
        discountCurrency: discount?.currency,
        couponCode: discount?.code,
        paymentMethod,
        ...(module.nights && stay ? { when: `${stay.checkIn} ${stayRules.check_in}`, checkOut: stay.checkOut, guests: stay.guests } : {}),
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
    if (module.nights) {
      if (!stay) {
        openDates();
        return;
      }
      if (stay.guests > beds) {
        setFailure(t.tooManyGuests(beds));
        return;
      }
    }

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
      couponCode: discount ? discount.code : undefined,
      date: askWhen ? when.date : "",
      time: askWhen ? when.time : "",
      ...(module.nights && stay ? { checkIn: stay.checkIn, checkOut: stay.checkOut, guests: stay.guests } : {}),
      note: notes.trim(),
      lang,
      clientKey,
    });
    setSending(false);

    if (result.ok) {
      setSaved(result.order);
      trackSent(result.order.kind, `${catalog.slug}-${result.order.number}`, result.order.totalUsd);
      if (result.order.whatsapp) openWhatsApp(result.order.whatsapp);
      return;
    }
    if (result.code === "stock_changed" || result.code === "item_unavailable") {
      setFailure(t.stockChanged);
      // Reload the items so sold-out and stock changes show
      router.refresh();
      return;
    }
    if (result.code === "coupon") {
      // The code ran out or changed since it was applied
      setCoupon((prev) => ({ ...prev, open: true, applied: null, error: t.couponProblems[result.detail ?? "invalid"] ?? t.couponProblems.invalid }));
      return;
    }
    if (result.code === "stay_unavailable") {
      // Someone else just booked one of the nights: load what's free again
      setFailure(t.stayTaken);
      refreshStayAvailability();
      return;
    }
    if (result.code === "stay_dates") {
      setFailure(t.stayProblems[result.detail ?? "invalid"] ?? t.stayProblems.invalid);
      return;
    }
    if (result.code === "too_many_guests") {
      setFailure(t.tooManyGuests(result.limit ?? beds));
      return;
    }
    if (result.code === "slot_unavailable") {
      // Someone else just took the time: load the free times again
      setErrors({ when: t.slotTaken });
      setWhen((prev) => ({ ...prev, time: "" }));
      setSlotsKey((n) => n + 1);
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
        {(quote || discount) && (
          <dl className="mb-2 space-y-1 text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-menu-muted">{t.itemsSubtotal}</dt>
              <dd><Price value={cartTotal} /></dd>
            </div>
            {quote && (
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-menu-muted">{t.deliveryFee}</dt>
                <dd className="font-semibold">{quote.fee > 0 ? <Price amount={quote.fee} currency={quote.currency} /> : t.freeDelivery}</dd>
              </div>
            )}
            {discount && (
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-menu-muted">
                  {t.msgDiscount} <bdi className="font-semibold">({discount.code})</bdi>
                </dt>
                <dd className="font-semibold">
                  −<Price amount={discount.amount} currency={discount.currency} />
                </dd>
              </div>
            )}
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

        {module.nights && stay && stayNightsCount > 0 && (
          <div>
            <p className="text-sm font-semibold">{t.stayLabel}</p>
            <div className="mt-1.5 flex items-start gap-3 rounded-control border border-menu-input-border px-4 py-3">
              <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-brand-ink" aria-hidden />
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-semibold">
                  {stayDate(stay.checkIn, lang)} {lang === "ar" ? "←" : "→"} {stayDate(stay.checkOut, lang)}
                </p>
                <p className="text-menu-muted">
                  {t.nightsCount(stayNightsCount)} · {t.guestsCount(stay.guests)}
                </p>
                <p className="text-menu-muted">
                  {t.checkInFrom(stayRules.check_in)} · {t.checkOutBy(stayRules.check_out)}
                </p>
              </div>
              <button type="button" onClick={() => openDates()} className="min-h-11 shrink-0 px-1 text-sm font-semibold text-brand-ink underline underline-offset-4">
                {t.changeDates}
              </button>
            </div>
            {stayDepositText && (
              <p className="mt-3 rounded-2xl bg-brand-soft px-4 py-3 text-sm leading-relaxed">
                <bdi>{stayDepositText}</bdi>
              </p>
            )}
          </div>
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

        {useSlots && (
          <div>
            <SlotPicker
              config={booking}
              date={when.date}
              time={when.time}
              minutes={appointmentMinutes}
              onChange={setWhen}
              error={errors.when}
              refreshKey={slotsKey}
            />
            {depositText && <p className="mt-3 rounded-2xl bg-brand-soft px-4 py-3 text-sm leading-relaxed"><bdi>{depositText}</bdi></p>}
          </div>
        )}

        {askWhen && !useSlots && (
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

        {(settings?.has_coupons || coupon.applied) && (
        <div>
          {coupon.applied ? (
            <div className="flex items-center justify-between gap-3 rounded-control border border-brand-ink bg-brand-soft px-4 py-3 text-sm">
              <span>
                <span className="font-semibold">
                  <bdi>{t.couponApplied(coupon.applied.code)}</bdi>
                </span>
                {discount && (
                  <span className="ms-2">
                    −<Price amount={discount.amount} currency={discount.currency} />
                  </span>
                )}
                {couponWarning && <span className="mt-1 block text-menu-danger">{couponWarning}</span>}
              </span>
              <button
                type="button"
                onClick={() => setCoupon({ open: true, input: "", applied: null, error: null, checking: false })}
                className="min-h-11 shrink-0 px-2 font-semibold underline underline-offset-4"
              >
                {t.couponRemove}
              </button>
            </div>
          ) : coupon.open ? (
            <Field label={t.couponLabel} error={coupon.error ?? undefined}>
              {(props) => (
                <div className="flex gap-2">
                  <input
                    {...props}
                    value={coupon.input}
                    onChange={(event) => setCoupon((prev) => ({ ...prev, input: event.target.value.slice(0, 24), error: null }))}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        applyCoupon();
                      }
                    }}
                    autoCapitalize="characters"
                    autoComplete="off"
                    dir="ltr"
                    className={cn(inputClass, "uppercase")}
                  />
                  <button
                    type="button"
                    onClick={applyCoupon}
                    disabled={coupon.checking || !coupon.input.trim()}
                    className="flex min-h-12 shrink-0 items-center gap-2 rounded-control border border-menu-input-border px-4 font-semibold disabled:opacity-60"
                  >
                    {coupon.checking && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                    {t.couponApply}
                  </button>
                </div>
              )}
            </Field>
          ) : (
            <button
              type="button"
              onClick={() => setCoupon((prev) => ({ ...prev, open: true }))}
              className="min-h-11 text-sm font-semibold text-brand-ink underline underline-offset-4"
            >
              {t.couponLink}
            </button>
          )}
        </div>
        )}

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
