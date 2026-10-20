// USD / LBP prices: Western digits in both languages, no conversion without an owner-set rate
import { test } from "node:test";
import assert from "node:assert/strict";
import { formatMoney, formatPrice, formatTotal, getPriceConfig, type PriceConfig } from "@/lib/catalog/price";

const dual: PriceConfig = { primary: "USD", lbpRate: 89500, rateUpdatedAt: null, showDual: true };
const noRate: PriceConfig = { primary: "USD", lbpRate: null, rateUpdatedAt: null, showDual: false };

test("formatMoney", () => {
  assert.equal(formatMoney(3, "USD", "en"), "$3");
  assert.equal(formatMoney(3.5, "USD", "ar"), "$3.50");
  assert.equal(formatMoney(270000, "LBP", "en"), "270,000 L.L.");
  assert.equal(formatMoney(270000, "LBP", "ar"), "270,000 ل.ل.");
});

test("without a rate, prices are shown exactly as entered", () => {
  assert.deepEqual(formatPrice(3, "USD", noRate, "en"), { primary: "$3" });
  assert.deepEqual(formatPrice(500000, "LBP", noRate, "en"), { primary: "500,000 L.L." });
  const config = getPriceConfig({ lbp_exchange_rate: null, show_dual_currency: 1 });
  assert.equal(config.lbpRate, null);
  assert.equal(config.showDual, false);
});

test("dual prices round LBP to the nearest 1,000", () => {
  assert.deepEqual(formatPrice(3, "USD", dual, "en"), { primary: "$3", secondary: "269,000 L.L." });
  assert.deepEqual(formatPrice(500000, "LBP", { ...dual, primary: "LBP" }, "ar"), {
    primary: "500,000 ل.ل.",
    secondary: "$5.59",
  });
});

test("totals match the lines above them", () => {
  const lines = [
    { price: 3, currency: "USD", quantity: 2 },
    { price: 500000, currency: "LBP", quantity: 1 },
  ];
  assert.deepEqual(formatTotal(lines, dual, "en"), { primary: "$11.59", secondary: "1,037,000 L.L." });
  assert.deepEqual(formatTotal(lines, noRate, "en"), { primary: "$6 + 500,000 L.L." });
});
