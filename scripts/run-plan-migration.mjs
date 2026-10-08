import { getDb } from "../lib/db/client.js";
import fs from "fs";
import path from "path";

async function main() {
    const db = getDb();
    const migrationPath = path.join(process.cwd(), "lib", "db", "migrations", "20260130_add_plan_requests.sql");
    const sql = fs.readFileSync(migrationPath, "utf-8");

    const statements = sql.split(";").map(s => s.trim()).filter(s => s.length > 0);

    console.log(`Running ${statements.length} migration statements...`);

    for (const statement of statements) {
        try {
            await db.execute(statement);
            console.log("Executed successfully:", statement.substring(0, 50) + "...");
        } catch (error) {
            if (error.message.includes("duplicate column name") || error.message.includes("already exists")) {
                console.log("Skipping (already exists):", statement.substring(0, 50) + "...");
            } else {
                console.error("Migration error:", error);
            }
        }
    }

    console.log("Migration complete.");
}

main().catch(console.error);
