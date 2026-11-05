import { NextRequest, NextResponse } from "next/server";
import { requireCatalogAdmin } from "@/lib/auth/catalog-admin-middleware";
import { getCatalogBySlug } from "@/lib/catalog/queries";
import { hasPushSubscription, isAllowedEndpoint, parseSubscription, pushConfig, removePushSubscription, savePushSubscription } from "@/lib/push";

// New-order notifications for this device. Every team member decides for their own devices, so
// view-only members can turn them on too.
const OPTIONS = { allowExpired: true, allowViewer: true };

async function access(request: NextRequest, slug: string) {
  const catalog = await getCatalogBySlug(slug);
  if (!catalog) return { response: NextResponse.json({ error: "Catalog not found" }, { status: 404 }) };
  const auth = await requireCatalogAdmin(request, catalog.id, OPTIONS);
  if (!auth.success) return { response: auth.response };
  return { catalog, admin: auth.admin };
}

/** GET ?endpoint=…: whether push is set up on the server, its public key, and if this device follows the catalog */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await access(request, slug);
  if ("response" in result) return result.response;
  const config = pushConfig();
  const endpoint = request.nextUrl.searchParams.get("endpoint") || "";
  const subscribed = config && isAllowedEndpoint(endpoint) ? await hasPushSubscription(result.catalog.id, endpoint) : false;
  return NextResponse.json({ enabled: Boolean(config), publicKey: config?.publicKey ?? null, subscribed }, { headers: { "Cache-Control": "no-store" } });
}

/** POST { subscription, lang }: follow new orders on this device */
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await access(request, slug);
  if ("response" in result) return result.response;
  if (!pushConfig()) return NextResponse.json({ error: "Notifications are not set up on this server" }, { status: 503 });

  let body: { subscription?: unknown; lang?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const subscription = parseSubscription(body.subscription);
  if (!subscription) return NextResponse.json({ error: "This browser's notification details aren't valid" }, { status: 400 });
  await savePushSubscription(result.catalog.id, result.admin.id, subscription, body.lang === "ar" ? "ar" : "en");
  return NextResponse.json({ subscribed: true });
}

/** DELETE { endpoint }: stop notifications for this catalog on this device */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await access(request, slug);
  if ("response" in result) return result.response;

  let body: { endpoint?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (typeof body.endpoint === "string" && body.endpoint) await removePushSubscription(result.catalog.id, body.endpoint);
  return NextResponse.json({ subscribed: false });
}
