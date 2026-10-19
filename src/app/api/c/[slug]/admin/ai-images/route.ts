import { after, NextRequest, NextResponse } from "next/server";
import { requireCatalogAdmin } from "@/lib/auth/catalog-admin-middleware";
import { getCatalogBySlug } from "@/lib/catalog/queries";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit/middleware";
import {
  IMAGE_STYLES,
  JobError,
  aiImagesConfigured,
  createJob,
  getCredits,
  listJobs,
  runJob,
  type ImageJobKind,
  type ImageStyle,
} from "@/lib/ai/image-jobs";

const STYLE_OPTIONS = Object.entries(IMAGE_STYLES).map(([id, style]) => ({ id, label: style.label }));

// GET ?item_id=: credits, available styles and this dish's recent AI image requests
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const catalog = await getCatalogBySlug(slug);
  if (!catalog) return NextResponse.json({ error: "Catalog not found" }, { status: 404 });

  const auth = await requireCatalogAdmin(request, catalog.id, { allowExpired: true });
  if (!auth.success) return auth.response;

  const itemId = request.nextUrl.searchParams.get("item_id");
  const [credits, jobs] = await Promise.all([getCredits(catalog.id), listJobs(catalog.id, itemId, itemId ? 5 : 20)]);
  return NextResponse.json({ configured: aiImagesConfigured(), credits, styles: STYLE_OPTIONS, jobs });
}

// POST { itemId, kind: 'enhance'|'illustrate', style, idempotencyKey }: start a job (one credit).
// Sending the same idempotencyKey again returns the same job without charging again.
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const catalog = await getCatalogBySlug(slug);
  if (!catalog) return NextResponse.json({ error: "Catalog not found" }, { status: 404 });

  const auth = await requireCatalogAdmin(request, catalog.id);
  if (!auth.success) return auth.response;

  if (!aiImagesConfigured()) {
    return NextResponse.json({ error: "AI photos aren't set up on this server yet." }, { status: 503 });
  }

  const limit = await checkRateLimit(request, RATE_LIMITS.aiGenerate, catalog.id);
  if (!limit.allowed) return rateLimitResponse(RATE_LIMITS.aiGenerate, limit.resetAt);

  const body = await request.json().catch(() => null);
  const itemId = typeof body?.itemId === "string" ? body.itemId : "";
  const kind = body?.kind as ImageJobKind;
  const style = body?.style as ImageStyle;
  const idempotencyKey = typeof body?.idempotencyKey === "string" ? body.idempotencyKey.slice(0, 100) : "";

  if (!itemId || !idempotencyKey) return NextResponse.json({ error: "itemId and idempotencyKey are required" }, { status: 400 });
  if (kind !== "enhance" && kind !== "illustrate") return NextResponse.json({ error: "Unknown kind" }, { status: 400 });
  if (!(style in IMAGE_STYLES)) return NextResponse.json({ error: "Unknown style" }, { status: 400 });

  try {
    const { job, created } = await createJob({ catalogId: catalog.id, itemId, kind, style, idempotencyKey, by: auth.admin.email });
    // Work continues after the response; a duplicate call can't run the same job twice
    if (job.status === "queued") after(() => runJob(catalog.id, job.id));
    return NextResponse.json({ job, created, credits: await getCredits(catalog.id) }, { status: created ? 202 : 200 });
  } catch (error) {
    if (error instanceof JobError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("AI image job error:", error);
    return NextResponse.json({ error: "Couldn't start the AI image. Please try again." }, { status: 500 });
  }
}
