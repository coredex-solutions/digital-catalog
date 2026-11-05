import { NextResponse } from "next/server";
import { getCatalogBySlug } from "@/lib/catalog/queries";

/**
 * The dashboard as an installable app (Add to Home Screen), opening on the Orders page. Scoped to
 * this catalog's dashboard only: customers who save a public page keep opening that page. On
 * iPhone, notifications for new orders only work once the dashboard is added to the Home Screen.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const catalog = await getCatalogBySlug(slug);
  if (!catalog) return NextResponse.json({ error: "Catalog not found" }, { status: 404 });
  const base = `/c/${slug}/admin/`;
  return NextResponse.json(
    {
      id: base,
      name: `${catalog.name} · Coredex`,
      short_name: catalog.name.slice(0, 20),
      start_url: `${base}orders/`,
      scope: base,
      display: "standalone",
      background_color: "#F7F8FC",
      theme_color: "#4028C9",
      icons: [
        { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
        { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    },
    { headers: { "Content-Type": "application/manifest+json", "Cache-Control": "public, max-age=3600" } }
  );
}
