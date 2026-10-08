// Resolves the diner's language and theme on the server, so the first render already has
// the right text, direction and colours (no language gate, no theme flash).

import { cookies, headers } from "next/headers";
import type { Language } from "@/types";

export const LANG_COOKIE = (slug: string) => `menu_lang_${slug}`;
export const THEME_COOKIE = "menu_theme";

/** Languages the owner enabled, in the order they listed them; Arabic and English by default */
export function getEnabledLanguages(enabled?: string | null): Language[] {
  const codes = (enabled || "ar,en")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((c): c is Language => c === "ar" || c === "en" || c === "fr");
  return codes.length > 0 ? [...new Set(codes)] : ["ar", "en"];
}

export async function resolveMenuLanguage(
  slug: string,
  enabledLanguages: Language[],
  defaultLanguage?: string | null
): Promise<Language> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LANG_COOKIE(slug))?.value as Language | undefined;
  if (fromCookie && enabledLanguages.includes(fromCookie)) return fromCookie;

  // First enabled language the browser asks for, e.g. "ar-LB,ar;q=0.9,en;q=0.8"
  const acceptLanguage = (await headers()).get("accept-language") || "";
  for (const part of acceptLanguage.split(",")) {
    const code = part.split(";")[0].trim().slice(0, 2).toLowerCase() as Language;
    if (enabledLanguages.includes(code)) return code;
  }

  const fallback = (defaultLanguage || "").toLowerCase() as Language;
  return enabledLanguages.includes(fallback) ? fallback : enabledLanguages[0];
}

export async function resolveMenuTheme(): Promise<"light" | "dark"> {
  const cookieStore = await cookies();
  return cookieStore.get(THEME_COOKIE)?.value === "dark" ? "dark" : "light";
}
