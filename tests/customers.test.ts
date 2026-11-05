// Customers list: the same person is one row however they typed their number, and cancelled
// orders don't count.
import { test } from "node:test";
import assert from "node:assert/strict";
import { groupCustomers, phoneKey } from "@/lib/orders/customers";

test("the same Lebanese number typed differently is one key", () => {
  for (const phone of ["03 123 456", "+961 3 123 456", "00961 3 123456", "3123456", "+961-3-123-456"]) {
    assert.equal(phoneKey(phone), "3123456", phone);
  }
  assert.equal(phoneKey("71 123 456"), phoneKey("+96171123456"));
  assert.notEqual(phoneKey("+44 20 7946 0000"), phoneKey("03 123 456"));
});

test("orders are grouped by person, with the latest name, counts and totals", () => {
  const customers = groupCustomers([
    { customer_name: "Rami", customer_phone: "03 123 456", status: "completed", total_usd: 20, created_at: "2026-11-01 10:00:00" },
    { customer_name: "Rami K.", customer_phone: "+961 3 123 456", status: "new", total_usd: 12.5, created_at: "2026-11-05 09:00:00" },
    { customer_name: "Rami", customer_phone: "03123456", status: "cancelled", total_usd: 99, created_at: "2026-11-03 09:00:00" },
    { customer_name: "Nour", customer_phone: "71 000 111", status: "completed", total_usd: null, created_at: "2026-11-04 12:00:00" },
  ]);
  assert.equal(customers.length, 2);
  const [rami, nour] = customers;
  assert.equal(rami.name, "Rami K.");
  assert.equal(rami.phone, "+961 3 123 456");
  assert.equal(rami.orders, 2);
  assert.equal(rami.spentUsd, 32.5);
  assert.equal(rami.firstAt, "2026-11-01 10:00:00");
  assert.equal(rami.lastAt, "2026-11-05 09:00:00");
  assert.equal(nour.orders, 1);
  assert.equal(nour.spentUsd, null);
});
