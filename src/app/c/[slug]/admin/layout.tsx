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
      <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white">
        <div className="glass-card p-12 max-w-lg text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.5)]" />
          <h1 className="text-3xl font-black mb-6 tracking-tighter uppercase whitespace-nowrap">Protocol Suspended</h1>
          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] leading-relaxed">
            Temporal license has expired. Establish connection with platform administrators to reactivate node throughput.
          </p>
        </div>
      </div>
    );
  }

  // Generate CSS variables for theming
  const themeStyles = settings
    ? ({
        "--color-primary": settings.color_primary || "#7c3aed",
        "--color-secondary": settings.color_secondary || "#4f46e5",
        "--color-accent": settings.color_accent || "#10b981",
        "--color-background": settings.color_background || "#050505",
        "--color-surface": settings.color_surface || "#0a0a0a",
        "--color-text": settings.color_text || "#ffffff",
        "--color-text-muted": settings.color_text_muted || "#a1a1aa",
      } as React.CSSProperties)
    : {};

  return (
    <div style={themeStyles} className="min-h-screen bg-[#050505]">
      {children}
    </div>
  );
}

