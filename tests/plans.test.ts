// The plans: Starter is a cheap menu page (no orders, bookings or AI assistant); the others order.
import { test } from "node:test";
import assert from "node:assert/strict";
import { PAID_PLAN_IDS, PLAN_CONFIG, isPaidPlanId, planHasAiAssistant, planTakesOrders } from "@/lib/plans";

test("Starter is the cheapest paid plan, listed first", () => {
  assert.equal(PAID_PLAN_IDS[0], "starter");
  assert.ok(isPaidPlanId("starter"));
  assert.equal(PLAN_CONFIG.starter.price, 49);
  const prices = PAID_PLAN_IDS.map((id) => PLAN_CONFIG[id].price);
  assert.deepEqual(prices, [...prices].sort((a, b) => a - b), "plans are listed from cheapest");
});

test("Starter takes no orders and has no AI assistant or AI photos", () => {
  assert.equal(planTakesOrders("starter"), false);
  assert.equal(planHasAiAssistant("starter"), false);
  assert.equal(PLAN_CONFIG.starter.limits.ai_image_enhancement_limit, 0);
  assert.equal(PLAN_CONFIG.starter.features.booking_enabled, false);
});

test("the trial, the other plans and old subscriptions keep ordering", () => {
  for (const type of ["trial", "essential", "pro", "enterprise", "yearly", "forever", "custom_years", null, undefined, "something-else"]) {
    assert.equal(planTakesOrders(type), true, String(type));
    assert.equal(planHasAiAssistant(type), true, String(type));
  }
});
