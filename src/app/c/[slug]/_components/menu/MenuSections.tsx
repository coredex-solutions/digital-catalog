"use client";

import { useMemo } from "react";
import { useCatalog, type MenuCategory, type MenuItem } from "../../_providers/CatalogProvider";
import { localized } from "../../_lib/i18n";
import { sectionId } from "./CategoryNav";
import { ItemRow } from "./ItemRow";

/** Categories that actually have dishes, in the owner's order, with their dishes */
export function useMenuSections(categories: MenuCategory[], items: MenuItem[]) {
  return useMemo(() => {
    const byCategory = new Map<string, MenuItem[]>();
    for (const item of items) {
      if (!item.category_id) continue;
      const list = byCategory.get(item.category_id) || [];
      list.push(item);
      byCategory.set(item.category_id, list);
    }
    return categories
      .map((category) => ({ category, items: byCategory.get(category.id) || [] }))
      .filter((section) => section.items.length > 0);
  }, [categories, items]);
}

export function MenuSections({ sections }: { sections: ReturnType<typeof useMenuSections> }) {
  const { lang } = useCatalog();
  let rendered = 0;

  return (
    <div className="mx-auto max-w-xl px-4">
      {sections.map(({ category, items }) => {
        const headingId = `${sectionId(category.id)}-heading`;
        return (
          <section key={category.id} id={sectionId(category.id)} aria-labelledby={headingId} className="scroll-mt-20 pt-8">
            <h2 id={headingId} className="text-[1.375rem] font-semibold leading-tight">
              {localized(category, "name", lang)}
            </h2>
            <div className="mt-1 divide-y divide-[var(--menu-line)]">
              {items.map((item) => (
                <ItemRow key={item.id} item={item} priority={rendered++ < 4} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
