// Menu import: reading prices as printed, spreadsheets, and AI-read menus
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parsePriceText,
  parseTable,
  categoriesFromTable,
  categoriesFromExtraction,
  TEMPLATE_CSV,
  normalizeName,
  sameName,
} from "@/lib/catalog/import";

const price = (text: string, fallback: "USD" | "LBP" = "USD") => {
  const r = parsePriceText(text, fallback);
  return [r.price, r.currency, r.explicit];
};

test("prices are read as printed, never converted", () => {
  assert.deepEqual(price("4"), [4, "USD", false]);
  assert.deepEqual(price("$4.50"), [4.5, "USD", true]);
  assert.deepEqual(price("4.5 USD"), [4.5, "USD", true]);
  assert.deepEqual(price("350,000 L.L."), [350000, "LBP", true]);
  assert.deepEqual(price("350.000 ل.ل"), [350000, "LBP", true]);
  assert.deepEqual(price("٣٥٠٬٠٠٠ ليرة"), [350000, "LBP", true]);
  assert.deepEqual(price("٤٫٥"), [4.5, "USD", false]);
  assert.deepEqual(price("900000", "LBP"), [900000, "LBP", false]);
  assert.deepEqual(price("1,250,000 LBP"), [1250000, "LBP", true]);
  assert.deepEqual(price("LL 75000"), [75000, "LBP", true]);
});

test("ambiguous separators", () => {
  assert.deepEqual(price("4,50 $"), [4.5, "USD", true]);
  assert.deepEqual(price("1,250"), [1250, "USD", false]);
  assert.deepEqual(price("$4.500"), [4.5, "USD", true]);
  assert.deepEqual(price("12."), [12, "USD", false]);
  assert.deepEqual(price("Market price"), [null, "USD", false]);
});

test("the downloadable template reads back", () => {
  const rows = parseTable(TEMPLATE_CSV);
  assert.equal(rows.length, 4);
  assert.equal(rows[1][4], "Chickpeas, tahini, lemon");
  const r = categoriesFromTable(rows, "USD");
  assert.deepEqual(
    r.categories.map((c) => [c.name_en, c.dishes.length]),
    [["Cold mezze", 2], ["Grills", 1]]
  );
  const grill = r.categories[1].dishes[0];
  assert.deepEqual([grill.price, grill.currency], [900000, "LBP"]);
});

test("Arabic headers, tabs, semicolons and multi-line cells", () => {
  const tsv = categoriesFromTable(parseTable("الاسم\tالسعر\tالقسم\nحمص\t٤\tمازة\nفتوش\t5$\tمازة\n"), "USD");
  assert.deepEqual(
    tsv.categories.map((c) => [c.name_ar, c.dishes.map((d) => [d.name_ar, d.price])]),
    [["مازة", [["حمص", 4], ["فتوش", 5]]]]
  );
  assert.equal(categoriesFromTable(parseTable("name;price\nKibbeh;6"), "USD").categories[0].dishes[0].price, 6);
  assert.deepEqual(parseTable('name,description,price\nHummus,"line one\nline two",4')[1], ["Hummus", "line one\nline two", "4"]);
  assert.deepEqual(categoriesFromTable(parseTable("foo,bar\n1,2"), "USD").missingColumns, ["name", "price"]);
});

test("duplicate names match across Arabic spelling variants", () => {
  assert.equal(normalizeName("أَحمد  ة"), normalizeName("احمد ه"));
  assert.equal(sameName({ name_en: "", name_ar: "تبّولة" }, { name_en: "Tabbouleh", name_ar: "تبولة" }), true);
  assert.equal(sameName({ name_en: "", name_ar: "" }, { name_en: "", name_ar: "" }), false);
});

test("AI-read menus: options give the lowest price, junk is dropped", () => {
  const menu = categoriesFromExtraction(
    {
      categories: [
        {
          name_en: "Drinks",
          dishes: [
            { name_en: "Juice", options: [{ name_en: "Small", price_text: "$2" }, { name_en: "Large", price_text: "$3" }] },
            { name_ar: "", name_en: "" },
            { name_en: "Tea", price_text: "100,000 LL" },
          ],
        },
        { name_en: "Empty", dishes: [] },
      ],
    },
    "USD"
  );
  assert.deepEqual(
    menu.map((c) => [c.name_en, c.dishes.map((d) => [d.name_en, d.price, d.currency, d.options.length])]),
    [["Drinks", [["Juice", 2, "USD", 2], ["Tea", 100000, "LBP", 0]]]]
  );
  assert.deepEqual(categoriesFromExtraction("nonsense", "USD"), []);
});
