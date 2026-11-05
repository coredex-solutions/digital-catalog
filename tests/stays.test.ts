// Stays (guesthouses, chalets, hotels): nights, weekend prices, free rooms and the order check.
import { test } from "node:test";
import assert from "node:assert/strict";
import { MODULES } from "@/lib/modules/registry";
import {
  addDays,
  bookedByNight,
  checkStayDates,
  freeUnits,
  isWeekendNight,
  nightsBetween,
  parseStayConfig,
  stayDeposit,
  stayLinePrice,
  stayNights,
  unitsOf,
} from "@/lib/orders/stays";
import { validateOrder, type OrderContext } from "@/lib/orders/validate";
import { EMPTY_DELIVERY } from "@/lib/orders/delivery";
import { DEFAULT_PAYMENT } from "@/lib/orders/payment";
import { DEFAULT_BOOKING } from "@/lib/orders/slots";
import { buildOrderMessage, buildReminder } from "@/app/c/[slug]/_lib/whatsapp";
import { getDictionary } from "@/app/c/[slug]/_lib/i18n";
import { parseItemExtras } from "@/lib/catalog/item-extras";

// 2026-12-10 is a Thursday
const today = "2026-12-01";

test("nights run from check-in to the night before check-out", () => {
  assert.equal(nightsBetween("2026-12-10", "2026-12-13"), 3);
  assert.deepEqual(stayNights("2026-12-10", "2026-12-13"), ["2026-12-10", "2026-12-11", "2026-12-12"]);
  assert.deepEqual(stayNights("2026-12-13", "2026-12-10"), []);
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(nightsBetween("2027-03-27", "2027-03-29"), 2, "a clock change doesn't lose a night");
});

test("Friday and Saturday nights cost the weekend price, options keep their difference", () => {
  assert.equal(isWeekendNight("2026-12-11"), true); // Friday
  assert.equal(isWeekendNight("2026-12-12"), true); // Saturday
  assert.equal(isWeekendNight("2026-12-13"), false); // Sunday
  const room = { price: 100, weekend_price: 130, currency: "USD" };
  // Thu 100 + Fri 130 + Sat 130
  assert.equal(stayLinePrice(room, 100, stayNights("2026-12-10", "2026-12-13")), 360);
  // An option at 120 a night pays 150 on weekend nights
  assert.equal(stayLinePrice(room, 120, stayNights("2026-12-10", "2026-12-13")), 420);
  assert.equal(stayLinePrice({ price: 100 }, 100, stayNights("2026-12-10", "2026-12-13")), 300);
  assert.equal(stayLinePrice({ price: 4_500_000, currency: "LBP" }, 4_500_000.4, ["2026-12-14"]), 4_500_000);
});

test("settings are cleaned", () => {
  const config = parseStayConfig({ check_in: "25:00", check_out: "11:00", min_nights: 3, max_nights: 2, max_days: 9999, deposit_percent: 30, blocked_dates: ["2026-12-25", "2026-02-31", "x"] });
  assert.equal(config.check_in, "14:00");
  assert.equal(config.check_out, "11:00");
  assert.equal(config.min_nights, 3);
  assert.equal(config.max_nights, 3, "never shorter than the shortest stay");
  assert.equal(config.max_days, 365);
  assert.deepEqual(config.blocked_dates, ["2026-12-25"]);
  assert.equal(config.deposit_percent, 30);
  assert.deepEqual(parseStayConfig("not json"), parseStayConfig(null));
});

test("dates are checked against the rules", () => {
  const config = parseStayConfig({ min_nights: 2, max_nights: 7, max_days: 60, blocked_dates: ["2026-12-25"] });
  assert.equal(checkStayDates(config, "2026-12-10", "2026-12-12", today), null);
  assert.equal(checkStayDates(config, "2026-12-10", "2026-12-11", today), "too_short");
  assert.equal(checkStayDates(config, "2026-12-10", "2026-12-20", today), "too_long");
  assert.equal(checkStayDates(config, "2026-11-30", "2026-12-02", today), "past");
  assert.equal(checkStayDates(config, "2027-03-01", "2027-03-03", today), "too_far");
  assert.equal(checkStayDates(config, "2026-12-24", "2026-12-26", today), "closed");
  // Leaving on a closed night is fine: that night isn't stayed
  assert.equal(checkStayDates(config, "2026-12-23", "2026-12-25", today), null);
  assert.equal(checkStayDates(config, "2026-12-12", "2026-12-10", today), "invalid");
  assert.equal(checkStayDates(config, "2026-02-30", "2026-03-02", today), "invalid");
});

test("free rooms count every night of the stay", () => {
  const booked = bookedByNight([
    { check_in: "2026-12-10", check_out: "2026-12-12", lines: [{ item_id: "double", quantity: 2 }] },
    { check_in: "2026-12-11", check_out: "2026-12-13", lines: [{ item_id: "double", quantity: 1 }, { item_id: "chalet", quantity: 1 }] },
  ]);
  assert.deepEqual(booked.double, { "2026-12-10": 2, "2026-12-11": 3, "2026-12-12": 1 });
  assert.equal(freeUnits(3, booked.double, stayNights("2026-12-10", "2026-12-11")), 1);
  assert.equal(freeUnits(3, booked.double, stayNights("2026-12-10", "2026-12-13")), 0, "the 11th is full");
  assert.equal(freeUnits(3, booked.double, stayNights("2026-12-13", "2026-12-15")), 3);
  // A stay that ends on the 12th leaves the night of the 12th free for the chalet
  assert.equal(freeUnits(1, booked.chalet, ["2026-12-13"]), 1);
  assert.equal(unitsOf({ unit_count: null }), 1);
  assert.equal(unitsOf({ unit_count: 4 }), 4);
});

test("the deposit is a part of the total", () => {
  assert.equal(stayDeposit(parseStayConfig({ deposit_percent: 30 }), 360, "USD"), 108);
  assert.equal(stayDeposit(parseStayConfig({ deposit_percent: 30 }), 1_000_001, "LBP"), 300_000);
  assert.equal(stayDeposit(parseStayConfig({}), 360, "USD"), null);
});

test("room fields from the editor are checked", () => {
  const ok = parseItemExtras({ unit_count: "4", max_guests: "3", weekend_price: "130" });
  assert.deepEqual(ok, { ok: true, value: { unit_count: 4, max_guests: 3, weekend_price: 130 } });
  assert.ok(!parseItemExtras({ unit_count: "0" }).ok);
  assert.ok(!parseItemExtras({ max_guests: "60" }).ok);
  assert.deepEqual(parseItemExtras({ unit_count: "", weekend_price: null }), { ok: true, value: { unit_count: null, weekend_price: null } });
});

function ctx(overrides: Partial<OrderContext> = {}): OrderContext {
  return {
    module: MODULES.stays,
    items: [
      { id: "double", name_en: "Double room", name_ar: "غرفة مزدوجة", price: 100, currency: "USD", is_available: true, stock_qty: null, variants: null, unit_count: 3, max_guests: 2, weekend_price: 130 },
      { id: "chalet", name_en: "Sea chalet", name_ar: "شاليه بحري", price: 200, currency: "USD", is_available: true, stock_qty: null, variants: null, unit_count: null, max_guests: 5 },
    ],
    orderTypesSetting: null,
    orderingEnabled: true,
    bookingEnabled: false,
    trackStock: false,
    priceConfig: { primary: "USD", lbpRate: 89500, rateUpdatedAt: null, showDual: false },
    delivery: EMPTY_DELIVERY,
    payment: DEFAULT_PAYMENT,
    booking: DEFAULT_BOOKING,
    hours: [],
    now: { date: today, minutes: 600 },
    today,
    stay: parseStayConfig({ check_in: "15:00" }),
    stayBooked: {},
    ...overrides,
  };
}
const booking = { name: "Rami", phone: "03 123 456", lang: "en", orderType: "stay", checkIn: "2026-12-10", checkOut: "2026-12-13", guests: 4, lines: [{ itemId: "double", quantity: 2 }] };

test("a stay is priced by the server for its nights and saved as a booking request", () => {
  const result = validateOrder({ ...booking, lines: [{ itemId: "double", quantity: 2, price: 1 }] }, ctx());
  assert.ok(result.ok, JSON.stringify(result));
  const order = result.order;
  assert.equal(order.kind, "request");
  assert.equal(order.orderType, "stay");
  assert.equal(order.requestedFor, "2026-12-10 15:00");
  assert.equal(order.checkOut, "2026-12-13");
  assert.equal(order.partySize, 4);
  assert.equal(order.lines[0].price, 360, "the price sent by the page is ignored");
  assert.equal(order.totalUsd, 720);
  assert.deepEqual(order.units, [{ itemId: "double", quantity: 2, count: 3 }]);
});

test("taken rooms, too many guests and bad dates are refused", () => {
  const full = validateOrder(booking, ctx({ stayBooked: { double: { "2026-12-11": 2 } } }));
  assert.ok(!full.ok && full.code === "stay_unavailable");
  const crowded = validateOrder({ ...booking, guests: 5 }, ctx());
  assert.ok(!crowded.ok && crowded.code === "too_many_guests" && crowded.limit === 4);
  const tooMany = validateOrder({ ...booking, lines: [{ itemId: "chalet", quantity: 2 }] }, ctx());
  assert.ok(!tooMany.ok && tooMany.code === "stay_unavailable", "only one chalet");
  const past = validateOrder({ ...booking, checkIn: "2026-11-20", checkOut: "2026-11-22" }, ctx());
  assert.ok(!past.ok && past.code === "stay_dates" && past.detail === "past");
  const noGuests = validateOrder({ ...booking, guests: 0 }, ctx());
  assert.ok(!noGuests.ok && noGuests.field === "guests");
  // A room without a guest limit sleeps everyone
  const chalet = validateOrder({ ...booking, guests: 9, lines: [{ itemId: "double", quantity: 1 }, { itemId: "chalet", quantity: 1 }] }, ctx({ items: ctx().items.map((i) => (i.id === "chalet" ? { ...i, max_guests: null } : i)) }));
  assert.ok(chalet.ok);
});

test("other modules don't ask for dates", () => {
  const result = validateOrder(
    { name: "Rami", phone: "03 123 456", orderType: "at_location", date: "2026-12-10", time: "10:00", lines: [{ itemId: "double", quantity: 1 }] },
    ctx({ module: MODULES.services })
  );
  assert.ok(result.ok && result.order.checkOut === null && result.order.units === null && result.order.lines[0].price === 100);
});

test("the WhatsApp message and reminder speak about the stay", () => {
  const message = buildOrderMessage(
    [{ name_en: "Double room", name_ar: "غرفة مزدوجة", price: 360, currency: "USD", quantity: 1 }],
    { restaurantName: "Beit Sama", orderType: "stay", name: "Rami", phone: "1", when: "2026-12-10 15:00", checkOut: "2026-12-13", guests: 2 },
    { primary: "USD", lbpRate: null, rateUpdatedAt: null, showDual: false },
    "en",
    "stays"
  );
  assert.match(message, /\*New booking request · Beit Sama\*/);
  assert.match(message, /\*Check-in:\* Thu 10 Dec · 15:00/);
  assert.match(message, /\*Check-out:\* Sun 13 Dec/);
  assert.match(message, /\*Stay:\* 3 nights · 2 guests/);
  assert.doesNotMatch(message, /Order type|When/);
  const reminder = buildReminder({ requested_for: "2026-12-10 15:00", lang: "ar" }, "بيت سما", "stays");
  assert.match(reminder!, /إقامتك في بيت سما تبدأ يوم الخميس، 10 كانون الأول. الوصول من الساعة 15:00/);
});

test("nights and guests read naturally in Arabic", () => {
  const t = getDictionary("ar", "stays");
  assert.deepEqual([1, 2, 3, 11].map(t.nightsCount), ["ليلة واحدة", "ليلتان", "3 ليالٍ", "11 ليلة"]);
  assert.deepEqual([1, 2, 5, 12].map(t.guestsCount), ["ضيف واحد", "ضيفان", "5 ضيوف", "12 ضيفاً"]);
  assert.equal(getDictionary("en", "stays").sleeps(4), "Sleeps up to 4");
});
