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
    { href: `${basePath}/hours`, label: "Business Hours", icon: Clock },
    { href: `${basePath}/faqs`, label: "FAQs", icon: MessageCircle },
    ...(features?.analytics_enabled
      ? [{ href: `${basePath}/analytics`, label: "Analytics", icon: BarChart3 }]
      : []),
    { href: `${basePath}/qr`, label: "QR Codes", icon: QrCode },
    { href: `${basePath}/settings`, label: "Settings", icon: Settings },
  ];

  const handleLogout = () => {
    localStorage.removeItem(`catalog_admin_token_${slug}`);
    router.push(`/c/${slug}/admin/login`);
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-72 bg-[#050505]/40 backdrop-blur-[30px] border-r border-white/5 flex flex-col z-40">
      {/* Brand Header */}
      <div className="p-8 pb-10">
        <div className="flex flex-col gap-6">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center relative group"
          >
            <div className="absolute inset-0 rounded-2xl animate-pulse blur-xl opacity-20 transition-all group-hover:opacity-40" 
                 style={{ background: `var(--color-primary)` }} />
            <div className="absolute inset-0 rounded-2xl border border-white/10 group-hover:border-white/20 transition-all" />
            <div className="relative z-10 w-full h-full rounded-2xl flex items-center justify-center overflow-hidden">
               <div className="absolute inset-0 opacity-20" style={{ background: `linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)` }} />
               <Store className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-tighter leading-none">{catalog.name}</h1>
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mt-2 font-mono">
              Business Type: {catalog.business_type}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Matrix */}
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all duration-300 relative group",
                isActive
                  ? "text-white"
                  : "text-white/30 hover:text-white hover:bg-white/[0.03]"
              )}
            >
              {isActive && (
                <div 
                  className="absolute inset-0 rounded-2xl opacity-10 blur-md transition-all animate-pulse"
                  style={{ backgroundColor: `var(--color-primary)` }}
                />
              )}
              {isActive && (
                <div 
                  className="absolute left-0 w-1 h-5 rounded-full"
                  style={{ backgroundColor: `var(--color-primary)` }}
                />
              )}
              <item.icon className={clsx("w-5 h-5 relative z-10 transition-transform duration-500", !isActive && "group-hover:scale-110")} />
              <span className="text-[11px] font-black uppercase tracking-[0.15em] relative z-10">{item.label}</span>
            </Link>
          );
        })}

        <div className="h-px bg-white/5 mx-4 my-6" />

        <a
          href={`/c/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-5 py-3.5 rounded-2xl text-white/30 hover:text-white hover:bg-white/[0.03] transition-all group"
        >
          <ExternalLink className="w-5 h-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          <span className="text-[11px] font-black uppercase tracking-[0.15em]">View Catalog</span>
        </a>
      </nav>

      {/* Control Footer */}
      <div className="p-6">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-5 py-4 rounded-2xl text-white/20 hover:text-red-400 hover:bg-red-500/5 border border-transparent hover:border-red-500/10 transition-all w-full group"
        >
          <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          <span className="text-[11px] font-black uppercase tracking-[0.15em]">Sign Out</span>
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
    <header className="px-10 py-8 border-b border-white/5 bg-white/[0.01] backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tighter uppercase">{title}</h1>
          <div className="h-1 w-10 bg-primary mt-2 rounded-full opacity-50 shadow-[0_0_10px_var(--color-primary)]" />
        </div>
        <div className="flex items-center gap-4">
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
    <main className="p-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="max-w-[1600px] mx-auto">
        {children}
      </div>
    </main>
  );
}
