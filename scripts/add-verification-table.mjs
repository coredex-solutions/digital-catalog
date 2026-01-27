import { getDb } from "./lib/db/client.js";

async function main() {
    const db = getDb();
    await db.execute(`
        CREATE TABLE IF NOT EXISTS verification_codes (
            id TEXT PRIMARY KEY,
            email TEXT NOT NULL,
            code TEXT NOT NULL,
            expires_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    console.log("verification_codes table created.");
}

main().catch(console.error);
