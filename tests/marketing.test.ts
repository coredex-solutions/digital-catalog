// Marketing settings (Meta Pixel, Google Analytics, review link), the review line in the
// customer update, and the 14-day trial.
import { test } from "node:test";
import assert from "node:assert/strict";
import { invalidMarketingFields, parseMarketingConfig } from "@/lib/marketing";
import { buildCustomerUpdate } from "@/app/c/[slug]/_lib/whatsapp";
import { PLAN_CONFIG } from "@/lib/plans";

test("only real IDs and https links are kept", () => {
  const config = parseMarketingConfig({ meta_pixel_id: " 1234 5678 9012 345 ", ga_id: "g-ab12cd34ef", review_url: "https://g.page/r/abc/review" });
  assert.deepEqual(config, { meta_pixel_id: "123456789012345", ga_id: "G-AB12CD34EF", review_url: "https://g.page/r/abc/review" });

  // Code instead of an ID, a Tag Manager container, a plain http or javascript link
  const bad = { meta_pixel_id: "123');alert(1);//", ga_id: "GTM-ABC123", review_url: "javascript:alert(1)" };
  assert.deepEqual(parseMarketingConfig(bad), { meta_pixel_id: "", ga_id: "", review_url: "" });
  assert.deepEqual(invalidMarketingFields(bad), ["meta_pixel_id", "ga_id", "review_url"]);
  assert.equal(parseMarketingConfig({ review_url: "http://example.com" }).review_url, "");

  // Empty fields are fine (the tool is just off); stored JSON is read the same way
  assert.deepEqual(invalidMarketingFields({ meta_pixel_id: "", ga_id: "  ", review_url: "" }), []);
  assert.deepEqual(parseMarketingConfig(JSON.stringify(config)), config);
  assert.deepEqual(parseMarketingConfig("not json"), { meta_pixel_id: "", ga_id: "", review_url: "" });
});

test("the done message asks for a review when the business has a link", () => {
  const order = { number: 12, status: "completed", order_type: "takeaway", lang: "en" };
  const withReview = buildCustomerUpdate(order, "Sofra", "restaurant", "https://x.test/c/sofra/order/t/", "https://g.page/r/abc/review");
  assert.match(withReview, /is done\.\nHow was it\? We'd love a short review: https:\/\/g\.page\/r\/abc\/review$/);
  // Without a link, or before the order is done, it links the status page as before
  assert.match(buildCustomerUpdate(order, "Sofra", "restaurant", "https://x.test/s/", null), /Follow your order: https:\/\/x\.test\/s\/$/);
  assert.doesNotMatch(buildCustomerUpdate({ ...order, status: "ready" }, "Sofra", "restaurant", null, "https://g.page/r/abc/review"), /review/);
  const arabic = buildCustomerUpdate({ ...order, lang: "ar" }, "سفرة", "restaurant", null, "https://g.page/r/abc/review");
  assert.match(arabic, /كيف كانت تجربتك؟/);
});

test("the free trial lasts 14 days", () => {
  assert.equal(PLAN_CONFIG.trial.durationDays, 14);
});
