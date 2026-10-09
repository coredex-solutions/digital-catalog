import { createClient, Client } from "@libsql/client";

let dbInstance: Client | null = null;

function getDbConfig() {
  if (!process.env.TURSO_DATABASE_URL) {
    throw new Error("TURSO_DATABASE_URL is not set");
  }

  // Local SQLite files (file:local.db) need no token, which allows development without Turso
  const isLocalFile = process.env.TURSO_DATABASE_URL.startsWith("file:");
  if (!isLocalFile && !process.env.TURSO_AUTH_TOKEN) {
    throw new Error("TURSO_AUTH_TOKEN is not set");
  }

  return {
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  };
}

export function getDb(): Client {
  if (!dbInstance) {
    const config = getDbConfig();
    dbInstance = createClient({
      url: config.url,
      authToken: config.authToken,
    });
  }
  return dbInstance;
}

// Note: All code should use getDb() for proper lazy initialization
// The db export has been removed to prevent initialization at module load time
