import { notFound } from "next/navigation";
import { getCatalogBySlug } from "@/lib/catalog/queries";
import type { Metadata, Viewport } from "next";

// Lets the phone tab bar pad itself with env(safe-area-inset-bottom) on devices with a home indicator
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const catalog = await getCatalogBySlug(slug);

  return {
    title: catalog ? `Admin | ${catalog.name}` : "Admin",
    robots: "noindex, nofollow",
  };
}

export default async function CatalogAdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const catalog = await getCatalogBySlug(slug);

  if (!catalog) {
    notFound();
  }

  // An expired subscription doesn't lock the dashboard: owners can still read their data and
  // reach Billing to renew. Writes are refused by the API (requireCatalogAdmin) and the shell
  // explains why. The admin uses the platform palette, not the restaurant's colours.
  return (
    <div lang="en" dir="ltr" className="platform min-h-screen">
      {children}
    </div>
  );
}
