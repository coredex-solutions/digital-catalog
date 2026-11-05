// Saved orders: what the server accepts. Prices come from the published items, order types and
// required fields follow the module, and stock can't be oversold.
import { test } from "node:test";
import assert from "node:assert/strict";
import { MODULES } from "@/lib/modules/registry";
import { stockToReserve, totalInUsd, validateOrder, type OrderContext, type OrderableItem } from "@/lib/orders/validate";
import { canMoveTo } from "@/lib/orders/store";
import { isItemAvailable } from "@/lib/orders/context";
import { buildOrderMessage } from "@/app/c/[slug]/_lib/whatsapp";
import type { PriceConfig } from "@/lib/catalog/price";
import { EMPTY_DELIVERY } from "@/lib/orders/delivery";
import { DEFAULT_BOOKING } from "@/lib/orders/slots";
import { DEFAULT_PAYMENT } from "@/lib/orders/payment";

const config: PriceConfig = { primary: "USD", lbpRate: 89500, rateUpdatedAt: null, showDual: true };

const items: OrderableItem[] = [
  { id: "hummus", name_en: "Hummus", name_ar: "حمص", price: 4, currency: "USD", is_available: true, stock_qty: null, variants: null },
  {
    id: "shirt",
    name_en: "Shirt",
    name_ar: "قميص",
    price: 20,
    currency: "USD",
    is_available: true,
    stock_qty: 3,
    variants: JSON.stringify([
      { id: "s", name_en: "Small", name_ar: "صغير", price: 20 },
      { id: "l", name_en: "Large", name_ar: "كبير", price: 25 },
    ]),
  },
  { id: "manakish", name_en: "", name_ar: "منقوشة", price: 90000, currency: "LBP", is_available: true, stock_qty: null, variants: null },
  { id: "gone", name_en: "Gone", name_ar: "", price: 1, currency: "USD", is_available: false, stock_qty: null, variants: null },
];

function ctx(overrides: Partial<OrderContext> = {}): OrderContext {
  return {
    module: MODULES.restaurant,
    items,
    orderTypesSetting: "dine_in,takeaway,delivery",
    orderingEnabled: true,
    bookingEnabled: true,
    trackStock: true,
    priceConfig: config,
    delivery: EMPTY_DELIVERY,
    payment: DEFAULT_PAYMENT,
    today: "2026-11-05",
    booking: DEFAULT_BOOKING,
    hours: [],
    now: { date: "2026-11-05", minutes: 9 * 60 },
    ...overrides,
  };
}

const customer = { name: "Rami", phone: "03 123 456", lang: "en" };

test("prices come from the published items, not the request", () => {
  const result = validateOrder(
    { ...customer, orderType: "takeaway", lines: [{ itemId: "hummus", quantity: 2, price: 0.01 }] },
    ctx()
  );
  assert.ok(result.ok);
  assert.equal(result.order.lines[0].price, 4);
  assert.equal(result.order.totalUsd, 8);
  assert.equal(result.order.kind, "order");
});

test("required fields follow the order type", () => {
  const dineIn = validateOrder({ ...customer, orderType: "dine_in", lines: [{ itemId: "hummus", quantity: 1 }] }, ctx());
  assert.ok(!dineIn.ok && dineIn.field === "table");
  const delivery = validateOrder({ ...customer, orderType: "delivery", lines: [{ itemId: "hummus", quantity: 1 }] }, ctx());
  assert.ok(!delivery.ok && delivery.field === "address");
  const noPhone = validateOrder({ name: "Rami", phone: "12", orderType: "takeaway", lines: [{ itemId: "hummus", quantity: 1 }] }, ctx());
  assert.ok(!noPhone.ok && noPhone.field === "phone");
});

test("order types outside the module or the owner's choice are refused", () => {
  const shopCtx = ctx({ module: MODULES.shop, orderTypesSetting: "delivery,pickup" });
  const wrong = validateOrder({ ...customer, orderType: "dine_in", table: "4", lines: [{ itemId: "hummus", quantity: 1 }] }, shopCtx);
  assert.ok(!wrong.ok && wrong.code === "order_type");
  const off = validateOrder({ ...customer, orderType: "takeaway", lines: [{ itemId: "hummus", quantity: 1 }] }, ctx({ orderingEnabled: false }));
  assert.ok(!off.ok && off.code === "closed");
});

test("sold-out items and missing options are refused", () => {
  const gone = validateOrder({ ...customer, orderType: "takeaway", lines: [{ itemId: "gone", quantity: 1 }] }, ctx());
  assert.ok(!gone.ok && gone.code === "item_unavailable");
  const noOption = validateOrder({ ...customer, orderType: "takeaway", lines: [{ itemId: "shirt", quantity: 1 }] }, ctx());
  assert.ok(!noOption.ok && noOption.code === "option_required");
});

test("stock: tracked items can't be ordered beyond what is left, summed across lines", () => {
  const shopCtx = ctx({ module: MODULES.shop, orderTypesSetting: "delivery,pickup" });
  const tooMany = validateOrder(
    {
      ...customer,
      orderType: "pickup",
      lines: [
        { itemId: "shirt", variantId: "s", quantity: 2 },
        { itemId: "shirt", variantId: "l", quantity: 2 },
      ],
    },
    shopCtx
  );
  assert.ok(!tooMany.ok && tooMany.code === "stock_changed");

  const fine = validateOrder(
    { ...customer, orderType: "pickup", lines: [{ itemId: "shirt", variantId: "l", quantity: 2 }, { itemId: "hummus", quantity: 1 }] },
    shopCtx
  );
  assert.ok(fine.ok);
  assert.equal(fine.order.lines[0].price, 25);
  assert.deepEqual([...stockToReserve(fine.order.lines)], [["shirt", 2]]);

  // Stock add-on off: quantities aren't limited or reserved
  const untracked = validateOrder(
    { ...customer, orderType: "pickup", lines: [{ itemId: "shirt", variantId: "s", quantity: 9 }] },
    { ...shopCtx, trackStock: false }
  );
  assert.ok(untracked.ok);
  assert.equal(stockToReserve(untracked.order.lines).size, 0);
});

test("services need an appointment time that isn't in the past", () => {
  const services = ctx({ module: MODULES.services, orderTypesSetting: "at_location,home_visit" });
  const base = { ...customer, orderType: "at_location", lines: [{ itemId: "hummus", quantity: 1 }] };
  const missing = validateOrder(base, services);
  assert.ok(!missing.ok && missing.field === "when");
  const past = validateOrder({ ...base, date: "2026-11-04", time: "10:00" }, services);
  assert.ok(!past.ok && past.field === "when");
  const badDate = validateOrder({ ...base, date: "2026-02-31", time: "10:00" }, services);
  assert.ok(!badDate.ok);
  const ok = validateOrder({ ...base, date: "2026-11-05", time: "16:30" }, services);
  assert.ok(ok.ok);
  assert.equal(ok.order.kind, "request");
  assert.equal(ok.order.requestedFor, "2026-11-05 16:30");
  // Home visits need an address
  const visit = validateOrder({ ...base, orderType: "home_visit", date: "2026-11-06", time: "09:00" }, services);
  assert.ok(!visit.ok && visit.field === "address");
});

test("café pre-order time is optional; restaurants ignore it", () => {
  const cafe = ctx({ module: MODULES.cafe });
  const asap = validateOrder({ ...customer, orderType: "takeaway", lines: [{ itemId: "hummus", quantity: 1 }] }, cafe);
  assert.ok(asap.ok && asap.order.requestedFor === null);
  const later = validateOrder({ ...customer, orderType: "takeaway", date: "2026-11-07", time: "08:15", lines: [{ itemId: "hummus", quantity: 1 }] }, cafe);
  assert.ok(later.ok && later.order.requestedFor === "2026-11-07 08:15");
  const restaurant = validateOrder({ ...customer, orderType: "takeaway", date: "2026-11-07", time: "08:15", lines: [{ itemId: "hummus", quantity: 1 }] }, ctx());
  assert.ok(restaurant.ok && restaurant.order.requestedFor === null);
});

test("table bookings only where the module has them and the owner turned them on", () => {
  const booking = { ...customer, kind: "booking", date: "2026-11-06", time: "20:00", partySize: 4 };
  const ok = validateOrder(booking, ctx());
  assert.ok(ok.ok && ok.order.kind === "booking" && ok.order.partySize === 4);
  const shop = validateOrder(booking, ctx({ module: MODULES.shop }));
  assert.ok(!shop.ok && shop.code === "closed");
  const off = validateOrder(booking, ctx({ bookingEnabled: false }));
  assert.ok(!off.ok);
  const noGuests = validateOrder({ ...booking, partySize: 0 }, ctx());
  assert.ok(!noGuests.ok && noGuests.field === "partySize");
});

test("USD report totals convert LBP lines only with a rate", () => {
  assert.equal(totalInUsd([{ price: 90000, currency: "LBP", quantity: 2 }], config), 2.01);
  assert.equal(totalInUsd([{ price: 90000, currency: "LBP", quantity: 1 }], { ...config, lbpRate: null }), null);
});

test("any status can follow any other, so changes can be undone", () => {
  assert.ok(canMoveTo("new", "confirmed"));
  assert.ok(canMoveTo("confirmed", "cancelled"));
  assert.ok(canMoveTo("completed", "confirmed"));
  assert.ok(canMoveTo("cancelled", "new"));
  assert.ok(canMoveTo("ready", "confirmed"));
  assert.ok(!canMoveTo("ready", "ready"));
  assert.ok(!canMoveTo("new", "archived" as never));
});

test("items sell out at zero stock only when stock is tracked", () => {
  assert.equal(isItemAvailable({ is_available: 1, stock_qty: 0 }, true), false);
  assert.equal(isItemAvailable({ is_available: 1, stock_qty: 0 }, false), true);
  assert.equal(isItemAvailable({ is_available: 0, stock_qty: 5 }, true), false);
  assert.equal(isItemAvailable({ is_available: null, stock_qty: null }, true), true);
});

test("WhatsApp messages carry the order number, address and appointment time", () => {
  const message = buildOrderMessage(
    [{ name_ar: "قص شعر", name_en: "Haircut", price: 15, currency: "USD", quantity: 1 }],
    {
      restaurantName: "Studio",
      orderType: "home_visit",
      address: "Main street",
      area: "Jounieh",
      name: "Lea",
      phone: "70123456",
      when: "2026-11-06 09:00",
      orderNumber: 42,
    },
    config,
    "en",
    "services"
  );
  assert.match(message, /New appointment request #42 · Studio/);
  assert.match(message, /Home visit/);
  assert.match(message, /Main street/);
  assert.match(message, /2026-11-06 · 09:00/);
});
