"use client";

import { ImageIcon, Info, MessageCircle, Phone, Plus, Search } from "lucide-react";
import { buildMenuTheme } from "../../_lib/theme";
import { getDictionary } from "../../_lib/i18n";
import { cn } from "@/utils/helpers";

export type PreviewLang = "en" | "ar";

interface MenuBrandPreviewProps {
  brandColor: string;
  theme: "light" | "dark";
  lang: PreviewLang;
  names: { name?: string; name_en?: string; name_ar?: string };
  logoUrl?: string;
  coverUrl?: string;
  hasPhone: boolean;
  hasWhatsapp: boolean;
  currency: "USD" | "LBP";
}

// Placeholder content, clearly marked as sample: the settings page has no dishes loaded.
const SAMPLE = {
  en: {
    categories: ["Sample category", "Category 2", "Category 3"],
    dishes: [
      { name: "Sample dish", description: "A short description of the dish appears here, up to two lines on the menu." },
      { name: "Sample dish 2", description: "Ingredients, portion size or allergens can go in the description." },
      { name: "Sample dish 3", description: "Shown for preview only." },
    ],
    restaurant: "Your restaurant",
  },
  ar: {
    categories: ["قسم تجريبي", "قسم ٢", "قسم ٣"],
    dishes: [
      { name: "طبق تجريبي", description: "يظهر هنا وصف قصير للطبق، حتى سطرين في القائمة." },
      { name: "طبق تجريبي ٢", description: "يمكن ذكر المكونات أو الحجم أو مسببات الحساسية في الوصف." },
      { name: "طبق تجريبي ٣", description: "للمعاينة فقط." },
    ],
    restaurant: "مطعمك",
  },
};

const SAMPLE_PRICES = { USD: ["$8.00", "$12.50", "$5.00"], LBP: ["720,000 LBP", "1,120,000 LBP", "450,000 LBP"] };

/**
 * Static miniature of the diner menu (src/app/c/[slug]/_components/menu) for the Branding tab.
 * It uses the real `.menu` tokens and buildMenuTheme, so only the brand colour changes it,
 * exactly as on the live menu. Nothing in it is interactive.
 */
export function MenuBrandPreview({
  brandColor,
  theme,
  lang,
  names,
  logoUrl,
  coverUrl,
  hasPhone,
  hasWhatsapp,
  currency,
}: MenuBrandPreviewProps) {
  const t = getDictionary(lang);
  const sample = SAMPLE[lang];
  const name =
    (lang === "ar" ? names.name_ar || names.name_en || names.name : names.name_en || names.name || names.name_ar) ||
    sample.restaurant;
  const prices = SAMPLE_PRICES[currency] ?? SAMPLE_PRICES.USD;

  const chip =
    "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-control border border-menu-line bg-menu-surface px-2.5 text-[11px] font-medium text-menu-ink";

  return (
    <div
      className="menu pointer-events-none select-none h-full overflow-hidden font-menu-sans text-[13px]"
      data-theme={theme}
      lang={lang}
      dir={lang === "ar" ? "rtl" : "ltr"}
      style={buildMenuTheme(brandColor)}
      aria-hidden
      inert
    >
      {coverUrl && (
        <div className="relative h-24 w-full overflow-hidden bg-menu-raised">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverUrl} alt="" className="h-full w-full object-cover" />
        </div>
      )}

      <div className="px-3">
        <div className={coverUrl ? "relative -mt-5 flex items-end gap-2" : "flex items-center gap-2 pt-3"}>
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-control border-2 border-[var(--menu-bg)] bg-menu-surface shadow-menu-sm">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-brand text-base font-semibold text-brand-fg">
                {name.charAt(0)}
              </span>
            )}
          </div>
        </div>

        <p className="mt-1.5 text-[17px] font-semibold leading-tight text-menu-ink">{name}</p>
        <p className="mt-0.5 inline-flex items-center gap-1.5 text-[11px]">
          <span className="h-1.5 w-1.5 rounded-full bg-menu-success" />
          <span className="font-semibold text-menu-success">{t.openNow}</span>
        </p>

        <div className="mt-2 flex gap-1.5 overflow-hidden">
          {hasPhone && (
            <span className={chip}>
              <Phone className="h-3.5 w-3.5" />
              {t.call}
            </span>
          )}
          {hasWhatsapp && (
            <span className={chip}>
              <MessageCircle className="h-3.5 w-3.5" />
              {t.whatsapp}
            </span>
          )}
          <span className={chip}>
            <Info className="h-3.5 w-3.5" />
            {t.info}
          </span>
        </div>

        <div className="mt-2 flex h-9 items-center gap-2 rounded-control border border-menu-input-border bg-menu-surface px-3 text-[12px] text-menu-muted">
          <Search className="h-4 w-4 shrink-0" />
          {t.searchPlaceholder}
        </div>
      </div>

      {/* Sticky category chips */}
      <div className="mt-2 border-b border-menu-line bg-menu-bg">
        <div className="flex gap-1.5 overflow-hidden px-3 py-1.5">
          {sample.categories.map((category, i) => (
            <span
              key={category}
              className={cn(
                "inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-control px-3 text-[12px] font-semibold",
                i === 0 ? "bg-brand text-brand-fg" : "text-menu-muted"
              )}
            >
              {category}
            </span>
          ))}
        </div>
      </div>

      <div className="px-3">
        <p className="pt-3 text-[15px] font-semibold text-menu-ink">{sample.categories[0]}</p>
        <div className="divide-y divide-[var(--menu-line)]">
          {sample.dishes.map((dish, i) => (
            <div key={dish.name} className="flex gap-3 py-2.5">
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="text-[13px] font-semibold leading-snug text-menu-ink">{dish.name}</p>
                <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-menu-muted">{dish.description}</p>
                <p className="mt-auto pt-1 text-[12px] font-semibold text-menu-ink tabular-nums" dir="ltr">
                  {prices[i]}
                </p>
              </div>
              <div className="relative h-16 w-16 shrink-0">
                <div className="flex h-full w-full items-center justify-center rounded-control bg-menu-raised text-menu-muted">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <span
                  className={cn(
                    "absolute -bottom-1.5 end-1 flex h-7 w-7 items-center justify-center rounded-control shadow-menu-sm",
                    i === 0 ? "bg-brand text-brand-fg" : "border border-menu-line bg-menu-surface text-menu-ink"
                  )}
                >
                  {i === 0 ? <span className="text-[11px] font-semibold">1</span> : <Plus className="h-4 w-4" />}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
