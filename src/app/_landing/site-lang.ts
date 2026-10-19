import { cookies, headers } from "next/headers";
import { SITE_LANG_COOKIE, type SiteLang } from "./copy";

/** Marketing and account pages: saved choice first, then the browser's preferred language */
export async function resolveSiteLang(): Promise<SiteLang> {
  const saved = (await cookies()).get(SITE_LANG_COOKIE)?.value;
  if (saved === "ar" || saved === "en") return saved;
  const accept = (await headers()).get("accept-language") || "";
  return accept.trim().toLowerCase().startsWith("ar") ? "ar" : "en";
}
