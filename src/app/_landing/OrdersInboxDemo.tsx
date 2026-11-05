import { ChefHat, MessageCircle, Phone, X, Check } from "lucide-react";
import { formatPrice, formatTotal } from "@/lib/catalog/price";
import type { SiteCopy, SiteLang } from "./copy";

// The same sample order as the WhatsApp demo, drawn like a card on the dashboard's Orders page
const PRICES = { primary: "USD" as const, lbpRate: 89500, rateUpdatedAt: null, showDual: true };
const LINES = [
  { en: "Hummus", ar: "حمص", price: 4, quantity: 2 },
  { en: "Fattoush", ar: "فتوش", price: 5, quantity: 1 },
  { en: "Mixed grill", ar: "مشاوي مشكّلة", price: 14, quantity: 1 },
];

/** A picture of the Orders page (not interactive: the buttons are drawn, not wired) */
export function OrdersInboxDemo({ t, lang }: { t: SiteCopy["whatsappDemo"]; lang: SiteLang }) {
  const total = formatTotal(LINES.map((line) => ({ price: line.price, currency: "USD", quantity: line.quantity })), PRICES, lang);
  const fakeButton = "inline-flex items-center gap-1.5 rounded-control px-3 text-sm font-semibold";

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
                #12 · <span className="text-sm">{t.inbox.kind}</span>
              </p>
              <p className="text-xs text-ui-muted">{t.inbox.time}</p>
            </div>
            <span className="rounded-full bg-ui-primary px-2.5 py-1 text-xs font-semibold text-ui-primary-fg">{t.inbox.status}</span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            <p className="font-semibold">{t.sampleName}</p>
            <bdi className="text-sm text-ui-muted">{t.samplePhone}</bdi>
            <span className="flex gap-1.5" aria-hidden>
              <span className={`${fakeButton} min-h-8 border border-ui-line px-2`}>
                <Phone className="h-3.5 w-3.5" />
              </span>
              <span className={`${fakeButton} min-h-8 border border-ui-line px-2`}>
                <MessageCircle className="h-3.5 w-3.5" />
              </span>
            </span>
          </div>

          <p className="mt-2 flex items-center gap-2 text-sm">
            <ChefHat className="h-4 w-4 text-ui-muted" aria-hidden />
            {t.inbox.table}: <strong>7</strong>
          </p>

          <div className="mt-3 rounded-control bg-ui-bg p-3 text-sm">
            <ul className="space-y-1.5">
              {LINES.map((line) => (
                <li key={line.en} className="flex justify-between gap-3">
                  <span>
                    <strong className="tabular-nums">{line.quantity} ×</strong> {line[lang]}
                  </span>
                  <bdi className="tabular-nums">{formatPrice(line.price * line.quantity, "USD", PRICES, lang).primary}</bdi>
                </li>
              ))}
            </ul>
            <p className="mt-2 flex justify-between gap-3 border-t border-ui-line pt-2 font-semibold">
              <span>{t.inbox.total}</span>
              <span className="inline-flex flex-wrap items-baseline justify-end gap-x-2 tabular-nums">
                <bdi>{total.primary}</bdi>
                {total.secondary && <bdi className="font-normal text-ui-muted">{total.secondary}</bdi>}
              </span>
            </p>
          </div>

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
              #11 · <span className="text-sm">{t.inbox.earlierKind}</span>
            </p>
            <p className="truncate text-sm text-ui-muted">{t.inbox.earlierLines}</p>
          </div>
          <span className="shrink-0 rounded-full bg-ui-subtle px-2.5 py-1 text-xs font-semibold text-ui-heading">{t.inbox.confirmed}</span>
        </article>
      </div>
    </div>
  );
}
