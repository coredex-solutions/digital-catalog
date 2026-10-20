// Owner rules: reordering, billing grace and Arabic error messages
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { planReorder } from "@/lib/catalog/reorder";
import { getSubscriptionState, GRACE_DAYS } from "@/lib/plans";
import { translateApiMessage, API_MESSAGE_EXACT } from "@/app/c/[slug]/admin/_lib/api-errors";

test("reordering only changes the rows that moved", () => {
  const current = new Map([["a", 0], ["b", 1], ["c", 2]]);
  assert.deepEqual(planReorder(["b", "a", "c"], current), [["b", 0], ["a", 1]]);
  assert.deepEqual(planReorder(["a", "b", "c"], current), []);
});

test("rows that shared a position are renumbered", () => {
  const current = new Map([["a", 0], ["b", 0], ["c", 0]]);
  assert.deepEqual(planReorder(["c", "a", "b"], current), [["a", 1], ["b", 2]]);
});

test("a stale or malformed order is refused", () => {
  const current = new Map([["a", 0], ["b", 1]]);
  assert.equal(planReorder(["a"], current), null);
  assert.equal(planReorder(["a", "a"], current), null);
  assert.equal(planReorder(["a", "x"], current), null);
  assert.equal(planReorder("a,b", current), null);
});

test("expired plans get a grace period before going offline", () => {
  const expiry = "2026-10-01 00:00:00";
  const day = 24 * 60 * 60 * 1000;
  const start = Date.parse("2026-10-01T00:00:00Z");
  assert.equal(getSubscriptionState(null).state, "active");
  assert.equal(getSubscriptionState(expiry, new Date(start - day)).state, "active");
  assert.equal(getSubscriptionState(expiry, new Date(start + day)).state, "grace");
  assert.equal(getSubscriptionState(expiry, new Date(start + (GRACE_DAYS + 1) * day)).state, "expired");
});

test("every error the dashboard APIs send has an Arabic translation", () => {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (name.endsWith(".ts")) files.push(full);
    }
  };
  ["src/app/api/c", "src/app/api/ai", "lib"].forEach(walk);

  // Example values for template literals, so patterns like "Dish ${n} needs a price" can match
  const SAMPLE: Record<string, string> = { maxAllowed: "25", maxImages: "50", MAX_VARIANTS: "10", MAX_MEMBERS: "5", MAX_FAQS: "20", day: "Monday", "index + 1": "2", "entry?.day_name": "Funday" };
  // Owner-facing: response fields and JobError. A plain `new Error` is replaced server-side,
  // except the "deleted" text that image jobs pass through.
  const pattern = /(?:error|message):\s*(?:"([^"\n]{3,})"|'([^'\n]{3,})'|`([^`\n]{3,})`)|new JobError\(\s*(?:"([^"]+)"|`([^`]+)`)|new Error\("([^"]*deleted[^"]*)"/g;
  // Internal errors that never reach the owner as-is
  const INTERNAL = [/GOOGLE_API_KEY/, /^fake failure/, /too large to enhance/, /^Invalid token/, /^No image/, /Gemini|model/i];

  const found = new Set<string>();
  for (const file of files) {
    for (const m of readFileSync(file, "utf8").matchAll(pattern)) {
      const text = (m[1] ?? m[2] ?? m[3] ?? m[4] ?? m[5] ?? m[6]).replace(/\$\{([^}]+)\}/g, (_, expr: string) => SAMPLE[expr.trim()] ?? "7");
      found.add(text);
    }
  }
  assert.ok(found.size > 100, `only ${found.size} messages found; is the scan still working?`);

  const generic = translateApiMessage("__unknown__", "ar");
  const missing = [...found].filter(
    (text) =>
      !INTERNAL.some((r) => r.test(text)) &&
      translateApiMessage(text, "ar") === generic &&
      API_MESSAGE_EXACT[text.trim()] !== generic
  );
  assert.deepEqual(missing, [], "add these to src/app/c/[slug]/admin/_lib/api-errors.ts");
});
