"use client";

import Link from "next/link";
import { usePathname, useRouter, useParams } from "next/navigation";
import { LogOut, Store, ExternalLink } from "lucide-react";
import { clsx } from "clsx";
import { getAdminNavItems, isNavItemActive } from "./adminNav";

interface CatalogInfo {
  id: string;
  slug: string;
  name: string;
  business_type: string;
}

interface Features {
  booking_enabled: boolean;
  analytics_enabled: boolean;
  ai_waiter_enabled: boolean;
  ai_image_enhancement_limit: number;
  ai_image_enhancement_used: number;
  max_items: number;
  max_categories: number;
  enabled_languages: string;
  default_language: string;
  is_expired: boolean;
  subscription_type: string;
}

interface CatalogAdminSidebarProps {
  catalog: CatalogInfo;
  features: Features | null;
}

export function CatalogAdminSidebar({
  catalog,
  features,
}: CatalogAdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const navItems = getAdminNavItems(slug, features);

  const handleLogout = () => {
    localStorage.removeItem(`catalog_admin_token_${slug}`);
    router.push(`/c/${slug}/admin/login`);
  };

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-ui-surface border-r border-ui-line flex-col z-40" aria-label="Admin navigation">
      {/* Brand Header */}
      <div className="p-6 pb-6">
        <div className="flex flex-col gap-4">
          <div
            className="w-14 h-14 rounded-control flex items-center justify-center relative group"
          >
            <div className="absolute inset-0 rounded-control border border-ui-line group-hover:border-ui-input transition-all" />
            <div className="relative z-10 w-full h-full rounded-control flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 opacity-20" style={{ background: `linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)` }} />
              <Store className="w-6 h-6 text-ui-ink" />
            </div>
          </div>
          <div>
            <p className="text-lg font-semibold text-ui-ink leading-none">{catalog.name}</p>
            <p className="text-xs text-ui-muted mt-2">
              Business Type: {catalog.business_type}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Matrix */}
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = isNavItemActive(item, pathname);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={clsx(
                "flex items-center gap-3 px-4 min-h-11 py-2.5 rounded-control transition-all duration-300 relative group",
                isActive
                  ? "text-ui-ink"
                  : "text-ui-muted hover:text-ui-ink hover:bg-ui-subtle"
              )}
            >
              {isActive && (
                <div className="absolute inset-0 rounded-control bg-ui-subtle" />
              )}
              {isActive && (
                <div
                  className="absolute left-0 w-1 h-5 rounded-full"
                  style={{ backgroundColor: `var(--color-primary)` }}
                />
              )}
              <item.icon className="w-5 h-5 relative z-10" strokeWidth={isActive ? 2.5 : 2} aria-hidden />
              <span className={clsx("text-sm relative z-10", isActive ? "font-semibold" : "font-medium")}>{item.label}</span>
            </Link>
          );
        })}

        <div className="h-px bg-ui-line mx-4 my-4" />

        <a
          href={`/c/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 min-h-11 py-2.5 rounded-control text-ui-muted hover:text-ui-ink hover:bg-ui-subtle transition-all group"
        >
          <ExternalLink className="w-5 h-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          <span className="text-sm font-medium">View Catalog</span>
        </a>
      </nav>

      {/* Control Footer */}
      <div className="p-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 min-h-11 py-2.5 rounded-control text-ui-muted hover:text-ui-primary hover:bg-ui-subtle border border-transparent hover:border-ui-line transition-all w-full group"
        >
          <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

export function CatalogAdminHeader({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="px-4 py-4 sm:px-6 sm:py-6 lg:px-10 lg:py-8 border-b border-ui-line bg-ui-bg">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold text-ui-ink">{title}</h1>
          <div className="h-1 w-10 bg-ui-primary mt-2 rounded-full opacity-50" aria-hidden />
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          {children}
        </div>
      </div>
    </header>
  );
}

export function CatalogAdminContent({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="px-4 py-4 sm:p-6 lg:p-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="max-w-[1600px] mx-auto">
        {children}
      </div>
    </main>
  );
}
