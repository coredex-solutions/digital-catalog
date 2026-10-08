"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useCatalog } from "../../_providers/CatalogProvider";
import { localized } from "../../_lib/i18n";
import { cn } from "@/utils/helpers";
import { SEARCH_FIELD_ID } from "./MenuHeader";

export const sectionId = (categoryId: string) => `cat-${categoryId}`;

const JUMP_EVENT = "menu:jump-to-category";

/** Scroll the page to a category section (sections carry scroll-margin for the sticky bar) */
export function scrollToCategory(categoryId: string, smooth = true) {
  const section = document.getElementById(sectionId(categoryId));
  if (!section) return;
  // Tell the nav which section was chosen, so it highlights it even if the page can't
  // scroll far enough to bring a short last section under the bar
  window.dispatchEvent(new CustomEvent(JUMP_EVENT, { detail: categoryId }));
  section.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
}

interface CategoryNavProps {
  categories: { id: string; name_ar: string; name_en: string; name_fr: string }[];
}

/**
 * Sticky category chips. Highlights the section currently in view and jumps to a section
 * when tapped. The active chip is kept visible inside the horizontal strip.
 */
export function CategoryNav({ categories }: CategoryNavProps) {
  const { lang, t, openSheet } = useCatalog();
  const [activeId, setActiveId] = useState(categories[0]?.id);
  const stripRef = useRef<HTMLDivElement>(null);
  // While a tap-triggered smooth scroll runs, ignore the observer so the chip doesn't flicker
  const lockUntil = useRef(0);
  // Avoid two search controls on screen: show the bar's button only once the header field is gone
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const field = document.getElementById(SEARCH_FIELD_ID);
    if (!field) {
      setShowSearch(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => setShowSearch(!entry.isIntersecting), {
      rootMargin: "-64px 0px 0px 0px",
    });
    observer.observe(field);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const sections = categories
      .map((c) => document.getElementById(sectionId(c.id)))
      .filter((el): el is HTMLElement => !!el);
    if (sections.length === 0) return;

    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id.replace(/^cat-/, "");
          if (entry.isIntersecting) visible.set(id, entry.boundingClientRect.top);
          else visible.delete(id);
        }
        if (Date.now() < lockUntil.current || visible.size === 0) return;
        // The top-most visible section is the current one
        const [first] = [...visible.entries()].sort((a, b) => a[1] - b[1]);
        setActiveId(first[0]);
      },
      // A band just under the sticky bar decides which section is "current"
      { rootMargin: "-72px 0px -55% 0px", threshold: 0 }
    );

    sections.forEach((section) => observer.observe(section));

    // At the very bottom of the page, the last section is the current one
    const onScroll = () => {
      if (Date.now() < lockUntil.current) return;
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        setActiveId(categories[categories.length - 1]?.id);
      }
    };
    const onJump = (event: Event) => {
      lockUntil.current = Date.now() + 900;
      setActiveId((event as CustomEvent<string>).detail);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener(JUMP_EVENT, onJump);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener(JUMP_EVENT, onJump);
    };
  }, [categories]);

  // Keep the active chip in view within the strip (works in both LTR and RTL)
  useEffect(() => {
    const chip = stripRef.current?.querySelector<HTMLElement>(`[data-category="${activeId}"]`);
    const strip = stripRef.current;
    if (!chip || !strip) return;
    const chipRect = chip.getBoundingClientRect();
    const stripRect = strip.getBoundingClientRect();
    const offset = chipRect.left + chipRect.width / 2 - (stripRect.left + stripRect.width / 2);
    strip.scrollBy({ left: offset, behavior: "smooth" });
  }, [activeId]);

  if (categories.length === 0) return null;

  return (
    <nav
      className="sticky top-0 z-30 border-b border-menu-line bg-menu-bg"
      aria-label={t.menu}
    >
      <div className="mx-auto flex max-w-xl items-center gap-2 py-2 ps-3">
        {showSearch && (
          <button
            type="button"
            onClick={() => openSheet("search")}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control border border-menu-input-border bg-menu-surface text-menu-ink"
            aria-label={t.search}
          >
            <Search className="h-5 w-5" aria-hidden />
          </button>
        )}

        <div ref={stripRef} className="flex flex-1 gap-2 overflow-x-auto pe-3 scrollbar-hide">
          {categories.map((category) => {
            const active = category.id === activeId;
            return (
              <a
                key={category.id}
                href={`#${sectionId(category.id)}`}
                data-category={category.id}
                aria-current={active ? "true" : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  scrollToCategory(category.id);
                }}
                className={cn(
                  "inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-control px-4 text-[0.9375rem] font-semibold transition-colors",
                  active ? "bg-brand text-brand-fg" : "text-menu-muted hover:text-menu-ink"
                )}
              >
                {localized(category, "name", lang)}
              </a>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
