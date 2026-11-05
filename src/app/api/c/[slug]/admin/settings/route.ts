import { NextRequest, NextResponse } from "next/server";
import { requireCatalogAdmin } from "@/lib/auth/catalog-admin-middleware";
import {
  getCatalogBySlug,
  getCatalogSettings,
  getCatalogContact,
  getCatalogSubscription,
} from "@/lib/catalog/queries";
import { getDb } from "@/lib/db/client";
import type { InValue } from "@libsql/client";
import { getModule, resolveOrderTypes } from "@/lib/modules/resolve";
import type { ModuleDefinition } from "@/lib/modules/registry";
import { parseDeliveryConfig } from "@/lib/orders/delivery";
import { parsePaymentConfig } from "@/lib/orders/payment";
import { parseBookingConfig } from "@/lib/orders/slots";
import { parseStayConfig } from "@/lib/orders/stays";
import { invalidMarketingFields, parseMarketingConfig } from "@/lib/marketing";

// Column names are interpolated into the UPDATE statements below, so only these
// known columns (the same ones GET returns) may ever be written. Only settings the
// guest menu actually reads are here: Arabic and English content (no French), the
// brand colour (no secondary/background/dark-mode colours or patterns), and the
// menu button label (the booking/order labels and live chat were never shown).
const SETTINGS_FIELDS = new Set([
  // appearance
  "hero_image_url", "color_primary",
  // features
  "booking_enabled", "whatsapp_order_enabled",
  "ai_waiter_enabled", "ai_waiter_name", "ai_waiter_persona",
  // cta
  "cta_menu_label_en", "cta_menu_label_ar",
  // seo
  "seo_title_en", "seo_title_ar",
  "seo_description_en", "seo_description_ar",
  "seo_keywords",
  // about
  "about_content_en", "about_content_ar",
  // pricing
  "currency_primary", "lbp_exchange_rate", "show_dual_currency",
  // ordering
  "order_types", "delivery_note_ar", "delivery_note_en", "delivery_config", "payment_config", "booking_config", "stay_config",
  // marketing (Meta Pixel, Google Analytics, review link)
  "marketing_config",
]);

/** Messages for marketing fields that were filled in but can't be used */
const MARKETING_ERRORS = {
  meta_pixel_id: "The Meta Pixel ID is a number of 8 to 20 digits",
  ga_id: "The Google Analytics ID starts with G-, for example G-AB12CD34EF",
  review_url: "The review link must be a full link starting with https://",
} as const;


/** Menus are offered in Arabic and English only; anything else (e.g. a legacy "fr") is dropped */
const MENU_LANGUAGES = ["ar", "en"] as const;
function sanitizeEnabledLanguages(value: unknown): string {
  const list = String(value || "").split(",").map((l) => l.trim());
  const kept = MENU_LANGUAGES.filter((l) => list.includes(l));
  return (kept.length ? kept : ["ar", "en"]).join(",");
}
function sanitizeDefaultLanguage(value: unknown, enabled: string): string {
  const lang = String(value || "");
  return (MENU_LANGUAGES as readonly string[]).includes(lang) && enabled.split(",").includes(lang)
    ? lang
    : enabled.split(",")[0];
}

type SettingsSection = Record<string, unknown> | null | undefined;

/** Validate pricing/ordering values before they reach the database */
function sanitizePricingAndOrdering(pricing: SettingsSection, ordering: SettingsSection, module: ModuleDefinition): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (pricing) {
    if (pricing.currency_primary !== undefined) {
      out.currency_primary = pricing.currency_primary === "LBP" ? "LBP" : "USD";
    }
    if (pricing.lbp_exchange_rate !== undefined) {
      // An empty rate clears it: prices are then shown only in the currency they were entered in
      const empty = pricing.lbp_exchange_rate === null || pricing.lbp_exchange_rate === "";
      const rate = Number(pricing.lbp_exchange_rate);
      if (empty) out.lbp_exchange_rate = null;
      else if (Number.isFinite(rate) && rate > 0 && rate < 10_000_000) out.lbp_exchange_rate = rate;
    }
    if (pricing.show_dual_currency !== undefined) out.show_dual_currency = Boolean(pricing.show_dual_currency);
  }
  if (ordering) {
    if (ordering.order_types !== undefined) {
      // Only the order types this catalog's module offers (a shop has no dine-in)
      out.order_types = resolveOrderTypes(module, String(ordering.order_types)).join(",");
    }
    if (ordering.delivery_note_ar !== undefined) out.delivery_note_ar = String(ordering.delivery_note_ar || "").slice(0, 300);
    if (ordering.delivery_note_en !== undefined) out.delivery_note_en = String(ordering.delivery_note_en || "").slice(0, 300);
    // Saved as cleaned JSON: areas need a name, amounts are numbers, Whish/OMT need a number
    if (ordering.delivery_config !== undefined) out.delivery_config = JSON.stringify(parseDeliveryConfig(ordering.delivery_config));
    if (ordering.payment_config !== undefined) out.payment_config = JSON.stringify(parsePaymentConfig(ordering.payment_config));
    if (ordering.booking_config !== undefined) out.booking_config = JSON.stringify(parseBookingConfig(ordering.booking_config));
    if (ordering.stay_config !== undefined) out.stay_config = JSON.stringify(parseStayConfig(ordering.stay_config));
  }
  return out;
}

const CONTACT_FIELDS = new Set([
  "phone_primary", "phone_whatsapp", "email",
  "address_en", "address_ar",
  "city_en", "city_ar",
  "google_map_iframe_url",
]);

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
  const enabledLanguages = sanitizeEnabledLanguages(settings?.enabled_languages);

  return NextResponse.json({
    catalog: {
      id: catalog.id,
      slug: catalog.slug,
      name: catalog.name,
      name_ar: catalog.name_ar,
      name_en: catalog.name_en,
      description: catalog.description,
      description_ar: catalog.description_ar,
      description_en: catalog.description_en,
      logo_url: catalog.logo_url,
      business_type: catalog.business_type,
    },
    subscription: {
      ai_image_enhancement_limit: subscription?.ai_image_enhancement_limit || 0,
    },
    appearance: {
      hero_image_url: settings?.hero_image_url,
      color_primary: settings?.color_primary,
    },
    feature_config: {
      enabled_languages: enabledLanguages,
      default_language: sanitizeDefaultLanguage(settings?.default_language, enabledLanguages),
    },
    features: {
      booking_enabled: settings?.booking_enabled,
      whatsapp_order_enabled: settings?.whatsapp_order_enabled,
      ai_waiter_enabled: Boolean(settings?.ai_waiter_enabled),
      ai_waiter_name: settings?.ai_waiter_name,
      ai_waiter_persona: settings?.ai_waiter_persona,
    },
    cta: {
      cta_menu_label_en: settings?.cta_menu_label_en,
      cta_menu_label_ar: settings?.cta_menu_label_ar,
    },
    seo: {
      seo_title_en: settings?.seo_title_en,
      seo_title_ar: settings?.seo_title_ar,
      seo_description_en: settings?.seo_description_en,
      seo_description_ar: settings?.seo_description_ar,
      seo_keywords: settings?.seo_keywords,
    },
    pricing: {
      currency_primary: settings?.currency_primary || "USD",
      lbp_exchange_rate: settings?.lbp_exchange_rate ?? null,
      lbp_rate_updated_at: settings?.lbp_rate_updated_at ?? null,
      show_dual_currency: Boolean(settings?.show_dual_currency ?? 0),
    },
    ordering: {
      order_types: resolveOrderTypes(getModule(catalog), settings?.order_types ?? null).join(","),
      delivery_note_ar: settings?.delivery_note_ar || "",
      delivery_note_en: settings?.delivery_note_en || "",
      delivery_config: parseDeliveryConfig((settings as unknown as Record<string, unknown> | null)?.delivery_config),
      payment_config: parsePaymentConfig((settings as unknown as Record<string, unknown> | null)?.payment_config),
      booking_config: parseBookingConfig((settings as unknown as Record<string, unknown> | null)?.booking_config),
      stay_config: parseStayConfig((settings as unknown as Record<string, unknown> | null)?.stay_config),
    },
    marketing: parseMarketingConfig((settings as unknown as Record<string, unknown> | null)?.marketing_config),
    about: {
      about_content_en: settings?.about_content_en,
      about_content_ar: settings?.about_content_ar,
    },
    contact: {
      phone_primary: contact?.phone_primary,
      phone_whatsapp: contact?.phone_whatsapp,
      email: contact?.email,
      address_en: contact?.address_en,
      address_ar: contact?.address_ar,
      city_en: contact?.city_en,
      city_ar: contact?.city_ar,
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

  const auth = await requireCatalogAdmin(request, catalog.id, { ownerOnly: true });
  if (!auth.success) return auth.response;

  try {
    const body = await request.json();
    const { catalog: catalogData, appearance, features, cta, contact, seo, about, pricing, ordering, marketing } = body;

    // Marketing: refuse a pixel ID, analytics ID or link that can't work, rather than quietly dropping it
    let marketingConfig: string | undefined;
    if (marketing && typeof marketing === "object") {
      const invalid = invalidMarketingFields(marketing);
      if (invalid.length > 0) {
        return NextResponse.json({ error: MARKETING_ERRORS[invalid[0]], field: invalid[0] }, { status: 422 });
      }
      marketingConfig = JSON.stringify(parseMarketingConfig(marketing));
    }

    const db = getDb();

    // Update catalog
    if (catalogData) {
      const catalogUpdates: string[] = [];
      const catalogArgs: InValue[] = [];

      if (catalogData.name !== undefined) {
        catalogUpdates.push("name = ?");
        catalogArgs.push(catalogData.name);
      }
      if (catalogData.description !== undefined) {
        catalogUpdates.push("description = ?");
        catalogArgs.push(catalogData.description);
      }
      if (catalogData.name_ar !== undefined) {
        catalogUpdates.push("name_ar = ?");
        catalogArgs.push(catalogData.name_ar);
      }
      if (catalogData.name_en !== undefined) {
        catalogUpdates.push("name_en = ?");
        catalogArgs.push(catalogData.name_en);
      }
      if (catalogData.description_ar !== undefined) {
        catalogUpdates.push("description_ar = ?");
        catalogArgs.push(catalogData.description_ar);
      }
      if (catalogData.description_en !== undefined) {
        catalogUpdates.push("description_en = ?");
        catalogArgs.push(catalogData.description_en);
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
    const settingsArgs: InValue[] = [];

    const pricingAndOrdering = sanitizePricingAndOrdering(pricing, ordering, getModule(catalog));
    const settingsFields = {
      ...(appearance || {}),
      ...(features || {}),
      ...(cta || {}),
      ...(seo || {}),
      ...(about || {}),
      ...pricingAndOrdering,
      ...(marketingConfig !== undefined ? { marketing_config: marketingConfig } : {}),
    };

    // Values are JSON body values, passed to the database as they are
    for (const [key, value] of Object.entries(settingsFields) as [string, InValue | undefined][]) {
      if (value !== undefined && SETTINGS_FIELDS.has(key)) {
        settingsUpdates.push(`${key} = ?`);
        if (typeof value === "boolean") {
          settingsArgs.push(value ? 1 : 0);
        } else {
          settingsArgs.push(value);
        }
        // Record when the rate actually changed (the CASE sees the row's old value)
        if (key === "lbp_exchange_rate") {
          settingsUpdates.push("lbp_rate_updated_at = CASE WHEN lbp_exchange_rate IS ? THEN lbp_rate_updated_at ELSE datetime('now') END");
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
      const contactArgs: InValue[] = [];

      for (const [key, value] of Object.entries(contact) as [string, InValue | undefined][]) {
        if (value !== undefined && CONTACT_FIELDS.has(key)) {
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

    // The cleaned delivery areas (with their new ids) and payment methods, so the form shows what was saved
    const saved: Record<string, unknown> = {};
    if (pricingAndOrdering.delivery_config !== undefined) saved.delivery_config = parseDeliveryConfig(pricingAndOrdering.delivery_config);
    if (pricingAndOrdering.payment_config !== undefined) saved.payment_config = parsePaymentConfig(pricingAndOrdering.payment_config);
    if (pricingAndOrdering.booking_config !== undefined) saved.booking_config = parseBookingConfig(pricingAndOrdering.booking_config);
    if (pricingAndOrdering.stay_config !== undefined) saved.stay_config = parseStayConfig(pricingAndOrdering.stay_config);
    return NextResponse.json({
      success: true,
      ...(Object.keys(saved).length > 0 ? { ordering: saved } : {}),
      ...(marketingConfig !== undefined ? { marketing: parseMarketingConfig(marketingConfig) } : {}),
    });
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
