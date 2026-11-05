"use client";

import { useEffect } from "react";
import { BedDouble, Coffee, ShoppingBag, Sparkles, UtensilsCrossed } from "lucide-react";
import { useCatalog } from "../../_providers/CatalogProvider";
import { CartBar } from "./CartBar";
import { CartSheet } from "./CartSheet";
import { CategoryNav, scrollToCategory } from "./CategoryNav";
import { CheckoutSheet } from "./CheckoutSheet";
import { InfoSheet } from "./InfoSheet";
import { ItemSheet } from "./ItemSheet";
import { MenuHeader } from "./MenuHeader";
import { MenuSections, useMenuSections } from "./MenuSections";
import { ReservationSheet } from "./ReservationSheet";
import { SearchSheet } from "./SearchSheet";
import { StayBar } from "./StayBar";
import { StayDatesSheet } from "./StayDatesSheet";

/** The whole catalog on one page: header, sticky categories, items, order bar, sheets */
export function MenuView() {
  const { categories, menuItems, t, bookingEnabled, cartItemCount, orderingEnabled, module } = useCatalog();
  const EmptyIcon = { UtensilsCrossed, Coffee, ShoppingBag, Sparkles, BedDouble }[module.icon];
  const sections = useMenuSections(categories, menuItems);

  // Old per-category links redirect here with ?c=<id>; open the menu at that section
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const target = params.get("c");
    if (!target) return;
    params.delete("c");
    const query = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
    // Wait a frame so the layout (and images' reserved space) is in place
    requestAnimationFrame(() => scrollToCategory(target, false));
  }, []);

  return (
    <>
      <MenuHeader />

      <main className={orderingEnabled && cartItemCount > 0 ? "pb-28" : "pb-12"}>
        {module.nights && orderingEnabled && sections.length > 0 && <StayBar />}
        {sections.length > 0 ? (
          <>
            <CategoryNav categories={sections.map((section) => section.category)} />
            <MenuSections sections={sections} />
          </>
        ) : (
          <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-menu-raised text-menu-muted">
              <EmptyIcon className="h-6 w-6" aria-hidden />
            </span>
            <p className="mt-4 font-semibold">{t.menu}</p>
            <p className="mt-1 text-sm text-menu-muted">{t.menuEmpty}</p>
          </div>
        )}

        <p className="mx-auto mt-12 max-w-xl px-4 text-center text-xs text-menu-muted">{t.poweredBy}</p>
      </main>

      <CartBar />
      <ItemSheet />
      <CartSheet />
      <CheckoutSheet />
      <SearchSheet />
      <InfoSheet />
      {bookingEnabled && <ReservationSheet />}
      {module.nights && <StayDatesSheet />}
    </>
  );
}
