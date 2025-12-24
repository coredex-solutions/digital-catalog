import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/super-admin-middleware";
import { getDb } from "@/lib/db/client";
import { v4 as uuidv4 } from "uuid";
import type { BusinessType, SubscriptionType } from "@/lib/db/types";
import { sendEmail, emailTemplates } from "@/lib/email/send";

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
      multi_language_enabled = false,
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

    // Calculate subscription dates
    const startsAt = new Date().toISOString();
    let expiresAt: string | null = null;

    if (subscription_type === "yearly") {
      const expires = new Date();
      expires.setFullYear(expires.getFullYear() + 1);
      expiresAt = expires.toISOString();
    } else if (subscription_type === "custom_years" && custom_years) {
      const expires = new Date();
      expires.setFullYear(expires.getFullYear() + custom_years);
      expiresAt = expires.toISOString();
    }
    // 'forever' = no expiration (null)

    // Create subscription
    const subscriptionId = uuidv4();
    await db.execute({
      sql: `
        INSERT INTO catalog_subscriptions (
          id, catalog_id, subscription_type, custom_years, starts_at, expires_at,
          multi_language_enabled, booking_enabled, analytics_enabled,
          amount_paid, currency, payment_method, payment_notes, is_active, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
      `,
      args: [
        subscriptionId,
        catalogId,
        subscription_type as SubscriptionType,
        custom_years || null,
        startsAt,
        expiresAt,
        multi_language_enabled ? 1 : 0,
        booking_enabled ? 1 : 0,
        analytics_enabled ? 1 : 0,
        amount_paid || null,
        currency,
        payment_method || null,
        payment_notes || null,
      ],
    });

    // Create default settings
    await db.execute({
      sql: `
        INSERT INTO catalog_settings (catalog_id, updated_at)
        VALUES (?, datetime('now'))
      `,
      args: [catalogId],
    });

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
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || "https://your-domain.com";
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

    // Initialize default operating hours
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    for (const day of days) {
      await db.execute({
        sql: `
          INSERT INTO operating_hours (catalog_id, day_name, open_hour, close_hour, is_closed, updated_at)
          VALUES (?, ?, 9, 22, 0, datetime('now'))
        `,
        args: [catalogId, day],
      });
    }

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

    // Apply seed template based on business type
    const { getSeedTemplate } = await import("@/lib/seed/templates");
    const template = getSeedTemplate(business_type as BusinessType);

    let categoryOrder = 0;
    for (const category of template) {
      const categoryId = uuidv4();
      await db.execute({
        sql: `
          INSERT INTO categories (id, catalog_id, name_ar, name_en, name_fr, icon_name, display_order, is_active, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
        `,
        args: [
          categoryId,
          catalogId,
          category.name_ar,
          category.name_en,
          category.name_fr,
          category.icon_name,
          categoryOrder++,
        ],
      });

      let itemOrder = 0;
      for (const item of category.items) {
        await db.execute({
          sql: `
            INSERT INTO menu_items (id, catalog_id, category_id, name_ar, name_en, name_fr, description_en, price, currency, display_order, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'USD', ?, 1, datetime('now'), datetime('now'))
          `,
          args: [
            uuidv4(),
            catalogId,
            categoryId,
            item.name_ar,
            item.name_en,
            item.name_fr,
            item.description_en || null,
            item.price,
            itemOrder++,
          ],
        });
      }
    }

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
