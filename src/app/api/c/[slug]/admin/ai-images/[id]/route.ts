import { after, NextRequest, NextResponse } from "next/server";
import { requireCatalogAdmin } from "@/lib/auth/catalog-admin-middleware";
import { getCatalogBySlug } from "@/lib/catalog/queries";
import { JobError, decideJob, getCredits, getJob, runJob } from "@/lib/ai/image-jobs";

type Params = { params: Promise<{ slug: string; id: string }> };

// GET: one job's status (the editor polls this while it is queued or processing)
export async function GET(request: NextRequest, { params }: Params) {
  const { slug, id } = await params;
  const catalog = await getCatalogBySlug(slug);
  if (!catalog) return NextResponse.json({ error: "Catalog not found" }, { status: 404 });

  const auth = await requireCatalogAdmin(request, catalog.id, { allowExpired: true });
  if (!auth.success) return auth.response;

  const job = await getJob(catalog.id, id);
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ job, credits: await getCredits(catalog.id) });
}

// POST { action: 'approve' | 'discard' | 'retry' | 'revert' }
//   approve: the dish uses this image (guests see it after the next publish)
//   discard: keep the current photo; the credit stays used
//   retry:   run a failed request again (takes a credit; failures give it back)
//   revert:  switch the dish back to the photo it had before
export async function POST(request: NextRequest, { params }: Params) {
  const { slug, id } = await params;
  const catalog = await getCatalogBySlug(slug);
  if (!catalog) return NextResponse.json({ error: "Catalog not found" }, { status: 404 });

  const auth = await requireCatalogAdmin(request, catalog.id);
  if (!auth.success) return auth.response;

  const body = await request.json().catch(() => null);
  const action = body?.action;
  if (!["approve", "discard", "retry", "revert"].includes(action)) {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  try {
    const job = await decideJob(catalog.id, id, action, auth.admin.email);
    if (job?.status === "queued") after(() => runJob(catalog.id, job.id));
    return NextResponse.json({ job, credits: await getCredits(catalog.id) });
  } catch (error) {
    if (error instanceof JobError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("AI image decision error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
