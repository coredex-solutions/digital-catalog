import { NextRequest, NextResponse } from "next/server";
import { getCatalogBySlug } from "@/lib/catalog/queries";
import { findCouponByCode } from "@/lib/orders/coupons-store";
import { couponUsable, normalizeCode } from "@/lib/orders/coupons";
import { beirutToday } from "@/lib/orders/validate";
import { checkRateLimit, getClientIdentifier, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit/middleware";

/**
 * POST { code }: check a coupon code at checkout. Answers its terms, so the page can show the
 * discount as the basket changes ({ ok, coupon }), or why it can't be used ({ ok: false, problem }).
 * Limited per address so codes can't be guessed. The order itself checks the code again.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const limit = await checkRateLimit(request, RATE_LIMITS.couponCheck, `${getClientIdentifier(request)}|${slug}`);
  if (!limit.allowed) return rateLimitResponse(RATE_LIMITS.couponCheck, limit.resetAt);

  let body: { code?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, problem: "invalid" }, { status: 400 });
  }
  const catalog = await getCatalogBySlug(slug);
  if (!catalog) return NextResponse.json({ ok: false, problem: "invalid" }, { status: 404 });

  const code = normalizeCode(body.code);
  const coupon = code ? await findCouponByCode(catalog.id, code) : null;
  const problem = coupon ? couponUsable(coupon, beirutToday()) : "invalid";
  if (!coupon || problem) return NextResponse.json({ ok: false, problem });
  const { kind, value, currency, min_order } = coupon;
  return NextResponse.json({ ok: true, coupon: { code: coupon.code, kind, value, currency, min_order } });
}
