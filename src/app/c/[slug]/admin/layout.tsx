import { notFound } from "next/navigation";
import { getCatalogBySlug } from "@/lib/catalog/queries";
import type { Metadata, Viewport } from "next";
import { resolveSiteLang } from "@/app/_landing/site-lang";
import { AdminLangProvider } from "./_lib/i18n";

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
    title: catalog ? `${(await resolveSiteLang()) === "ar" ? "لوحة التحكم" : "Dashboard"} | ${catalog.name}` : "Dashboard",
    robots: "noindex, nofollow",
    // Installable dashboard (and the only way to get order notifications on iPhone)
    manifest: `/api/c/${slug}/admin/manifest/`,
    appleWebApp: { capable: true, title: catalog?.name ?? "Coredex", statusBarStyle: "default" },
    // Setting icons here replaces the site icon for these pages, so list it again
    icons: { icon: "/icon.svg", apple: "/icons/apple-touch-icon.png" },
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
  // Arabic or English: the site-wide choice (home page, sign-in, or the switch in the dashboard).
  const lang = await resolveSiteLang();
  return (
    <div lang={lang} dir={lang === "ar" ? "rtl" : "ltr"} className="platform min-h-screen">
      <AdminLangProvider lang={lang}>{children}</AdminLangProvider>
    </div>
  );
}
