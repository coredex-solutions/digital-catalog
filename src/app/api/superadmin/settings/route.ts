import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/super-admin-middleware";
import { getDb } from "@/lib/db/client";

// Default platform settings
const DEFAULT_SETTINGS = {
  platform_name: "Digital Menu Platform",
  platform_email: "admin@platform.com",
  support_email: "support@platform.com",
  default_language: "en",
  maintenance_mode: false,
  registration_enabled: true,
  trial_days: 14,
  max_categories_free: 3,
  max_items_free: 15,
  smtp_host: "",
  smtp_port: 587,
  smtp_user: "",
};

// GET: Get platform settings
export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (!auth.success) return auth.response;

  try {
    const db = getDb();
    
    // Try to get settings from database
    const result = await db.execute({
      sql: "SELECT * FROM platform_settings WHERE id = 1",
      args: [],
    });

    if (result.rows.length > 0) {
      const row = result.rows[0] as any;
      return NextResponse.json({
        settings: {
          platform_name: row.platform_name || DEFAULT_SETTINGS.platform_name,
          platform_email: row.platform_email || DEFAULT_SETTINGS.platform_email,
          support_email: row.support_email || DEFAULT_SETTINGS.support_email,
          default_language: row.default_language || DEFAULT_SETTINGS.default_language,
          maintenance_mode: Boolean(row.maintenance_mode),
          registration_enabled: row.registration_enabled !== 0,
          trial_days: row.trial_days || DEFAULT_SETTINGS.trial_days,
          max_categories_free: row.max_categories_free || DEFAULT_SETTINGS.max_categories_free,
          max_items_free: row.max_items_free || DEFAULT_SETTINGS.max_items_free,
          smtp_host: row.smtp_host || "",
          smtp_port: row.smtp_port || 587,
          smtp_user: row.smtp_user || "",
        },
      });
    }

    // Return defaults if no settings table exists
    return NextResponse.json({ settings: DEFAULT_SETTINGS });
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    // Return defaults on error (table might not exist)
    return NextResponse.json({ settings: DEFAULT_SETTINGS });
  }
}

// PUT: Update platform settings
export async function PUT(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (!auth.success) return auth.response;

  try {
    const settings = await request.json();
    const db = getDb();

    // Try to create table if not exists
    await db.execute(`
      CREATE TABLE IF NOT EXISTS platform_settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        platform_name TEXT,
        platform_email TEXT,
        support_email TEXT,
        default_language TEXT DEFAULT 'en',
        maintenance_mode INTEGER DEFAULT 0,
        registration_enabled INTEGER DEFAULT 1,
        trial_days INTEGER DEFAULT 14,
        max_categories_free INTEGER DEFAULT 3,
        max_items_free INTEGER DEFAULT 15,
        smtp_host TEXT,
        smtp_port INTEGER DEFAULT 587,
        smtp_user TEXT,
        updated_at TEXT
      )
    `);

    // Check if row exists
    const existing = await db.execute({
      sql: "SELECT id FROM platform_settings WHERE id = 1",
      args: [],
    });

    if (existing.rows.length > 0) {
      // Update existing
      await db.execute({
        sql: `
          UPDATE platform_settings SET
            platform_name = ?,
            platform_email = ?,
            support_email = ?,
            default_language = ?,
            maintenance_mode = ?,
            registration_enabled = ?,
            trial_days = ?,
            max_categories_free = ?,
            max_items_free = ?,
            smtp_host = ?,
            smtp_port = ?,
            smtp_user = ?,
            updated_at = datetime('now')
          WHERE id = 1
        `,
        args: [
          settings.platform_name,
          settings.platform_email,
          settings.support_email,
          settings.default_language,
          settings.maintenance_mode ? 1 : 0,
          settings.registration_enabled ? 1 : 0,
          settings.trial_days,
          settings.max_categories_free,
          settings.max_items_free,
          settings.smtp_host,
          settings.smtp_port,
          settings.smtp_user,
        ],
      });
    } else {
      // Insert new
      await db.execute({
        sql: `
          INSERT INTO platform_settings (
            id, platform_name, platform_email, support_email, default_language,
            maintenance_mode, registration_enabled, trial_days,
            max_categories_free, max_items_free, smtp_host, smtp_port, smtp_user,
            updated_at
          ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `,
        args: [
          settings.platform_name,
          settings.platform_email,
          settings.support_email,
          settings.default_language,
          settings.maintenance_mode ? 1 : 0,
          settings.registration_enabled ? 1 : 0,
          settings.trial_days,
          settings.max_categories_free,
          settings.max_items_free,
          settings.smtp_host,
          settings.smtp_port,
          settings.smtp_user,
        ],
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to update settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
