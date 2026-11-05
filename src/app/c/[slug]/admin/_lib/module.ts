"use client";

// The catalog's module in the dashboard: its words (Dishes / Products / Services), fields and
// add-ons. Pages use this instead of writing "dish" or "menu" themselves.

import { useMemo } from "react";
import type { AddonId, ModuleDefinition, ModuleVocab } from "@/lib/modules/registry";
import { moduleFor } from "@/lib/modules/resolve";
import { useCatalogAdmin } from "../_components/CatalogAdminShell";
import { useAdminLang } from "./i18n";

export interface AdminModule {
  module: ModuleDefinition;
  /** Words in the dashboard's language */
  v: ModuleVocab;
  addons: AddonId[];
  has: (addon: AddonId) => boolean;
}

export { moduleFor };

export function useModule(): AdminModule {
  const { catalog } = useCatalogAdmin();
  const lang = useAdminLang();
  return useMemo(() => {
    const { module, addons } = moduleFor(catalog);
    return { module, v: module.vocab[lang], addons, has: (addon: AddonId) => addons.includes(addon) };
  }, [catalog, lang]);
}

/** "3 dishes" / "3 أطباق", with the module's noun and Arabic dual and plural forms */
export function countNoun(module: ModuleDefinition, lang: "en" | "ar", n: number): string {
  const num = new Intl.NumberFormat("en-US").format(n);
  if (lang === "en") return `${num} ${n === 1 ? module.nouns.en.one : module.nouns.en.many}`;
  const a = module.nouns.ar;
  if (n === 0) return `لا ${a.plural}`;
  if (n === 1) return `${a.one} ${a.feminine ? "واحدة" : "واحد"}`;
  if (n === 2) return a.two;
  const rest = n % 100;
  if (rest >= 3 && rest <= 10) return `${num} ${a.plural}`;
  if (rest >= 11 && rest <= 99) return `${num} ${a.acc}`;
  return `${num} ${a.one}`;
}

/** The owner's page, as they'd say it: menu, store, page (and "your …" in Arabic) */
export function pageWord(module: ModuleDefinition, lang: "en" | "ar"): string {
  if (lang === "ar") return module.id === "shop" ? "متجرك" : module.id === "services" || module.id === "stays" ? "صفحتك" : "قائمتك";
  return module.id === "shop" ? "store" : module.id === "services" || module.id === "stays" ? "page" : "menu";
}
