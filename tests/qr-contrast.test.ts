// QR colours phones can't read are refused; middling ones ask the owner to test a print
import { test } from "node:test";
import assert from "node:assert/strict";
import { checkQrColors } from "@/lib/qr/contrast";

const level = (dark: string, light: string) => checkQrColors(dark, light)?.level;

test("dark codes on light backgrounds pass", () => {
  assert.equal(level("#000000", "#ffffff"), "good");
  assert.equal(level("#4028C9", "#ffffff"), "good"); // Coredex violet, 8.9:1
  assert.equal(level("#000000", "transparent"), "good"); // judged against white paper
});

test("middling contrast is allowed but must be tested", () => {
  assert.equal(level("#E53935", "#ffffff"), "test"); // mid red, 4.2:1
  assert.equal(level("#777777", "#ffffff"), "test");
});

test("faint and inverted codes are refused with a reason", () => {
  const orange = checkQrColors("#FF6B35", "#ffffff");
  assert.equal(orange?.level, "unreadable");
  assert.match(orange?.message ?? "", /too close/);
  assert.equal(level("#FFD166", "#ffffff"), "unreadable");
  const inverted = checkQrColors("#ffffff", "#000000");
  assert.equal(inverted?.inverted, true);
  assert.equal(inverted?.level, "unreadable");
});

test("anything that isn't #RRGGBB is rejected", () => {
  assert.equal(checkQrColors("#12", "#ffffff"), null);
  assert.equal(checkQrColors("black", "#ffffff"), null);
});
