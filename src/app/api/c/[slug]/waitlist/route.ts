import { NextRequest, NextResponse, after } from "next/server";
import { getFullCatalogData } from "@/lib/catalog/queries";
import { buildOrderContext } from "@/lib/orders/context";
import { checkWaitlistRequest, joinWaitlist } from "@/lib/orders/waitlist";
import { checkRateLimit, getClientIdentifier, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit/middleware";
import { planTakesOrders } from "@/lib/plans";
import { notifyWaitlist } from "@/lib/push";

/**
 * POST { date, name, phone, itemIds?, staffId?, lang? }: join the waiting list for a fully booked
 * day. The team sees it on the calendar and messages the customer if a time opens.
 * Errors carry a `code` the page shows in its own words: closed, date, required, full.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const limit = await checkRateLimit(request, RATE_LIMITS.waitlist, `${getClientIdentifier(request)}|${slug}`);
  if (!limit.allowed) return rateLimitResponse(RATE_LIMITS.waitlist, limit.resetAt);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request", code: "required" }, { status: 400 });
  }

  const data = await getFullCatalogData(slug);
  if (!data) return NextResponse.json({ error: "Catalog not found", code: "closed" }, { status: 404 });
  if (data.isExpired || !planTakesOrders(data.subscriptionType)) {
    return NextResponse.json({ error: "This page is not taking orders", code: "closed" }, { status: 403 });
  }

  const ctx = buildOrderContext(data);
  const result = checkWaitlistRequest(body, { module: ctx.module, booking: ctx.booking, items: ctx.items, today: ctx.today });
  if (!result.ok) {
    return NextResponse.json({ error: result.message, code: result.code, field: result.field }, { status: result.code === "closed" ? 403 : 400 });
  }

  const saved = await joinWaitlist(data.catalog.id, result.entry);
  if (!saved.ok) return NextResponse.json({ error: "The waiting list for this day is full", code: "full" }, { status: 409 });

  const entry = result.entry;
  after(() => notifyWaitlist(data.catalog.id, slug, entry.date, entry.name));
  return NextResponse.json({ ok: true, date: entry.date }, { status: 201 });
}
