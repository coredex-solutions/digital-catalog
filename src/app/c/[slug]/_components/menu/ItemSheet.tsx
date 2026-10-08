"use client";

import { MenuImage } from "./MenuImage";
import { CircleSlash } from "lucide-react";
import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/catalog/price";
import { useCatalog } from "../../_providers/CatalogProvider";
import { localized } from "../../_lib/i18n";
import { Price } from "./Price";
import { QuantityStepper } from "./QuantityStepper";
import { Sheet } from "./Sheet";

export function ItemSheet() {
  const { activeSheet, closeSheet, selectedItem: item, lang, t, addToCart, cart, orderingEnabled, priceConfig } = useCatalog();
  const open = activeSheet === "item" && !!item;
  const existing = item ? cart.find((line) => line.id === item.id) : undefined;

  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");

  // Reset the form each time a dish is opened, keeping any note already in the order
  useEffect(() => {
    if (open) {
      setQuantity(1);
      setNote(existing?.note || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item?.id]);

  if (!item) return null;

  const name = localized(item, "name", lang);
  const description = localized(item, "description", lang);
  const lineTotal = formatPrice(item.price * quantity, item.currency, priceConfig, lang);
  const soldOut = item.is_available === false;

  const footer = orderingEnabled && !soldOut ? (
    <div className="flex items-center gap-3">
      <QuantityStepper value={quantity} onChange={setQuantity} size="lg" />
      <button
        type="button"
        onClick={() => {
          addToCart(item, quantity, note.trim());
          closeSheet();
        }}
        className="flex min-h-12 flex-1 items-center justify-between gap-2 rounded-control bg-brand px-4 font-semibold text-brand-fg transition-transform active:scale-[0.99]"
      >
        <span>{t.addToOrder}</span>
        <bdi className="tabular-nums">{lineTotal.primary}</bdi>
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
        <Price amount={item.price} currency={item.currency} className="mt-2 text-lg" secondaryClassName="text-sm" />
        {soldOut && (
          <p className="mt-3 inline-flex items-center gap-1.5 font-medium text-menu-warning">
            <CircleSlash className="h-4 w-4" aria-hidden />
            {t.soldOut} · {t.soldOutHint}
          </p>
        )}
        {description && <p className="mt-3 whitespace-pre-line text-menu-muted">{description}</p>}
        {existing && (
          <p className="mt-3 text-sm font-semibold text-brand-ink">
            {t.yourOrder}: {existing.quantity}
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
