"use client";

import { CircleSlash, Plus, Star } from "lucide-react";
import { MenuImage, imageLoading, type ImagePriority } from "./MenuImage";
import { cartQuantityOf, needsVariant, remainingFor, useCatalog, type MenuItem } from "../../_providers/CatalogProvider";
import { lowestVariantPrice } from "@/lib/catalog/dish-info";
import { localized } from "../../_lib/i18n";
import { Price } from "./Price";
import { ItemFacts, SaleTag, WasPrice } from "./ItemMeta";
import { cn } from "@/utils/helpers";

/**
 * One item as a photo card, for the two-column grid that cafés and shops use. Like ItemRow,
 * the whole card opens the item sheet and the add button puts it straight in the cart.
 */
export function ItemCard({ item, priority }: { item: MenuItem; priority?: ImagePriority }) {
  const { lang, t, openItem, addToCart, cart, orderingEnabled } = useCatalog();
  const name = localized(item, "name", lang);
  const inCart = cartQuantityOf(cart, item.id);
  const soldOut = item.is_available === false;
  const hasOptions = needsVariant(item);
  const fromPrice = lowestVariantPrice(item.variants);
  const full = remainingFor(item, cart) <= 0;

  return (
    <article className="relative flex flex-col overflow-hidden rounded-panel border border-menu-line bg-menu-surface">
      <div className={cn("relative aspect-square bg-menu-raised", soldOut && "opacity-60")}>
        {item.image_url ? (
          <MenuImage src={item.image_url} alt="" fill sizes="(max-width: 640px) 50vw, 288px" {...imageLoading(priority)} className="object-cover" />
        ) : (
          // No photo: the first letter on a soft brand tile keeps the grid even
          <span className="flex h-full w-full items-center justify-center bg-brand-soft text-4xl font-semibold text-brand-ink" aria-hidden>
            {name.charAt(0)}
          </span>
        )}
        <SaleTag item={item} />
        {item.image_is_illustrative && (
          <span className="absolute inset-x-0 bottom-0 bg-black/70 px-1 py-0.5 text-center text-[0.6875rem] font-medium leading-tight text-white">
            {t.illustrativeShort}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        {item.is_featured && (
          <span className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-brand-ink">
            <Star className="h-3.5 w-3.5 fill-current" aria-hidden />
            {t.popular}
          </span>
        )}
        <h3 className="line-clamp-2 text-[0.9375rem] font-semibold leading-snug">
          <button
            type="button"
            onClick={() => openItem(item)}
            className="text-start after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:rounded-panel focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-[var(--brand-ink)]"
          >
            {name}
          </button>
        </h3>
        <ItemFacts item={item} className="mt-1" />
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="min-w-0">
            {fromPrice !== null ? (
              <span className="inline-flex flex-wrap items-baseline gap-x-1 text-sm">
                <span className="text-xs text-menu-muted">{t.priceFrom}</span>
                <Price amount={fromPrice} currency={item.currency} stacked />
                <WasPrice item={item} className="w-full text-xs" />
              </span>
            ) : (
              <span className="flex flex-col">
                <Price amount={item.price} currency={item.currency} stacked className="text-sm" />
                <WasPrice item={item} className="text-xs" />
              </span>
            )}
            {soldOut && (
              <span className="mt-1 flex items-center gap-1 text-xs font-medium text-menu-warning">
                <CircleSlash className="h-3.5 w-3.5" aria-hidden />
                {t.soldOut}
              </span>
            )}
          </div>
          {orderingEnabled && !soldOut && (
            <button
              type="button"
              disabled={!hasOptions && full}
              onClick={() => (hasOptions ? openItem(item) : addToCart(item, 1))}
              className={cn(
                "relative z-10 flex h-11 min-w-11 shrink-0 items-center justify-center rounded-control px-3 text-sm font-semibold shadow-menu-sm transition-transform active:scale-95 disabled:opacity-50",
                inCart > 0 ? "bg-brand text-brand-fg" : "border border-menu-line bg-menu-surface text-menu-ink hover:border-brand-ink"
              )}
              aria-label={`${t.add} ${name}${inCart > 0 ? ` (${inCart})` : ""}`}
            >
              {inCart > 0 ? <span className="tabular-nums">{inCart}</span> : <Plus className="h-5 w-5" />}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
