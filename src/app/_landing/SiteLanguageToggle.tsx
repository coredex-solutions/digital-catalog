"use client";

import { useRouter } from "next/navigation";
import { SITE_LANG_COOKIE, type SiteLang } from "./copy";

/** Switches the marketing site between English and Arabic; the server re-renders the page */
export function SiteLanguageToggle({ current, label }: { current: SiteLang; label: string }) {
  const router = useRouter();
  const next: SiteLang = current === "ar" ? "en" : "ar";

  return (
    <button
      type="button"
      lang={next}
      onClick={() => {
        document.cookie = `${SITE_LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
        router.refresh();
      }}
      className="inline-flex min-h-11 items-center rounded-control border border-ui-input px-3.5 text-sm font-medium text-ui-ink transition-colors hover:bg-ui-subtle"
    >
      {label}
    </button>
  );
}
