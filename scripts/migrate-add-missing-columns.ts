/**
 * Migration script to add missing columns to existing tables
 *
 * Run with: npx tsx scripts/migrate-add-missing-columns.ts
 */

import { config } from "dotenv";
config(); // Load .env file

import { getDb } from "../lib/db/client";

interface ColumnToAdd {
  table: string;
  column: string;
  type: string;
  defaultValue?: string;
}

const columnsToAdd: ColumnToAdd[] = [
  // social_media table
  {
    table: "social_media",
    column: "is_active",
    type: "INTEGER",
    defaultValue: "1",
  },

  // categories table
  {
    table: "categories",
    column: "is_active",
    type: "INTEGER",
    defaultValue: "1",
  },
  {
    table: "categories",
    column: "display_order",
    type: "INTEGER",
    defaultValue: "0",
  },

  // menu_items table
  {
    table: "menu_items",
    column: "is_active",
    type: "INTEGER",
    defaultValue: "1",
  },
  {
    table: "menu_items",
    column: "display_order",
    type: "INTEGER",
    defaultValue: "0",
  },
  {
    table: "menu_items",
    column: "currency",
    type: "TEXT",
    defaultValue: "'USD'",
  },
  { table: "menu_items", column: "image_url", type: "TEXT" },
  {
    table: "menu_items",
    column: "is_featured",
    type: "INTEGER",
    defaultValue: "0",
  },

  // faqs table
  { table: "faqs", column: "is_active", type: "INTEGER", defaultValue: "1" },
  {
    table: "faqs",
    column: "display_order",
    type: "INTEGER",
    defaultValue: "0",
  },

  // branches table
  {
    table: "branches",
    column: "is_active",
    type: "INTEGER",
    defaultValue: "1",
  },
];

async function runMigration() {
  console.log("🚀 Adding missing columns to existing tables...\n");

  const db = getDb();

  for (const { table, column, type, defaultValue } of columnsToAdd) {
    try {
      // Check if column already exists
      const tableInfo = await db.execute(`PRAGMA table_info(${table})`);
      const hasColumn = tableInfo.rows.some((row: any) => row.name === column);

      if (hasColumn) {
        console.log(`  ⏭️  ${table}.${column}: already exists`);
        continue;
      }

      // Add the column with default value
      const defaultClause = defaultValue ? ` DEFAULT ${defaultValue}` : "";
      await db.execute(
        `ALTER TABLE ${table} ADD COLUMN ${column} ${type}${defaultClause}`
      );
      console.log(`  ✅ ${table}.${column}: Added`);

      // Update existing rows to have the default value
      if (defaultValue) {
        await db.execute(
          `UPDATE ${table} SET ${column} = ${defaultValue} WHERE ${column} IS NULL`
        );
      }
    } catch (error: any) {
      console.error(`  ❌ ${table}.${column}: ${error.message}`);
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
