// Dish options (variants), dietary tags and merchant-verified allergens.
//
// Stored on menu_items as JSON text (migration 20261010_dish_options.sql):
//   variants  [{ "id": "v1", "name_en": "Large", "name_ar": "كبير", "price": 8 }]  NULL/[] = no options
//   dietary   ["vegetarian", "spicy"]                                               restaurant's claim
//   allergens ["sesame", "milk"]   NULL = not verified (unknown), [] = verified: none of the listed
//
// Allergens are never inferred from ingredients or dish names: only what the restaurant ticked
// is shown, and an unverified dish tells guests to ask staff.

import { parseItemPrice } from "./price";

type Lang = "ar" | "en";

export const DIETARY_CODES = ["vegetarian", "vegan", "spicy", "gluten_free"] as const;
export type DietaryCode = (typeof DIETARY_CODES)[number];

/** The 14 allergens EU menus must declare (sesame matters for Lebanese food) */
export const ALLERGEN_CODES = [
  "gluten",
  "crustaceans",
  "eggs",
  "fish",
  "peanuts",
  "soy",
  "milk",
  "tree_nuts",
  "celery",
  "mustard",
  "sesame",
  "sulphites",
  "lupin",
  "molluscs",
] as const;
export type AllergenCode = (typeof ALLERGEN_CODES)[number];

export const DIETARY_LABELS: Record<DietaryCode, { en: string; ar: string }> = {
  vegetarian: { en: "Vegetarian", ar: "نباتي" },
  vegan: { en: "Vegan", ar: "نباتي صرف" },
  spicy: { en: "Spicy", ar: "حار" },
  // Only ever the restaurant's own claim
  gluten_free: { en: "Gluten-free", ar: "خالٍ من الغلوتين" },
};

export const ALLERGEN_LABELS: Record<AllergenCode, { en: string; ar: string }> = {
  gluten: { en: "Gluten", ar: "الغلوتين" },
  crustaceans: { en: "Crustaceans", ar: "القشريات" },
  eggs: { en: "Eggs", ar: "البيض" },
  fish: { en: "Fish", ar: "السمك" },
  peanuts: { en: "Peanuts", ar: "الفول السوداني" },
  soy: { en: "Soy", ar: "الصويا" },
  milk: { en: "Milk", ar: "الحليب" },
  tree_nuts: { en: "Tree nuts", ar: "المكسرات" },
  celery: { en: "Celery", ar: "الكرفس" },
  mustard: { en: "Mustard", ar: "الخردل" },
  sesame: { en: "Sesame", ar: "السمسم" },
  sulphites: { en: "Sulphites", ar: "الكبريتيت" },
  lupin: { en: "Lupin", ar: "الترمس" },
  molluscs: { en: "Molluscs", ar: "الرخويات" },
};

export interface DishVariant {
  id: string;
  name_en: string;
  name_ar: string;
  /** Absolute price in the item's currency */
  price: number;
}

export const MAX_VARIANTS = 20;
export const MAX_VARIANT_NAME = 60;

const ID_PATTERN = /^[A-Za-z0-9_-]{1,32}$/;

export function dietaryLabel(code: DietaryCode, lang: Lang): string {
  return DIETARY_LABELS[code][lang === "ar" ? "ar" : "en"];
}

export function allergenLabel(code: AllergenCode, lang: Lang): string {
  return ALLERGEN_LABELS[code][lang === "ar" ? "ar" : "en"];
}

/** A variant's name in the language, falling back to the other one */
export function variantName(variant: Pick<DishVariant, "name_en" | "name_ar">, lang: Lang): string {
  return (lang === "ar" ? variant.name_ar || variant.name_en : variant.name_en || variant.name_ar) || "";
}

/** Cheapest option price, or null without options */
export function lowestVariantPrice(variants: DishVariant[] | null | undefined): number | null {
  if (!variants || variants.length === 0) return null;
  return Math.min(...variants.map((v) => v.price));
}

/** JSON text (from the database) or an already-parsed value */
function toValue(value: unknown): unknown {
  if (typeof value !== "string") return value;
  if (value.trim() === "") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function codeList<T extends string>(value: unknown, codes: readonly T[]): T[] {
  if (!Array.isArray(value)) return [];
  const wanted = new Set(value.filter((v): v is string => typeof v === "string").map((v) => v.trim().toLowerCase()));
  // Keep the canonical order, drop unknown codes and duplicates
  return codes.filter((code) => wanted.has(code));
}

function cleanName(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, MAX_VARIANT_NAME) : "";
}

// ---- Reading stored values (tolerant: bad data is dropped, never shown) ----

export function readVariants(value: unknown): DishVariant[] {
  const parsed = toValue(value);
  if (!Array.isArray(parsed)) return [];
  const seen = new Set<string>();
  const out: DishVariant[] = [];
  for (const raw of parsed) {
    if (!raw || typeof raw !== "object") continue;
    const entry = raw as Record<string, unknown>;
    const id = typeof entry.id === "string" ? entry.id : "";
    const price = parseItemPrice(entry.price);
    const name_en = cleanName(entry.name_en);
    const name_ar = cleanName(entry.name_ar);
    if (!ID_PATTERN.test(id) || seen.has(id) || price === null || (!name_en && !name_ar)) continue;
    seen.add(id);
    out.push({ id, name_en, name_ar, price });
    if (out.length >= MAX_VARIANTS) break;
  }
  return out;
}

export function readDietary(value: unknown): DietaryCode[] {
  return codeList(toValue(value), DIETARY_CODES);
}

/** null = the restaurant has not verified allergens (unknown); [] = verified, none listed */
export function readAllergens(value: unknown): AllergenCode[] | null {
  if (value === null || value === undefined) return null;
  const parsed = toValue(value);
  return Array.isArray(parsed) ? codeList(parsed, ALLERGEN_CODES) : null;
}

/** The three fields parsed, for passing a menu item to the client */
export function readDishInfo(row: { variants?: unknown; dietary?: unknown; allergens?: unknown } | Record<string, unknown>) {
  const r = row as { variants?: unknown; dietary?: unknown; allergens?: unknown };
  return {
    variants: readVariants(r.variants),
    dietary: readDietary(r.dietary),
    allergens: readAllergens(r.allergens),
  };
}

// ---- Validating owner input (strict: errors are returned to the form) ----

type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

/**
 * Validate options from a request. null/[] means no options. Each option needs an English or
 * Arabic name and a valid price; names are trimmed and capped. Existing ids are kept (so saved
 * carts still match), missing or duplicate ids are generated.
 */
export function parseVariantsInput(value: unknown): Parsed<DishVariant[]> {
  if (value === null || value === undefined || value === "") return { ok: true, value: [] };
  if (!Array.isArray(value)) return { ok: false, error: "Options must be a list" };
  if (value.length > MAX_VARIANTS) return { ok: false, error: `A dish can have at most ${MAX_VARIANTS} options` };

  const drafts: Array<Omit<DishVariant, "id"> & { id: string | null }> = [];
  for (const [index, raw] of value.entries()) {
    const entry = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
    const name_en = cleanName(entry.name_en);
    const name_ar = cleanName(entry.name_ar);
    if (!name_en && !name_ar) return { ok: false, error: `Option ${index + 1} needs a name` };
    const price = parseItemPrice(entry.price);
    if (price === null) return { ok: false, error: `Option ${index + 1} needs a price of 0 or more` };
    const id = typeof entry.id === "string" && ID_PATTERN.test(entry.id) ? entry.id : null;
    drafts.push({ id, name_en, name_ar, price });
  }

  const used = new Set<string>();
  const kept = drafts.map((d) => {
    if (d.id && !used.has(d.id)) {
      used.add(d.id);
      return d.id;
    }
    return null;
  });
  let next = 1;
  const variants = drafts.map((d, i) => {
    let id = kept[i];
    if (!id) {
      while (used.has(`v${next}`)) next++;
      id = `v${next}`;
      used.add(id);
    }
    return { id, name_en: d.name_en, name_ar: d.name_ar, price: d.price };
  });
  return { ok: true, value: variants };
}

/** Dietary codes from a request; unknown codes are dropped */
export function parseDietaryInput(value: unknown): Parsed<DietaryCode[]> {
  if (value === null || value === undefined) return { ok: true, value: [] };
  if (!Array.isArray(value)) return { ok: false, error: "Dietary tags must be a list" };
  return { ok: true, value: codeList(value, DIETARY_CODES) };
}

/** Allergens from a request: null marks them unknown, an array (possibly empty) is verified */
export function parseAllergensInput(value: unknown): Parsed<AllergenCode[] | null> {
  if (value === null) return { ok: true, value: null };
  if (!Array.isArray(value)) return { ok: false, error: "Allergens must be a list, or null when not checked" };
  return { ok: true, value: codeList(value, ALLERGEN_CODES) };
}

/** Database text for each field (variants/dietary: NULL when empty; allergens: NULL = unknown) */
export function variantsToDb(variants: DishVariant[]): string | null {
  return variants.length > 0 ? JSON.stringify(variants) : null;
}
export function dietaryToDb(dietary: DietaryCode[]): string | null {
  return dietary.length > 0 ? JSON.stringify(dietary) : null;
}
export function allergensToDb(allergens: AllergenCode[] | null): string | null {
  return allergens === null ? null : JSON.stringify(allergens);
}
