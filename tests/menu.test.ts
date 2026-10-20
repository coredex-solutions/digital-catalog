// Guest menu helpers: Arabic search, WhatsApp handoff and allergen rules
import { test } from "node:test";
import assert from "node:assert/strict";
import { matchesQuery } from "@/app/c/[slug]/_lib/search";
import { buildOrderMessage, parseOrderTypes, whatsappLink } from "@/app/c/[slug]/_lib/whatsapp";
import { getDictionary } from "@/app/c/[slug]/_lib/i18n";
import { readAllergens, lowestVariantPrice } from "@/lib/catalog/dish-info";
import type { PriceConfig } from "@/lib/catalog/price";

test("search ignores diacritics and Arabic letter variants", () => {
  const item = { name_ar: "منقوشة زعتر", name_en: "Zaatar manakish" };
  assert.equal(matchesQuery(item, "منقوشه"), true);
  assert.equal(matchesQuery(item, "مَنْقوشة"), true);
  assert.equal(matchesQuery(item, "زعتر منقوشه"), true);
  assert.equal(matchesQuery(item, "MANAKISH"), true);
  assert.equal(matchesQuery(item, "فلافل"), false);
});

test("WhatsApp links accept Lebanese local numbers", () => {
  assert.equal(whatsappLink("03 123 456"), "https://wa.me/9613123456");
  assert.equal(whatsappLink("+961 3 123 456"), "https://wa.me/9613123456");
  assert.equal(whatsappLink("0096170123456"), "https://wa.me/96170123456");
  assert.equal(whatsappLink("70123456", "Hi"), "https://wa.me/96170123456?text=Hi");
});

test("order types keep a fixed order and drop unknown values", () => {
  assert.deepEqual(parseOrderTypes(undefined), ["dine_in", "takeaway"]);
  assert.deepEqual(parseOrderTypes("delivery, dine_in, picnic"), ["dine_in", "delivery"]);
});

test("the order message carries the table, lines and totals", () => {
  const config: PriceConfig = { primary: "USD", lbpRate: 89500, rateUpdatedAt: null, showDual: true };
  const t = getDictionary("en");
  const message = buildOrderMessage(
    [{ name_ar: "حمص", name_en: "Hummus", price: 4, currency: "USD", quantity: 2, note: "No garlic" }],
    { restaurantName: "Sofra", orderType: "dine_in", table: "5", name: "Rami", phone: "03123456" },
    config,
    "en"
  );
  assert.match(message, new RegExp(`\\*${t.msgTable}:\\* 5`));
  assert.match(message, /2 × Hummus — \$8/);
  assert.match(message, /No garlic/);
  assert.match(message, /\$8 \(716,000 L\.L\.\)/);
});

test("unknown allergens stay unknown", () => {
  assert.equal(readAllergens(null), null);
  assert.equal(readAllergens("not json"), null);
  assert.deepEqual(readAllergens("[]"), []);
  assert.deepEqual(readAllergens('["milk","nonsense"]'), ["milk"]);
});

test("a dish with options is priced from its cheapest option", () => {
  assert.equal(lowestVariantPrice(null), null);
  assert.equal(
    lowestVariantPrice([
      { id: "a", name_en: "Large", name_ar: "", price: 6 },
      { id: "b", name_en: "Small", name_ar: "", price: 4 },
    ]),
    4
  );
});
