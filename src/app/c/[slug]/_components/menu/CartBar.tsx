"use client";

import { ShoppingBag } from "lucide-react";
import { useCatalog } from "../../_providers/CatalogProvider";
import { Price } from "./Price";

/** Bottom bar in thumb reach, shown once something is in the order */
export function CartBar() {
  const { cartItemCount, cartTotal, t, openSheet, orderingEnabled, activeSheet } = useCatalog();
  if (!orderingEnabled || cartItemCount === 0) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 px-4 pb-safe pt-2"
      style={{ background: "linear-gradient(to top, var(--menu-bg) 65%, transparent)" }}
      aria-hidden={activeSheet !== null}
    >
      <button
        type="button"
        onClick={() => openSheet("cart")}
        className="mx-auto flex min-h-14 w-full max-w-xl items-center gap-3 rounded-control bg-brand px-4 text-brand-fg shadow-menu-md transition-transform active:scale-[0.99]"
      >
        <span className="relative flex">
          <ShoppingBag className="h-5 w-5" aria-hidden />
          <span className="absolute -end-2.5 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-fg px-1 text-[11px] font-semibold tabular-nums text-brand">
            {cartItemCount}
          </span>
        </span>
        <span className="ms-2 font-semibold">{t.viewOrder}</span>
        <span className="sr-only">· {t.items(cartItemCount)}</span>
        <Price value={cartTotal} className="ms-auto text-end" secondaryClassName="text-brand-fg opacity-80" stacked />
      </button>
    </div>
  );
}
