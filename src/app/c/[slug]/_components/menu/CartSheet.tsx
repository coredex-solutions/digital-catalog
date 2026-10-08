"use client";

import { MenuImage } from "./MenuImage";
import { ShoppingBag } from "lucide-react";
import { useCatalog } from "../../_providers/CatalogProvider";
import { localized } from "../../_lib/i18n";
import { Price } from "./Price";
import { QuantityStepper } from "./QuantityStepper";
import { Sheet } from "./Sheet";

export function CartSheet() {
  const { activeSheet, closeSheet, openSheet, cart, cartTotal, cartItemCount, updateQuantity, clearCart, lang, t } = useCatalog();
  const open = activeSheet === "cart";

  const footer =
    cart.length > 0 ? (
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-menu-muted">{t.subtotal}</span>
          <Price value={cartTotal} className="text-lg" stacked secondaryClassName="text-end" />
        </div>
        <button
          type="button"
          onClick={() => openSheet("checkout")}
          className="mt-3 flex min-h-12 w-full items-center justify-center rounded-control bg-brand px-4 font-semibold text-brand-fg transition-transform active:scale-[0.99]"
        >
          {t.checkout}
        </button>
      </div>
    ) : undefined;

  return (
    <Sheet
      open={open}
      onClose={closeSheet}
      title={t.yourOrder}
      description={cart.length > 0 ? t.items(cartItemCount) : undefined}
      footer={footer}
    >
      {cart.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-menu-raised text-menu-muted">
            <ShoppingBag className="h-6 w-6" aria-hidden />
          </span>
          <p className="mt-4 font-semibold">{t.emptyOrder}</p>
          <p className="mt-1 text-sm text-menu-muted">{t.emptyOrderHint}</p>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-[var(--menu-line)]">
            {cart.map((line) => (
              <li key={line.id} className="flex gap-3 py-4">
                {line.image_url && (
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-menu-raised">
                    <MenuImage src={line.image_url} alt="" fill sizes="64px" className="object-cover" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-snug">{localized(line, "name", lang)}</p>
                  {line.note && <p className="mt-0.5 text-sm text-menu-muted">{line.note}</p>}
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <Price amount={line.price * line.quantity} currency={line.currency} className="text-sm" />
                    <QuantityStepper
                      value={line.quantity}
                      min={0}
                      onChange={(quantity) => updateQuantity(line.id, quantity)}
                      label={`${t.quantity}: ${localized(line, "name", lang)}`}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={clearCart}
            className="mt-2 min-h-11 text-sm font-semibold text-menu-muted underline-offset-4 hover:text-menu-danger hover:underline"
          >
            {t.clearOrder}
          </button>
        </>
      )}
    </Sheet>
  );
}
