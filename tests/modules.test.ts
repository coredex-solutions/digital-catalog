// Business modules: every module speaks both languages, old business types map to a module,
// and add-ons / order types stay within what a module allows
import { test } from "node:test";
import assert from "node:assert/strict";
import { MODULES, MODULE_IDS, ADDON_LABELS, ADDON_IDS } from "@/lib/modules/registry";
import {
  getModule,
  legacyBusinessTypeToModule,
  newCatalogModuleColumns,
  parseAddonsInput,
  resolveAddons,
  resolveOrderTypes,
  resolveSubType,
  schemaTypeFor,
} from "@/lib/modules/resolve";
import { getDictionary, MODULE_COPY_FOR_TESTS } from "@/app/c/[slug]/_lib/i18n";
import { adminNavLabels } from "@/app/c/[slug]/admin/_components/adminNav";

test("every module has every word, label and sub-type in Arabic and English", () => {
  for (const id of MODULE_IDS) {
    const m = MODULES[id];
    assert.equal(m.id, id);
    for (const lang of ["en", "ar"] as const) {
      assert.ok(m.label[lang] && m.tagline[lang] && m.assistant.title[lang], `${id} ${lang} labels`);
      for (const [key, value] of Object.entries(m.vocab[lang])) assert.ok(value, `${id} ${lang} vocab.${key}`);
      for (const sub of m.subTypes) assert.ok(sub.label[lang], `${id} sub-type ${sub.id} ${lang}`);
    }
    assert.ok(m.subTypes.length > 0, `${id} has sub-types`);
    // Defaults are always allowed, and default order types are offered by the module
    for (const addon of m.defaultAddons) assert.ok(m.allowedAddons.includes(addon), `${id} default add-on ${addon}`);
    for (const type of m.defaultOrderTypes) assert.ok(m.orderTypes.includes(type), `${id} default order type ${type}`);
  }
  for (const id of ADDON_IDS) assert.ok(ADDON_LABELS[id].label.ar && ADDON_LABELS[id].hint.en);
});

test("sub-type ids are unique across modules (they map back to one module)", () => {
  const seen = new Map<string, string>();
  for (const m of Object.values(MODULES)) {
    for (const sub of m.subTypes) {
      assert.ok(!seen.has(sub.id), `${sub.id} is in ${seen.get(sub.id)} and ${m.id}`);
      seen.set(sub.id, m.id);
      assert.equal(legacyBusinessTypeToModule(sub.id), m.id);
    }
  }
});

test("module overrides of the customer strings exist in both languages", () => {
  for (const [module, copy] of Object.entries(MODULE_COPY_FOR_TESTS)) {
    assert.deepEqual(Object.keys(copy.en).sort(), Object.keys(copy.ar).sort(), `${module} overrides`);
  }
  assert.equal(getDictionary("en", "shop").addToOrder, "Add to cart");
  assert.equal(getDictionary("ar", "services").checkout, "طلب موعد");
  // Restaurant keeps the base wording
  assert.equal(getDictionary("en", "restaurant").addToOrder, "Add to order");
});

test("old business types map to a module", () => {
  assert.equal(legacyBusinessTypeToModule("restaurant"), "restaurant");
  assert.equal(legacyBusinessTypeToModule("other"), "restaurant");
  assert.equal(legacyBusinessTypeToModule(undefined), "restaurant");
  assert.equal(legacyBusinessTypeToModule("bakery"), "cafe");
  assert.equal(legacyBusinessTypeToModule("retail"), "shop");
  assert.equal(legacyBusinessTypeToModule("supermarket"), "shop");
  assert.equal(legacyBusinessTypeToModule("salon"), "services");
  assert.equal(legacyBusinessTypeToModule("gym"), "services");
  assert.equal(getModule({ module: "shop", business_type: "salon" }).id, "shop");
  assert.equal(getModule({ module: "nonsense", business_type: "salon" }).id, "services");
});

test("add-ons: NULL means defaults, '' means none, unknown or disallowed are dropped", () => {
  const shop = MODULES.shop;
  assert.deepEqual(resolveAddons(shop, null), ["options", "stock"]);
  assert.deepEqual(resolveAddons(shop, ""), []);
  assert.deepEqual(resolveAddons(shop, "stock,tables,bogus"), ["stock"]);
  assert.deepEqual(parseAddonsInput(MODULES.services, ["stock", "options"]), ["options"]);
  assert.equal(parseAddonsInput(shop, "stock"), null);
});

test("order types are limited to the module's, in its order", () => {
  assert.deepEqual(resolveOrderTypes(MODULES.shop, null), ["delivery", "pickup"]);
  assert.deepEqual(resolveOrderTypes(MODULES.shop, "dine_in,pickup"), ["pickup"]);
  assert.deepEqual(resolveOrderTypes(MODULES.restaurant, "delivery,dine_in"), ["dine_in", "delivery"]);
  assert.deepEqual(resolveOrderTypes(MODULES.services, ""), []);
});

test("new catalogs get a valid module, sub-type and default add-ons", () => {
  const shop = newCatalogModuleColumns("shop", "clothing");
  assert.equal(shop.module.id, "shop");
  assert.equal(shop.business_type, "clothing");
  assert.equal(shop.addons, "options,stock");
  // Unknown sub-type → the module's first; no module → taken from the business type
  assert.equal(newCatalogModuleColumns("services", "pizza").business_type, "salon");
  assert.equal(newCatalogModuleColumns(undefined, "bakery").module.id, "cafe");
  assert.equal(resolveSubType(MODULES.cafe, "BAKERY"), "bakery");
  assert.equal(schemaTypeFor(MODULES.cafe, "bakery"), "Bakery");
  assert.equal(schemaTypeFor(MODULES.shop, "unknown"), "Store");
});

test("dashboard section names use the module's words", () => {
  assert.equal(adminNavLabels("en", MODULES.restaurant).items, "Dishes");
  assert.equal(adminNavLabels("en", MODULES.shop).items, "Products");
  assert.equal(adminNavLabels("ar", MODULES.services).items, "الخدمات");
  assert.equal(adminNavLabels("en", MODULES.services).orders, "Requests");
});
