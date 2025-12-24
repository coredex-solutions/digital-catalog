"use client";

import Link from "next/link";
import { usePathname, useRouter, useParams } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Package,
  Settings,
  LogOut,
  Store,
  BarChart3,
  FileText,
  ExternalLink,
  QrCode,
  Clock,
  MessageCircle,
} from "lucide-react";
import { clsx } from "clsx";

interface CatalogInfo {
  id: string;
  slug: string;
  name: string;
  business_type: string;
}

interface Features {
  multi_language_enabled: boolean;
  booking_enabled: boolean;
  analytics_enabled: boolean;
  is_expired: boolean;
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

  const basePath = `/c/${slug}/admin`;

  const navItems = [
    { href: basePath, label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: `${basePath}/categories`, label: "Categories", icon: FolderKanban },
    { href: `${basePath}/items`, label: "Products", icon: Package },
    { href: `${basePath}/about`, label: "About & SEO", icon: FileText },
    { href: `${basePath}/hours`, label: "Opening Hours", icon: Clock },
    { href: `${basePath}/faqs`, label: "FAQs & Chat", icon: MessageCircle },
    ...(features?.analytics_enabled
      ? [{ href: `${basePath}/analytics`, label: "Analytics", icon: BarChart3 }]
      : []),
    { href: `${basePath}/qr`, label: "QR & Print", icon: QrCode },
    { href: `${basePath}/settings`, label: "Settings", icon: Settings },
  ];

  const handleLogout = () => {
    localStorage.removeItem(`catalog_admin_token_${slug}`);
    router.push(`/c/${slug}/admin/login`);
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-800/80 backdrop-blur-xl border-r border-slate-700/50 flex flex-col z-40">
      {/* Header */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
            style={{
              background: `linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)`,
            }}
          >
            <Store className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-white truncate">{catalog.name}</h1>
            <p className="text-xs text-slate-400 capitalize">
              {catalog.business_type}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                isActive
                  ? "text-white border"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              )}
              style={
                isActive
                  ? {
                      backgroundColor: `color-mix(in srgb, var(--color-primary) 20%, transparent)`,
                      borderColor: `color-mix(in srgb, var(--color-primary) 30%, transparent)`,
                      color: "var(--color-primary)",
                    }
                  : undefined
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}

        {/* View Live Link */}
        <a
          href={`/c/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all mt-4"
        >
          <ExternalLink className="w-5 h-5" />
          <span className="font-medium">View Live</span>
        </a>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700/50">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all w-full"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
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
    <header className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50 px-8 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {children}
      </div>
    </header>
  );
}

export function CatalogAdminContent({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main className="p-8">{children}</main>;
}
