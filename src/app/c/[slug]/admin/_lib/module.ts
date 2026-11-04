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
