import { NextRequest, NextResponse } from "next/server";
import { requireCatalogAdmin } from "@/lib/auth/catalog-admin-middleware";
import { getCatalogBySlug } from "@/lib/catalog/queries";
import { getDb } from "@/lib/db/client";
import { uploadBufferToR2, deleteFromR2 } from "@/lib/r2/upload";
import { getR2BucketName, getR2Client, getR2PublicUrl } from "@/lib/r2/client";
import { HeadObjectCommand } from "@aws-sdk/client-s3";
import { withRateLimit, RATE_LIMITS } from "@/lib/rate-limit/middleware";

// Used when a catalog row has no max_images set (matches the column default)
const DEFAULT_MAX_IMAGES = 500;
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

    // Check current image count against this catalog's own limit
    const countResult = await db.execute({
      sql: "SELECT current_image_count, max_images FROM catalogs WHERE id = ?",
      args: [catalog.id],
    });

    const currentCount = Number(countResult.rows[0]?.current_image_count || 0);
    const maxImages = Number(countResult.rows[0]?.max_images) || DEFAULT_MAX_IMAGES;

    if (currentCount >= maxImages) {
      return NextResponse.json(
        {
          error: `Image limit reached. Maximum ${maxImages} images per catalog.`,
          current: currentCount,
          max: maxImages,
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
      remaining: maxImages - currentCount - 1,
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

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Uploads are stored under "<catalog id>/", so only URLs under that prefix are this catalog's
    const prefix = `${getR2PublicUrl()}/${catalog.id}/`;
    const key = url.startsWith(prefix) ? `${catalog.id}/${url.slice(prefix.length)}` : null;
    if (!key || key.includes("..") || key.includes("?") || key.includes("#")) {
      return NextResponse.json(
        { error: "Image does not belong to this catalog" },
        { status: 403 }
      );
    }

    // R2 deletes succeed even for missing objects, so confirm it exists to keep the count honest
    try {
      await getR2Client().send(new HeadObjectCommand({ Bucket: getR2BucketName(), Key: key }));
    } catch (error: any) {
      if (error?.name === "NotFound" || error?.$metadata?.httpStatusCode === 404) {
        return NextResponse.json({ error: "Image not found" }, { status: 404 });
      }
      throw error;
    }

    // Delete from R2 (throws on failure, so the count is only lowered after a real delete)
    await deleteFromR2(url);

    // Decrement image count, never below zero
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

