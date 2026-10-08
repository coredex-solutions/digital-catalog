"use client";

import { formatPrice, type FormattedPrice } from "@/lib/catalog/price";
import { useCatalog } from "../../_providers/CatalogProvider";
import { cn } from "@/utils/helpers";

interface PriceProps {
  amount?: number;
  currency?: string | null;
  /** Pre-formatted price (e.g. a cart total) instead of amount + currency */
  value?: FormattedPrice;
  className?: string;
  secondaryClassName?: string;
  /** Put the second currency on its own line */
  stacked?: boolean;
}

/** Shows a price in the primary currency, with the other currency beside or under it */
export function Price({ amount = 0, currency, value, className, secondaryClassName, stacked }: PriceProps) {
  const { priceConfig, lang } = useCatalog();
  const price = value ?? formatPrice(amount, currency, priceConfig, lang);

  return (
    <span className={cn(stacked ? "inline-flex flex-col" : "inline-flex flex-wrap items-baseline gap-x-1.5", className)}>
      <bdi className="font-semibold tabular-nums">{price.primary}</bdi>
      {price.secondary && (
        <bdi className={cn("text-xs font-normal tabular-nums text-menu-muted", secondaryClassName)}>{price.secondary}</bdi>
      )}
    </span>
  );
}
