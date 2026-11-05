// Set booking times: times come from the opening hours, full times disappear, and the order
// check only accepts real free times.
import { test } from "node:test";
import assert from "node:assert/strict";
import { MODULES } from "@/lib/modules/registry";
import { availableSlots, beirutNow, fitsSlot, openingFor, parseBookingConfig, requestMinutes, type HoursRow } from "@/lib/orders/slots";
import { validateOrder, type OrderContext } from "@/lib/orders/validate";
import { EMPTY_DELIVERY } from "@/lib/orders/delivery";
import { DEFAULT_PAYMENT } from "@/lib/orders/payment";
import { buildReminder } from "@/app/c/[slug]/_lib/whatsapp";

// 2026-11-09 is a Monday
const hours: HoursRow[] = [
  { day_name: "Monday", open_hour: 9, close_hour: 12, is_closed: 0 },
  { day_name: "Tuesday", open_hour: 18, close_hour: 2, is_closed: 0 },
  { day_name: "Sunday", open_hour: 9, close_hour: 17, is_closed: 1 },
];
const config = parseBookingConfig({ enabled: true, slot_minutes: 30, capacity: 2, lead_minutes: 60, max_days: 14, blocked_dates: ["2026-11-16"] });
const now = { date: "2026-11-09", minutes: 9 * 60 + 10 }; // Monday 09:10

test("times follow the opening hours, the step and the notice", () => {
  const result = availableSlots({ config, hours, date: "2026-11-09", minutes: 30, now, taken: [] });
  assert.equal(result.state, "open");
  // 09:10 + 1 hour notice → first time 10:30; last start that ends by 12:00 is 11:30
  assert.deepEqual(result.state === "open" && result.times, ["10:30", "11:00", "11:30"]);
  const tomorrowish = availableSlots({ config, hours, date: "2026-11-23", minutes: 60, now, taken: [] });
  assert.deepEqual(tomorrowish.state === "open" && tomorrowish.times, ["09:00", "09:30", "10:00", "10:30", "11:00"]);
});

test("full times disappear once capacity is reached", () => {
  const taken = [
    { start: "2026-11-23 09:00", minutes: 60 },
    { start: "2026-11-23 09:30", minutes: 30 },
    { start: "2026-11-24 09:00", minutes: 600 }, // another day
  ];
  const result = availableSlots({ config, hours, date: "2026-11-23", minutes: 30, now, taken });
  // 09:30 overlaps two bookings (capacity 2): gone. 09:00 overlaps one: still free.
  assert.deepEqual(result.state === "open" && result.times, ["09:00", "10:00", "10:30", "11:00", "11:30"]);
});

test("closed weekdays, blocked dates, past days and days too far ahead offer nothing", () => {
  for (const date of ["2026-11-15", "2026-11-16", "2026-11-08", "2026-11-30", "nope"]) {
    assert.equal(availableSlots({ config, hours, date, minutes: 30, now, taken: [] }).state, "closed", date);
  }
  // A weekday with no row (Wednesday) is closed too
  assert.equal(openingFor(hours, "2026-11-11"), null);
});

test("overnight hours take bookings until midnight; no hours at all means any time", () => {
  assert.deepEqual(openingFor(hours, "2026-11-10"), [18 * 60, 24 * 60]);
  const late = availableSlots({ config, hours, date: "2026-11-10", minutes: 90, now, taken: [] });
  assert.equal(late.state === "open" && late.times.at(-1), "22:30");
  assert.equal(availableSlots({ config, hours: [], date: "2026-11-10", minutes: 30, now, taken: [] }).state, "free");
});

test("settings are cleaned", () => {
  const parsed = parseBookingConfig(JSON.stringify({ enabled: 1, slot_minutes: 7, capacity: 0, lead_minutes: -5, blocked_dates: ["2026-12-25", "x", "2026-12-25"], deposit: "10", deposit_currency: "EUR" }));
  assert.equal(parsed.enabled, true);
  assert.equal(parsed.slot_minutes, 30);
  assert.equal(parsed.capacity, 1);
  assert.equal(parsed.lead_minutes, 60);
  assert.deepEqual(parsed.blocked_dates, ["2026-12-25"]);
  assert.equal(parsed.deposit, 10);
  assert.equal(parsed.deposit_currency, "USD");
  assert.equal(parseBookingConfig("garbage").enabled, false);
});

test("appointment length adds the services' durations", () => {
  assert.equal(requestMinutes([{ duration_minutes: 45, quantity: 1 }, { duration_minutes: 15, quantity: 2 }], config), 75);
  assert.equal(requestMinutes([{ duration_minutes: null, quantity: 1 }], config), config.default_minutes);
});

test("beirutNow gives the Beirut date and time", () => {
  // 2026-11-09 22:30 UTC is 00:30 on the 10th in Beirut (UTC+2 in winter)
  assert.deepEqual(beirutNow(new Date("2026-11-09T22:30:00Z")), { date: "2026-11-10", minutes: 30 });
});

function ctx(overrides: Partial<OrderContext> = {}): OrderContext {
  return {
    module: MODULES.services,
    items: [
      { id: "cut", name_en: "Haircut", name_ar: "قص", price: 15, currency: "USD", is_available: true, stock_qty: null, variants: null, duration_minutes: 45 },
    ],
    orderTypesSetting: "at_location",
    orderingEnabled: true,
    bookingEnabled: true,
    trackStock: false,
    priceConfig: { primary: "USD", lbpRate: null, rateUpdatedAt: null, showDual: false },
    delivery: EMPTY_DELIVERY,
    payment: DEFAULT_PAYMENT,
    booking: config,
    hours,
    now,
    today: now.date,
    ...overrides,
  };
}
const request = { name: "Lea", phone: "70 123 456", lang: "en", orderType: "at_location", lines: [{ itemId: "cut", quantity: 1 }] };

test("appointments must use one of the set times and carry their length", () => {
  const ok = validateOrder({ ...request, date: "2026-11-23", time: "10:00" }, ctx());
  assert.ok(ok.ok);
  assert.equal(ok.order.durationMinutes, 45);
  assert.equal(ok.order.capacity, 2);
  for (const [date, time] of [["2026-11-23", "10:10"], ["2026-11-23", "11:30"], ["2026-11-16", "10:00"], ["2026-11-09", "09:30"]]) {
    const bad = validateOrder({ ...request, date, time }, ctx());
    assert.ok(!bad.ok, `${date} ${time}`);
    assert.equal(bad.code, "slot_unavailable");
  }
  // Without set times any future time is accepted, with no capacity check
  const free = validateOrder({ ...request, date: "2026-11-23", time: "10:10" }, ctx({ booking: parseBookingConfig(null) }));
  assert.ok(free.ok);
  assert.equal(free.order.capacity, null);
});

test("table bookings use the table length", () => {
  const restaurant = ctx({ module: MODULES.restaurant, orderTypesSetting: "dine_in" });
  const ok = validateOrder({ name: "Rami", phone: "03 123 456", lang: "en", kind: "booking", date: "2026-11-23", time: "09:00", partySize: 4 }, { ...restaurant, booking: { ...config, table_minutes: 120 } });
  assert.ok(ok.ok);
  assert.equal(ok.order.durationMinutes, 120);
  const late = validateOrder({ name: "Rami", phone: "03 123 456", lang: "en", kind: "booking", date: "2026-11-23", time: "11:00", partySize: 4 }, { ...restaurant, booking: { ...config, table_minutes: 120 } });
  assert.ok(!late.ok);
  assert.equal(fitsSlot(config, hours, "2026-11-23", "11:30", 30, now), true);
});

test("reminders name the day and time in the customer's language", () => {
  assert.equal(
    buildReminder({ requested_for: "2026-11-23 10:00", lang: "en" }, "Studio Lea", "services"),
    "Reminder: your appointment at Studio Lea is on Monday 23 November at 10:00. See you soon!"
  );
  assert.match(buildReminder({ requested_for: "2026-11-23 20:30", lang: "ar" }, "مطعم الأرز", "restaurant") ?? "", /^تذكير: موعد حجزك لدى مطعم الأرز يوم الاثنين،? 23 تشرين الثاني الساعة 20:30/);
});
