// Sign-in, password and signup pages: every API error has Arabic
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { accountError, ACCOUNT_ERRORS_AR } from "@/app/(account)/_errors";

test("every error the account APIs send has an Arabic translation", () => {
  const dir = join(process.cwd(), "src/app/api/auth");
  const messages = new Set<string>();
  for (const route of readdirSync(dir)) {
    const source = readFileSync(join(dir, route, "route.ts"), "utf8");
    for (const [, , text] of source.matchAll(/\{\s*error:\s*(["'`])((?:(?!\1).)+)\1/g)) messages.add(text.replace("${MIN_PASSWORD_LENGTH}", "8"));
    for (const [, text] of source.matchAll(/const EXPIRED = ["'`]([^"'`]+)["'`]/g)) messages.add(text);
  }
  messages.add("Too many requests. Please try again later.");
  assert.ok(messages.size > 15, "the scan found the routes' messages");
  const missing = [...messages].filter((text) => !ACCOUNT_ERRORS_AR[text]);
  assert.deepEqual(missing, []);
});

test("English stays English and unknown errors get a general Arabic message", () => {
  assert.equal(accountError("Invalid or expired code", "en"), "Invalid or expired code");
  assert.match(accountError("Invalid or expired code", "ar"), /الرمز/);
  assert.match(accountError("Failed to fetch", "ar"), /حدث خطأ/);
});
