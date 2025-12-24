import { NextRequest, NextResponse } from "next/server";
import { requireCatalogAdmin } from "@/lib/auth/catalog-admin-middleware";
import { getCatalogBySlug } from "@/lib/catalog/queries";
import QRCode from "qrcode";

// GET: Generate QR code for the catalog
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // First get the catalog by slug to get the ID
  const catalog = await getCatalogBySlug(slug);
  if (!catalog) {
    return NextResponse.json({ error: "Catalog not found" }, { status: 404 });
  }

  const auth = await requireCatalogAdmin(request, catalog.id);
  if (!auth.success) return auth.response;

  const searchParams = request.nextUrl.searchParams;
  const format = searchParams.get("format") || "png"; // 'png' | 'svg' | 'base64'
  const size = parseInt(searchParams.get("size") || "1024");
  const darkColor = searchParams.get("dark") || "#000000";
  const lightColor = searchParams.get("light") || "#ffffff";
  const includeMargin = searchParams.get("margin") !== "false";

  // Construct the catalog URL
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://your-domain.com";
  const catalogUrl = `${baseUrl}/c/${slug}`;

  try {
    if (format === "svg") {
      // Generate SVG
      const svgString = await QRCode.toString(catalogUrl, {
        type: "svg",
        color: {
          dark: darkColor,
          light: lightColor === "transparent" ? "#ffffff00" : lightColor,
        },
        margin: includeMargin ? 4 : 0,
        width: size,
        errorCorrectionLevel: "H", // High error correction for logo placement
      });

      return new NextResponse(svgString, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Content-Disposition": `attachment; filename="${slug}-qr.svg"`,
        },
      });
    } else if (format === "base64") {
      // Generate Base64 data URL
      const dataUrl = await QRCode.toDataURL(catalogUrl, {
        type: "image/png",
        width: size,
        color: {
          dark: darkColor,
          light: lightColor === "transparent" ? "#ffffff00" : lightColor,
        },
        margin: includeMargin ? 4 : 0,
        errorCorrectionLevel: "H",
      });

      return NextResponse.json({
        dataUrl,
        catalogUrl,
        slug,
      });
    } else {
      // Generate PNG
      const buffer = await QRCode.toBuffer(catalogUrl, {
        type: "png",
        width: size,
        color: {
          dark: darkColor,
          light: lightColor === "transparent" ? "#ffffff00" : lightColor,
        },
        margin: includeMargin ? 4 : 0,
        errorCorrectionLevel: "H",
      });

      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "image/png",
          "Content-Disposition": `attachment; filename="${slug}-qr.png"`,
        },
      });
    }
  } catch (error: any) {
    console.error("QR generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate QR code" },
      { status: 500 }
    );
  }
}
