// Coupon codes and loyalty stamps.
import { test } from "node:test";
import assert from "node:assert/strict";
import { MODULES } from "@/lib/modules/registry";
import { couponDiscount, couponUsable, normalizeCode, parseCouponInput, type Coupon } from "@/lib/orders/coupons";
import { countFor, isRewardOrder, loyaltyProgress, parseLoyaltyConfig, rewardText } from "@/lib/orders/loyalty";
import { validateOrder, type OrderContext } from "@/lib/orders/validate";
import { parseDeliveryConfig } from "@/lib/orders/delivery";
import { DEFAULT_PAYMENT } from "@/lib/orders/payment";
import { DEFAULT_BOOKING } from "@/lib/orders/slots";
import { phoneKey } from "@/lib/orders/customers";
import { buildOrderMessage } from "@/app/c/[slug]/_lib/whatsapp";
import { getDictionary } from "@/app/c/[slug]/_lib/i18n";

const coupon = (overrides: Partial<Coupon> = {}): Coupon => ({
  id: "c1",
  code: "SUMMER10",
  kind: "percent",
  value: 10,
  currency: "USD",
  min_order: null,
  starts_on: null,
  ends_on: null,
  max_uses: null,
  used_count: 0,
  is_active: true,
  ...overrides,
});

test("codes are kept in capitals without spaces", () => {
  assert.equal(normalizeCode(" summer 10 "), "SUMMER10");
  assert.equal(normalizeCode("ramadan-2026!"), "RAMADAN-2026");
  assert.equal(normalizeCode(42), "");
});

test("percent and amount discounts, never more than the items", () => {
  const lines = [{ price: 20, currency: "USD", quantity: 2 }];
  assert.deepEqual(couponDiscount(coupon(), lines, null), { ok: true, discount: 4, currency: "USD" });
  assert.deepEqual(couponDiscount(coupon({ kind: "amount", value: 50 }), lines, null), { ok: true, discount: 40, currency: "USD" });
  // LBP coupon on USD items converts through the rate and gives whole pounds
  assert.deepEqual(couponDiscount(coupon({ kind: "amount", value: 100000, currency: "LBP" }), lines, 89500), { ok: true, discount: 100000, currency: "LBP" });
  assert.deepEqual(couponDiscount(coupon({ kind: "amount", value: 5, currency: "LBP" }), lines, null), { ok: false, problem: "invalid" });
  assert.deepEqual(couponDiscount(coupon({ min_order: 50 }), lines, null), { ok: false, problem: "below_minimum" });
});

test("dates, uses and the on switch", () => {
  assert.equal(couponUsable(coupon(), "2026-11-08"), null);
  assert.equal(couponUsable(coupon({ is_active: false }), "2026-11-08"), "inactive");
  assert.equal(couponUsable(coupon({ starts_on: "2026-11-09" }), "2026-11-08"), "not_started");
  assert.equal(couponUsable(coupon({ ends_on: "2026-11-08" }), "2026-11-08"), null);
  assert.equal(couponUsable(coupon({ ends_on: "2026-11-07" }), "2026-11-08"), "expired");
  assert.equal(couponUsable(coupon({ max_uses: 3, used_count: 3 }), "2026-11-08"), "used_up");
});

test("the dashboard form is checked", () => {
  assert.ok(!parseCouponInput({ code: "AB", value: 10 }).ok);
  assert.ok(!parseCouponInput({ code: "BIG", kind: "percent", value: 120 }).ok);
  const bad = parseCouponInput({ code: "DATES", value: 5, starts_on: "2026-12-10", ends_on: "2026-12-01" });
  assert.ok(!bad.ok && bad.field === "ends_on");
  const ok = parseCouponInput({ code: "eid 5", kind: "amount", value: "5", min_order: "", max_uses: "100", currency: "USD" });
  assert.ok(ok.ok);
  assert.deepEqual(ok.coupon, { code: "EID5", kind: "amount", value: 5, currency: "USD", min_order: null, starts_on: null, ends_on: null, max_uses: 100, is_active: true });
});

function ctx(overrides: Partial<OrderContext> = {}): OrderContext {
  return {
    module: MODULES.shop,
    items: [{ id: "tee", name_en: "Tee", name_ar: "قميص", price: 20, currency: "USD", is_available: true, stock_qty: null, variants: null }],
    orderTypesSetting: "delivery,pickup",
    orderingEnabled: true,
    bookingEnabled: false,
    trackStock: false,
    priceConfig: { primary: "USD", lbpRate: 89500, rateUpdatedAt: null, showDual: false },
    delivery: parseDeliveryConfig({ currency: "USD", free_over: 40, zones: [{ id: "hamra", name_en: "Hamra", fee: 3 }] }),
    payment: DEFAULT_PAYMENT,
    booking: DEFAULT_BOOKING,
    hours: [],
    now: { date: "2026-11-08", minutes: 600 },
    today: "2026-11-08",
    coupon: coupon(),
    ...overrides,
  };
}
const order = { name: "Rami", phone: "03 123 456", lang: "en", orderType: "delivery", address: "Bliss", zoneId: "hamra", lines: [{ itemId: "tee", quantity: 2 }] };

test("the server works out the coupon; free delivery still counts the full items total", () => {
  const result = validateOrder({ ...order, couponCode: "summer10" }, ctx());
  assert.ok(result.ok);
  assert.equal(result.order.discount, 4);
  assert.equal(result.order.couponCode, "SUMMER10");
  assert.equal(result.order.couponId, "c1");
  // $40 of items reaches free delivery even after the $4 discount
  assert.equal(result.order.deliveryFee, 0);
  assert.equal(result.order.totalUsd, 36);
});

test("unknown, used-up or under-minimum codes are refused with the reason", () => {
  const unknown = validateOrder({ ...order, couponCode: "NOPE" }, ctx({ coupon: null }));
  assert.ok(!unknown.ok && unknown.code === "coupon" && unknown.detail === "invalid" && unknown.field === "coupon");
  const used = validateOrder({ ...order, couponCode: "SUMMER10" }, ctx({ coupon: coupon({ max_uses: 1, used_count: 1 }) }));
  assert.ok(!used.ok && used.detail === "used_up");
  const small = validateOrder({ ...order, couponCode: "SUMMER10" }, ctx({ coupon: coupon({ min_order: 100 }) }));
  assert.ok(!small.ok && small.detail === "below_minimum");
  const none = validateOrder(order, ctx());
  assert.ok(none.ok && none.order.discount === null && none.order.couponId === null);
});

test("the WhatsApp message shows the discount and the total after it", () => {
  const message = buildOrderMessage(
    [{ name_en: "Tee", name_ar: "قميص", price: 20, currency: "USD", quantity: 2 }],
    { restaurantName: "Cedar", orderType: "pickup", name: "Rami", phone: "1", discount: 4, discountCurrency: "USD", couponCode: "SUMMER10" },
    { primary: "USD", lbpRate: null, rateUpdatedAt: null, showDual: false },
    "en",
    "shop"
  );
  assert.match(message, /• Discount \(SUMMER10\) — −\$4/);
  assert.match(message, /\*Total:\* \$36/);
});

test("loyalty: settings, stamps and the reward order", () => {
  assert.equal(parseLoyaltyConfig({ enabled: true, every: 6 }).enabled, false, "needs a reward");
  const config = parseLoyaltyConfig(JSON.stringify({ enabled: true, every: 99, reward_en: " A free coffee ", reward_ar: "" }));
  assert.deepEqual(config, { enabled: true, every: 6, reward_en: "A free coffee", reward_ar: "" });
  assert.equal(rewardText(config, "ar"), "A free coffee");
  assert.deepEqual(loyaltyProgress(5, 6), { stamps: 5, nextIsReward: true });
  assert.deepEqual(loyaltyProgress(6, 6), { stamps: 0, nextIsReward: false });
  assert.equal(isRewardOrder(5, 6), true);
  assert.equal(isRewardOrder(11, 6), true);
  assert.equal(isRewardOrder(6, 6), false);
  const finished = [
    { key: phoneKey("03 123 456"), created_at: "2026-11-01 10:00:00" },
    { key: phoneKey("+961 3 123 456"), created_at: "2026-11-02 10:00:00" },
    { key: phoneKey("71 000 000"), created_at: "2026-11-02 11:00:00" },
  ];
  assert.equal(countFor(finished, "03123456"), 2);
  assert.equal(countFor(finished, "03123456", "2026-11-02 00:00:00"), 1);
});

test("loyalty wording in both languages", () => {
  assert.equal(getDictionary("en").loyaltyEvery(6, "A free coffee"), "Every 6th order: A free coffee");
  assert.equal(getDictionary("en").loyaltyEvery(2, "X"), "Every 2nd order: X");
  assert.equal(getDictionary("en").loyaltyEvery(12, "X"), "Every 12th order: X");
  assert.equal(getDictionary("ar").loyaltyEvery(6, "قهوة"), "مع كل 6 طلبات: قهوة");
  assert.equal(getDictionary("ar").loyaltyEvery(2, "قهوة"), "مع كل طلبين: قهوة");
  assert.equal(getDictionary("ar").loyaltyEvery(12, "قهوة"), "مع كل 12 طلباً: قهوة");
});
