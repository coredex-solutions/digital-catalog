"use client";

import { useCatalog } from "../../_providers/CatalogProvider";

// The Core Commerce home page in the page's language (absolute when the site address is set,
// so the link still goes to Core Commerce if a business page is ever served on its own domain)
const SITE = (process.env.NEXT_PUBLIC_BASE_URL || "").replace(/\/+$/, "");

/** "Menu by Core Commerce", linking to the Core Commerce home page */
export function PoweredBy({ className = "" }: { className?: string }) {
  const { t, lang } = useCatalog();
  return (
    <p className={`text-center text-xs text-menu-muted ${className}`}>
      <a href={`${SITE}${lang === "ar" ? "/ar/" : "/"}`} className="inline-flex min-h-9 items-center underline-offset-4 hover:text-menu-ink hover:underline">
        {t.poweredBy}
      </a>
    </p>
  );
}
