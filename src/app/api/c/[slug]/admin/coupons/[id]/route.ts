import { NextRequest, NextResponse } from "next/server";
import { requireCatalogAdmin } from "@/lib/auth/catalog-admin-middleware";
import { getCatalogBySlug } from "@/lib/catalog/queries";
import { deleteCoupon, updateCoupon } from "@/lib/orders/coupons-store";
import { parseCouponInput } from "@/lib/orders/coupons";

/** PUT: change a coupon (all its fields, including switching it on or off) */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const catalog = await getCatalogBySlug(slug);
  if (!catalog) return NextResponse.json({ error: "Catalog not found" }, { status: 404 });
  const auth = await requireCatalogAdmin(request, catalog.id);
  if (!auth.success) return auth.response;

  const parsed = parseCouponInput(await request.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error, field: parsed.field }, { status: 400 });
  const result = await updateCoupon(catalog.id, id, parsed.coupon);
  if (!result.ok) {
    if (result.code === "duplicate") return NextResponse.json({ error: "This code already exists", field: "code" }, { status: 409 });
    return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
  }
  return NextResponse.json({ coupon: result.coupon });
}

/** DELETE: remove a coupon (orders that used it keep their discount) */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const catalog = await getCatalogBySlug(slug);
  if (!catalog) return NextResponse.json({ error: "Catalog not found" }, { status: 404 });
  const auth = await requireCatalogAdmin(request, catalog.id);
  if (!auth.success) return auth.response;
  if (!(await deleteCoupon(catalog.id, id))) return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
