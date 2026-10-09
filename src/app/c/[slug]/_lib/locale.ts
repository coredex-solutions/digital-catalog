// Resolves the diner's language and theme on the server, so the first render already has
// the right text, direction and colours (no language gate, no theme flash).

import { cookies, headers } from "next/headers";
import type { Language } from "@/types";

export const LANG_COOKIE = (slug: string) => `menu_lang_${slug}`;
export const THEME_COOKIE = "menu_theme";

/** Languages the menu can be shown in. Only Arabic and English are supported. */
export const SUPPORTED_LANGUAGES: readonly Language[] = ["ar", "en"];

export function isMenuLanguage(value: unknown): value is Language {
  return typeof value === "string" && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

/**
 * Languages the owner enabled, in the order they listed them; Arabic and English by default.
 * Codes that are no longer supported (e.g. "fr" saved by older versions) are ignored.
 */
export function getEnabledLanguages(enabled?: string | null): Language[] {
  const codes = (enabled || "ar,en")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(isMenuLanguage);
  return codes.length > 0 ? [...new Set(codes)] : ["ar", "en"];
}

/**
 * Languages the menu offers. Arabic and English are included in every plan, so this is the
 * owner's choice; the subscription argument is kept for callers.
 */
export function getMenuLanguages(
  enabled: string | null | undefined,
  _subscription?: unknown
): Language[] {
  return getEnabledLanguages(enabled);
}

export async function resolveMenuLanguage(
  slug: string,
  enabledLanguages: Language[],
  defaultLanguage?: string | null
): Promise<Language> {
  const cookieStore = await cookies();
  // A stale cookie (e.g. "fr" from an older version) is ignored
  const fromCookie = cookieStore.get(LANG_COOKIE(slug))?.value;
  if (isMenuLanguage(fromCookie) && enabledLanguages.includes(fromCookie)) return fromCookie;

  // First enabled language the browser asks for, e.g. "ar-LB,ar;q=0.9,en;q=0.8"
  const acceptLanguage = (await headers()).get("accept-language") || "";
  for (const part of acceptLanguage.split(",")) {
    const code = part.split(";")[0].trim().slice(0, 2).toLowerCase();
    if (isMenuLanguage(code) && enabledLanguages.includes(code)) return code;
  }

  const fallback = (defaultLanguage || "").toLowerCase();
  if (isMenuLanguage(fallback) && enabledLanguages.includes(fallback)) return fallback;
  return enabledLanguages[0] ?? "ar";
}

export async function resolveMenuTheme(): Promise<"light" | "dark"> {
  const cookieStore = await cookies();
  return cookieStore.get(THEME_COOKIE)?.value === "dark" ? "dark" : "light";
}
