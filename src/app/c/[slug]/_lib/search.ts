// Menu search that tolerates the ways people actually type Arabic on phones:
// diacritics are ignored and common letter variants are treated as the same letter.

const ARABIC_DIACRITICS = /[ً-ٰٟـ]/g; // harakat, dagger alef, tatweel

export function normalizeSearchText(text: string | null | undefined): string {
  return (text || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // Latin accents (é -> e)
    .replace(ARABIC_DIACRITICS, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/\s+/g, " ")
    .trim();
}

interface SearchableItem {
  name_ar?: string | null;
  name_en?: string | null;
  name_fr?: string | null;
  description_ar?: string | null;
  description_en?: string | null;
  description_fr?: string | null;
}

/** Every word of the query must appear somewhere in the item's names or descriptions */
export function matchesQuery(item: SearchableItem, query: string): boolean {
  const words = normalizeSearchText(query).split(" ").filter(Boolean);
  if (words.length === 0) return true;

  const haystack = normalizeSearchText(
    [item.name_ar, item.name_en, item.name_fr, item.description_ar, item.description_en, item.description_fr].join(" ")
  );
  return words.every((word) => haystack.includes(word));
}
