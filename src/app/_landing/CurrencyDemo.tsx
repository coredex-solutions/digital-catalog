"use client";

import { useId, useState } from "react";
import { formatPrice, type PriceConfig, type PrimaryCurrency } from "@/lib/catalog/price";
import type { SiteCopy, SiteLang } from "./copy";

/** Interactive dual-price card, formatted by the same code the real menu uses */
export function CurrencyDemo({ t, lang }: { t: SiteCopy["currency"]; lang: SiteLang }) {
  const [rate, setRate] = useState(89500);
  const [primary, setPrimary] = useState<PrimaryCurrency>("USD");
  const rateId = useId();
  const config: PriceConfig = { primary, lbpRate: rate, rateUpdatedAt: null, showDual: true };

  return (
    <div className="rounded-panel border border-ui-line bg-ui-surface p-5 shadow-[0_24px_48px_-32px_rgba(23,43,38,0.4)] sm:p-6">
      <ul className="divide-y divide-[var(--ui-line)]">
        {t.items.map((item) => {
          const price = formatPrice(item.price, "USD", config, lang);
          return (
            <li key={item.name} className="flex items-baseline justify-between gap-4 py-3">
              <span className="font-medium">{item.name}</span>
              <span className="flex flex-wrap items-baseline justify-end gap-x-2 text-end">
                <bdi className="font-semibold tabular-nums">{price.primary}</bdi>
                {price.secondary && <bdi className="text-sm tabular-nums text-ui-muted">{price.secondary}</bdi>}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-5 space-y-4 rounded-control bg-ui-bg p-4">
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor={rateId} className="text-sm font-semibold">
              {t.rate}
            </label>
            <span className="text-sm tabular-nums text-ui-muted">
              <bdi>{new Intl.NumberFormat("en-US").format(rate)}</bdi> {t.perDollar}
            </span>
          </div>
          <input
            id={rateId}
            type="range"
            min={80000}
            max={100000}
            step={500}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="mt-2 w-full"
          />
        </div>

        <fieldset>
          <legend className="text-sm font-semibold">{t.first}</legend>
          <div className="mt-2 grid grid-cols-2 gap-1 rounded-control border border-ui-input bg-ui-surface p-1">
            {(["USD", "LBP"] as const).map((code) => (
              <label
                key={code}
                className={`flex min-h-10 cursor-pointer items-center justify-center rounded-[8px] text-sm font-semibold transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--ui-primary)] ${
                  primary === code ? "bg-ui-primary text-ui-primary-fg" : "text-ui-muted hover:text-ui-ink"
                }`}
              >
                <input type="radio" name={`${rateId}-primary`} value={code} checked={primary === code} onChange={() => setPrimary(code)} className="sr-only" />
                {code === "USD" ? t.usd : t.lbp}
              </label>
            ))}
          </div>
        </fieldset>
      </div>
      <p className="mt-3 text-sm text-ui-muted">{t.note}</p>
    </div>
  );
}
