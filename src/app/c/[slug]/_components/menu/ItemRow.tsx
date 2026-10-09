"use client";

import { MenuImage } from "./MenuImage";
import { CircleSlash, Plus, Star } from "lucide-react";
import { cartQuantityOf, needsVariant, useCatalog, type MenuItem } from "../../_providers/CatalogProvider";
import { dietaryLabel, lowestVariantPrice } from "@/lib/catalog/dish-info";
import { localized } from "../../_lib/i18n";
import { Price } from "./Price";
import { cn } from "@/utils/helpers";

interface ItemRowProps {
  item: MenuItem;
  /** Load the photo eagerly (first rows on screen) */
  priority?: boolean;
}

/**
 * One dish in the menu list. The whole row opens the dish sheet (a stretched button, so the
 * row stays a single tab stop); the separate add button puts it straight in the order.
 */
export function ItemRow({ item, priority }: ItemRowProps) {
  const { lang, t, openItem, addToCart, cart, orderingEnabled } = useCatalog();
  const name = localized(item, "name", lang);
  const description = localized(item, "description", lang);
  // All lines of this dish (different special requests are separate lines)
  const inCart = cartQuantityOf(cart, item.id);
  const soldOut = item.is_available === false;
  // Dishes with options are added from the dish sheet, where the option is chosen
  const hasOptions = needsVariant(item);
  const fromPrice = lowestVariantPrice(item.variants);
  const dietary = (item.dietary || []).map((code) => dietaryLabel(code, lang)).join(" · ");

  const addButton = orderingEnabled && !soldOut && (
    <button
      type="button"
      onClick={() => (hasOptions ? openItem(item) : addToCart(item, 1))}
      className={cn(
        "relative z-10 flex h-11 min-w-11 items-center justify-center rounded-control px-3 text-sm font-semibold shadow-menu-sm transition-transform active:scale-95",
        inCart > 0
          ? "bg-brand text-brand-fg"
          : "border border-menu-line bg-menu-surface text-menu-ink hover:border-brand-ink"
      )}
      aria-label={`${t.add} ${name}${inCart > 0 ? ` (${inCart})` : ""}`}
    >
      {inCart > 0 ? <span className="tabular-nums">{inCart}</span> : <Plus className="h-5 w-5" />}
    </button>
  );

  return (
    <article className="relative flex gap-4 py-4">
      <div className="flex min-w-0 flex-1 flex-col">
        {item.is_featured && (
          <span className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-brand-ink">
            <Star className="h-3.5 w-3.5 fill-current" aria-hidden />
            {t.popular}
          </span>
        )}
        <h3 className="text-[1.0625rem] font-semibold leading-snug">
          <button
            type="button"
            onClick={() => openItem(item)}
            className="text-start after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:rounded-xl focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-[var(--brand-ink)]"
          >
            {name}
          </button>
        </h3>
        {description && <p className="mt-1 line-clamp-2 text-sm text-menu-muted">{description}</p>}
        {dietary && <p className="mt-1 text-xs font-medium text-menu-muted">{dietary}</p>}
        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {fromPrice !== null ? (
              <span className="inline-flex flex-wrap items-baseline gap-x-1.5 text-base">
                <span className="text-sm text-menu-muted">{t.priceFrom}</span>
                <Price amount={fromPrice} currency={item.currency} />
              </span>
            ) : (
              <Price amount={item.price} currency={item.currency} className="text-base" />
            )}
            {soldOut && (
              <span className="inline-flex items-center gap-1 text-sm font-medium text-menu-warning">
                <CircleSlash className="h-4 w-4" aria-hidden />
                {t.soldOut}
              </span>
            )}
          </div>
          {!item.image_url && addButton}
        </div>
      </div>

      {item.image_url && (
        <div className="relative h-24 w-24 shrink-0">
          <div className={cn("relative h-full w-full overflow-hidden rounded-control bg-menu-raised", soldOut && "opacity-60")}>
            <MenuImage
              src={item.image_url}
              alt=""
              fill
              sizes="96px"
              priority={priority}
              className="object-cover"
            />
          </div>
          {addButton && <div className="absolute -bottom-2 end-2">{addButton}</div>}
        </div>
      )}
    </article>
  );
}
