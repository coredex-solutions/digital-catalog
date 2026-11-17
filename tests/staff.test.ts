// Staff calendars (services): each person takes one appointment at a time, customers book a person
// or "anyone", days off and working hours count, and repeat bookings land on the right dates.
import { test } from "node:test";
import assert from "node:assert/strict";
import { MODULES } from "@/lib/modules/registry";
import { parseBookingConfig, staffChoices, staffForTime, staffSlots, usesStaff, type HoursRow } from "@/lib/orders/slots";
import { bookableStaff, parseStaffList, worksOn } from "@/lib/orders/staff";
import { validateOrder, type OrderContext } from "@/lib/orders/validate";
import { repeatDates } from "@/lib/orders/appointments";
import { EMPTY_DELIVERY } from "@/lib/orders/delivery";
import { DEFAULT_PAYMENT } from "@/lib/orders/payment";
import { buildOrderMessage, buildReminder } from "@/app/c/[slug]/_lib/whatsapp";

// 2026-11-23 is a Monday
const hours: HoursRow[] = [
  { day_name: "Monday", open_hour: 9, close_hour: 13, is_closed: 0 },
  { day_name: "Tuesday", open_hour: 9, close_hour: 13, is_closed: 0 },
];
const now = { date: "2026-11-20", minutes: 10 * 60 };
const config = parseBookingConfig({
  enabled: true,
  slot_minutes: 60,
  capacity: 5,
  lead_minutes: 0,
  max_days: 30,
  staff: [
    { id: "rana1", name_en: "Rana", name_ar: "رنا", service_ids: [], days_off: [2] }, // off on Tuesdays
    { id: "maya1", name_en: "Maya", name_ar: "مايا", service_ids: ["nails"], from: "11:00", to: "13:00" },
    { id: "omar1", name_en: "Omar", name_ar: "عمر", active: false },
  ],
});

test("the staff list is cleaned: names needed, hours as a pair, inactive kept", () => {
  const staff = parseStaffList([
    { id: "ok01", name_en: " Lea ", from: "10:00", to: "09:00", days_off: [1, 9, "x"], dates_off: ["2026-12-25", "bad"] },
    { id: "ok01", name_en: "Duplicate" },
    { id: "nm01", name_en: "", name_ar: "" },
    { id: "!", name_en: "Bad id" },
  ]);
  assert.equal(staff.length, 1);
  assert.equal(staff[0].name_en, "Lea");
  assert.equal(staff[0].from, null, "a finish before the start is dropped");
  assert.deepEqual(staff[0].days_off, [1]);
  assert.deepEqual(staff[0].dates_off, ["2026-12-25"]);
  assert.equal(config.staff.length, 3);
  assert.equal(config.staff[2].active, false);
  assert.ok(usesStaff(config));
  assert.ok(!usesStaff(parseBookingConfig({ enabled: true, staff: [{ id: "x001", name_en: "Off", active: false }] })));
});

test("only active people who do every chosen service can be booked", () => {
  assert.deepEqual(bookableStaff(config.staff, ["cut"]).map((p) => p.id), ["rana1"]);
  assert.deepEqual(bookableStaff(config.staff, ["nails"]).map((p) => p.id), ["rana1", "maya1"]);
  assert.deepEqual(staffChoices(config, ["nails"], "maya1").map((p) => p.id), ["maya1"]);
  assert.deepEqual(staffChoices(config, ["nails"], "any").map((p) => p.id), ["rana1", "maya1"]);
  assert.deepEqual(staffChoices(config, ["cut", "nails"], "maya1"), [], "Maya doesn't cut hair");
  assert.ok(worksOn(config.staff[0], "2026-11-23"));
  assert.ok(!worksOn(config.staff[0], "2026-11-24"));
});

test("a time stays free while someone who can do it is free", () => {
  const people = staffChoices(config, ["nails"], "any");
  const taken = [
    { start: "2026-11-23 09:00", minutes: 60, staff_id: "rana1" },
    { start: "2026-11-23 11:00", minutes: 60, staff_id: "rana1" },
    { start: "2026-11-23 12:00", minutes: 60, staff_id: "maya1" },
    { start: "2026-11-23 10:00", minutes: 60, staff_id: null }, // from before staff: blocks no one
  ];
  const result = staffSlots({ config, hours, date: "2026-11-23", minutes: 60, now, taken, staff: people });
  assert.equal(result.state, "open");
  // 09:00 Rana busy, Maya starts at 11:00 → gone. 10:00 Rana. 11:00 Maya. 12:00 Rana.
  assert.deepEqual(result.state === "open" && result.times, ["10:00", "11:00", "12:00"]);
  assert.deepEqual(result.free, { "10:00": ["rana1"], "11:00": ["maya1"], "12:00": ["rana1"] });

  const maya = staffSlots({ config, hours, date: "2026-11-23", minutes: 60, now, taken, staff: staffChoices(config, ["nails"], "maya1") });
  assert.deepEqual(maya.state === "open" && maya.times, ["11:00"]);
});

test("a day nobody works is closed, and nobody for the services says so", () => {
  // Tuesday: Rana is off, so haircuts (only Rana) can't be booked
  assert.equal(staffSlots({ config, hours, date: "2026-11-24", minutes: 60, now, taken: [], staff: staffChoices(config, ["cut"]) }).state, "closed");
  const none = staffSlots({ config, hours, date: "2026-11-23", minutes: 60, now, taken: [], staff: [] });
  assert.deepEqual(none, { state: "closed", reason: "no_staff" });
});

test("the order check keeps who can take the time, and capacity becomes one", () => {
  const ctx: OrderContext = {
    module: MODULES.services,
    items: [
      { id: "cut", name_en: "Haircut", name_ar: "قص", price: 15, currency: "USD", is_available: true, stock_qty: null, variants: null, duration_minutes: 60 },
      { id: "nails", name_en: "Nails", name_ar: "أظافر", price: 20, currency: "USD", is_available: true, stock_qty: null, variants: null, duration_minutes: 60 },
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
  };
  const base = { name: "Lea", phone: "70 123 456", lang: "en", orderType: "at_location", date: "2026-11-23" };

  const anyone = validateOrder({ ...base, time: "11:00", lines: [{ itemId: "nails", quantity: 1 }] }, ctx);
  assert.ok(anyone.ok);
  assert.deepEqual(anyone.order.staff?.map((p) => p.id), ["rana1", "maya1"]);
  assert.equal(anyone.order.capacity, 1);

  // 09:00 is before Maya starts, so asking for her fails; anyone still has Rana
  const early = validateOrder({ ...base, time: "09:00", staffId: "maya1", lines: [{ itemId: "nails", quantity: 1 }] }, ctx);
  assert.ok(!early.ok);
  assert.equal(early.code, "slot_unavailable");
  const earlyAny = validateOrder({ ...base, time: "09:00", lines: [{ itemId: "nails", quantity: 1 }] }, ctx);
  assert.ok(earlyAny.ok);
  assert.deepEqual(earlyAny.order.staff?.map((p) => p.id), ["rana1"]);

  // Haircut and nails in one visit: only Rana does both
  const both = validateOrder({ ...base, time: "09:00", lines: [{ itemId: "cut", quantity: 1 }, { itemId: "nails", quantity: 1 }] }, { ...ctx, hours: [{ day_name: "Monday", open_hour: 9, close_hour: 13, is_closed: 0 }] });
  assert.ok(both.ok);
  assert.deepEqual(both.order.staff?.map((p) => p.id), ["rana1"]);
  assert.equal(both.order.durationMinutes, 120);

  // Without staff, the business capacity applies as before
  const plain = validateOrder({ ...base, time: "10:00", lines: [{ itemId: "cut", quantity: 1 }] }, { ...ctx, booking: { ...config, staff: [] } });
  assert.ok(plain.ok);
  assert.equal(plain.order.staff, null);
  assert.equal(plain.order.capacity, 5);
});

test("staffForTime respects working hours", () => {
  const ids = (time: string) => staffForTime(config, hours, staffChoices(config, ["nails"]), "2026-11-23", time, 60, now).map((p) => p.id);
  assert.deepEqual(ids("10:00"), ["rana1"]);
  assert.deepEqual(ids("12:00"), ["rana1", "maya1"]);
});

test("repeat bookings come back every one, two or four weeks, up to twelve times", () => {
  assert.deepEqual(repeatDates("2026-11-23", 1, 3), ["2026-11-23", "2026-11-30", "2026-12-07"]);
  assert.deepEqual(repeatDates("2026-12-28", 2, 2), ["2026-12-28", "2027-01-11"]);
  assert.equal(repeatDates("2026-11-23", 4, 99).length, 12);
  assert.deepEqual(repeatDates("2026-11-23", 3, 2), ["2026-11-23", "2026-11-30"], "an unknown gap means every week");
});

test("the WhatsApp message and the reminder name the person", () => {
  const message = buildOrderMessage(
    [{ name_en: "Nails", name_ar: "أظافر", price: 20, currency: "USD", quantity: 1 }],
    { restaurantName: "Studio Lea", orderType: "at_location", name: "Lea", phone: "70123456", when: "2026-11-23 11:00", staff: "Maya" },
    { primary: "USD", lbpRate: null, rateUpdatedAt: null, showDual: false },
    "en",
    "services"
  );
  assert.match(message, /\*With:\* Maya/);
  assert.equal(
    buildReminder({ requested_for: "2026-11-23 11:00", lang: "en", staff_name: "Maya" }, "Studio Lea", "services"),
    "Reminder: your appointment at Studio Lea is on Monday 23 November at 11:00 with Maya. See you soon!"
  );
  assert.match(buildReminder({ requested_for: "2026-11-23 11:00", lang: "ar", staff_name: "مايا" }, "ستوديو ليا", "services") ?? "", /الساعة 11:00 مع مايا\./);
});
