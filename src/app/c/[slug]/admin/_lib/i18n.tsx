"use client";

// Owner dashboard in Arabic and English. The language is the site-wide choice (cookie site_lang,
// set on the home page, at sign-in or with the switch in the dashboard menu), resolved on the
// server in admin/layout.tsx so the first render already has the right text and direction.
//
// Each page keeps its own copy next to its code:
//   const en = { title: "Dishes", count: (n: number) => `${n} dishes` };
//   const ar: typeof en = { title: "الأطباق", count: (n) => plural("ar", n, {...}) };
//   const t = useCopy({ en, ar });

import { createContext, useCallback, useContext } from "react";
import { useRouter } from "next/navigation";
import { SITE_LANG_COOKIE } from "@/app/_landing/copy";

export type AdminLang = "en" | "ar";

const AdminLangContext = createContext<AdminLang>("en");

export function AdminLangProvider({ lang, children }: { lang: AdminLang; children: React.ReactNode }) {
  return <AdminLangContext.Provider value={lang}>{children}</AdminLangContext.Provider>;
}

export function useAdminLang(): AdminLang {
  return useContext(AdminLangContext);
}

/** This file's copy in the dashboard language */
export function useCopy<T>(copy: { en: T; ar: T }): T {
  return copy[useAdminLang()];
}

/** Switches the dashboard (and the rest of the site) to the other language */
export function useSetAdminLang() {
  const router = useRouter();
  return useCallback(
    (lang: AdminLang) => {
      document.cookie = `${SITE_LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
      router.refresh();
    },
    [router]
  );
}

/**
 * An owner-written name in the dashboard language, falling back to the other language:
 * pickName(dish, "ar") → name_ar, or name_en when there is no Arabic name.
 */
export function pickName(row: { name_en?: string | null; name_ar?: string | null } | null | undefined, lang: AdminLang): string {
  if (!row) return "";
  const first = lang === "ar" ? row.name_ar : row.name_en;
  const second = lang === "ar" ? row.name_en : row.name_ar;
  return String(first || "").trim() || String(second || "").trim();
}

// ---- Plurals ----

export interface PluralForms {
  /** 0 (Arabic only; falls back to `other`) */
  zero?: string;
  one: string;
  /** 2 (Arabic dual) */
  two?: string;
  /** 3–10 (Arabic) */
  few?: string;
  /** 11–99 (Arabic) */
  many?: string;
  other: string;
}

/**
 * Picks the plural form for n and replaces "#" with the number.
 * English: plural("en", n, { one: "# dish", other: "# dishes" })
 * Arabic:  plural("ar", n, { zero: "لا أطباق", one: "طبق واحد", two: "طبقان", few: "# أطباق", many: "# طبقاً", other: "# طبق" })
 */
export function plural(lang: AdminLang, n: number, forms: PluralForms): string {
  const rule = new Intl.PluralRules(lang === "ar" ? "ar" : "en").select(n) as keyof PluralForms;
  const form = forms[rule] ?? forms.other;
  return form.replace(/#/g, formatNumber(n, lang));
}

// ---- Numbers and dates ----
// Western digits in both languages, as on Lebanese menus and on the guest menu.

const LOCALE: Record<AdminLang, string> = { en: "en-GB", ar: "ar-LB-u-nu-latn" };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function formatNumber(value: number, _lang: AdminLang, options?: Intl.NumberFormatOptions): string {
  // "1,250" in both languages (Arabic separators would read as a different number to many owners)
  return new Intl.NumberFormat("en-US", options).format(value);
}

/** A date in Beirut time, e.g. "19 October 2026" / "19 تشرين الأول 2026" */
export function formatDate(
  value: string | number | Date,
  lang: AdminLang,
  options: Intl.DateTimeFormatOptions = { dateStyle: "long" }
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(LOCALE[lang], { timeZone: "Asia/Beirut", ...options }).format(date);
}

/** Date and time in Beirut time, e.g. "19 Oct 2026, 14:05" */
export function formatDateTime(value: string | number | Date, lang: AdminLang): string {
  return formatDate(value, lang, { dateStyle: "medium", timeStyle: "short" });
}

/** Hooks version: const f = useFormat(); f.date(x) */
export function useFormat() {
  const lang = useAdminLang();
  return {
    lang,
    number: (value: number, options?: Intl.NumberFormatOptions) => formatNumber(value, lang, options),
    date: (value: string | number | Date, options?: Intl.DateTimeFormatOptions) => formatDate(value, lang, options),
    dateTime: (value: string | number | Date) => formatDateTime(value, lang),
    plural: (n: number, forms: PluralForms) => plural(lang, n, forms),
  };
}
