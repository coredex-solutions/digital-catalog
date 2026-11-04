"use client";

import { Clock } from "lucide-react";
import { formatPrice } from "@/lib/catalog/price";
import { useCatalog, type MenuItem } from "../../_providers/CatalogProvider";
import { cn } from "@/utils/helpers";

/** Stock is mentioned only when it is running low */
export const LOW_STOCK = 5;

/** Old price crossed out next to the current one (shops) */
export function WasPrice({ item, className }: { item: MenuItem; className?: string }) {
  const { priceConfig, lang, t } = useCatalog();
  if (!item.compare_at_price || item.compare_at_price <= item.price) return null;
  return (
    <span className={cn("text-sm text-menu-muted", className)}>
      <span className="sr-only">{t.wasPrice} </span>
      <s className="tabular-nums">{formatPrice(item.compare_at_price, item.currency, priceConfig, lang).primary}</s>
    </span>
  );
}

/** Small facts under an item: how long a service takes, "Only 3 left" */
export function ItemFacts({ item, className }: { item: MenuItem; className?: string }) {
  const { t } = useCatalog();
  const low = item.is_available !== false && item.stock_qty != null && item.stock_qty > 0 && item.stock_qty <= LOW_STOCK;
  if (!item.duration_minutes && !low) return null;
  return (
    <p className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium", className)}>
      {item.duration_minutes ? (
        <span className="inline-flex items-center gap-1 text-menu-muted">
          <Clock className="h-3.5 w-3.5" aria-hidden />
          {t.minutes(item.duration_minutes)}
        </span>
      ) : null}
      {low && <span className="text-menu-warning">{t.onlyLeft(item.stock_qty!)}</span>}
    </p>
  );
}

/** "Sale" tag on a photo when the item has an old price */
export function SaleTag({ item }: { item: MenuItem }) {
  const { t } = useCatalog();
  if (!item.compare_at_price || item.compare_at_price <= item.price) return null;
  return (
    <span className="absolute start-2 top-2 rounded-full bg-brand px-2 py-0.5 text-[0.6875rem] font-semibold text-brand-fg">{t.onSale}</span>
  );
}
