import { NextRequest, NextResponse } from "next/server";
import type { InStatement } from "@libsql/client";
import { getDb } from "@/lib/db/client";
import { hashPassword } from "@/lib/auth/password";
import { verifyEmailVerificationToken } from "@/lib/auth/jwt";
import { withRateLimit, RATE_LIMITS } from "@/lib/rate-limit/middleware";
import { v4 as uuidv4 } from "uuid";
import { CATALOG_THEMES, DEFAULT_THEME_ID } from "@/config/themes";
import type { BusinessType } from "@/lib/db/types";
import { PLAN_CONFIG } from "@/lib/plans";
import { initialVersionStatement } from "@/lib/catalog/publishing";

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const BUSINESS_TYPES: BusinessType[] = ["restaurant", "retail", "cafe", "salon", "bakery", "pharmacy", "grocery", "other"];
// Any paid plan picked at signup is queued for approval; the account starts on the trial
const PAID_PLANS = ["essential", "pro", "enterprise"];
const MIN_PASSWORD_LENGTH = 8;

async function handler(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password, name, catalogName, catalogSlug, businessType, themeId, plan, verificationToken } = body;

        // 1. Basic Validation
        if (!email || !password || !name || !catalogName || !catalogSlug) {
            return NextResponse.json(
                { error: "Please fill in all required fields" },
                { status: 400 }
            );
        }

        // Login looks admins up by lowercased email, so store it the same way
        const normalizedEmail = String(email).toLowerCase().trim();

        // The email must have been confirmed through /api/auth/verify-code
        const verifiedEmail = typeof verificationToken === "string" ? verifyEmailVerificationToken(verificationToken) : null;
        if (!verifiedEmail || verifiedEmail !== normalizedEmail) {
            return NextResponse.json(
                { error: "Please verify your email address first." },
                { status: 400 }
            );
        }

        if (String(password).length < MIN_PASSWORD_LENGTH) {
            return NextResponse.json(
                { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
                { status: 400 }
            );
        }

        const slug = String(catalogSlug).toLowerCase().trim();
        if (slug.length < 3 || slug.length > 50 || !SLUG_REGEX.test(slug)) {
            return NextResponse.json(
                { error: "The URL must be 3-50 characters: lowercase letters, numbers and single hyphens." },
                { status: 400 }
            );
        }

        const resolvedBusinessType: BusinessType = BUSINESS_TYPES.includes(businessType) ? businessType : "restaurant";

        const db = getDb();

        // 2. Check if slug is taken
        const existingCatalog = await db.execute({
            sql: "SELECT id FROM catalogs WHERE slug = ?",
            args: [slug],
        });

        if (existingCatalog.rows.length > 0) {
            return NextResponse.json(
                { error: "This URL is already taken. Please choose another one." },
                { status: 400 }
            );
        }

        // 3. Generate IDs
        const catalogId = uuidv4();
        const adminId = uuidv4();
        const subId = uuidv4();
        const hashedPassword = await hashPassword(password);

        // 4. Plan Selection
        // Every trial runs on Essential limits; a paid plan picked at signup becomes a
        // pending upgrade request for a super admin to approve (see /api/superadmin/requests).
        const requestedPlan = String(plan || "essential").toLowerCase();
        const trial = PLAN_CONFIG.trial;
        const maxItems = trial.limits.max_items;
        const maxCategories = trial.limits.max_categories;
        const aiLimit = trial.limits.ai_image_enhancement_limit;
        const multiLang = trial.features.multi_language_enabled ? 1 : 0;
        const analytics = trial.features.analytics_enabled ? 1 : 0;

        // Find selected theme colors
        const selectedTheme = CATALOG_THEMES.find(t => t.id === themeId) || CATALOG_THEMES.find(t => t.id === DEFAULT_THEME_ID)!;

        // 5. Build every insert up front so the catalog is created atomically in one batch
        const statements: InStatement[] = [
            // A. Create Catalog
            {
                sql: `INSERT INTO catalogs (id, slug, name, business_type, created_at, updated_at)
              VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
                args: [catalogId, slug, catalogName, resolvedBusinessType],
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
              ) VALUES (?, ?, ?, datetime('now'), datetime('now', ?), ?, 1, ?, 0, ?, ?, ?, 1)`,
                args: [subId, catalogId, trial.id, `+${trial.durationDays} days`, multiLang, analytics, aiLimit, maxItems, maxCategories],
            },
            // D. Initialize Settings with Theme Colors (menus are Arabic and English; the column default still lists French)
            {
                sql: `INSERT INTO catalog_settings (
                    catalog_id, enabled_languages,
                    color_primary, color_secondary, color_accent,
                    color_background, color_surface, color_text, color_text_muted,
                    color_background_dark, color_surface_dark, color_text_dark, color_text_muted_dark,
                    updated_at
                ) VALUES (?, 'ar,en', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
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
            },
        ];

        // No opening hours or sample dishes are created: the menu must not show invented
        // prices or "Open now" before the owner has entered their own. The hours page
        // pre-fills a suggestion for the owner to confirm.

        // F. Initialize Social Media
        const platforms = ["instagram", "facebook", "tiktok", "whatsapp"];
        for (const p of platforms) {
            statements.push({
                sql: `INSERT INTO social_media (id, catalog_id, platform, is_active, updated_at)
                  VALUES (?, ?, ?, 0, datetime('now'))`,
                args: [uuidv4(), catalogId, p],
            });
        }

        // G. An empty published version: the menu starts in draft mode, so nothing the owner
        // adds is public until they preview and publish it
        statements.push(initialVersionStatement(catalogId));

        try {
            await db.batch(statements, "write");
        } catch (batchErr: any) {
            // Another signup claimed the slug between the check above and this insert
            if (String(batchErr?.message).includes("UNIQUE constraint failed: catalogs.slug")) {
                return NextResponse.json(
                    { error: "This URL is already taken. Please choose another one." },
                    { status: 400 }
                );
            }
            throw batchErr;
        }

        // 6. Queue the requested paid plan for approval (non-fatal: the trial works without it)
        if (PAID_PLANS.includes(requestedPlan)) {
            try {
                await db.execute({
                    sql: "INSERT INTO plan_requests (id, catalog_id, plan_name, status, created_at) VALUES (?, ?, ?, 'pending', datetime('now'))",
                    args: [uuidv4(), catalogId, requestedPlan],
                });
            } catch (requestErr) {
                console.error("Failed to queue plan request:", requestErr);
            }
        }

        return NextResponse.json({
            success: true,
            message: "Catalog created successfully",
            slug
        });

    } catch (error: any) {
        console.error("Signup error:", error);
        return NextResponse.json(
            { error: "Internal server error during registration" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    return withRateLimit(request, () => handler(request), RATE_LIMITS.register);
}
