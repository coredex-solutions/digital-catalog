import { NextRequest, NextResponse } from "next/server";
import { requireCatalogAdmin } from "@/lib/auth/catalog-admin-middleware";
import { getCatalogBySlug } from "@/lib/catalog/queries";
import { diffMenus, getLiveMenu, getPublishedVersion, listVersions, publishMenu } from "@/lib/catalog/publishing";

// GET: what changed since the last publish, plus the version history
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const catalog = await getCatalogBySlug(slug);
  if (!catalog) return NextResponse.json({ error: "Catalog not found" }, { status: 404 });

  const auth = await requireCatalogAdmin(request, catalog.id);
  if (!auth.success) return auth.response;

  try {
    const [live, published, versions] = await Promise.all([
      getLiveMenu(catalog.id),
      getPublishedVersion(catalog.id),
      listVersions(catalog.id),
    ]);
    const changes = diffMenus(live, published?.data ?? null);
    return NextResponse.json({
      // Never published (older catalogs): guests see the live menu, so nothing is pending
      everPublished: !!published,
      hasUnpublishedChanges: !!published && changes.length > 0,
      changes: published ? changes : [],
      current: published
        ? { id: published.id, version: published.version, note: published.note, published_by: published.published_by, published_at: published.published_at }
        : null,
      versions,
    });
  } catch (error) {
    console.error("Publish status error:", error);
    return NextResponse.json({ error: "Could not load publishing status" }, { status: 500 });
  }
}

// POST: publish the current draft { note? }
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const catalog = await getCatalogBySlug(slug);
  if (!catalog) return NextResponse.json({ error: "Catalog not found" }, { status: 404 });

  const auth = await requireCatalogAdmin(request, catalog.id);
  if (!auth.success) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const note = typeof body?.note === "string" ? body.note : null;
    const version = await publishMenu(catalog.id, auth.admin.email, note);
    return NextResponse.json({ success: true, version: version?.version ?? null });
  } catch (error) {
    console.error("Publish error:", error);
    return NextResponse.json({ error: "Could not publish. Please try again." }, { status: 500 });
  }
}
