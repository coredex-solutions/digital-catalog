"use client";

import { Languages } from "lucide-react";
import type { Language } from "@/types";
import { useCatalog } from "../../_providers/CatalogProvider";
import { cn } from "@/utils/helpers";

const LABELS: Record<Language, string> = { ar: "العربية", en: "English" };
// Short labels for the compact header chip; screen readers get the full name
const SHORT_LABELS: Record<Language, string> = { ar: "عربي", en: "EN" };

/**
 * Arabic / English switch. The chip is one button that switches to the other language
 * (labelled in that language, so it's readable by someone who can't read the current one);
 * the segmented variant shows both.
 */
export function LanguageToggle({ className, variant = "chip" }: { className?: string; variant?: "chip" | "segmented" }) {
  const { lang, enabledLanguages, setLanguage, t } = useCatalog();
  if (enabledLanguages.length < 2) return null;

  if (variant === "segmented") {
    return (
      <div className={cn("inline-flex rounded-control border border-menu-line bg-menu-surface p-0.5 shadow-menu-sm", className)} role="radiogroup" aria-label={t.language}>
        {enabledLanguages.map((code) => (
          <button
            key={code}
            type="button"
            role="radio"
            aria-checked={code === lang}
            onClick={() => setLanguage(code)}
            lang={code}
            aria-label={LABELS[code]}
            className={cn(
              "min-h-11 min-w-11 rounded-[8px] px-3 text-sm font-semibold transition-colors",
              code === lang ? "bg-brand text-brand-fg" : "text-menu-muted hover:text-menu-ink"
            )}
          >
            {LABELS[code]}
          </button>
        ))}
      </div>
    );
  }

  const other = enabledLanguages.find((code) => code !== lang) || enabledLanguages[0];
  return (
    <button
      type="button"
      onClick={() => setLanguage(other)}
      lang={other}
      className={cn(
        "inline-flex min-h-11 items-center gap-1.5 rounded-control border border-menu-line bg-menu-surface px-3.5 text-sm font-semibold text-menu-ink shadow-menu-sm transition-colors hover:bg-menu-raised",
        className
      )}
      aria-label={`${t.language}: ${LABELS[other]}`}
    >
      <Languages className="h-4 w-4" aria-hidden />
      <span>{SHORT_LABELS[other]}</span>
    </button>
  );
}
