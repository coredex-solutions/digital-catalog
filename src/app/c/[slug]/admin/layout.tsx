import { notFound } from "next/navigation";
import { getCatalogBySlug, getCatalogSettings, getCatalogSubscription } from "@/lib/catalog/queries";
import type { Metadata } from "next";

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

  const [settings, subscription] = await Promise.all([
    getCatalogSettings(catalog.id),
    getCatalogSubscription(catalog.id),
  ]);

  // Check if subscription is expired
  const isExpired = subscription?.expires_at
    ? new Date(subscription.expires_at) < new Date()
    : false;

  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold mb-4">Subscription Expired</h1>
          <p className="text-slate-400">
            Please contact the platform administrator to renew your subscription.
          </p>
        </div>
      </div>
    );
  }

  // Generate CSS variables for theming
  const themeStyles = settings
    ? ({
        "--color-primary": settings.color_primary || "#FF6B35",
        "--color-secondary": settings.color_secondary || "#4A90A4",
        "--color-accent": settings.color_accent || "#F7C948",
        "--color-background": settings.color_background || "#1a1a2e",
        "--color-surface": settings.color_surface || "#16213e",
        "--color-text": settings.color_text || "#ffffff",
        "--color-text-muted": settings.color_text_muted || "#a0aec0",
      } as React.CSSProperties)
    : {};

  return (
    <div style={themeStyles} className="min-h-screen bg-slate-900">
      {children}
    </div>
  );
}

