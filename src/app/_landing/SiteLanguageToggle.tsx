"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SITE_LANG_COOKIE, type SiteLang } from "./copy";

function remember(lang: SiteLang) {
  document.cookie = `${SITE_LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
}

/**
 * Switches the site between English and Arabic. With `href` (the home page, where each language
 * has its own address) it is a plain link to the other page; elsewhere the server re-renders
 * the same page in the other language.
 */
export function SiteLanguageToggle({ current, label, href }: { current: SiteLang; label: string; href?: string }) {
  const router = useRouter();
  const next: SiteLang = current === "ar" ? "en" : "ar";
  const className = `inline-flex min-h-11 items-center rounded-control border border-ui-input px-3.5 text-sm font-medium text-ui-ink transition-colors hover:bg-ui-subtle ${next === "ar" ? "font-system" : ""}`;

  if (href) {
    return (
      <a href={href} hrefLang={next} lang={next} onClick={() => remember(next)} className={className}>
        {label}
      </a>
    );
  }

  return (
    <button
      type="button"
      lang={next}
      onClick={() => {
        remember(next);
        router.refresh();
      }}
      className={className}
    >
      {label}
    </button>
  );
}

/** Remembers the language of the home page being read, so sign-in and the next visit match it */
export function RememberSiteLang({ lang }: { lang: SiteLang }) {
  useEffect(() => {
    if (!document.cookie.split("; ").includes(`${SITE_LANG_COOKIE}=${lang}`)) remember(lang);
  }, [lang]);
  return null;
}
