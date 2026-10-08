"use client";

import { MenuImage } from "./MenuImage";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useCatalog } from "../../_providers/CatalogProvider";
import { localized } from "../../_lib/i18n";
import { matchesQuery } from "../../_lib/search";
import { Price } from "./Price";
import { Sheet } from "./Sheet";

export function SearchSheet() {
  const { activeSheet, closeSheet, openItem, menuItems, categories, lang, t } = useCatalog();
  const open = activeSheet === "search";
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    // Focus after the sheet's open animation so the keyboard doesn't fight it
    const timer = window.setTimeout(() => inputRef.current?.focus(), 150);
    return () => window.clearTimeout(timer);
  }, [open]);

  const categoryNames = useMemo(() => new Map(categories.map((c) => [c.id, localized(c, "name", lang)])), [categories, lang]);
  const results = useMemo(
    () => (query.trim() ? menuItems.filter((item) => matchesQuery(item, query)).slice(0, 50) : []),
    [menuItems, query]
  );

  return (
    <Sheet open={open} onClose={closeSheet} title={t.search} hideTitle full>
      <div className="sticky top-0 z-10 bg-menu-surface pb-2">
        <div className="relative">
          <Search className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-menu-muted" aria-hidden />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.searchPlaceholder}
            aria-label={t.searchPlaceholder}
            enterKeyHint="search"
            className="w-full min-h-12 rounded-control border border-menu-input-border bg-menu-surface pe-4 ps-12 text-base placeholder:text-menu-muted focus:border-brand-ink focus:outline-none"
          />
        </div>
      </div>

      {!query.trim() ? (
        <p className="py-8 text-center text-sm text-menu-muted">{t.searchHint}</p>
      ) : results.length === 0 ? (
        <p className="py-8 text-center text-sm text-menu-muted" role="status">
          {t.searchEmpty}
        </p>
      ) : (
        <ul className="divide-y divide-[var(--menu-line)]" aria-live="polite">
          {results.map((item) => (
            <li key={item.id}>
              <button type="button" onClick={() => openItem(item)} className="flex w-full items-center gap-3 py-3 text-start">
                {item.image_url ? (
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-menu-raised">
                    <MenuImage src={item.image_url} alt="" fill sizes="56px" className="object-cover" />
                  </div>
                ) : null}
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold leading-snug">{localized(item, "name", lang)}</span>
                  {item.category_id && categoryNames.get(item.category_id) && (
                    <span className="block text-sm text-menu-muted">{categoryNames.get(item.category_id)}</span>
                  )}
                  {item.is_available === false && <span className="block text-sm font-medium text-menu-warning">{t.soldOut}</span>}
                </span>
                <Price amount={item.price} currency={item.currency} className="shrink-0 text-sm" stacked secondaryClassName="text-end" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
