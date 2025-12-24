/**
 * Migration script to add catalog_id column to existing tables
 * 
 * Run with: npx tsx scripts/migrate-add-catalog-id.ts
 */

import { config } from "dotenv";
config(); // Load .env file

import { getDb } from "../lib/db/client";

const tablesToMigrate = [
  "categories",
  "menu_items", 
  "operating_hours",
  "social_media",
  "branches",
  "faqs",
];

async function runMigration() {
  console.log("🚀 Adding catalog_id column to existing tables...\n");

  const db = getDb();

  for (const table of tablesToMigrate) {
    try {
      // Check if column already exists
      const tableInfo = await db.execute(`PRAGMA table_info(${table})`);
      const hasColumn = tableInfo.rows.some((row: any) => row.name === "catalog_id");

      if (hasColumn) {
        console.log(`  ⏭️  ${table}: catalog_id column already exists`);
        continue;
      }

      // Add the column
      await db.execute(`ALTER TABLE ${table} ADD COLUMN catalog_id TEXT`);
      console.log(`  ✅ ${table}: Added catalog_id column`);

      // Create index for the new column
      try {
        await db.execute(`CREATE INDEX IF NOT EXISTS idx_${table}_catalog ON ${table}(catalog_id)`);
        console.log(`  ✅ ${table}: Created index`);
      } catch (indexErr: any) {
        console.log(`  ⚠️  ${table}: Index might already exist`);
      }
    } catch (error: any) {
      console.error(`  ❌ ${table}: ${error.message}`);
    }
  }

  console.log("\n✅ Migration completed!");
}

runMigration()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });

