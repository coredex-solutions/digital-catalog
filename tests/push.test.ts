// New-order notifications: only real browser push services are accepted (so a crafted
// subscription can't point the server at another address), and the text is short and localized.
import { test } from "node:test";
import assert from "node:assert/strict";
import { isAllowedEndpoint, notificationFor, parseSubscription, pushConfig } from "@/lib/push";
import type { SavedOrder } from "@/lib/orders/store";

const keys = { p256dh: "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM", auth: "tBHItJI5svbpez7KI4CCXg" };

test("only browser push services are accepted", () => {
  assert.ok(isAllowedEndpoint("https://fcm.googleapis.com/fcm/send/abc"));
  assert.ok(isAllowedEndpoint("https://updates.push.services.mozilla.com/wpush/v2/abc"));
  assert.ok(isAllowedEndpoint("https://web.push.apple.com/QH8abc"));
  assert.ok(isAllowedEndpoint("https://wns2-db5p.notify.windows.com/w/?token=abc"));
  assert.ok(!isAllowedEndpoint("http://fcm.googleapis.com/fcm/send/abc"), "plain http");
  assert.ok(!isAllowedEndpoint("https://169.254.169.254/latest/meta-data"), "internal address");
  assert.ok(!isAllowedEndpoint("https://fcm.googleapis.com.evil.example/x"), "look-alike host");
  assert.ok(!isAllowedEndpoint("https://evilpush.apple.com.example/x"));
  assert.ok(!isAllowedEndpoint("not a url"));
});

test("a subscription needs a push service address and both keys", () => {
  const good = parseSubscription({ endpoint: "https://fcm.googleapis.com/fcm/send/abc", keys });
  assert.deepEqual(good, { endpoint: "https://fcm.googleapis.com/fcm/send/abc", ...keys });
  assert.equal(parseSubscription({ endpoint: "https://example.com/hook", keys }), null);
  assert.equal(parseSubscription({ endpoint: "https://fcm.googleapis.com/fcm/send/abc", keys: { p256dh: keys.p256dh } }), null);
  assert.equal(parseSubscription({ endpoint: "https://fcm.googleapis.com/fcm/send/abc", keys: { ...keys, auth: "not base64!" } }), null);
  assert.equal(parseSubscription(null), null);
});

test("push is off without server keys", () => {
  const saved = { pub: process.env.VAPID_PUBLIC_KEY, priv: process.env.VAPID_PRIVATE_KEY };
  delete process.env.VAPID_PUBLIC_KEY;
  delete process.env.VAPID_PRIVATE_KEY;
  assert.equal(pushConfig(), null);
  process.env.VAPID_PUBLIC_KEY = "pub";
  process.env.VAPID_PRIVATE_KEY = "priv";
  assert.equal(pushConfig()?.subject, "mailto:ops@coredex.solutions");
  if (saved.pub === undefined) delete process.env.VAPID_PUBLIC_KEY;
  else process.env.VAPID_PUBLIC_KEY = saved.pub;
  if (saved.priv === undefined) delete process.env.VAPID_PRIVATE_KEY;
  else process.env.VAPID_PRIVATE_KEY = saved.priv;
});

const order: SavedOrder = {
  id: "o1",
  number: 12,
  kind: "order",
  status: "new",
  order_type: "dine_in",
  customer_name: "Rami",
  customer_phone: "71123456",
  table_label: "7",
  address: null,
  area: null,
  requested_for: null,
  party_size: null,
  lines: [
    { item_id: "h", name_en: "Hummus", name_ar: "حمص", variant_id: null, variant_en: null, variant_ar: null, price: 4, currency: "USD", quantity: 2, note: null, reserved: 0 },
    { item_id: "g", name_en: "Mixed grill", name_ar: "مشاوي", variant_id: null, variant_en: null, variant_ar: null, price: 14, currency: "USD", quantity: 1, note: null, reserved: 0 },
  ],
  price_config: { primary: "USD", lbpRate: 89500, rateUpdatedAt: null, showDual: true },
  total_usd: 22,
  note: null,
  lang: "en",
  delivery_fee: null,
  delivery_currency: null,
  payment_method: null,
  paid_at: null,
  public_token: null,
  duration_minutes: null,
  discount: null,
  discount_currency: null,
  coupon_code: null,
  check_out: null,
  created_at: "2026-11-05 10:00:00",
  updated_at: "2026-11-05 10:00:00",
};

test("the notification names the order, customer, total and table, and opens the Orders page", () => {
  const en = notificationFor(order, "en", "sofra");
  assert.equal(en.title, "New order #12");
  assert.equal(en.body, "Rami · $22 · Table 7");
  assert.equal(en.url, "/c/sofra/admin/orders/");
  const ar = notificationFor({ ...order, kind: "request", lines: [], table_label: null, requested_for: "2026-11-06T10:30" }, "ar", "lea");
  assert.equal(ar.title, "طلب موعد جديد #12");
  assert.equal(ar.body, "Rami · 2026-11-06 10:30");
});
