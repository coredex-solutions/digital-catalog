import { NextRequest, NextResponse } from "next/server";
import { getFullCatalogData } from "@/lib/catalog/queries";
import { buildOrderContext } from "@/lib/orders/context";
import { takenBookings } from "@/lib/orders/store";
import { availableSlots } from "@/lib/orders/slots";
import { checkRateLimit, getClientIdentifier, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit/middleware";

/**
 * GET ?date=YYYY-MM-DD&minutes=N: the free booking times on a date. Table bookings always last
 * the owner's table length; for appointments the page sends the chosen services' total length.
 * { state: "open", times } | { state: "closed" } | { state: "free" } (no hours: any time) |
 * { state: "off" } (the business doesn't use set times).
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const limit = await checkRateLimit(request, RATE_LIMITS.slots, `${getClientIdentifier(request)}|${slug}`);
  if (!limit.allowed) return rateLimitResponse(RATE_LIMITS.slots, limit.resetAt);

  const data = await getFullCatalogData(slug);
  if (!data) return NextResponse.json({ error: "Catalog not found" }, { status: 404 });
  const ctx = buildOrderContext(data);
  const noStore = { headers: { "Cache-Control": "no-store" } };
  if (!ctx.booking.enabled || data.isExpired) return NextResponse.json({ state: "off" }, noStore);

  const search = new URL(request.url).searchParams;
  const date = search.get("date") ?? "";
  const kind = ctx.module.tableBooking ? "booking" : "request";
  const asked = Math.round(Number(search.get("minutes")));
  const minutes = kind === "booking" ? ctx.booking.table_minutes : Number.isFinite(asked) && asked >= 5 && asked <= 12 * 60 ? asked : ctx.booking.default_minutes;

  const taken = /^\d{4}-\d{2}-\d{2}$/.test(date) ? await takenBookings(data.catalog.id, kind, date, minutes) : [];
  const result = availableSlots({ config: ctx.booking, hours: ctx.hours, date, minutes, now: ctx.now, taken });
  return NextResponse.json(result, noStore);
}
