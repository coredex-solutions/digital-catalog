import { NextRequest, NextResponse } from "next/server";
import { getFullCatalogData } from "@/lib/catalog/queries";
import { buildOrderContext } from "@/lib/orders/context";
import { stayBookings } from "@/lib/orders/store";
import { addDays, bookedByNight, unitsOf } from "@/lib/orders/stays";
import { checkRateLimit, getClientIdentifier, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit/middleware";

/**
 * GET: what guests need to pick dates, from today to as far ahead as the place takes bookings.
 * { today, last, rules, units: { itemId: rooms }, booked: { itemId: { date: rooms taken } } }.
 * Only counts are sent (no names or numbers), and only for nights with something booked.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const limit = await checkRateLimit(request, RATE_LIMITS.slots, `${getClientIdentifier(request)}|${slug}`);
  if (!limit.allowed) return rateLimitResponse(RATE_LIMITS.slots, limit.resetAt);

  const data = await getFullCatalogData(slug);
  if (!data) return NextResponse.json({ error: "Catalog not found" }, { status: 404 });
  const ctx = buildOrderContext(data);
  const noStore = { headers: { "Cache-Control": "no-store" } };
  if (!ctx.module.nights || !ctx.stay || data.isExpired) return NextResponse.json({ state: "off" }, noStore);

  // The last night guests can book: the latest check-in plus the longest stay
  const last = addDays(ctx.today, ctx.stay.max_days + ctx.stay.max_nights);
  const bookings = await stayBookings(data.catalog.id, ctx.today, last);
  const units = Object.fromEntries(ctx.items.filter((item) => item.is_available).map((item) => [item.id, unitsOf(item)]));
  const booked = bookedByNight(bookings, ctx.today, last);
  for (const id of Object.keys(booked)) if (!(id in units)) delete booked[id];

  return NextResponse.json({ state: "open", today: ctx.today, last, rules: ctx.stay, units, booked }, noStore);
}
