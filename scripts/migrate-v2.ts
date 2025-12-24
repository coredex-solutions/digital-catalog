/**
 * Migration script to upgrade database to v2 multi-tenant schema
 * 
 * Run with: npx tsx scripts/migrate-v2.ts
 */

import { config } from "dotenv";
config(); // Load .env file

import { getDb } from "../lib/db/client";
import * as fs from "fs";
import * as path from "path";

async function runMigration() {
  console.log("🚀 Starting v2 multi-tenant migration...\n");

  const db = getDb();

  // Read the new schema
  const schemaPath = path.join(process.cwd(), "lib", "db", "schema-v2-multitenant.sql");
  const schema = fs.readFileSync(schemaPath, "utf-8");

  // Remove single-line comments
  const schemaWithoutComments = schema
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");

  // Split by semicolon and execute each statement
  const statements = schemaWithoutComments
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const statement of statements) {
    try {
      await db.execute(statement);
      successCount++;
      
      // Extract table/index name for logging
      const match = statement.match(/(?:CREATE\s+(?:TABLE|INDEX)\s+IF\s+NOT\s+EXISTS\s+)([^\s(]+)/i);
      if (match) {
        console.log(`  ✅ Created: ${match[1]}`);
      }
    } catch (error: any) {
      // Ignore "already exists" errors
      if (
        error.message?.includes("already exists") ||
        error.message?.includes("duplicate")
      ) {
        skipCount++;
        const match = statement.match(/(?:CREATE\s+(?:TABLE|INDEX)\s+IF\s+NOT\s+EXISTS\s+)([^\s(]+)/i);
        if (match) {
          console.log(`  ⏭️  Skipped (exists): ${match[1]}`);
        }
      } else {
        errorCount++;
        console.error(`  ❌ Error: ${error.message}`);
        console.error(`     Statement: ${statement.substring(0, 100)}...`);
      }
    }
  }

  console.log("\n📊 Migration Summary:");
  console.log(`   Created: ${successCount}`);
  console.log(`   Skipped: ${skipCount}`);
  console.log(`   Errors:  ${errorCount}`);

  if (errorCount === 0) {
    console.log("\n✅ Migration completed successfully!");
  } else {
    console.log("\n⚠️  Migration completed with errors. Please review above.");
  }
}

// Run migration
runMigration()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });

