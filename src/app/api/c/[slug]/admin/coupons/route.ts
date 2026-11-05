import { NextRequest, NextResponse } from "next/server";
import { requireCatalogAdmin } from "@/lib/auth/catalog-admin-middleware";
import { getCatalogBySlug } from "@/lib/catalog/queries";
import { createCoupon, listCoupons } from "@/lib/orders/coupons-store";
import { MAX_COUPONS, parseCouponInput } from "@/lib/orders/coupons";

/** GET: the catalog's coupon codes */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const catalog = await getCatalogBySlug(slug);
  if (!catalog) return NextResponse.json({ error: "Catalog not found" }, { status: 404 });
  const auth = await requireCatalogAdmin(request, catalog.id);
  if (!auth.success) return auth.response;
  return NextResponse.json({ coupons: await listCoupons(catalog.id) });
}

/** POST: add a coupon code */
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const catalog = await getCatalogBySlug(slug);
  if (!catalog) return NextResponse.json({ error: "Catalog not found" }, { status: 404 });
  const auth = await requireCatalogAdmin(request, catalog.id);
  if (!auth.success) return auth.response;

  const parsed = parseCouponInput(await request.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error, field: parsed.field }, { status: 400 });
  const result = await createCoupon(catalog.id, parsed.coupon);
  if (!result.ok) {
    if (result.code === "duplicate") return NextResponse.json({ error: "This code already exists", field: "code" }, { status: 409 });
    return NextResponse.json({ error: "Up to 100 codes", code: "too_many", max: MAX_COUPONS }, { status: 409 });
  }
  return NextResponse.json({ coupon: result.coupon }, { status: 201 });
}
