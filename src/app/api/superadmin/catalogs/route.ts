import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/super-admin-middleware";
import { getDb } from "@/lib/db/client";
import { v4 as uuidv4 } from "uuid";
import type { BusinessType, SubscriptionType } from "@/lib/db/types";
import { sendEmail, emailTemplates } from "@/lib/email/send";
import { getPlanForSubscriptionType, getSubscriptionExpiry, isSubscriptionType } from "@/lib/plans";
import { getBaseUrl } from "@/lib/utils/base-url";
import { initialVersionStatement } from "@/lib/catalog/publishing";

// GET: List all catalogs with stats
export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (!auth.success) return auth.response;

  const db = getDb();

  // Get all catalogs with subscription and stats
  const result = await db.execute(`
    SELECT 
      c.*,
      cs.subscription_type,
      cs.starts_at,
      cs.expires_at,
      cs.is_active as subscription_active,
      cs.multi_language_enabled,
      cs.booking_enabled,
      cs.analytics_enabled,
      (SELECT COUNT(*) FROM catalog_admins WHERE catalog_id = c.id) as admin_count,
      (SELECT COUNT(*) FROM categories WHERE catalog_id = c.id) as category_count,
      (SELECT COUNT(*) FROM menu_items WHERE catalog_id = c.id) as item_count,
      (SELECT SUM(page_views) FROM catalog_analytics WHERE catalog_id = c.id) as total_views
    FROM catalogs c
    LEFT JOIN catalog_subscriptions cs ON cs.catalog_id = c.id
    ORDER BY c.created_at DESC
  `);

  return NextResponse.json({
    catalogs: result.rows,
  });
}

// POST: Create a new catalog
export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (!auth.success) return auth.response;

  try {
    const body = await request.json();
    const {
      slug,
      name,
      business_type = "restaurant",
      description,
      // Subscription details
      subscription_type = "yearly",
      custom_years,
      amount_paid,
      currency = "USD",
      payment_method,
      payment_notes,
      // Features
      booking_enabled = true,
      analytics_enabled = true,
      // Admin details
      admin_email,
      admin_password,
      admin_name,
    } = body;

    // Validate required fields
    if (!slug || !name) {
      return NextResponse.json(
        { error: "Slug and name are required" },
        { status: 400 }
      );
    }

    // Validate slug format (lowercase, alphanumeric, hyphens)
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(slug)) {
      return NextResponse.json(
        { error: "Slug must be lowercase, alphanumeric, with hyphens only" },
        { status: 400 }
      );
    }

    if (!isSubscriptionType(subscription_type)) {
      return NextResponse.json(
        { error: "Unknown subscription type" },
        { status: 400 }
      );
    }
    if (subscription_type === "custom_years" && !(Number.isInteger(Number(custom_years)) && Number(custom_years) >= 1)) {
      return NextResponse.json(
        { error: "Custom years must be a whole number of 1 or more" },
        { status: 400 }
      );
    }
    // Limits come from the plan; legacy duration types get Essential's
    const plan = getPlanForSubscriptionType(subscription_type);

    const db = getDb();

    // Check if slug already exists
    const existing = await db.execute({
      sql: "SELECT id FROM catalogs WHERE slug = ?",
      args: [slug],
    });

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "A catalog with this slug already exists" },
        { status: 409 }
      );
    }

    // Create catalog
    const catalogId = uuidv4();
    await db.execute({
      sql: `
        INSERT INTO catalogs (id, slug, name, business_type, description, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
      `,
      args: [
        catalogId,
        slug,
        name,
        business_type as BusinessType,
        description || null,
      ],
    });

    // Calculate subscription dates ('forever' = no expiration)
    const startsAt = new Date().toISOString();
    const expiresAt = getSubscriptionExpiry(subscription_type as SubscriptionType, custom_years);

    // Create subscription
    const subscriptionId = uuidv4();
    await db.execute({
      sql: `
        INSERT INTO catalog_subscriptions (
          id, catalog_id, subscription_type, custom_years, starts_at, expires_at,
          multi_language_enabled, booking_enabled, analytics_enabled,
          max_items, max_categories, ai_image_enhancement_limit,
          amount_paid, currency, payment_method, payment_notes, is_active, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
      `,
      args: [
        subscriptionId,
        catalogId,
        subscription_type as SubscriptionType,
        custom_years || null,
        startsAt,
        expiresAt,
        1, // multi_language_enabled: every plan has Arabic and English
        booking_enabled ? 1 : 0,
        analytics_enabled ? 1 : 0,
        plan.limits.max_items,
        plan.limits.max_categories,
        plan.limits.ai_image_enhancement_limit,
        amount_paid || null,
        currency,
        payment_method || null,
        payment_notes || null,
      ],
    });

    // Create default settings
    await db.execute({
      sql: `
        INSERT INTO catalog_settings (catalog_id, enabled_languages, updated_at)
        VALUES (?, 'ar,en', datetime('now'))
      `,
      args: [catalogId],
    });

    // Start in draft mode: nothing is public until the owner publishes
    await db.execute(initialVersionStatement(catalogId));

    // Create default contact
    await db.execute({
      sql: `
        INSERT INTO catalog_contact (catalog_id, updated_at)
        VALUES (?, datetime('now'))
      `,
      args: [catalogId],
    });

    // Create admin if provided
    let adminId: string | null = null;
    if (admin_email && admin_password && admin_name) {
      const { hashPassword } = await import("@/lib/auth/password");
      adminId = uuidv4();
      const passwordHash = await hashPassword(admin_password);

      await db.execute({
        sql: `
          INSERT INTO catalog_admins (id, catalog_id, email, password_hash, name, role, is_active, created_at)
          VALUES (?, ?, ?, ?, ?, 'admin', 1, datetime('now'))
        `,
        args: [
          adminId,
          catalogId,
          admin_email.toLowerCase().trim(),
          passwordHash,
          admin_name,
        ],
      });

      // Send welcome email with credentials
      const baseUrl = getBaseUrl(request);
      const loginUrl = `${baseUrl}/c/${slug}/admin/login`;
      const catalogUrl = `${baseUrl}/c/${slug}`;

      const emailContent = emailTemplates.accountCreated(
        admin_name,
        name,
        admin_email.toLowerCase().trim(),
        admin_password,
        loginUrl,
        catalogUrl
      );

      // Send email asynchronously (don't block response)
      sendEmail({
        to: admin_email.toLowerCase().trim(),
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      }).then((result) => {
        if (result.success) {
          console.log(`✅ Welcome email sent to ${admin_email}`);
        } else {
          console.error(`❌ Failed to send welcome email: ${result.error}`);
        }
      });
    }

    // No default operating hours: the owner enters their own, and the menu shows no
    // open/closed badge until they do

    // Initialize default social media entries
    const platforms = ["instagram", "facebook", "twitter", "tiktok", "youtube"];
    for (const platform of platforms) {
      await db.execute({
        sql: `
          INSERT INTO social_media (id, catalog_id, platform, is_active, updated_at)
          VALUES (?, ?, ?, 0, datetime('now'))
        `,
        args: [uuidv4(), catalogId, platform],
      });
    }

    // No sample dishes: the menu starts empty so no invented prices go live

    return NextResponse.json(
      {
        success: true,
        catalog: {
          id: catalogId,
          slug,
          name,
          business_type,
        },
        subscription: {
          id: subscriptionId,
          type: subscription_type,
          starts_at: startsAt,
          expires_at: expiresAt,
        },
        admin: adminId
          ? { id: adminId, email: admin_email, name: admin_name }
          : null,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create catalog error:", error);
    return NextResponse.json(
      { error: "Failed to create catalog" },
      { status: 500 }
    );
  }
}
