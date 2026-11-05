"use client";

import { useState } from "react";
import Image from "next/image";
import { Clock3, Languages, Search } from "lucide-react";
import { formatPrice } from "@/lib/catalog/price";
import { BusinessPicker } from "./BusinessPicker";
import { SAMPLES, duration } from "./HeroModuleSamples";
import type { Business } from "./samples";
import type { SiteCopy, SiteLang } from "./copy";

type Text = Record<SiteLang, string>;
type Item = { id: string; name: Text; detail?: Text; price: number; img?: string; minutes?: number };

// Three items from each sample page, with the search box and sections a real page would show
const PAGES: Record<Business, { search: Text; chips: Text[]; section: Text; items: Item[] }> = {
  restaurant: {
    search: { en: "Search the menu", ar: "ابحث في القائمة" },
    chips: [
      { en: "Mezze", ar: "مازة" },
      { en: "Grills", ar: "مشاوي" },
      { en: "Drinks", ar: "مشروبات" },
    ],
    section: { en: "Cold mezze", ar: "مازة باردة" },
    items: [
      { id: "hummus", img: "/landing/hummus.png", price: 4, name: { en: "Hummus", ar: "حمص" }, detail: { en: "Chickpeas, tahini, lemon and olive oil", ar: "حمص بالطحينة والليمون وزيت الزيتون" } },
      { id: "kibbeh", img: "/landing/kibbeh.png", price: 6, name: { en: "Fried kibbeh", ar: "كبة مقلية" }, detail: { en: "Bulgur shells filled with spiced meat and pine nuts", ar: "برغل محشو باللحمة المتبّلة والصنوبر" } },
      { id: "baba", img: "/landing/baba-ganoush.png", price: 4.5, name: { en: "Baba ghanoush", ar: "بابا غنوج" }, detail: { en: "Smoked eggplant, tahini and pomegranate", ar: "باذنجان مشوي مع الطحينة والرمان" } },
    ],
  },
  cafe: {
    search: SAMPLES.cafe.search,
    chips: [
      { en: "Coffee", ar: "قهوة" },
      { en: "Sweets", ar: "حلويات" },
      { en: "Bakery", ar: "مخبوزات" },
    ],
    section: SAMPLES.cafe.section,
    items: SAMPLES.cafe.items.filter((item) => ["cappuccino", "croissant", "cake"].includes(item.id)),
  },
  shop: {
    search: SAMPLES.shop.search,
    chips: [
      { en: "New in", ar: "وصل حديثاً" },
      { en: "Tops", ar: "قمصان" },
      { en: "Bags", ar: "حقائب" },
    ],
    section: SAMPLES.shop.section,
    items: SAMPLES.shop.items.filter((item) => ["tee", "sweat", "bag"].includes(item.id)),
  },
  services: {
    search: SAMPLES.services.search,
    chips: [
      { en: "Hair", ar: "شعر" },
      { en: "Nails", ar: "أظافر" },
      { en: "Make-up", ar: "مكياج" },
    ],
    section: SAMPLES.services.section,
    items: SAMPLES.services.items.filter((item) => ["cut", "colour", "nails"].includes(item.id)),
  },
};

/** A mini page (menu, store or services) that flips between Arabic (RTL) and English on one tap */
export function LanguageDemo({ t, lang, labels }: { t: SiteCopy["language"]; lang: SiteLang; labels: Record<Business, string> }) {
  const [shown, setShown] = useState<SiteLang>(lang);
  const [business, setBusiness] = useState<Business>("restaurant");
  const page = PAGES[business];

  return (
    <div className="rounded-panel border border-ui-line bg-ui-surface p-4 shadow-[0_24px_48px_-32px_rgba(23,21,46,0.4)] sm:p-5">
      <BusinessPicker value={business} onChange={setBusiness} labels={labels} label={t.pickerLabel} className="bg-ui-bg" />
      <button
        type="button"
        onClick={() => setShown(shown === "ar" ? "en" : "ar")}
        aria-pressed={shown !== lang}
        className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-control bg-ui-primary px-4 font-semibold text-ui-primary-fg transition-colors hover:bg-ui-primary-hover"
      >
        <Languages className="h-5 w-5" aria-hidden />
        <span lang={shown === lang ? (lang === "ar" ? "en" : "ar") : lang}>{shown === lang ? t.switchTo : t.switchBack}</span>
      </button>

      <div key={`${shown}-${business}`} lang={shown} dir={shown === "ar" ? "rtl" : "ltr"} className="site-pop mt-4">
        <div className="flex min-h-11 items-center gap-2 rounded-control border border-ui-input px-3 text-sm text-ui-muted">
          <Search className="h-4 w-4" aria-hidden />
          {page.search[shown]}
        </div>
        <div className="mt-3 flex gap-2">
          {page.chips.map((chip, i) => (
            <span key={chip.en} className={`rounded-control px-3 py-1.5 text-sm font-semibold ${i === 0 ? "bg-ui-primary text-ui-primary-fg" : "text-ui-muted"}`}>
              {chip[shown]}
            </span>
          ))}
        </div>
        <p className="mt-4 text-lg font-semibold">{page.section[shown]}</p>
        <ul className="divide-y divide-[var(--ui-line)]">
          {page.items.map((item) => (
            <li key={item.id} className="flex gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{item.name[shown]}</p>
                {item.detail && <p className="line-clamp-2 text-sm text-ui-muted">{item.detail[shown]}</p>}
                <p className="mt-1 flex flex-wrap items-center gap-x-3 text-sm">
                  <bdi className="font-semibold tabular-nums">
                    {formatPrice(item.price, "USD", { primary: "USD", lbpRate: null, rateUpdatedAt: null, showDual: false }, shown).primary}
                  </bdi>
                  {item.minutes && (
                    <span className="inline-flex items-center gap-1 text-ui-muted">
                      <Clock3 className="h-3.5 w-3.5" aria-hidden />
                      {duration(item.minutes, shown)}
                    </span>
                  )}
                </p>
              </div>
              {item.img && (
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-control bg-ui-subtle">
                  <Image src={item.img} alt="" fill sizes="64px" className="object-cover" />
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
