import { NextRequest, NextResponse } from "next/server";
import { requireCatalogAdmin } from "@/lib/auth/catalog-admin-middleware";
import {
  getCatalogBySlug,
  getCatalogSettings,
  getCatalogContact,
  getCatalogSubscription,
} from "@/lib/catalog/queries";
import { getDb } from "@/lib/db/client";

// GET: Get all settings
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const catalog = await getCatalogBySlug(slug);
  if (!catalog) {
    return NextResponse.json({ error: "Catalog not found" }, { status: 404 });
  }

  const auth = await requireCatalogAdmin(request, catalog.id);
  if (!auth.success) return auth.response;

  const [settings, contact, subscription] = await Promise.all([
    getCatalogSettings(catalog.id),
    getCatalogContact(catalog.id),
    getCatalogSubscription(catalog.id),
  ]);

  return NextResponse.json({
    catalog: {
      id: catalog.id,
      slug: catalog.slug,
      name: catalog.name,
      description: catalog.description,
      logo_url: catalog.logo_url,
      business_type: catalog.business_type,
    },
    appearance: {
      hero_image_url: settings?.hero_image_url,
      bg_pattern_enabled: settings?.bg_pattern_enabled,
      bg_pattern_type: settings?.bg_pattern_type,
      color_primary: settings?.color_primary,
      color_secondary: settings?.color_secondary,
      color_accent: settings?.color_accent,
      color_background: settings?.color_background,
      color_surface: settings?.color_surface,
      color_text: settings?.color_text,
      color_text_muted: settings?.color_text_muted,
      color_background_dark: settings?.color_background_dark,
      color_surface_dark: settings?.color_surface_dark,
      color_text_dark: settings?.color_text_dark,
      color_text_muted_dark: settings?.color_text_muted_dark,
    },
    features: {
      booking_enabled: settings?.booking_enabled,
      whatsapp_order_enabled: settings?.whatsapp_order_enabled,
      live_chat_enabled: settings?.live_chat_enabled,
      ai_waiter_enabled: Boolean(settings?.ai_waiter_enabled),
      ai_waiter_name: settings?.ai_waiter_name,
      ai_waiter_persona: settings?.ai_waiter_persona,
    },
    cta: {
      cta_menu_label_en: settings?.cta_menu_label_en,
      cta_menu_label_ar: settings?.cta_menu_label_ar,
      cta_menu_label_fr: settings?.cta_menu_label_fr,
      cta_booking_label_en: settings?.cta_booking_label_en,
      cta_booking_label_ar: settings?.cta_booking_label_ar,
      cta_booking_label_fr: settings?.cta_booking_label_fr,
      cta_order_label_en: settings?.cta_order_label_en,
      cta_order_label_ar: settings?.cta_order_label_ar,
      cta_order_label_fr: settings?.cta_order_label_fr,
    },
    seo: {
      seo_title_en: settings?.seo_title_en,
      seo_title_ar: settings?.seo_title_ar,
      seo_title_fr: settings?.seo_title_fr,
      seo_description_en: settings?.seo_description_en,
      seo_description_ar: settings?.seo_description_ar,
      seo_description_fr: settings?.seo_description_fr,
      seo_keywords: settings?.seo_keywords,
      json_ld_custom: settings?.json_ld_custom,
    },
    about: {
      about_content_en: settings?.about_content_en,
      about_content_ar: settings?.about_content_ar,
      about_content_fr: settings?.about_content_fr,
    },
    contact: {
      phone_primary: contact?.phone_primary,
      phone_whatsapp: contact?.phone_whatsapp,
      email: contact?.email,
      address_en: contact?.address_en,
      address_ar: contact?.address_ar,
      address_fr: contact?.address_fr,
      city_en: contact?.city_en,
      city_ar: contact?.city_ar,
      city_fr: contact?.city_fr,
      google_map_iframe_url: contact?.google_map_iframe_url,
    },
  });
}

// PUT: Update settings
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const catalog = await getCatalogBySlug(slug);
  if (!catalog) {
    return NextResponse.json({ error: "Catalog not found" }, { status: 404 });
  }

  const auth = await requireCatalogAdmin(request, catalog.id);
  if (!auth.success) return auth.response;

  try {
    const body = await request.json();
    const { catalog: catalogData, appearance, features, cta, contact, seo, about } = body;

    const db = getDb();

    // Update catalog
    if (catalogData) {
      const catalogUpdates: string[] = [];
      const catalogArgs: any[] = [];

      if (catalogData.name !== undefined) {
        catalogUpdates.push("name = ?");
        catalogArgs.push(catalogData.name);
      }
      if (catalogData.description !== undefined) {
        catalogUpdates.push("description = ?");
        catalogArgs.push(catalogData.description);
      }
      if (catalogData.logo_url !== undefined) {
        catalogUpdates.push("logo_url = ?");
        catalogArgs.push(catalogData.logo_url);
      }

      if (catalogUpdates.length > 0) {
        catalogUpdates.push("updated_at = datetime('now')");
        catalogArgs.push(catalog.id);
        await db.execute({
          sql: `UPDATE catalogs SET ${catalogUpdates.join(", ")} WHERE id = ?`,
          args: catalogArgs,
        });
      }
    }

    // Update settings (appearance, features, cta)
    const settingsUpdates: string[] = [];
    const settingsArgs: any[] = [];

    const settingsFields = {
      ...(appearance || {}),
      ...(features || {}),
      ...(cta || {}),
      ...(seo || {}),
      ...(about || {}),
    };

    for (const [key, value] of Object.entries(settingsFields)) {
      if (value !== undefined) {
        settingsUpdates.push(`${key} = ?`);
        if (typeof value === "boolean") {
          settingsArgs.push(value ? 1 : 0);
        } else {
          settingsArgs.push(value);
        }
      }
    }

    if (settingsUpdates.length > 0) {
      settingsUpdates.push("updated_at = datetime('now')");
      settingsArgs.push(catalog.id);
      await db.execute({
        sql: `UPDATE catalog_settings SET ${settingsUpdates.join(
          ", "
        )} WHERE catalog_id = ?`,
        args: settingsArgs,
      });
    }

    // Update contact
    if (contact) {
      const contactUpdates: string[] = [];
      const contactArgs: any[] = [];

      for (const [key, value] of Object.entries(contact)) {
        if (value !== undefined) {
          contactUpdates.push(`${key} = ?`);
          contactArgs.push(value || null);
        }
      }

      if (contactUpdates.length > 0) {
        contactUpdates.push("updated_at = datetime('now')");
        contactArgs.push(catalog.id);
        await db.execute({
          sql: `UPDATE catalog_contact SET ${contactUpdates.join(
            ", "
          )} WHERE catalog_id = ?`,
          args: contactArgs,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Update settings error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
