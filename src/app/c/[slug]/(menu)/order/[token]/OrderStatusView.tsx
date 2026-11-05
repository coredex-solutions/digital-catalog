"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, CircleX, MessageCircle } from "lucide-react";
import { useCatalog } from "../../../_providers/CatalogProvider";
import { localized } from "../../../_lib/i18n";
import { customerStep, whatsappLink } from "../../../_lib/whatsapp";
import { LanguageToggle } from "../../../_components/menu/LanguageToggle";
import { formatPrice, formatTotal, type PriceConfig } from "@/lib/catalog/price";
import { variantName } from "@/lib/catalog/dish-info";
import { feeLine } from "@/lib/orders/delivery";
import { isTransfer, parsePaymentConfig } from "@/lib/orders/payment";
import { parseBookingConfig } from "@/lib/orders/slots";
import { discountLine } from "@/lib/orders/coupons";
import { parseLoyaltyConfig, rewardText } from "@/lib/orders/loyalty";
import { depositInstructions } from "../../../_components/menu/CheckoutSheet";
import { cn } from "@/utils/helpers";

export interface PublicOrder {
  number: number;
  kind: "order" | "booking" | "request";
  status: string;
  order_type: string | null;
  area: string | null;
  table_label: string | null;
  requested_for: string | null;
  party_size: number | null;
  lines: { name_en: string; name_ar: string; variant_en: string | null; variant_ar: string | null; price: number; currency: string; quantity: number }[];
  price_config: PriceConfig | null;
  delivery_fee: number | null;
  delivery_currency: string | null;
  payment_method: string | null;
  paid: boolean;
  discount: number | null;
  discount_currency: string | null;
  coupon_code: string | null;
  /** Stamps towards the next reward, when the business has a loyalty card */
  loyalty: { stamps: number; nextIsReward: boolean; every: number; rewardOrder: boolean } | null;
  created_at: string;
}

/** How often the page checks for a new status while the order is still open */
const REFRESH_MS = 20_000;

export function OrderStatusView({ order }: { order: PublicOrder }) {
  const router = useRouter();
  const { catalog, contact, settings, lang, t, priceConfig } = useCatalog();
  const finished = order.status === "completed" || order.status === "cancelled";

  // Follow the order while it's open: refresh now and then, and when the customer comes back to the tab
  useEffect(() => {
    if (finished) return;
    const refresh = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const timer = setInterval(refresh, REFRESH_MS);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [finished, router]);

  const businessName = localized(catalog, "name", lang) || catalog.name;
  const config = order.price_config ?? priceConfig;
  const total = order.lines.length > 0 ? formatTotal([...order.lines, ...feeLine(order.delivery_fee, order.delivery_currency), ...discountLine(order.discount, order.discount_currency)], config, lang) : null;
  const loyaltyConfig = parseLoyaltyConfig((settings as unknown as Record<string, unknown> | null)?.loyalty_config);
  const reward = rewardText(loyaltyConfig, lang);
  const payment = parsePaymentConfig((settings as unknown as Record<string, unknown> | null)?.payment_config);

  // The steps the customer follows; "ready" reads as "on its way" for deliveries
  const steps = order.kind === "order" ? ["new", "confirmed", "ready", "completed"] : ["new", "confirmed", "completed"];
  const current = Math.max(0, steps.indexOf(order.status));
  const stepLabel = (status: string) => {
    const step = customerStep(status, order.order_type);
    return t.statusSteps[step === "readyPickup" ? "ready" : step] ?? status;
  };
  const hint = t.statusHints[customerStep(order.status, order.order_type)] ?? t.statusHints.new;

  // Bookings and appointments with a deposit: how to pay it, until the team marks it paid
  const booking = parseBookingConfig((settings as unknown as Record<string, unknown> | null)?.booking_config);
  const depositText =
    order.kind !== "order" && order.requested_for && order.status !== "cancelled" && booking.enabled
      ? depositInstructions(booking, payment, config, lang, t)
      : null;

  const transferDue = isTransfer(order.payment_method) && !order.paid && order.status !== "cancelled" && total;
  const transferTo =
    order.payment_method === "whish" ? payment.whish_phone : [payment.omt_name, payment.omt_phone].filter(Boolean).join(" · ");

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-4 pb-16 pt-4">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/c/${catalog.slug}/`}
          className="inline-flex min-h-11 items-center gap-2 rounded-control pe-3 text-sm font-semibold text-menu-muted hover:text-menu-ink"
        >
          <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
          {t.backToPage}
        </Link>
        <LanguageToggle />
      </div>

      <header className="mt-4 flex items-center gap-3">
        {catalog.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={catalog.logo_url} alt="" className="h-12 w-12 rounded-2xl object-cover shadow-menu-sm" />
        )}
        <div className="min-w-0">
          <p className="truncate text-sm text-menu-muted">{businessName}</p>
          <h1 className="font-menu-display text-2xl font-semibold">{t.statusTitle(order.number)}</h1>
        </div>
      </header>

      <section className="mt-6 rounded-[20px] bg-menu-surface p-5 shadow-menu-sm" aria-live="polite">
        {order.status === "cancelled" ? (
          <p className="flex items-start gap-3 font-semibold text-menu-danger">
            <CircleX className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <span>
              {t.statusSteps.cancelled}
              <span className="mt-1 block text-sm font-normal text-menu-muted">{hint}</span>
            </span>
          </p>
        ) : (
          <>
            <p className="text-lg font-semibold">{hint}</p>
            <ol className="mt-4 space-y-3">
              {steps.map((status, index) => {
                const done = index <= current;
                return (
                  <li key={status} className="flex items-center gap-3" aria-current={index === current ? "step" : undefined}>
                    <span
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2",
                        done ? "border-brand bg-brand text-brand-fg" : "border-menu-line text-menu-muted"
                      )}
                    >
                      {done ? <Check className="h-4 w-4" aria-hidden /> : <span className="text-xs tabular-nums">{index + 1}</span>}
                    </span>
                    <span className={cn("text-sm", index === current ? "font-semibold" : done ? "" : "text-menu-muted")}>{stepLabel(status)}</span>
                  </li>
                );
              })}
            </ol>
            {!finished && <p className="mt-4 text-xs text-menu-muted">{t.statusAuto}</p>}
          </>
        )}
      </section>

      {transferDue && transferTo && (
        <section className="mt-4 rounded-[20px] border border-brand-ink bg-brand-soft p-5">
          <h2 className="font-semibold">
            {t.payment}: {t.payMethods[order.payment_method!]}
          </h2>
          <p className="mt-1 text-sm leading-relaxed">
            <bdi>
              {order.payment_method === "whish" ? t.custPayWhish(total.primary, transferTo) : t.custPayOmt(total.primary, transferTo)}
            </bdi>
          </p>
        </section>
      )}

      {depositText && (
        <section className="mt-4 rounded-[20px] border border-brand-ink bg-brand-soft p-5">
          <p className="flex items-start justify-between gap-3 text-sm leading-relaxed">
            <bdi>{depositText}</bdi>
            {order.paid && <span className="shrink-0 rounded-full bg-brand px-2.5 py-0.5 text-xs font-semibold text-brand-fg">{t.paid}</span>}
          </p>
        </section>
      )}

      {(order.lines.length > 0 || order.area || order.table_label || order.requested_for) && (
        <section className="mt-4 rounded-[20px] bg-menu-surface p-5 shadow-menu-sm">
          <dl className="space-y-1 text-sm">
            {order.order_type && (
              <div className="flex justify-between gap-3">
                <dt className="text-menu-muted">{t.orderType}</dt>
                <dd className="font-semibold">{(t as unknown as Record<string, string>)[order.order_type] ?? order.order_type}</dd>
              </div>
            )}
            {order.area && (
              <div className="flex justify-between gap-3">
                <dt className="text-menu-muted">{t.area}</dt>
                <dd className="font-semibold">{order.area}</dd>
              </div>
            )}
            {order.table_label && (
              <div className="flex justify-between gap-3">
                <dt className="text-menu-muted">{t.tableNumber}</dt>
                <dd className="font-semibold">{order.table_label}</dd>
              </div>
            )}
            {order.requested_for && (
              <div className="flex justify-between gap-3">
                <dt className="text-menu-muted">{t.msgWhen}</dt>
                <dd dir="ltr" className="font-semibold">{order.requested_for}</dd>
              </div>
            )}
            {order.party_size != null && (
              <div className="flex justify-between gap-3">
                <dt className="text-menu-muted">{t.reserveGuests}</dt>
                <dd className="font-semibold tabular-nums">{order.party_size}</dd>
              </div>
            )}
          </dl>

          {order.lines.length > 0 && (
            <ul className="mt-4 space-y-2 border-t border-menu-line pt-4 text-sm">
              {order.lines.map((line, index) => (
                <li key={index} className="flex justify-between gap-3">
                  <span>
                    <strong className="tabular-nums">{line.quantity} ×</strong> {localized(line, "name", lang)}
                    {(line.variant_en || line.variant_ar) && ` (${variantName({ name_en: line.variant_en ?? "", name_ar: line.variant_ar ?? "" }, lang)})`}
                  </span>
                  <bdi className="shrink-0 tabular-nums">{formatPrice(line.price * line.quantity, line.currency, config, lang).primary}</bdi>
                </li>
              ))}
              {order.discount != null && order.discount > 0 && (
                <li className="flex justify-between gap-3 text-menu-muted">
                  <span>
                    {t.msgDiscount}
                    {order.coupon_code && <bdi> ({order.coupon_code})</bdi>}
                  </span>
                  <bdi className="shrink-0 tabular-nums">−{formatPrice(order.discount, order.discount_currency, config, lang).primary}</bdi>
                </li>
              )}
              {order.order_type === "delivery" && order.delivery_fee != null && (
                <li className="flex justify-between gap-3 text-menu-muted">
                  <span>{t.deliveryFee}</span>
                  <bdi className="shrink-0 tabular-nums">
                    {order.delivery_fee > 0 ? formatPrice(order.delivery_fee, order.delivery_currency, config, lang).primary : t.freeDelivery}
                  </bdi>
                </li>
              )}
            </ul>
          )}

          {total && (
            <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-menu-line pt-3">
              <span className="font-semibold">{t.subtotal}</span>
              <span className="inline-flex flex-wrap items-baseline justify-end gap-x-2 tabular-nums">
                <bdi className="text-lg font-semibold">{total.primary}</bdi>
                {total.secondary && <bdi className="text-xs text-menu-muted">{total.secondary}</bdi>}
              </span>
            </div>
          )}

          {order.payment_method && (
            <p className="mt-3 flex items-center justify-between gap-3 text-sm">
              <span className="text-menu-muted">
                {t.payment}: <span className="font-semibold text-menu-ink">{t.payMethods[order.payment_method] ?? order.payment_method}</span>
              </span>
              {order.paid ? (
                <span className="rounded-full bg-brand px-2.5 py-0.5 text-xs font-semibold text-brand-fg">{t.paid}</span>
              ) : (
                isTransfer(order.payment_method) &&
                order.status !== "cancelled" && <span className="text-xs text-menu-muted">{t.notPaid}</span>
              )}
            </p>
          )}
        </section>
      )}

      {order.loyalty && reward && (
        <section className="mt-4 rounded-[20px] bg-menu-surface p-5 shadow-menu-sm" aria-labelledby="loyalty-title">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="loyalty-title" className="font-semibold">{t.loyaltyTitle}</h2>
            <span className="text-sm text-menu-muted tabular-nums">{t.loyaltyStamps(order.loyalty.stamps, order.loyalty.every)}</span>
          </div>
          {/* One dot per order towards the reward */}
          <div className="mt-3 flex flex-wrap gap-2" aria-hidden>
            {Array.from({ length: order.loyalty.every }, (_, i) => (
              <span
                key={i}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border-2",
                  i < order.loyalty!.stamps ? "border-brand bg-brand text-brand-fg" : "border-menu-line"
                )}
              >
                {i < order.loyalty!.stamps && <Check className="h-3.5 w-3.5" />}
              </span>
            ))}
          </div>
          <p className="mt-3 text-sm">
            {order.loyalty.rewardOrder && order.status !== "cancelled"
              ? t.loyaltyEarned(reward)
              : order.loyalty.nextIsReward
                ? t.loyaltyNext(reward)
                : t.loyaltyEvery(order.loyalty.every, reward)}
          </p>
        </section>
      )}

      {contact?.phone_whatsapp && (
        <a
          href={whatsappLink(contact.phone_whatsapp, `${t.statusTitle(order.number)} · ${businessName}`)}
          className="mt-6 flex min-h-12 items-center justify-center gap-2 rounded-control bg-brand px-4 font-semibold text-brand-fg"
        >
          <MessageCircle className="h-5 w-5" aria-hidden />
          {t.messageBusiness}
        </a>
      )}
    </main>
  );
}
