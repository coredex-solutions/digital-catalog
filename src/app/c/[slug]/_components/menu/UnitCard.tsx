"use client";

import { CircleSlash, Loader2, Star, Users } from "lucide-react";
import { MenuImage } from "./MenuImage";
import { cartQuantityOf, needsVariant, useCatalog, type MenuItem } from "../../_providers/CatalogProvider";
import { lowestVariantPrice } from "@/lib/catalog/dish-info";
import { stayLinePrice, stayNights } from "@/lib/orders/stays";
import { localized } from "../../_lib/i18n";
import { formatPrice } from "@/lib/catalog/price";
import { Price } from "./Price";
import { QuantityStepper } from "./QuantityStepper";
import { freeFor } from "./StayDatesSheet";
import { cn } from "@/utils/helpers";

/**
 * One room or chalet (stays): a wide photo, who it sleeps and the price per night. Once dates
 * are chosen it says whether it's free and what the whole stay costs; booking it needs dates.
 */
export function UnitCard({ item, priority }: { item: MenuItem; priority?: boolean }) {
  const { lang, t, stay, stayAvailability, stayLoading, openDates, openItem, addToCart, cart, updateLineQuantity, orderingEnabled, priceConfig } = useCatalog();
  const name = localized(item, "name", lang);
  const description = localized(item, "description", lang);
  const soldOut = item.is_available === false;
  const fromPrice = lowestVariantPrice(item.variants);
  const nightly = fromPrice ?? item.price;
  const units = item.unit_count ?? 1;
  const nights = stay ? stayNights(stay.checkIn, stay.checkOut) : [];
  const free = stay ? freeFor(stayAvailability, item.id, units, nights) : null;
  const inCart = cartQuantityOf(cart, item.id);
  const line = cart.find((l) => l.id === item.id && !l.variant && !l.note);
  const total = stay ? stayLinePrice(item, nightly, nights) : null;

  let action: React.ReactNode = null;
  if (orderingEnabled && !soldOut) {
    if (!stay) {
      action = (
        <button
          type="button"
          onClick={() => openDates(item)}
          className="relative z-10 flex min-h-11 items-center justify-center rounded-control border border-menu-line bg-menu-surface px-4 text-sm font-semibold shadow-menu-sm hover:border-brand-ink"
        >
          {t.chooseDates}
        </button>
      );
    } else if (stayLoading && inCart === 0) {
      action = (
        <span className="inline-flex min-h-11 items-center gap-1.5 text-sm text-menu-muted" role="status">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          {t.checkingDates}
        </span>
      );
    } else if (free === 0 && inCart === 0) {
      action = (
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-menu-warning">
          <CircleSlash className="h-4 w-4" aria-hidden />
          {t.notFree}
        </span>
      );
    } else if (line) {
      action = (
        <div className="relative z-10">
          <QuantityStepper value={line.quantity} min={0} max={Math.max(line.quantity, Math.min(units, free ?? units))} onChange={(quantity) => updateLineQuantity(line.key, quantity)} label={`${t.quantity}: ${name}`} />
        </div>
      );
    } else {
      action = (
        <button
          type="button"
          onClick={() => (needsVariant(item) || inCart > 0 ? openItem(item) : addToCart(item, 1))}
          className="relative z-10 flex min-h-11 items-center justify-center rounded-control bg-brand px-5 text-sm font-semibold text-brand-fg shadow-menu-sm transition-transform active:scale-95"
          aria-label={`${t.add} ${name}${inCart > 0 ? ` (${inCart})` : ""}`}
        >
          {inCart > 0 ? `${t.add} (${inCart})` : t.add}
        </button>
      );
    }
  }

  return (
    <article className="relative overflow-hidden rounded-panel border border-menu-line bg-menu-surface">
      {item.image_url && (
        <div className={cn("relative aspect-[16/10] bg-menu-raised", (soldOut || free === 0) && "opacity-60")}>
          <MenuImage src={item.image_url} alt="" fill sizes="(max-width: 640px) 100vw, 576px" priority={priority} className="object-cover" />
          {item.image_is_illustrative && (
            <span className="absolute inset-x-0 bottom-0 bg-black/70 px-2 py-1 text-center text-xs font-medium text-white">{t.illustrativeShort}</span>
          )}
        </div>
      )}
      <div className="p-4">
        {item.is_featured && (
          <span className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-brand-ink">
            <Star className="h-3.5 w-3.5 fill-current" aria-hidden />
            {t.popular}
          </span>
        )}
        <h3 className="text-lg font-semibold leading-snug">
          <button
            type="button"
            onClick={() => openItem(item)}
            className="text-start after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:rounded-panel focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-[var(--brand-ink)]"
          >
            {name}
          </button>
        </h3>
        {description && <p className="mt-1 line-clamp-2 text-sm text-menu-muted">{description}</p>}
        {item.max_guests && (
          <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-menu-muted">
            <Users className="h-4 w-4" aria-hidden />
            {t.sleeps(item.max_guests)}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            {stay && total !== null && free !== 0 ? (
              <>
                <p className="flex flex-wrap items-baseline gap-x-1.5">
                  {fromPrice !== null && <span className="text-sm text-menu-muted">{t.priceFrom}</span>}
                  <Price amount={total} currency={item.currency} className="text-lg" />
                  <span className="text-sm text-menu-muted">{t.forNights(t.nightsCount(nights.length))}</span>
                </p>
                {free !== null && !stayLoading && units > 1 && free <= 3 && <p className="mt-0.5 text-xs font-semibold text-brand-ink">{t.unitsLeft(free)}</p>}
              </>
            ) : (
              <>
                <p className="flex flex-wrap items-baseline gap-x-1.5">
                  {fromPrice !== null && <span className="text-sm text-menu-muted">{t.priceFrom}</span>}
                  <Price amount={nightly} currency={item.currency} className="text-lg" />
                  <span className="text-sm text-menu-muted">/ {t.perNight}</span>
                </p>
                {item.weekend_price && item.weekend_price !== item.price && (
                  <p className="mt-0.5 text-xs text-menu-muted">
                    <bdi>{t.weekendNights(formatPrice(item.weekend_price, item.currency, priceConfig, lang).primary)}</bdi>
                  </p>
                )}
              </>
            )}
            {soldOut && (
              <p className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-menu-warning">
                <CircleSlash className="h-4 w-4" aria-hidden />
                {t.soldOut}
              </p>
            )}
          </div>
          {action}
        </div>
      </div>
    </article>
  );
}
