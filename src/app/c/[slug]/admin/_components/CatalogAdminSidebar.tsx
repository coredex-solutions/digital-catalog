"use client";

import Link from "next/link";
import { usePathname, useRouter, useParams } from "next/navigation";
import { LogOut, Store, ExternalLink, Languages } from "lucide-react";
import { clsx } from "clsx";
import { getAdminNavItems, isNavItemActive } from "./adminNav";
import { useAdminLang, useCopy, useSetAdminLang } from "../_lib/i18n";

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

const en = {
  nav: "Dashboard sections",
  viewMenu: "View menu",
  newTab: "(opens in a new tab)",
  signOut: "Sign out",
  switchLanguage: "العربية",
  businessTypes: { restaurant: "Restaurant", cafe: "Café", bakery: "Bakery" } as Record<string, string>,
};
const ar: typeof en = {
  nav: "أقسام لوحة التحكم",
  viewMenu: "عرض القائمة",
  newTab: "(تُفتح في نافذة جديدة)",
  signOut: "تسجيل الخروج",
  switchLanguage: "English",
  businessTypes: { restaurant: "مطعم", cafe: "مقهى", bakery: "مخبز" },
};

export function CatalogAdminSidebar({
  catalog,
  features,
}: CatalogAdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const lang = useAdminLang();
  const setLang = useSetAdminLang();
  const t = useCopy({ en, ar });

  const navItems = getAdminNavItems(slug, features, lang);

  const handleLogout = () => {
    localStorage.removeItem(`catalog_admin_token_${slug}`);
    router.push(`/login/?r=${slug}`);
  };

  return (
    <aside className="hidden lg:flex fixed start-0 top-0 h-screen w-64 bg-ui-surface border-e border-ui-line flex-col z-40" aria-label={t.nav}>
      <div className="p-6 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-ui-subtle text-ui-primary">
            <Store className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-ui-ink">{catalog.name}</p>
            {t.businessTypes[catalog.business_type] && (
              <p className="text-xs text-ui-muted">{t.businessTypes[catalog.business_type]}</p>
            )}
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = isNavItemActive(item, pathname);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={clsx(
                "relative flex items-center gap-3 px-4 min-h-11 py-2.5 rounded-control transition-colors",
                isActive ? "bg-ui-subtle text-ui-ink" : "text-ui-muted hover:text-ui-ink hover:bg-ui-subtle"
              )}
            >
              {isActive && <span className="absolute start-0 h-5 w-1 rounded-full bg-ui-primary" aria-hidden />}
              <item.icon className="w-5 h-5 shrink-0" strokeWidth={isActive ? 2.5 : 2} aria-hidden />
              <span className={clsx("text-sm", isActive ? "font-semibold" : "font-medium")}>{item.label}</span>
            </Link>
          );
        })}

        <div className="h-px bg-ui-line mx-4 my-4" />

        <a
          href={`/c/${slug}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 min-h-11 py-2.5 rounded-control text-ui-muted hover:text-ui-ink hover:bg-ui-subtle transition-colors"
        >
          <ExternalLink className="w-5 h-5 shrink-0 rtl:-scale-x-100" aria-hidden />
          <span className="text-sm font-medium">{t.viewMenu}</span>
          <span className="sr-only">{t.newTab}</span>
        </a>
      </nav>

      <div className="p-4 space-y-1">
        <button
          type="button"
          onClick={() => setLang(lang === "ar" ? "en" : "ar")}
          lang={lang === "ar" ? "en" : "ar"}
          className="flex items-center gap-3 px-4 min-h-11 py-2.5 rounded-control text-ui-muted hover:text-ui-ink hover:bg-ui-subtle transition-colors w-full"
        >
          <Languages className="w-5 h-5 shrink-0" aria-hidden />
          <span className={clsx("text-sm font-medium", lang !== "ar" && "font-system")}>{t.switchLanguage}</span>
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 min-h-11 py-2.5 rounded-control text-ui-muted hover:text-ui-ink hover:bg-ui-subtle transition-colors w-full"
        >
          <LogOut className="w-5 h-5 shrink-0 rtl:-scale-x-100" aria-hidden />
          <span className="text-sm font-medium">{t.signOut}</span>
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
          <h1 className="text-xl sm:text-2xl font-semibold text-ui-heading">{title}</h1>
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
