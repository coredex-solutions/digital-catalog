"use client";

import { Banknote } from "lucide-react";
import { useCatalog } from "../../_providers/CatalogProvider";
import { cn } from "@/utils/helpers";

const DATE_LOCALES = { ar: "ar-LB-u-nu-latn", en: "en-GB", fr: "fr-FR" } as const;

/** SQLite stores UTC "YYYY-MM-DD HH:MM:SS"; show it as a Beirut date, e.g. "8 Oct" (with the year if it isn't this year) */
function formatRateDate(value: string, lang: keyof typeof DATE_LOCALES): string | null {
  const date = new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(DATE_LOCALES[lang] || "en-GB", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
    timeZone: "Asia/Beirut",
  }).format(date);
}

/**
 * States how prices are shown: the main currency and, when the owner converts prices, the
 * rate they set and when. The menu never converts with a rate the owner didn't enter.
 */
export function CurrencyNote({ className }: { className?: string }) {
  const { priceConfig, t, lang, menuItems } = useCatalog();

  // Only state a main currency when every price is actually shown in it: with a rate, USD and
  // LBP prices convert; without one, each price stays in the currency it was entered in
  const shownIn = (code: string) => (priceConfig.lbpRate && (code === "USD" || code === "LBP") ? priceConfig.primary : code);
  const currencies = new Set(menuItems.map((item) => shownIn((item.currency || "USD").toUpperCase())));
  if (currencies.size > 1 || (currencies.size === 1 && !currencies.has(priceConfig.primary))) return null;

  const currency = priceConfig.primary === "LBP" ? t.currencyLBP : t.currencyUSD;
  const rateDate = priceConfig.rateUpdatedAt ? formatRateDate(priceConfig.rateUpdatedAt, lang) : null;

  return (
    <p className={cn("flex items-start gap-2 text-sm text-menu-muted", className)}>
      <Banknote className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>
        {t.pricesInCurrency(currency)}
        {priceConfig.showDual && priceConfig.lbpRate && (
          <>
            {" · "}
            <bdi dir="ltr" className="tabular-nums">
              {t.rateNote(new Intl.NumberFormat("en-US").format(priceConfig.lbpRate))}
            </bdi>
            {rateDate && ` ${t.rateUpdated(rateDate)}`}
          </>
        )}
      </span>
    </p>
  );
}
