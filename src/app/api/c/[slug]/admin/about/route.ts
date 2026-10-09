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
    },
    seo: {
      seo_title_ar: settings?.seo_title_ar || "",
      seo_title_en: settings?.seo_title_en || "",
      seo_description_ar: settings?.seo_description_ar || "",
      seo_description_en: settings?.seo_description_en || "",
      seo_keywords: settings?.seo_keywords || "",
    },
  });
}

// PUT: Update about/SEO settings (Arabic and English only; French and custom JSON-LD are no longer edited)
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
      seo_title_ar,
      seo_title_en,
      seo_description_ar,
      seo_description_en,
      seo_keywords,
    } = body;

    const db = getDb();

    await db.execute({
      sql: `
        UPDATE catalog_settings SET
          about_content_ar = COALESCE(?, about_content_ar),
          about_content_en = COALESCE(?, about_content_en),
          seo_title_ar = COALESCE(?, seo_title_ar),
          seo_title_en = COALESCE(?, seo_title_en),
          seo_description_ar = COALESCE(?, seo_description_ar),
          seo_description_en = COALESCE(?, seo_description_en),
          seo_keywords = COALESCE(?, seo_keywords),
          updated_at = datetime('now')
        WHERE catalog_id = ?
      `,
      args: [
        about_content_ar,
        about_content_en,
        seo_title_ar,
        seo_title_en,
        seo_description_ar,
        seo_description_en,
        seo_keywords,
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

