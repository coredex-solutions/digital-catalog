import { NextRequest, NextResponse } from "next/server";
import { requireCatalogAdmin } from "@/lib/auth/catalog-admin-middleware";
import { getCatalogBySlug } from "@/lib/catalog/queries";
import { restoreVersion } from "@/lib/catalog/publishing";

// POST: put an older version back { versionId } — replaces the draft and publishes it again
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const catalog = await getCatalogBySlug(slug);
  if (!catalog) return NextResponse.json({ error: "Catalog not found" }, { status: 404 });

  const auth = await requireCatalogAdmin(request, catalog.id);
  if (!auth.success) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const versionId = typeof body?.versionId === "string" ? body.versionId : "";
    if (!versionId) return NextResponse.json({ error: "Choose a version to restore" }, { status: 400 });

    const restored = await restoreVersion(catalog.id, versionId, auth.admin.email);
    if (!restored) return NextResponse.json({ error: "Version not found" }, { status: 404 });
    return NextResponse.json({ success: true, version: restored.version });
  } catch (error) {
    console.error("Restore error:", error);
    return NextResponse.json({ error: "Could not restore this version. Nothing was changed." }, { status: 500 });
  }
}
