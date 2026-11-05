import { CalendarClock, ChefHat, Check, Clock, MapPin, MessageCircle, Phone, Wallet, X } from "lucide-react";
import { formatPrice, formatTotal } from "@/lib/catalog/price";
import { getDictionary } from "../c/[slug]/_lib/i18n";
import { SAMPLE_ORDERS, type Business } from "./samples";
import type { SiteCopy, SiteLang } from "./copy";

const PRICES = { primary: "USD" as const, lbpRate: 89500, rateUpdatedAt: null, showDual: true };

/** A picture of the Orders page for one kind of business (not interactive: the buttons are drawn, not wired) */
export function OrdersInboxDemo({ t, lang, business }: { t: SiteCopy["whatsappDemo"]; lang: SiteLang; business: Business }) {
  const sample = SAMPLE_ORDERS[business];
  const d = sample.details;
  const words = getDictionary(lang, business);
  const fee = d.orderType === "delivery" && d.deliveryFee != null ? d.deliveryFee : null;
  const total = formatTotal(
    [
      ...sample.lines,
      ...(fee ? [{ price: fee, currency: d.deliveryCurrency || "USD", quantity: 1 }] : []),
      ...(d.discount ? [{ price: -d.discount, currency: d.discountCurrency || "USD", quantity: 1 }] : []),
    ],
    PRICES,
    lang
  );
  const money = (amount: number) => formatPrice(amount, "USD", PRICES, lang).primary;
  const fakeButton = "inline-flex items-center gap-1.5 rounded-control px-3 text-sm font-semibold";
  const kind = `${t.inbox.kinds[business]} · ${words[d.orderType]}`;

  // Where and when: the table, the delivery address or the booked time
  const place =
    d.orderType === "dine_in" ? (
      <>
        <ChefHat className="h-4 w-4 shrink-0 text-ui-muted" aria-hidden />
        {words.msgTable}: <strong>{d.table}</strong>
      </>
    ) : d.address ? (
      <>
        <MapPin className="h-4 w-4 shrink-0 text-ui-muted" aria-hidden />
        <span>
          <strong>{d.area?.[lang]}</strong> · {d.address[lang]}
        </span>
      </>
    ) : d.when ? (
      <>
        {business === "services" ? <CalendarClock className="h-4 w-4 shrink-0 text-ui-muted" aria-hidden /> : <Clock className="h-4 w-4 shrink-0 text-ui-muted" aria-hidden />}
        {words.msgWhen}: <strong>{d.when[lang].replace(" ", " · ")}</strong>
      </>
    ) : null;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-panel border border-ui-line bg-ui-bg shadow-[0_24px_48px_-32px_rgba(23,21,46,0.4)]">
      {/* Window bar */}
      <div className="flex items-center gap-2 border-b border-ui-line bg-ui-surface px-4 py-3">
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-ui-line" />
          <span className="h-2.5 w-2.5 rounded-full bg-ui-line" />
          <span className="h-2.5 w-2.5 rounded-full bg-ui-line" />
        </span>
        <span className="ms-2 font-semibold text-ui-heading">{t.inbox.title}</span>
      </div>

      <div className="flex-1 p-4">
        {/* Tabs */}
        <div className="grid grid-cols-3 gap-1 rounded-panel bg-ui-subtle p-1 text-sm font-semibold" aria-hidden>
          {t.inbox.tabs.map((tab, index) => (
            <span key={tab} className={`flex min-h-9 items-center justify-center gap-1.5 rounded-control ${index === 0 ? "bg-ui-surface text-ui-ink shadow-sm" : "text-ui-muted"}`}>
              {tab}
              {index === 0 && <span className="rounded-full bg-ui-primary px-1.5 py-0.5 text-[11px] leading-none text-white">1</span>}
            </span>
          ))}
        </div>

        {/* Order card */}
        <article className="mt-3 rounded-panel border border-ui-line bg-ui-surface p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-ui-heading">
                #{sample.number} · <span className="text-sm">{kind}</span>
              </p>
              <p className="text-xs text-ui-muted">{t.inbox.time}</p>
            </div>
            <span className="rounded-full bg-ui-primary px-2.5 py-1 text-xs font-semibold text-ui-primary-fg">{t.inbox.status}</span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            <p className="font-semibold">{sample.customer[lang]}</p>
            <bdi className="text-sm text-ui-muted">{sample.phone}</bdi>
            <span className="flex gap-1.5" aria-hidden>
              <span className={`${fakeButton} min-h-8 border border-ui-line px-2`}>
                <Phone className="h-3.5 w-3.5" />
              </span>
              <span className={`${fakeButton} min-h-8 border border-ui-line px-2`}>
                <MessageCircle className="h-3.5 w-3.5" />
              </span>
            </span>
          </div>

          {place && <p className="mt-2 flex items-center gap-2 text-sm">{place}</p>}

          <div className="mt-3 rounded-control bg-ui-bg p-3 text-sm">
            <ul className="space-y-1.5">
              {sample.lines.map((line) => (
                <li key={line.name_en} className="flex justify-between gap-3">
                  <span>
                    <strong className="tabular-nums">{line.quantity} ×</strong> {lang === "ar" ? line.name_ar : line.name_en}
                  </span>
                  <bdi className="tabular-nums">{money(line.price * line.quantity)}</bdi>
                </li>
              ))}
              {fee != null && (
                <li className="flex justify-between gap-3 text-ui-muted">
                  <span>{words.msgDelivery}</span>
                  <bdi className="tabular-nums">{fee > 0 ? money(fee) : words.freeDelivery}</bdi>
                </li>
              )}
              {d.discount ? (
                <li className="flex justify-between gap-3 text-ui-success">
                  <span>
                    {words.msgDiscount} <bdi dir="ltr">({d.couponCode})</bdi>
                  </span>
                  <bdi className="tabular-nums">−{money(d.discount)}</bdi>
                </li>
              ) : null}
            </ul>
            <p className="mt-2 flex justify-between gap-3 border-t border-ui-line pt-2 font-semibold">
              <span>{t.inbox.total}</span>
              <span className="inline-flex flex-wrap items-baseline justify-end gap-x-2 tabular-nums">
                <bdi>{total.primary}</bdi>
                {total.secondary && <bdi className="font-normal text-ui-muted">{total.secondary}</bdi>}
              </span>
            </p>
          </div>

          {d.paymentMethod && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-ui-muted" aria-hidden />
                {words.msgPayment}: <strong>{words.payMethods[d.paymentMethod]}</strong>
                <span className="text-ui-muted">· {t.inbox.notPaid}</span>
              </span>
              <span className={`${fakeButton} min-h-8 border border-ui-line`} aria-hidden>
                {t.inbox.markPaid}
              </span>
            </div>
          )}

          <div className="mt-4 flex gap-2" aria-hidden>
            <span className={`${fakeButton} min-h-10 bg-ui-primary text-ui-primary-fg`}>
              <Check className="h-4 w-4" />
              {t.inbox.confirm}
            </span>
            <span className={`${fakeButton} min-h-10 text-ui-danger`}>
              <X className="h-4 w-4" />
              {t.inbox.cancel}
            </span>
          </div>
        </article>

        {/* An earlier order, already confirmed */}
        <article className="mt-3 flex items-center justify-between gap-3 rounded-panel border border-ui-line bg-ui-surface p-4 opacity-70">
          <div className="min-w-0">
            <p className="font-semibold text-ui-heading">
              #{sample.number - 1} · <span className="text-sm">{`${t.inbox.kinds[business]} · ${words[sample.earlier.type]}`}</span>
            </p>
            <p className="truncate text-sm text-ui-muted">{sample.earlier.lines[lang]}</p>
          </div>
          <span className="shrink-0 rounded-full bg-ui-subtle px-2.5 py-1 text-xs font-semibold text-ui-heading">{t.inbox.confirmed}</span>
        </article>
      </div>
    </div>
  );
}
