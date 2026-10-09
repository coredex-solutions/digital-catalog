import { NextRequest, NextResponse } from "next/server";
import { requireCatalogAdmin } from "@/lib/auth/catalog-admin-middleware";
import { getCatalogBySlug } from "@/lib/catalog/queries";
import { signMenuPreviewToken } from "@/lib/auth/jwt";

// GET: a 30-minute link that shows the guest menu with unpublished changes. A read, so viewers
// and owners whose plan has expired can preview too.
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const catalog = await getCatalogBySlug(slug);
  if (!catalog) return NextResponse.json({ error: "Catalog not found" }, { status: 404 });

  const auth = await requireCatalogAdmin(request, catalog.id, { allowExpired: true });
  if (!auth.success) return auth.response;

  const token = signMenuPreviewToken(catalog.id);
  return NextResponse.json({ url: `/c/${slug}/preview/?token=${encodeURIComponent(token)}` });
}
