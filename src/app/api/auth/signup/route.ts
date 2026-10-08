import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { hashPassword } from "@/lib/auth/password";
import { v4 as uuidv4 } from "uuid";
import { CATALOG_THEMES, DEFAULT_THEME_ID } from "@/config/themes";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password, name, catalogName, catalogSlug, businessType, themeId, plan } = body;

        // 1. Basic Validation
        if (!email || !password || !name || !catalogName || !catalogSlug) {
            return NextResponse.json(
                { error: "Please fill in all required fields" },
                { status: 400 }
            );
        }

        // Login looks admins up by lowercased email, so store it the same way
        const normalizedEmail = String(email).toLowerCase().trim();

        const db = getDb();

        // 2. Check if slug is taken
        const existingCatalog = await db.execute({
            sql: "SELECT id FROM catalogs WHERE slug = ?",
            args: [catalogSlug.toLowerCase()],
        });

        if (existingCatalog.rows.length > 0) {
            return NextResponse.json(
                { error: "This URL is already taken. Please choose another one." },
                { status: 400 }
            );
        }

        // 3. Check if email is taken for this platform (optional, let's keep it simple)

        // 4. Generate IDs
        const catalogId = uuidv4();
        const adminId = uuidv4();
        const subId = uuidv4();
        const hashedPassword = await hashPassword(password);

        // 4.5 Plan Selection & Defaults
        const selectedPlan = (plan || "essential").toLowerCase();
        let maxItems = 200;
        let maxCategories = 20;
        let aiLimit = 5;
        let multiLang = 0;
        let analytics = 1;

        if (selectedPlan === "pro") {
            maxItems = 1000;
            maxCategories = 50;
            aiLimit = 20;
            multiLang = 1;
        } else if (selectedPlan === "enterprise") {
            maxItems = 10000;
            maxCategories = 200;
            aiLimit = 100;
            multiLang = 1;
        }

        // Find selected theme colors
        const selectedTheme = CATALOG_THEMES.find(t => t.id === themeId) || CATALOG_THEMES.find(t => t.id === DEFAULT_THEME_ID)!;

        // 5. Transactional-like inserts (SQLite in LibSQL/Turso supports batch/transaction)
        await db.batch([
            // A. Create Catalog
            {
                sql: `INSERT INTO catalogs (id, slug, name, business_type, created_at, updated_at) 
              VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
                args: [catalogId, catalogSlug.toLowerCase(), catalogName, businessType || "restaurant"],
            },
            // B. Create Admin
            {
                sql: `INSERT INTO catalog_admins (id, catalog_id, email, password_hash, name, created_at) 
              VALUES (?, ?, ?, ?, ?, datetime('now'))`,
                args: [adminId, catalogId, normalizedEmail, hashedPassword, name],
            },
            // C. Create Trial Subscription (Free for 2 days)
            {
                sql: `INSERT INTO catalog_subscriptions (
                id, catalog_id, subscription_type, starts_at, expires_at, 
                multi_language_enabled, booking_enabled, analytics_enabled, 
                custom_domain_enabled, ai_image_enhancement_limit, 
                max_items, max_categories, is_active
              ) VALUES (?, ?, ?, datetime('now'), datetime('now', '+2 days'), ?, 1, ?, 0, ?, ?, ?, 1)`,
                args: [subId, catalogId, selectedPlan, multiLang, analytics, aiLimit, maxItems, maxCategories],
            },
            // D. Initialize Settings with Theme Colors
            {
                sql: `INSERT INTO catalog_settings (
                    catalog_id, 
                    color_primary, color_secondary, color_accent, 
                    color_background, color_surface, color_text, color_text_muted,
                    color_background_dark, color_surface_dark, color_text_dark, color_text_muted_dark,
                    updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
                args: [
                    catalogId,
                    selectedTheme.light.primary, selectedTheme.light.secondary, selectedTheme.light.accent,
                    selectedTheme.light.background, selectedTheme.light.surface, selectedTheme.light.text, selectedTheme.light.textMuted,
                    selectedTheme.dark.background, selectedTheme.dark.surface, selectedTheme.dark.text, selectedTheme.dark.textMuted
                ],
            },
            // E. Initialize Contact
            {
                sql: `INSERT INTO catalog_contact (catalog_id, email, updated_at) VALUES (?, ?, datetime('now'))`,
                args: [catalogId, normalizedEmail],
            }
        ]);

        // 6. Initialize Operating Hours
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        for (const day of days) {
            await db.execute({
                sql: `INSERT INTO operating_hours (catalog_id, day_name, open_hour, close_hour, is_closed, updated_at)
                  VALUES (?, ?, 9, 22, 0, datetime('now'))`,
                args: [catalogId, day],
            });
        }

        // 7. Initialize Social Media
        const platforms = ["instagram", "facebook", "tiktok", "whatsapp"];
        for (const p of platforms) {
            await db.execute({
                sql: `INSERT INTO social_media (id, catalog_id, platform, is_active, updated_at)
                  VALUES (?, ?, ?, 0, datetime('now'))`,
                args: [uuidv4(), catalogId, p],
            });
        }

        // 8. Seed Template Data
        try {
            const { getSeedTemplate } = await import("@/lib/seed/templates");
            const template = getSeedTemplate(businessType as any);

            for (const category of template) {
                const categoryId = uuidv4();
                await db.execute({
                    sql: `INSERT INTO categories (id, catalog_id, name_ar, name_en, name_fr, icon_name, display_order, is_active, created_at, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, 0, 1, datetime('now'), datetime('now'))`,
                    args: [categoryId, catalogId, category.name_ar, category.name_en, category.name_fr, category.icon_name],
                });

                for (const item of category.items) {
                    await db.execute({
                        sql: `INSERT INTO menu_items (id, catalog_id, category_id, name_ar, name_en, name_fr, description_en, price, currency, display_order, is_active, created_at, updated_at)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'USD', 0, 1, datetime('now'), datetime('now'))`,
                        args: [uuidv4(), catalogId, categoryId, item.name_ar, item.name_en, item.name_fr, item.description_en || "", item.price],
                    });
                }
            }
        } catch (seedErr) {
            console.error("Non-fatal seeding error:", seedErr);
        }

        return NextResponse.json({
            success: true,
            message: "Catalog created successfully",
            slug: catalogSlug.toLowerCase()
        });

    } catch (error: any) {
        console.error("Signup error:", error);
        return NextResponse.json(
            { error: "Internal server error during registration" },
            { status: 500 }
        );
    }
}
