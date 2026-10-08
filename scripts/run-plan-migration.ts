import { getDb } from "../lib/db/client";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

async function main() {
    const db = getDb();
    const migrationPath = path.join(process.cwd(), "lib", "db", "migrations", "20260130_add_plan_requests.sql");
    const sql = fs.readFileSync(migrationPath, "utf-8");

    // Split by custom logic to handle semicolons inside triggers if any (though currently simple)
    const statements = sql.split(";").map(s => s.trim()).filter(s => s.length > 0);

    console.log(`Running ${statements.length} migration statements...`);

    for (const statement of statements) {
        try {
            await db.execute(statement);
            console.log("Executed successfully:", statement.substring(0, 50) + "...");
        } catch (error: any) {
            console.error("Migration error detail:", error);
            if (error.message && (error.message.includes("duplicate column name") || error.message.includes("already exists"))) {
                console.log("Skipping (already exists):", statement.substring(0, 50) + "...");
            }
        }
    }

    console.log("Migration complete.");
}

main().catch(console.error);
