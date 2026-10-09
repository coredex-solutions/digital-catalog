"use client";

import { useState } from "react";
import Image from "next/image";
import { Languages, Search } from "lucide-react";
import { formatPrice } from "@/lib/catalog/price";
import type { SiteCopy, SiteLang } from "./copy";

// Sample dishes in both languages (illustrative, shown as a mini menu)
const DISHES = [
  {
    img: "/landing/hummus.png",
    en: { name: "Hummus", desc: "Chickpeas, tahini, lemon and olive oil" },
    ar: { name: "حمص", desc: "حمص بالطحينة والليمون وزيت الزيتون" },
    price: 4,
  },
  {
    img: "/landing/kibbeh.png",
    en: { name: "Fried kibbeh", desc: "Bulgur shells filled with spiced meat and pine nuts" },
    ar: { name: "كبة مقلية", desc: "برغل محشو باللحمة المتبّلة والصنوبر" },
    price: 6,
  },
  {
    img: "/landing/baba-ganoush.png",
    en: { name: "Baba ghanoush", desc: "Smoked eggplant, tahini and pomegranate" },
    ar: { name: "بابا غنوج", desc: "باذنجان مشوي مع الطحينة والرمان" },
    price: 4.5,
  },
];

const UI = {
  en: { search: "Search the menu", section: "Cold mezze", chips: ["Mezze", "Grills", "Drinks"] },
  ar: { search: "ابحث في القائمة", section: "مازة باردة", chips: ["مازة", "مشاوي", "مشروبات"] },
};

/** A mini menu that flips between Arabic (RTL) and English on one tap */
export function LanguageDemo({ t, lang }: { t: SiteCopy["language"]; lang: SiteLang }) {
  const [shown, setShown] = useState<SiteLang>(lang);
  const ui = UI[shown];

  return (
    <div className="rounded-panel border border-ui-line bg-ui-surface p-4 shadow-[0_24px_48px_-32px_rgba(23,43,38,0.4)] sm:p-5">
      <button
        type="button"
        onClick={() => setShown(shown === "ar" ? "en" : "ar")}
        aria-pressed={shown !== lang}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-control bg-ui-primary px-4 font-semibold text-ui-primary-fg transition-colors hover:bg-ui-primary-hover"
      >
        <Languages className="h-5 w-5" aria-hidden />
        <span lang={shown === lang ? (lang === "ar" ? "en" : "ar") : lang}>{shown === lang ? t.switchTo : t.switchBack}</span>
      </button>

      <div key={shown} lang={shown} dir={shown === "ar" ? "rtl" : "ltr"} className="site-pop mt-4" style={shown === "ar" ? { fontFamily: "var(--font-platform-arabic), sans-serif" } : undefined}>
        <div className="flex min-h-11 items-center gap-2 rounded-control border border-ui-input px-3 text-sm text-ui-muted">
          <Search className="h-4 w-4" aria-hidden />
          {ui.search}
        </div>
        <div className="mt-3 flex gap-2">
          {ui.chips.map((chip, i) => (
            <span key={chip} className={`rounded-control px-3 py-1.5 text-sm font-semibold ${i === 0 ? "bg-ui-primary text-ui-primary-fg" : "text-ui-muted"}`}>
              {chip}
            </span>
          ))}
        </div>
        <p className="mt-4 text-lg font-semibold">{ui.section}</p>
        <ul className="divide-y divide-[var(--ui-line)]">
          {DISHES.map((dish) => {
            const text = dish[shown];
            return (
              <li key={dish.img} className="flex gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{text.name}</p>
                  <p className="line-clamp-2 text-sm text-ui-muted">{text.desc}</p>
                  <p className="mt-1 text-sm font-semibold tabular-nums">
                    <bdi>{formatPrice(dish.price, "USD", { primary: "USD", lbpRate: null, rateUpdatedAt: null, showDual: false }, shown).primary}</bdi>
                  </p>
                </div>
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-control bg-ui-subtle">
                  <Image src={dish.img} alt="" fill sizes="64px" className="object-cover" />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
