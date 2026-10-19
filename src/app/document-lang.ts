import { headers } from "next/headers";
import { getMenuData } from "./c/[slug]/_lib/menu-data";
import { getMenuLanguages, resolveMenuLanguage } from "./c/[slug]/_lib/locale";
import { resolveSiteLang } from "./_landing/site-lang";

/**
 * The language of the page being rendered, for <html lang dir>. Pages also set lang/dir on
 * their own wrapper; this makes the document itself right for browsers' translate offers,
 * screen readers and search engines. The path comes from src/proxy.ts.
 */
export async function documentLang(): Promise<"ar" | "en"> {
  const path = (await headers()).get("x-pathname") || "/";
  if (path === "/ar" || path.startsWith("/ar/")) return "ar";
  if (/^\/(login|forgot-password|reset-password)(\/|$)/.test(path)) return resolveSiteLang();
  // The owner dashboard follows the same saved choice as the site and sign-in
  if (/^\/c\/[^/]+\/admin(\/|$)/.test(path)) return resolveSiteLang();

  // Guest menu pages (not the owner's admin or old login addresses)
  const menu = path.match(/^\/c\/([^/]+)(\/.*)?$/);
  if (menu && !/^\/(admin|login|preview)(\/|$)/.test(menu[2] || "")) {
    const data = await getMenuData(decodeURIComponent(menu[1])).catch(() => null);
    if (!data) return "en";
    const enabled = getMenuLanguages(data.settings?.enabled_languages, data.subscription);
    return resolveMenuLanguage(data.catalog.slug, enabled, data.settings?.default_language);
  }
  return "en";
}
