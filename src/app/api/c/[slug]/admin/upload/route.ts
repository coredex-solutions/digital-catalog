import { NextRequest, NextResponse } from "next/server";
import { requireCatalogAdmin } from "@/lib/auth/catalog-admin-middleware";
import { getCatalogBySlug } from "@/lib/catalog/queries";
import { getDb } from "@/lib/db/client";
import { uploadBufferToR2, deleteFromR2 } from "@/lib/r2/upload";
import { withRateLimit, RATE_LIMITS } from "@/lib/rate-limit/middleware";

const MAX_IMAGES_PER_CATALOG = 500;
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

async function uploadHandler(
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
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF" },
        { status: 400 }
      );
    }

    // Validate file size (2MB limit)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 2MB" },
        { status: 400 }
      );
    }

    const db = getDb();

    // Check current image count
    const countResult = await db.execute({
      sql: "SELECT current_image_count FROM catalogs WHERE id = ?",
      args: [catalog.id],
    });

    const currentCount = Number(countResult.rows[0]?.current_image_count || 0);

    if (currentCount >= MAX_IMAGES_PER_CATALOG) {
      return NextResponse.json(
        {
          error: `Image limit reached. Maximum ${MAX_IMAGES_PER_CATALOG} images per catalog.`,
          current: currentCount,
          max: MAX_IMAGES_PER_CATALOG,
        },
        { status: 403 }
      );
    }

    // Upload to R2
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.type.split("/")[1] || "jpg";
    const filename = `${catalog.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

    const url = await uploadBufferToR2(buffer, filename, file.type);

    // Increment image count
    await db.execute({
      sql: "UPDATE catalogs SET current_image_count = current_image_count + 1 WHERE id = ?",
      args: [catalog.id],
    });

    return NextResponse.json({
      success: true,
      url,
      remaining: MAX_IMAGES_PER_CATALOG - currentCount - 1,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  return withRateLimit(
    request,
    () => uploadHandler(request, context),
    RATE_LIMITS.upload
  );
}

// DELETE: Remove an image and decrement count
export async function DELETE(
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
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Verify the URL belongs to this catalog (starts with catalog.id/)
    const urlPath = new URL(url).pathname;
    if (!urlPath.includes(catalog.id)) {
      return NextResponse.json(
        { error: "Image does not belong to this catalog" },
        { status: 403 }
      );
    }

    // Delete from R2
    await deleteFromR2(url);

    // Decrement image count
    const db = getDb();
    await db.execute({
      sql: "UPDATE catalogs SET current_image_count = MAX(0, current_image_count - 1) WHERE id = ?",
      args: [catalog.id],
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete image error:", error);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    );
  }
}

