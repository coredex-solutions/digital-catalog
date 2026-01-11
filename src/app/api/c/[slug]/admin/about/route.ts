import { NextRequest, NextResponse } from "next/server";
import { requireCatalogAdmin } from "@/lib/auth/catalog-admin-middleware";
import { getCatalogBySlug, getCatalogSettings } from "@/lib/catalog/queries";
import { getDb } from "@/lib/db/client";

// GET: Get about/SEO settings
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

  const settings = await getCatalogSettings(catalog.id);

  return NextResponse.json({
    catalog: {
      name: catalog.name,
      business_type: catalog.business_type,
    },
    about: {
      about_content_ar: settings?.about_content_ar || "",
      about_content_en: settings?.about_content_en || "",
      about_content_fr: settings?.about_content_fr || "",
    },
    seo: {
      seo_title_ar: settings?.seo_title_ar || "",
      seo_title_en: settings?.seo_title_en || "",
      seo_title_fr: settings?.seo_title_fr || "",
      seo_description_ar: settings?.seo_description_ar || "",
      seo_description_en: settings?.seo_description_en || "",
      seo_description_fr: settings?.seo_description_fr || "",
      seo_keywords: settings?.seo_keywords || "",
      json_ld_custom: settings?.json_ld_custom || "",
    },
  });
}

// PUT: Update about/SEO settings
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
    const {
      about_content_ar,
      about_content_en,
      about_content_fr,
      seo_title_ar,
      seo_title_en,
      seo_title_fr,
      seo_description_ar,
      seo_description_en,
      seo_description_fr,
      seo_keywords,
      json_ld_custom,
    } = body;

    // Validate JSON-LD if provided
    if (json_ld_custom) {
      try {
        JSON.parse(json_ld_custom);
      } catch {
        return NextResponse.json(
          { error: "Invalid JSON-LD format" },
          { status: 400 }
        );
      }
    }

    const db = getDb();

    await db.execute({
      sql: `
        UPDATE catalog_settings SET
          about_content_ar = COALESCE(?, about_content_ar),
          about_content_en = COALESCE(?, about_content_en),
          about_content_fr = COALESCE(?, about_content_fr),
          seo_title_ar = COALESCE(?, seo_title_ar),
          seo_title_en = COALESCE(?, seo_title_en),
          seo_title_fr = COALESCE(?, seo_title_fr),
          seo_description_ar = COALESCE(?, seo_description_ar),
          seo_description_en = COALESCE(?, seo_description_en),
          seo_description_fr = COALESCE(?, seo_description_fr),
          seo_keywords = COALESCE(?, seo_keywords),
          json_ld_custom = COALESCE(?, json_ld_custom),
          updated_at = datetime('now')
        WHERE catalog_id = ?
      `,
      args: [
        about_content_ar,
        about_content_en,
        about_content_fr,
        seo_title_ar,
        seo_title_en,
        seo_title_fr,
        seo_description_ar,
        seo_description_en,
        seo_description_fr,
        seo_keywords,
        json_ld_custom,
        catalog.id,
      ],
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Update about/SEO error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}

