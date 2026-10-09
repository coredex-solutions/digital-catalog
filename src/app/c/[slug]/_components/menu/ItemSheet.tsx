"use client";

import { MenuImage } from "./MenuImage";
import { CircleSlash } from "lucide-react";
import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/catalog/price";
import { cartQuantityOf, needsVariant, useCatalog } from "../../_providers/CatalogProvider";
import { allergenLabel, dietaryLabel, lowestVariantPrice, variantName } from "@/lib/catalog/dish-info";
import { localized } from "../../_lib/i18n";
import { Price } from "./Price";
import { QuantityStepper } from "./QuantityStepper";
import { Sheet } from "./Sheet";

export function ItemSheet() {
  const { activeSheet, closeSheet, selectedItem: item, lang, t, addToCart, cart, orderingEnabled, priceConfig } = useCatalog();
  const open = activeSheet === "item" && !!item;
  const inCart = item ? cartQuantityOf(cart, item.id) : 0;

  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  // No option is preselected: the guest chooses, so the price they see is the one they pick
  const [variantId, setVariantId] = useState<string | null>(null);

  // Reset the form each time a dish is opened. A different special request becomes its own
  // line in the order; the same one adds to the existing line.
  useEffect(() => {
    if (open) {
      setQuantity(1);
      setNote("");
      setVariantId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item?.id]);

  if (!item) return null;

  const name = localized(item, "name", lang);
  const description = localized(item, "description", lang);
  const soldOut = item.is_available === false;
  const hasOptions = needsVariant(item);
  const variant = hasOptions ? item.variants!.find((v) => v.id === variantId) : undefined;
  const unitPrice = variant ? variant.price : item.price;
  const lineTotal = formatPrice(unitPrice * quantity, item.currency, priceConfig, lang);
  const canAdd = !hasOptions || !!variant;
  const fromPrice = lowestVariantPrice(item.variants);

  const footer = orderingEnabled && !soldOut ? (
    <div className="flex items-center gap-3">
      <QuantityStepper value={quantity} onChange={setQuantity} size="lg" />
      <button
        type="button"
        disabled={!canAdd}
        aria-describedby={canAdd ? undefined : "item-option-hint"}
        onClick={() => {
          if (addToCart(item, quantity, note.trim(), variant?.id)) closeSheet();
        }}
        className="flex min-h-12 flex-1 items-center justify-between gap-2 rounded-control bg-brand px-4 font-semibold text-brand-fg transition-transform active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span>{t.addToOrder}</span>
        {canAdd && <bdi className="tabular-nums">{lineTotal.primary}</bdi>}
      </button>
    </div>
  ) : undefined;

  return (
    <Sheet open={open} onClose={closeSheet} title={name} hideTitle footer={footer}>
      {item.image_url && (
        <div className="relative -mx-4 aspect-[4/3] overflow-hidden bg-menu-raised">
          <MenuImage src={item.image_url} alt={name} fill sizes="(max-width: 640px) 100vw, 576px" className="object-cover" />
        </div>
      )}

      <div className="pt-5">
        <p className="text-[1.375rem] font-semibold leading-tight" aria-hidden>
          {name}
        </p>
        {variant || fromPrice === null ? (
          <Price amount={unitPrice} currency={item.currency} className="mt-2 text-lg" secondaryClassName="text-sm" />
        ) : (
          <p className="mt-2 inline-flex flex-wrap items-baseline gap-x-1.5 text-lg">
            <span className="text-base text-menu-muted">{t.priceFrom}</span>
            <Price amount={fromPrice} currency={item.currency} secondaryClassName="text-sm" />
          </p>
        )}
        {item.dietary && item.dietary.length > 0 && (
          <p className="mt-2 text-sm font-medium text-menu-muted">{item.dietary.map((code) => dietaryLabel(code, lang)).join(" · ")}</p>
        )}
        {soldOut && (
          <p className="mt-3 inline-flex items-center gap-1.5 font-medium text-menu-warning">
            <CircleSlash className="h-4 w-4" aria-hidden />
            {t.soldOut} · {t.soldOutHint}
          </p>
        )}
        {description && <p className="mt-3 whitespace-pre-line text-menu-muted">{description}</p>}

        {/* Options: each with its own price; required before adding */}
        {hasOptions && (
          <fieldset className="mt-5">
            <legend className="text-sm font-semibold">{t.options}</legend>
            <div className="mt-2 grid gap-2">
              {item.variants!.map((option) => (
                <label
                  key={option.id}
                  className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-control border px-4 ${variantId === option.id ? "border-brand-ink bg-menu-raised" : "border-menu-line"}`}
                >
                  <input
                    type="radio"
                    name="item-option"
                    value={option.id}
                    checked={variantId === option.id}
                    onChange={() => setVariantId(option.id)}
                    disabled={soldOut}
                    className="h-5 w-5 accent-[var(--brand)]"
                  />
                  <span className="flex-1 font-medium">{variantName(option, lang)}</span>
                  <Price amount={option.price} currency={item.currency} stacked className="items-end text-end" />
                </label>
              ))}
            </div>
            {orderingEnabled && !soldOut && !variant && (
              <p id="item-option-hint" className="mt-2 text-sm text-menu-muted">{t.optionRequired}</p>
            )}
          </fieldset>
        )}

        {/* Allergens: only what the restaurant verified; otherwise say it's unknown */}
        <div className="mt-5 rounded-control bg-menu-raised px-4 py-3 text-sm">
          <p className="font-semibold">{t.allergens}</p>
          <p className="mt-1 text-menu-muted">
            {item.allergens == null
              ? t.allergensUnknown
              : item.allergens.length === 0
                ? t.allergensNone
                : `${t.allergensContains}: ${item.allergens.map((code) => allergenLabel(code, lang)).join(lang === "ar" ? "، " : ", ")}`}
          </p>
        </div>
        {inCart > 0 && (
          <p className="mt-3 text-sm font-semibold text-brand-ink">
            {t.yourOrder}: {inCart}
          </p>
        )}

        {orderingEnabled && !soldOut && (
          <div className="mt-6">
            <label htmlFor="item-note" className="text-sm font-semibold">
              {t.noteLabel}
            </label>
            <textarea
              id="item-note"
              value={note}
              onChange={(event) => setNote(event.target.value.slice(0, 200))}
              placeholder={t.notePlaceholder}
              rows={2}
              className="mt-2 w-full resize-none rounded-control border border-menu-input-border bg-menu-surface px-4 py-3 text-base placeholder:text-menu-muted focus:border-brand-ink focus:outline-none"
            />
          </div>
        )}
      </div>
    </Sheet>
  );
}
