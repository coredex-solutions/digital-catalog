// Runs one SQL migration file from lib/db/migrations against TURSO_DATABASE_URL.
// Usage: npx tsx scripts/run-migration.ts 20261008_menu_redesign.sql
import { getDb } from "../lib/db/client";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

async function main() {
    const fileName = process.argv[2];
    if (!fileName) {
        throw new Error("Pass a migration file name, e.g. 20261008_menu_redesign.sql");
    }

    const db = getDb();
    const migrationPath = path.join(process.cwd(), "lib", "db", "migrations", fileName);
    const sql = fs.readFileSync(migrationPath, "utf-8");

    const statements = sql.split(";").map(s => s.trim()).filter(s => s.length > 0);

    console.log(`Running ${statements.length} migration statements from ${fileName}...`);

    for (const statement of statements) {
        try {
            await db.execute(statement);
            console.log("Executed successfully:", statement.substring(0, 60).replace(/\s+/g, " ") + "...");
        } catch (error: any) {
            // Re-running a migration is safe: existing columns/tables are skipped
            if (error.message?.includes("duplicate column name") || error.message?.includes("already exists")) {
                console.log("Skipping (already exists):", statement.substring(0, 60).replace(/\s+/g, " ") + "...");
            } else {
                throw error;
            }
        }
    }

    console.log("Migration complete.");
}

main().catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
});
