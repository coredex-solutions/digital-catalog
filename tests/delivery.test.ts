// Delivery areas, fees and payment methods: the server works out the fee from the chosen area,
// enforces the minimum, and only accepts the owner's payment methods.
import { test } from "node:test";
import assert from "node:assert/strict";
import { MODULES } from "@/lib/modules/registry";
import { validateOrder, type OrderContext, type OrderableItem } from "@/lib/orders/validate";
import { parseDeliveryConfig, quoteDelivery, totalIn, type DeliveryConfig } from "@/lib/orders/delivery";
import { DEFAULT_BOOKING } from "@/lib/orders/slots";
import { DEFAULT_PAYMENT, parsePaymentConfig } from "@/lib/orders/payment";
import { buildCustomerUpdate, buildOrderMessage, customerStep } from "@/app/c/[slug]/_lib/whatsapp";
import type { PriceConfig } from "@/lib/catalog/price";

const config: PriceConfig = { primary: "USD", lbpRate: 89500, rateUpdatedAt: null, showDual: false };

const items: OrderableItem[] = [
  { id: "shirt", name_en: "Shirt", name_ar: "قميص", price: 20, currency: "USD", is_available: true, stock_qty: null, variants: null },
  { id: "manakish", name_en: "Manakish", name_ar: "منقوشة", price: 90000, currency: "LBP", is_available: true, stock_qty: null, variants: null },
];

const delivery: DeliveryConfig = parseDeliveryConfig({
  currency: "USD",
  free_over: 60,
  zones: [
    { id: "hamra", name_en: "Hamra", name_ar: "الحمرا", fee: 2, min_order: 15, eta_minutes: 40 },
    { id: "jounieh", name_en: "Jounieh", name_ar: "جونية", fee: 5, min_order: 30 },
  ],
});

function ctx(overrides: Partial<OrderContext> = {}): OrderContext {
  return {
    module: MODULES.shop,
    items,
    orderTypesSetting: "delivery,pickup",
    orderingEnabled: true,
    bookingEnabled: false,
    trackStock: false,
    priceConfig: config,
    delivery,
    payment: parsePaymentConfig({ methods: ["cash", "whish"], whish_phone: "03 123 456" }),
    today: "2026-11-07",
    booking: DEFAULT_BOOKING,
    hours: [],
    now: { date: "2026-11-07", minutes: 9 * 60 },
    ...overrides,
  };
}

const base = { name: "Rami", phone: "03 123 456", lang: "en", orderType: "delivery", address: "Bliss St", paymentMethod: "cash" };

test("the fee comes from the chosen area, never from the request", () => {
  const result = validateOrder({ ...base, zoneId: "hamra", deliveryFee: 0, lines: [{ itemId: "shirt", quantity: 1 }] }, ctx());
  assert.ok(result.ok);
  assert.equal(result.order.deliveryFee, 2);
  assert.equal(result.order.deliveryCurrency, "USD");
  assert.equal(result.order.area, "Hamra");
  assert.equal(result.order.totalUsd, 22);
});

test("the area name is saved in the customer's language", () => {
  const result = validateOrder({ ...base, lang: "ar", zoneId: "hamra", lines: [{ itemId: "shirt", quantity: 1 }] }, ctx());
  assert.ok(result.ok);
  assert.equal(result.order.area, "الحمرا");
});

test("an unknown or missing area is refused when areas are set up", () => {
  for (const zoneId of [undefined, "beirut", ""]) {
    const result = validateOrder({ ...base, zoneId, area: "Hamra", lines: [{ itemId: "shirt", quantity: 1 }] }, ctx());
    assert.ok(!result.ok);
    assert.equal(result.field, "area");
  }
});

test("without areas the customer types the area and no fee is added", () => {
  const result = validateOrder({ ...base, area: "Verdun", lines: [{ itemId: "shirt", quantity: 1 }] }, ctx({ delivery: parseDeliveryConfig(null) }));
  assert.ok(result.ok);
  assert.equal(result.order.area, "Verdun");
  assert.equal(result.order.deliveryFee, null);
  assert.equal(result.order.totalUsd, 20);
});

test("orders under the area's minimum are refused", () => {
  const result = validateOrder({ ...base, zoneId: "jounieh", lines: [{ itemId: "shirt", quantity: 1 }] }, ctx());
  assert.ok(!result.ok);
  assert.equal(result.code, "below_minimum");
  const enough = validateOrder({ ...base, zoneId: "jounieh", lines: [{ itemId: "shirt", quantity: 2 }] }, ctx());
  assert.ok(enough.ok);
  assert.equal(enough.order.deliveryFee, 5);
});

test("free delivery from the set amount, counting LBP items through the rate", () => {
  // 2 shirts ($40) + 2 manakish (180,000 L.L. ≈ $2.01) is under $60; 3 shirts reach it
  const under = validateOrder({ ...base, zoneId: "hamra", lines: [{ itemId: "shirt", quantity: 2 }, { itemId: "manakish", quantity: 2 }] }, ctx());
  assert.ok(under.ok);
  assert.equal(under.order.deliveryFee, 2);
  const over = validateOrder({ ...base, zoneId: "hamra", lines: [{ itemId: "shirt", quantity: 3 }] }, ctx());
  assert.ok(over.ok);
  assert.equal(over.order.deliveryFee, 0);
  assert.equal(over.order.totalUsd, 60);
});

test("pickup orders get no fee and don't need an area", () => {
  const result = validateOrder({ ...base, orderType: "pickup", lines: [{ itemId: "shirt", quantity: 1 }] }, ctx());
  assert.ok(result.ok);
  assert.equal(result.order.deliveryFee, null);
  assert.equal(result.order.area, null);
});

test("fees in LBP and mixed-currency totals", () => {
  const lbp = parseDeliveryConfig({ currency: "LBP", zones: [{ id: "a", name_en: "A", fee: 150000, min_order: 1000000 }] });
  assert.equal(totalIn([{ price: 20, currency: "USD", quantity: 1 }], "LBP", 89500), 1790000);
  assert.equal(quoteDelivery(lbp, "a", [{ price: 5, currency: "USD", quantity: 1 }], 89500)?.belowMinimum, true);
  // No rate: USD items can't be compared with an LBP minimum, so it isn't enforced
  assert.equal(quoteDelivery(lbp, "a", [{ price: 5, currency: "USD", quantity: 1 }], null)?.belowMinimum, false);
  const result = validateOrder({ ...base, zoneId: "a", lines: [{ itemId: "shirt", quantity: 1 }] }, ctx({ delivery: lbp }));
  assert.ok(result.ok);
  assert.equal(result.order.deliveryFee, 150000);
  assert.equal(result.order.totalUsd, 21.68);
});

test("delivery settings are cleaned: no-name areas dropped, bad numbers ignored, ids kept", () => {
  const parsed = parseDeliveryConfig(
    JSON.stringify({
      currency: "EUR",
      free_over: -5,
      zones: [
        { id: "keep", name_en: " Achrafieh ", fee: "3", min_order: "", eta_minutes: "45" },
        { name_en: "", name_ar: "" },
        { id: "keep", name_ar: "الحمرا", fee: -1, eta_minutes: 99999 },
      ],
    })
  );
  assert.equal(parsed.currency, "USD");
  assert.equal(parsed.free_over, null);
  assert.equal(parsed.zones.length, 2);
  assert.deepEqual(parsed.zones[0], { id: "keep", name_en: "Achrafieh", name_ar: "", fee: 3, min_order: null, eta_minutes: 45 });
  assert.equal(parsed.zones[1].fee, 0);
  assert.equal(parsed.zones[1].eta_minutes, null);
  assert.notEqual(parsed.zones[1].id, "keep");
  assert.deepEqual(parseDeliveryConfig("not json"), parseDeliveryConfig(null));
});

test("payment must be one of the owner's methods; Whish and OMT need a number", () => {
  const wrong = validateOrder({ ...base, zoneId: "hamra", paymentMethod: "omt", lines: [{ itemId: "shirt", quantity: 1 }] }, ctx());
  assert.ok(!wrong.ok);
  assert.equal(wrong.field, "payment");
  const whish = validateOrder({ ...base, zoneId: "hamra", paymentMethod: "whish", lines: [{ itemId: "shirt", quantity: 1 }] }, ctx());
  assert.ok(whish.ok);
  assert.equal(whish.order.paymentMethod, "whish");

  assert.deepEqual(parsePaymentConfig({ methods: ["whish", "omt", "bitcoin"] }).methods, ["cash"]);
  assert.deepEqual(parsePaymentConfig({ methods: ["card", "omt"], omt_phone: "71 000 000" }).methods, ["card", "omt"]);
});

test("with one method nothing is asked; dine-in asks no payment", () => {
  const only = validateOrder({ ...base, zoneId: "hamra", paymentMethod: undefined, lines: [{ itemId: "shirt", quantity: 1 }] }, ctx({ payment: DEFAULT_PAYMENT }));
  assert.ok(only.ok);
  assert.equal(only.order.paymentMethod, "cash");
  const dineIn = validateOrder(
    { name: "Rami", phone: "03 123 456", lang: "en", orderType: "dine_in", table: "4", lines: [{ itemId: "shirt", quantity: 1 }] },
    ctx({ module: MODULES.restaurant, orderTypesSetting: "dine_in,delivery" })
  );
  assert.ok(dineIn.ok);
  assert.equal(dineIn.order.paymentMethod, null);
});

test("the WhatsApp message shows the fee, includes it in the total, and names the payment", () => {
  const message = buildOrderMessage(
    [{ name_en: "Shirt", name_ar: "قميص", price: 20, currency: "USD", quantity: 1 }],
    {
      restaurantName: "Cedar & Co.",
      orderType: "delivery",
      address: "Bliss St",
      area: "Hamra",
      name: "Rami",
      phone: "03 123 456",
      orderNumber: 7,
      deliveryFee: 2,
      deliveryCurrency: "USD",
      paymentMethod: "whish",
      statusUrl: "https://coredex.solutions/c/shop/order/abc/",
    },
    config,
    "en",
    "shop"
  );
  assert.match(message, /• Delivery — \$2/);
  assert.match(message, /\*Total:\* \$22/);
  assert.match(message, /\*Payment:\* Whish/);
  assert.match(message, /Order status: https:\/\/coredex\.solutions\/c\/shop\/order\/abc\//);
  const free = buildOrderMessage([{ name_en: "Shirt", name_ar: "قميص", price: 20, quantity: 1 }], { restaurantName: "X", orderType: "delivery", name: "R", phone: "1", deliveryFee: 0 }, config, "ar", "shop");
  assert.match(free, /التوصيل — مجاني/);
});

test("status updates to the customer read right for each kind of order", () => {
  assert.equal(customerStep("ready", "delivery"), "onTheWay");
  assert.equal(customerStep("ready", "pickup"), "readyPickup");
  assert.equal(customerStep("ready", "dine_in"), "ready");
  const message = buildCustomerUpdate({ number: 7, status: "ready", order_type: "delivery", lang: "ar" }, "متجر الأرز", "shop", "https://x/c/s/order/t/");
  assert.equal(message, "طلبك رقم 7 من متجر الأرز في الطريق إليك.\nتابع طلبك: https://x/c/s/order/t/");
  assert.equal(
    buildCustomerUpdate({ number: 3, status: "confirmed", order_type: "at_location", lang: "en" }, "Studio Lea", "services", null),
    "Your request #3 at Studio Lea is confirmed."
  );
});
