"use client";

import { useEffect, useState, type ComponentType } from "react";
import dynamic from "next/dynamic";
import { BedDouble, Coffee, ShoppingBag, Sparkles, UtensilsCrossed } from "lucide-react";
import { useCatalog, type MenuSheet } from "../../_providers/CatalogProvider";
import { CartBar } from "./CartBar";
import { CategoryNav, scrollToCategory } from "./CategoryNav";
import { MenuHeader } from "./MenuHeader";
import { PoweredBy } from "./PoweredBy";
import { MenuSections, useMenuSections } from "./MenuSections";
import { StayBar } from "./StayBar";

// The sheets (item, basket, checkout, search, info, booking, dates) are not needed to show the
// page, so their code stays out of the first download: it is fetched quietly once the page has
// settled, or straight away when the customer first touches the page, and each sheet is mounted
// the first time it opens (then kept, so it can slide closed).
const SHEET_CODE = {
  item: () => import("./ItemSheet").then((m) => m.ItemSheet),
  cart: () => import("./CartSheet").then((m) => m.CartSheet),
  checkout: () => import("./CheckoutSheet").then((m) => m.CheckoutSheet),
  search: () => import("./SearchSheet").then((m) => m.SearchSheet),
  info: () => import("./InfoSheet").then((m) => m.InfoSheet),
  reservation: () => import("./ReservationSheet").then((m) => m.ReservationSheet),
  dates: () => import("./StayDatesSheet").then((m) => m.StayDatesSheet),
} satisfies Record<MenuSheet, () => Promise<ComponentType>>;

const SHEETS = Object.fromEntries(
  Object.entries(SHEET_CODE).map(([name, load]) => [name, dynamic(load, { ssr: false })])
) as Record<MenuSheet, ComponentType>;

function preloadSheets() {
  for (const load of Object.values(SHEET_CODE)) void load();
}

/** Mounts each sheet from its first opening on, and fetches the sheets' code ahead of time */
function useSheets(): MenuSheet[] {
  const { activeSheet } = useCatalog();
  const [mounted, setMounted] = useState<MenuSheet[]>([]);
  // Updating state while rendering (React's pattern for following a changing value), so the
  // sheet mounts in the same render that opens it
  if (activeSheet && !mounted.includes(activeSheet)) setMounted([...mounted, activeSheet]);

  useEffect(() => {
    let done = false;
    const events = ["pointerdown", "keydown", "touchstart", "scroll"] as const;
    const run = () => {
      if (done) return;
      done = true;
      for (const name of events) window.removeEventListener(name, run);
      clearTimeout(timer);
      preloadSheets();
    };
    for (const name of events) window.addEventListener(name, run, { passive: true, once: true });
    // Otherwise a few seconds after loading, when the phone is idle
    const timer = setTimeout(() => {
      if ("requestIdleCallback" in window) window.requestIdleCallback(run, { timeout: 2000 });
      else run();
    }, 6000);
    return () => {
      done = true;
      for (const name of events) window.removeEventListener(name, run);
      clearTimeout(timer);
    };
  }, []);

  return mounted;
}

/** The whole catalog on one page: header, sticky categories, items, order bar, sheets */
export function MenuView() {
  const { categories, menuItems, t, bookingEnabled, cartItemCount, orderingEnabled, module } = useCatalog();
  const EmptyIcon = { UtensilsCrossed, Coffee, ShoppingBag, Sparkles, BedDouble }[module.icon];
  const sections = useMenuSections(categories, menuItems);
  const mountedSheets = useSheets();

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

        <PoweredBy className="mx-auto mt-12 max-w-xl px-4" />
      </main>

      <CartBar />
      {mountedSheets
        .filter((name) => (name === "reservation" ? bookingEnabled : name === "dates" ? module.nights : true))
        .map((name) => {
          const SheetView = SHEETS[name];
          return <SheetView key={name} />;
        })}
    </>
  );
}
