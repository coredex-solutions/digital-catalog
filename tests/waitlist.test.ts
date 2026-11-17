// Waiting lists for fully booked days: who can join, what is kept, and the messages around it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { MODULES } from "@/lib/modules/registry";
import { parseBookingConfig } from "@/lib/orders/slots";
import { checkWaitlistRequest } from "@/lib/orders/waitlist";
import { waitlistNotification } from "@/lib/push";
import { buildSpotOpened } from "@/app/c/[slug]/_lib/whatsapp";

const booking = parseBookingConfig({
  enabled: true,
  max_days: 14,
  blocked_dates: ["2026-11-25"],
  staff: [
    { id: "rana1", name_en: "Rana", name_ar: "رنا" },
    { id: "maya1", name_en: "Maya", name_ar: "مايا", service_ids: ["nails"] },
  ],
});
const items = [
  { id: "cut", name_en: "Haircut", name_ar: "قص", is_available: true },
  { id: "nails", name_en: "Nails", name_ar: "أظافر", is_available: true },
  { id: "gone", name_en: "Old", name_ar: "قديم", is_available: false },
];
const ctx = { module: MODULES.services, booking, items, today: "2026-11-20" };
const base = { date: "2026-11-23", name: "  Lea   Haddad ", phone: "+961 70-123 456", itemIds: ["cut", "gone", "nope"], lang: "ar" };

test("a customer joins with their name, phone digits and the services they wanted", () => {
  const result = checkWaitlistRequest(base, ctx);
  assert.ok(result.ok);
  assert.equal(result.entry.name, "Lea Haddad");
  assert.equal(result.entry.phone, "96170123456", "digits only, so the same number typed two ways is one entry");
  assert.deepEqual(result.entry.services, [{ id: "cut", name_en: "Haircut", name_ar: "قص" }], "unknown and sold-out services are dropped");
  assert.equal(result.entry.lang, "ar");
  assert.equal(result.entry.staff_id, null, "no person asked for");
});

test("the person asked for is kept only if they do the services", () => {
  const maya = checkWaitlistRequest({ ...base, itemIds: ["nails"], staffId: "maya1" }, ctx);
  assert.ok(maya.ok);
  assert.equal(maya.entry.staff_id, "maya1");
  assert.equal(maya.entry.staff_name, "مايا", "named in the customer's language");
  const wrong = checkWaitlistRequest({ ...base, itemIds: ["cut"], staffId: "maya1" }, ctx);
  assert.ok(wrong.ok);
  assert.equal(wrong.entry.staff_id, null);
});

test("days in the past, too far ahead or closed for bookings can't be joined", () => {
  for (const date of ["2026-11-19", "2026-12-05", "2026-11-25", "2026-02-31", "soon"]) {
    const result = checkWaitlistRequest({ ...base, date }, ctx);
    assert.ok(!result.ok, date);
    assert.equal(result.code, "date");
  }
});

test("a name and a real phone number are needed", () => {
  const noName = checkWaitlistRequest({ ...base, name: " " }, ctx);
  assert.ok(!noName.ok && noName.field === "name");
  const shortPhone = checkWaitlistRequest({ ...base, phone: "123" }, ctx);
  assert.ok(!shortPhone.ok && shortPhone.field === "phone");
});

test("only businesses taking appointments at set times have a waiting list", () => {
  assert.equal(checkWaitlistRequest(base, { ...ctx, module: MODULES.restaurant }).ok, false);
  assert.equal(checkWaitlistRequest(base, { ...ctx, booking: parseBookingConfig(null) }).ok, false);
});

test("the message when a time opens, and the team's alert, are in the right language", () => {
  assert.equal(
    buildSpotOpened({ date: "2026-11-23", lang: "en", name: "Lea" }, "Studio Lea", "services"),
    "Hello Lea, good news: a time has opened up at Studio Lea on Monday 23 November. Would you like to book it? Reply here and we'll confirm."
  );
  assert.match(buildSpotOpened({ date: "2026-11-23", lang: "ar", name: "ليا" }, "ستوديو ليا", "services"), /^مرحباً ليا، خبر سار: توفّر موعد لدى ستوديو ليا يوم الاثنين،? 23 تشرين الثاني\./);
  const alert = waitlistNotification("2026-11-23", "Lea", "en", "salon");
  assert.equal(alert.title, "Waiting list");
  assert.equal(alert.body, "Lea is waiting for a time on Mon 23 Nov");
  assert.equal(alert.url, "/c/salon/admin/calendar/?date=2026-11-23");
});
