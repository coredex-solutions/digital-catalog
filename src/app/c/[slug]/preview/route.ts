import { NextRequest, NextResponse } from "next/server";
import { getCatalogBySlug } from "@/lib/catalog/queries";
import { verifyMenuPreviewToken } from "@/lib/auth/jwt";
import { PREVIEW_COOKIE } from "../_lib/menu-data";

// GET /c/[slug]/preview/?token=…  → start previewing the draft (cookie, 30 minutes)
// GET /c/[slug]/preview/?exit=1   → back to the published menu
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const menuUrl = new URL(`/c/${slug}/`, request.url);
  const response = NextResponse.redirect(menuUrl);
  const cookie = { path: `/c/${slug}`, httpOnly: true, sameSite: "lax" as const, secure: request.nextUrl.protocol === "https:" };

  if (request.nextUrl.searchParams.get("exit")) {
    response.cookies.set(PREVIEW_COOKIE, "", { ...cookie, maxAge: 0 });
    return response;
  }

  const token = request.nextUrl.searchParams.get("token") || "";
  const catalog = await getCatalogBySlug(slug);
  // An invalid or expired link just shows the published menu
  if (catalog && verifyMenuPreviewToken(token, catalog.id)) {
    response.cookies.set(PREVIEW_COOKIE, token, { ...cookie, maxAge: 30 * 60 });
  }
  return response;
}
