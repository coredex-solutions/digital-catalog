import { config } from "dotenv";
config();
import { getDb } from "../lib/db/client";

async function run() {
  const db = getDb();
  
  const statements = [
    `CREATE TABLE IF NOT EXISTS catalog_ai_training_queue (
      id TEXT PRIMARY KEY,
      catalog_id TEXT NOT NULL REFERENCES catalogs(id) ON DELETE CASCADE,
      question_en TEXT NOT NULL,
      question_ar TEXT NOT NULL,
      category TEXT DEFAULT 'menu',
      priority INTEGER DEFAULT 3,
      context TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `ALTER TABLE catalog_settings ADD COLUMN ai_waiter_enabled INTEGER DEFAULT 0;`
  ];
  
  for (const statement of statements) {
    try {
      await db.execute(statement);
      console.log("✅ Success");
    } catch (error: any) {
      if (error.message.includes("duplicate column name")) {
        console.log("⏭️ Skipped (column exists)");
      } else {
        console.error("❌ Error:", error.message);
      }
    }
  }
}

run();
