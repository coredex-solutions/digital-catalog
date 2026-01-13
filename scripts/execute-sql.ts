import { config } from "dotenv";
config();
import { getDb } from "../lib/db/client";
import * as fs from "fs";
import * as path from "path";

async function run() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Please provide a SQL file path");
    process.exit(1);
  }

  const db = getDb();
  const sql = fs.readFileSync(path.resolve(filePath), "utf8").replace(/^\uFEFF/, "");
  
  // Split by semicolon for multiple statements
  const statements = sql.split(";").map(s => s.trim()).filter(s => s.length > 0);
  
  for (const statement of statements) {
    console.log("Executing:", statement.substring(0, 50) + "...");
    try {
      const res = await db.execute(statement);
      console.log("✅ Success");
      if (res.rows && res.rows.length > 0) {
        console.table(res.rows);
      }
    } catch (error: any) {
      console.error("❌ Error:", error.message);
    }
  }
}

run();
