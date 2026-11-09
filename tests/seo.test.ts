// Search-engine addresses and structured data: one address per language for business pages,
// the business page JSON-LD, and the home page JSON-LD.
import { test } from "node:test";
import assert from "node:assert/strict";
import { baseMenuLanguage, catalogJsonLd, menuAlternates } from "@/app/c/[slug]/_lib/seo";
import { landingJsonLd } from "@/app/_landing/structured-data";

test("the base language is the owner's default, else the first enabled one", () => {
  assert.equal(baseMenuLanguage(["ar", "en"], "en"), "en");
  assert.equal(baseMenuLanguage(["ar", "en"], null), "ar");
  assert.equal(baseMenuLanguage(["en"], "ar"), "en");
});

test("each language has its own address, and the base one has no ?lang", () => {
  const ar = menuAlternates("sofra", "ar", ["ar", "en"], "ar");
  assert.equal(ar.canonical, "/c/sofra/");
  assert.deepEqual(ar.languages, { ar: "/c/sofra/", en: "/c/sofra/?lang=en", "x-default": "/c/sofra/" });
  assert.equal(menuAlternates("sofra", "en", ["ar", "en"], "ar").canonical, "/c/sofra/?lang=en");
});

test("a page in one language lists no other languages", () => {
  const only = menuAlternates("shop", "en", ["en"], null);
  assert.equal(only.canonical, "/c/shop/");
  assert.equal(only.languages, undefined);
});

const row = (fields: Record<string, unknown>) => fields as never;

function sampleData(module: string) {
  return {
    catalog: row({ id: "c1", slug: "sofra", name: "Sofra", name_ar: "سفرة", name_en: "Sofra", module, business_type: null, logo_url: "/logo.png", addons: null }),
    settings: row({ hero_image_url: null, seo_description_en: null }),
    contact: row({ phone_primary: "+961 1 234 567", address_en: "Hamra St", city_en: "Beirut", country_en: null }),
    operatingHours: [row({ day_name: "Monday", open_hour: 9, close_hour: 25, is_closed: 0 })],
    socialMedia: [row({ url: "https://instagram.com/sofra" }), row({ url: "javascript:alert(1)" })],
    categories: [row({ id: "k1", name_en: "Mezze", name_ar: "مقبلات" })],
    menuItems: [row({ id: "i1", category_id: "k1", name_en: "Hummus <b>", name_ar: "حمص", price: 4, currency: "USD", image_url: "/landing/hummus.png", is_available: 1 })],
    faqs: [row({ question_en: "Delivery?", answer_en: "Yes" })],
  } as never;
}

test("a restaurant page describes its menu, hours and profiles in the page language", () => {
  const json = catalogJsonLd(sampleData("restaurant"), "ar", "https://x.test/c/sofra/");
  assert.ok(!json.includes("<"), "no raw < that could close the script tag");
  const [business, faq] = JSON.parse(json)["@graph"];
  assert.equal(business.name, "سفرة");
  assert.equal(business.hasMenu.hasMenuSection[0].name, "مقبلات");
  assert.equal(business.hasMenu.hasMenuSection[0].hasMenuItem[0].offers.price, 4);
  assert.match(business.logo, /^https?:\/\/[^/]+\/logo\.png$/, "site paths become full addresses");
  assert.deepEqual(business.sameAs, ["https://instagram.com/sofra"]);
  assert.equal(business.openingHoursSpecification[0].closes, "01:00");
  assert.equal(faq["@type"], "FAQPage");
});

test("a shop lists products in an offer catalogue", () => {
  const [business] = JSON.parse(catalogJsonLd(sampleData("shop"), "en", "https://x.test/c/sofra/"))["@graph"];
  assert.equal(business.hasMenu, undefined);
  const offer = business.hasOfferCatalog.itemListElement[0].itemListElement[0];
  assert.equal(offer.itemOffered["@type"], "Product");
  assert.equal(offer.itemOffered.name, "Hummus <b>");
});

test("the home page lists the company, the product with its yearly prices and the questions", () => {
  const graph = JSON.parse(landingJsonLd("en", "/"))["@graph"];
  const types = graph.map((node: { "@type": string }) => node["@type"]);
  assert.deepEqual(types, ["Organization", "WebSite", "WebPage", "SoftwareApplication", "FAQPage"]);
  const product = graph[3];
  assert.deepEqual(product.offers.map((o: { price: number }) => o.price), [99, 299, 399]);
  assert.ok(graph[4].mainEntity.length > 0);
});
