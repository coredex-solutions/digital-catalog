import { NextRequest, NextResponse } from "next/server";
import { requireCatalogAdmin } from "@/lib/auth/catalog-admin-middleware";
import { getCatalogBySlug } from "@/lib/catalog/queries";
import { setWaitlistStatus, waitingCount, WAITLIST_STATUSES, type WaitlistStatus } from "@/lib/orders/waitlist";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

async function loadCatalog(request: NextRequest, slug: string, write: boolean) {
  const catalog = await getCatalogBySlug(slug);
  if (!catalog) return { error: NextResponse.json({ error: "Catalog not found" }, { status: 404 }) };
  const auth = await requireCatalogAdmin(request, catalog.id, { allowExpired: !write, allowViewer: !write });
  if (!auth.success) return { error: auth.response };
  return { catalog };
}

/** GET ?date=YYYY-MM-DD: how many people are still waiting for that day (the Orders page asks after a cancellation) */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const loaded = await loadCatalog(request, slug, false);
  if ("error" in loaded) return loaded.error;
  const date = new URL(request.url).searchParams.get("date") ?? "";
  if (!DATE.test(date)) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  return NextResponse.json({ date, waiting: await waitingCount(loaded.catalog.id, date) });
}

/** PATCH { id, status }: the team messaged someone (contacted), took them off (removed) or put them back (waiting) */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const loaded = await loadCatalog(request, slug, true);
  if ("error" in loaded) return loaded.error;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const status = body.status as WaitlistStatus;
  if (typeof body.id !== "string" || !(WAITLIST_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const entry = await setWaitlistStatus(loaded.catalog.id, body.id, status);
  if (!entry) return NextResponse.json({ error: "Not on the waiting list" }, { status: 404 });
  return NextResponse.json({ entry });
}
