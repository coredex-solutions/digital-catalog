// Creates the full multi-tenant schema on the database in .env.local (or .env).
// Safe to re-run: tables use IF NOT EXISTS and existing columns are skipped.
//
//   node scripts/init-db.mjs
import { createClient } from "@libsql/client";
import { config } from "dotenv";
import fs from "fs";
import path from "path";

config({ path: ".env.local" });
config();

const url = process.env.TURSO_DATABASE_URL;
if (!url) throw new Error("TURSO_DATABASE_URL is not set");
const db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });

// Order matters: base schema first, then migrations in date order
const FILES = [
  "lib/db/schema-v2-multitenant.sql",
  "lib/db/migrations/20240120_add_dark_mode_colors.sql",
  "lib/db/migrations/20260130_add_plan_requests.sql",
  "ai_waiter_migration.sql",
  "lib/db/migrations/20261008_menu_redesign.sql",
  "lib/db/migrations/20261010_publishing.sql",
  "lib/db/migrations/20261010_dish_options.sql",
  "lib/db/migrations/20261010_team_billing.sql",
];

// Tables that were only ever created by one-off scripts or at runtime
const EXTRA = [
  `CREATE TABLE IF NOT EXISTS catalog_ai_training_queue (
    id TEXT PRIMARY KEY,
    catalog_id TEXT NOT NULL REFERENCES catalogs(id) ON DELETE CASCADE,
    question_en TEXT NOT NULL,
    question_ar TEXT NOT NULL,
    category TEXT DEFAULT 'menu',
    priority INTEGER DEFAULT 3,
    context TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `ALTER TABLE catalog_settings ADD COLUMN ai_waiter_enabled INTEGER DEFAULT 0`,
  // French (and Arabic answer) columns for the AI waiter tables
  `ALTER TABLE catalog_ai_training_queue ADD COLUMN question_fr TEXT`,
  `ALTER TABLE catalog_ai_knowledge ADD COLUMN question_fr TEXT`,
  `ALTER TABLE catalog_ai_knowledge ADD COLUMN answer_fr TEXT`,
  `ALTER TABLE catalog_ai_knowledge ADD COLUMN answer_ar TEXT`,
  `CREATE TABLE IF NOT EXISTS verification_codes (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
];

function read(file) {
  const buf = fs.readFileSync(path.join(process.cwd(), file));
  // Some older .sql files were saved as UTF-16 by PowerShell
  return buf[0] === 0xff && buf[1] === 0xfe ? buf.subarray(2).toString("utf16le") : buf.toString("utf8");
}

function split(sql) {
  return sql
    .replace(/--.*$/gm, "")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
}

const ALREADY = /duplicate column|already exists/i;
let failed = 0;

async function run(label, statements) {
  let applied = 0;
  for (const statement of statements) {
    try {
      await db.execute(statement);
      applied++;
    } catch (error) {
      if (ALREADY.test(error.message)) continue;
      failed++;
      console.error(`  ✗ ${label}: ${error.message}\n    ${statement.slice(0, 80).replace(/\s+/g, " ")}`);
    }
  }
  console.log(`${label}: ${applied}/${statements.length} applied`);
}

for (const file of FILES) await run(file, split(read(file)));
await run("extra tables", EXTRA);

const tables = await db.execute("SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'table'");
console.log(`\n${tables.rows[0].n} tables. ${failed ? `${failed} statement(s) failed.` : "Done."}`);
process.exit(failed ? 1 : 0);
