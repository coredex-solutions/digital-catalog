"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Bell, Coffee, ShoppingBag, Sparkles, UtensilsCrossed } from "lucide-react";
import { formatPrice } from "@/lib/catalog/price";
import { HeroMenuDemo } from "./HeroMenuDemo";
import { HeroModuleSample } from "./HeroModuleSamples";
import type { SiteCopy, SiteLang } from "./copy";

const MODULES = ["restaurant", "cafe", "shop", "services"] as const;
type Module = (typeof MODULES)[number];
const ICONS: Record<Module, typeof Coffee> = { restaurant: UtensilsCrossed, cafe: Coffee, shop: ShoppingBag, services: Sparkles };
// The sample price shown in the floating card, formatted like the real page
const SAMPLE_PRICE: Record<Module, number> = { restaurant: 4, cafe: 3.5, shop: 18, services: 15 };
const PRICES = { primary: "USD" as const, lbpRate: 89500, rateUpdatedAt: null, showDual: true };
const ROTATE_MS = 6000;
const cardShadow = "shadow-[0_16px_32px_-16px_rgba(23,21,46,0.35)]";

/**
 * The hero phone: one sample page per kind of business, switched by tabs above it. The tabs move
 * on by themselves while the hero is in view, until the visitor touches anything here (and never
 * with reduced motion). Each sample works: search, language switch and adding items.
 */
export function HeroShowcase({
  lang,
  t,
  floats,
  demos,
  demoQr,
}: {
  lang: SiteLang;
  t: SiteCopy["showcase"];
  floats: SiteCopy["floats"];
  demos: Partial<Record<Module, string>>;
  demoQr: string | null;
}) {
  const [active, setActive] = useState<Module>("restaurant");
  const [touched, setTouched] = useState(false);
  const [paused, setPaused] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  // Rotate while visible, not hovered, not touched, and motion is welcome
  useEffect(() => {
    if (touched || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = root.current;
    let visible = true;
    const observer = el && "IntersectionObserver" in window ? new IntersectionObserver(([entry]) => (visible = entry.isIntersecting)) : null;
    if (el && observer) observer.observe(el);
    const timer = window.setInterval(() => {
      if (visible && document.visibilityState === "visible") setActive((current) => MODULES[(MODULES.indexOf(current) + 1) % MODULES.length]);
    }, ROTATE_MS);
    return () => {
      window.clearInterval(timer);
      observer?.disconnect();
    };
  }, [touched, paused]);

  const choose = (module: Module) => {
    setTouched(true);
    setActive(module);
  };

  // Arrow keys move between tabs (left/right follow the reading direction)
  const onKey = (event: React.KeyboardEvent, index: number) => {
    const forward = lang === "ar" ? "ArrowLeft" : "ArrowRight";
    const back = lang === "ar" ? "ArrowRight" : "ArrowLeft";
    let next = -1;
    if (event.key === forward) next = (index + 1) % MODULES.length;
    else if (event.key === back) next = (index - 1 + MODULES.length) % MODULES.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = MODULES.length - 1;
    if (next < 0) return;
    event.preventDefault();
    choose(MODULES[next]);
    tabs.current[next]?.focus();
  };

  const price = formatPrice(SAMPLE_PRICE[active], "USD", PRICES, lang);
  const [orderTitle, orderBody] = t.orders[active];
  const demo = demos[active];

  return (
    <div
      ref={root}
      className="site-pop relative mx-auto w-[300px] sm:w-[320px]"
      style={{ animationDelay: "150ms" }}
      onPointerDown={() => setTouched(true)}
      onFocusCapture={() => setTouched(true)}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      <div className="absolute -inset-10 -z-10 rounded-full bg-[radial-gradient(closest-side,rgba(64,40,201,0.22),transparent)]" aria-hidden />

      {/* Kind of business */}
      <div role="tablist" aria-label={t.label} className="mx-auto mb-4 grid w-full grid-cols-4 gap-1 rounded-panel border border-ui-line bg-ui-surface p-1 shadow-sm">
        {MODULES.map((module, index) => {
          const Icon = ICONS[module];
          const selected = active === module;
          return (
            <button
              key={module}
              ref={(el) => {
                tabs.current[index] = el;
              }}
              type="button"
              role="tab"
              id={`hero-tab-${module}`}
              aria-selected={selected}
              aria-controls="hero-phone"
              tabIndex={selected ? 0 : -1}
              onClick={() => choose(module)}
              onKeyDown={(event) => onKey(event, index)}
              className={`relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-control px-1 text-xs font-semibold transition-colors ${
                selected ? "bg-ui-primary text-ui-primary-fg" : "text-ui-muted hover:bg-ui-subtle hover:text-ui-ink"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {t.tabs[module]}
              {/* Time left before the next tab, while rotating */}
              {selected && !touched && !paused && (
                <span key={active} className="site-progress absolute inset-x-2 bottom-1 h-0.5 origin-left rounded-full bg-white/60 rtl:origin-right" style={{ animationDuration: `${ROTATE_MS}ms` }} aria-hidden />
              )}
            </button>
          );
        })}
      </div>

      <figure id="demo" className="scroll-mt-24">
        <div
          id="hero-phone"
          role="tabpanel"
          aria-labelledby={`hero-tab-${active}`}
          className="overflow-hidden rounded-[2.25rem] border-[10px] border-ui-ink bg-ui-surface shadow-[0_32px_64px_-24px_rgba(23,21,46,0.5)]"
        >
          <div key={active} className="site-fade">
            {active === "restaurant" ? <HeroMenuDemo lang={lang} /> : <HeroModuleSample sample={active} lang={lang} />}
          </div>
        </div>
        <figcaption className="mt-3 flex items-center justify-center gap-2 text-sm text-ui-muted">
          <span>{t.sample}</span>
          {demo && (
            <>
              <span aria-hidden>·</span>
              <a href={`/c/${demo}/?lang=${lang}`} className="inline-flex items-center gap-1 font-medium text-ui-primary underline-offset-4 hover:underline">
                {t.openDemo}
                <ArrowUpRight className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden />
              </a>
            </>
          )}
        </figcaption>
      </figure>

      {/* Floating illustrations (decorative; the same facts are in the text) */}
      <div aria-hidden className="pointer-events-none">
        <div key={`order-${active}`} className={`site-pop absolute -start-28 top-[5.75rem] hidden w-56 rounded-panel border border-ui-line bg-ui-surface p-3 sm:block lg:-start-40 ${cardShadow}`}>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ui-primary text-ui-primary-fg">
              <Bell className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold leading-tight">{orderTitle}</span>
          </div>
          <p className="mt-2 text-sm text-ui-muted">{orderBody}</p>
        </div>

        <div key={`price-${active}`} className={`site-pop absolute -end-24 top-[52%] hidden rounded-panel border border-ui-line bg-ui-surface px-4 py-3 sm:block lg:-end-32 ${cardShadow}`} style={{ animationDelay: "80ms" }}>
          <p className="text-sm font-semibold">{t.priceLabel[active]}</p>
          <p className="mt-0.5 flex items-baseline gap-2">
            <bdi className="text-lg font-semibold tabular-nums">{price.primary}</bdi>
            <bdi className="text-sm tabular-nums text-ui-muted">{price.secondary}</bdi>
          </p>
        </div>

        {demoQr && (
          <div className={`site-float absolute -start-28 bottom-16 hidden rounded-panel border border-ui-line bg-ui-surface p-3 sm:block lg:-start-40 ${cardShadow}`} style={{ animationDelay: "-3s" }}>
            <div className="relative h-24 w-24 overflow-hidden rounded-control">
              <div className="h-full w-full [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: demoQr }} />
              <span className="site-scan absolute inset-x-1 h-0.5 rounded-full bg-ui-primary shadow-[0_0_12px_2px_rgba(64,40,201,0.6)]" />
            </div>
            <p className="mt-2 text-center text-xs font-semibold">{floats.scan}</p>
          </div>
        )}

        <div className="site-float-slow absolute -end-14 bottom-28 hidden rounded-full border border-ui-line bg-ui-surface px-3 py-1.5 text-sm font-semibold shadow-[0_12px_24px_-12px_rgba(23,21,46,0.35)] sm:block lg:-end-20">
          {floats.lang}
        </div>
      </div>
    </div>
  );
}
