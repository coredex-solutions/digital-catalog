// Menu import, shared by the dashboard (reading a spreadsheet, reviewing rows) and the import
// API (checking what is saved). Pure code: no database, no browser APIs.
//
// Prices are only ever read as written: "$4", "4.50", "350,000 ل.ل.", "٣٥٠٠٠٠ ليرة". A price with
// no currency sign uses the menu's main currency, and nothing is converted. Allergens and dietary
// tags are never imported: they stay unknown until the owner checks them on each dish.

export type ImportCurrency = "USD" | "LBP";

export interface ImportOption {
  name_en: string;
  name_ar: string;
  price: number | null;
}

export interface ImportDish {
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  price: number | null;
  currency: ImportCurrency;
  /** The currency came from the text ("$", "L.L.") rather than the menu's default */
  currencyExplicit: boolean;
  /** As written in the source, so the owner can compare */
  priceText: string;
  options: ImportOption[];
}

export interface ImportCategory {
  name_en: string;
  name_ar: string;
  dishes: ImportDish[];
}

export const IMPORT_LIMITS = {
  dishes: 300,
  name: 120,
  description: 1000,
  files: 5,
  fileBytes: 8 * 1024 * 1024,
  // Under nginx's 10 MB request limit (deploy/nginx.conf); photos are shrunk in the browser first
  totalBytes: 9 * 1024 * 1024,
} as const;

// ---- Prices ----

// Arabic-Indic (٠-٩) and Persian (۰-۹) digits, and the Arabic decimal and thousands marks
const toWesternDigits = (text: string) =>
  text
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/٫/g, ".")
    .replace(/٬/g, ",");

const LBP_MARK = /l\.?\s?l\.?|lbp|ل\.?\s?ل|ليرة|lira/i;
const USD_MARK = /\$|usd|dollar|دولار/i;

/**
 * Reads a price as written. Returns null when there is no number. Thousands separators are
 * understood ("350,000", "350.000"), and "4,50" is read as 4.50.
 */
export function parsePriceText(raw: unknown, fallback: ImportCurrency): { price: number | null; currency: ImportCurrency; explicit: boolean } {
  const text = toWesternDigits(String(raw ?? "")).trim();
  const currency: ImportCurrency | null = LBP_MARK.test(text) ? "LBP" : USD_MARK.test(text) ? "USD" : null;
  const match = text.match(/\d[\d.,\s]*/);
  if (!match) return { price: null, currency: currency ?? fallback, explicit: currency !== null };

  let number = match[0].replace(/\s+/g, "");
  number = number.replace(/[.,]+$/, "");
  if (/^\d{1,3}([.,]\d{3})+$/.test(number)) {
    // "350,000", "1.250.000", "1,250" → thousands; a lone "4.500" in dollars stays a decimal
    const groups = number.split(/[.,]/).length - 1;
    if (groups > 1 || number.includes(",") || currency === "LBP") number = number.replace(/[.,]/g, "");
  } else if (/^\d+,\d{1,2}$/.test(number)) {
    // 4,50 → decimal comma
    number = number.replace(",", ".");
  } else {
    number = number.replace(/,/g, "");
  }
  const price = Number(number);
  return {
    price: Number.isFinite(price) && price >= 0 ? Math.round(price * 100) / 100 : null,
    currency: currency ?? fallback,
    explicit: currency !== null,
  };
}

// ---- Spreadsheets ----

/** CSV or tab-separated text (pasted from Excel / Google Sheets) into rows of cells */
export function parseTable(input: string): string[][] {
  const text = input.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  const firstLine = text.split("\n", 1)[0] || "";
  const delimiter = firstLine.includes("\t") ? "\t" : firstLine.split(";").length > firstLine.split(",").length ? ";" : ",";

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"' && cell === "") quoted = true;
    else if (ch === delimiter) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.map((r) => r.map((c) => c.trim())).filter((r) => r.some((c) => c !== ""));
}

type Column = "category_en" | "category_ar" | "name_en" | "name_ar" | "description_en" | "description_ar" | "price" | "currency";

// Header names owners are likely to use, in English and Arabic (compared lowercased, without spaces/_/-)
const HEADER_ALIASES: Record<Column, string[]> = {
  category_en: ["categoryen", "category", "categoryenglish", "section", "sectionen"],
  category_ar: ["categoryar", "categoryarabic", "القسم", "القسمبالعربية", "الفئة", "الصنف"],
  name_en: ["nameen", "name", "dish", "dishname", "item", "itemname", "nameenglish", "dishen"],
  name_ar: ["namear", "namearabic", "الاسم", "اسمالطبق", "الطبق", "الاسمبالعربية", "اسم"],
  description_en: ["descriptionen", "description", "descriptionenglish", "details", "ingredients"],
  description_ar: ["descriptionar", "descriptionarabic", "الوصف", "الوصفبالعربية", "المكونات"],
  price: ["price", "السعر", "سعر", "prix", "cost"],
  currency: ["currency", "العملة", "عملة"],
};

const headerKey = (cell: string) => cell.toLowerCase().replace(/[\s_\-()]/g, "");

export const TEMPLATE_HEADERS = ["category_en", "category_ar", "name_en", "name_ar", "description_en", "description_ar", "price", "currency"] as const;

/** The template owners can download; the UTF-8 mark lets Excel open the Arabic correctly */
export const TEMPLATE_CSV =
  "﻿" +
  [
    TEMPLATE_HEADERS.join(","),
    'Cold mezze,مازة باردة,Hummus,حمص,"Chickpeas, tahini, lemon",حمص بالطحينة والليمون,4,USD',
    "Cold mezze,مازة باردة,Tabbouleh,تبولة,,,5,USD",
    "Grills,مشاوي,Shish taouk,شيش طاووق,,,\"900,000\",LBP",
  ].join("\r\n") +
  "\r\n";

export interface TableResult {
  categories: ImportCategory[];
  /** The header row could not be matched to name and price columns */
  missingColumns: ("name" | "price")[];
  /** Columns that were recognised, for showing the owner */
  recognised: Column[];
  skippedRows: number;
}

/** Spreadsheet rows (with a header row) into categories of dishes */
export function categoriesFromTable(table: string[][], fallback: ImportCurrency): TableResult {
  const [header = [], ...body] = table;
  const index: Partial<Record<Column, number>> = {};
  header.forEach((cell, i) => {
    const key = headerKey(cell);
    for (const [column, aliases] of Object.entries(HEADER_ALIASES) as [Column, string[]][]) {
      if (index[column] === undefined && aliases.includes(key)) {
        index[column] = i;
        break;
      }
    }
  });
  const missingColumns: ("name" | "price")[] = [];
  if (index.name_en === undefined && index.name_ar === undefined) missingColumns.push("name");
  if (index.price === undefined) missingColumns.push("price");
  const recognised = Object.keys(index) as Column[];
  if (missingColumns.length) return { categories: [], missingColumns, recognised, skippedRows: 0 };

  const get = (row: string[], column: Column) => (index[column] === undefined ? "" : (row[index[column]!] ?? "").trim());
  const byKey = new Map<string, ImportCategory>();
  let skippedRows = 0;
  for (const row of body) {
    const name_en = get(row, "name_en");
    const name_ar = get(row, "name_ar");
    const priceCell = get(row, "price");
    if (!name_en && !name_ar && !priceCell) {
      skippedRows++;
      continue;
    }
    const currencyCell = get(row, "currency");
    const parsed = parsePriceText(`${priceCell} ${currencyCell}`, fallback);
    const category_en = get(row, "category_en");
    const category_ar = get(row, "category_ar");
    const key = normalizeName(category_en) + "|" + normalizeName(category_ar);
    if (!byKey.has(key)) byKey.set(key, { name_en: category_en, name_ar: category_ar, dishes: [] });
    byKey.get(key)!.dishes.push({
      name_en,
      name_ar,
      description_en: get(row, "description_en"),
      description_ar: get(row, "description_ar"),
      price: parsed.price,
      currency: parsed.currency,
      currencyExplicit: parsed.explicit,
      priceText: [priceCell, currencyCell].filter(Boolean).join(" "),
      options: [],
    });
  }
  return { categories: [...byKey.values()], missingColumns, recognised, skippedRows };
}

// ---- AI-read menus ----

interface ExtractedOption { name_en?: unknown; name_ar?: unknown; price_text?: unknown }
interface ExtractedDish { name_en?: unknown; name_ar?: unknown; description_en?: unknown; description_ar?: unknown; price_text?: unknown; options?: unknown }
interface ExtractedCategory { name_en?: unknown; name_ar?: unknown; dishes?: unknown }

const str = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");

/** The AI's JSON (see the extract API's prompt) into categories, dropping anything malformed */
export function categoriesFromExtraction(data: unknown, fallback: ImportCurrency): ImportCategory[] {
  const list = Array.isArray((data as { categories?: unknown })?.categories) ? ((data as { categories: unknown[] }).categories as ExtractedCategory[]) : [];
  return list
    .map((category) => ({
      name_en: str(category?.name_en, IMPORT_LIMITS.name),
      name_ar: str(category?.name_ar, IMPORT_LIMITS.name),
      dishes: (Array.isArray(category?.dishes) ? (category.dishes as ExtractedDish[]) : [])
        .map((dish) => {
          const priceText = str(dish?.price_text, 60);
          const parsed = parsePriceText(priceText, fallback);
          const options = (Array.isArray(dish?.options) ? (dish.options as ExtractedOption[]) : [])
            .map((o) => ({ name_en: str(o?.name_en, 60), name_ar: str(o?.name_ar, 60), price: parsePriceText(str(o?.price_text, 60), parsed.currency).price }))
            .filter((o) => (o.name_en || o.name_ar) && o.price !== null)
            .slice(0, 10);
          return {
            name_en: str(dish?.name_en, IMPORT_LIMITS.name),
            name_ar: str(dish?.name_ar, IMPORT_LIMITS.name),
            description_en: str(dish?.description_en, IMPORT_LIMITS.description),
            description_ar: str(dish?.description_ar, IMPORT_LIMITS.description),
            price: options.length ? Math.min(...options.map((o) => o.price as number)) : parsed.price,
            currency: parsed.currency,
            currencyExplicit: parsed.explicit,
            priceText,
            options,
          };
        })
        .filter((dish) => dish.name_en || dish.name_ar),
    }))
    .filter((category) => category.dishes.length > 0);
}

// ---- Matching what is already on the menu ----

const ARABIC_MARKS = /[ً-ٰـ]/g;

/** For comparing names: case, spaces, accents and common Arabic spelling variants ignored */
export function normalizeName(text: string | null | undefined): string {
  return (text || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(ARABIC_MARKS, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** Same thing in either language: any non-empty name matches */
export function sameName(a: { name_en?: string | null; name_ar?: string | null }, b: { name_en?: string | null; name_ar?: string | null }): boolean {
  const pairs: [string, string][] = [
    [normalizeName(a.name_en), normalizeName(b.name_en)],
    [normalizeName(a.name_ar), normalizeName(b.name_ar)],
  ];
  return pairs.some(([x, y]) => x !== "" && x === y);
}
