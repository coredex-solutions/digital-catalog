import {
  LayoutDashboard,
  FolderKanban,
  Package,
  Settings,
  BarChart3,
  FileText,
  QrCode,
  Clock,
  MessageCircle,
  Brain,
  CreditCard,
  MapPin,
  Rocket,
  Users,
  Inbox,
  Contact,
  TicketPercent,
  type LucideIcon,
} from "lucide-react";
import type { AdminLang } from "../_lib/i18n";
import { MODULES, type ModuleDefinition } from "@/lib/modules/registry";

export type AdminNavKey =
  | "dashboard"
  | "orders"
  | "customers"
  | "offers"
  | "categories"
  | "items"
  | "about"
  | "hours"
  | "faqs"
  | "branches"
  | "ai-waiter"
  | "analytics"
  | "qr"
  | "settings"
  | "billing"
  | "publish"
  | "team";

export interface AdminNavItem {
  key: AdminNavKey;
  href: string;
  label: string;
  /** Shorter label for the phone tab bar */
  shortLabel?: string;
  /** Shows a count (e.g. new orders) */
  badgeKey?: "newOrders";
  icon: LucideIcon;
  exact?: boolean;
}

interface NavFeatures {
  analytics_enabled?: boolean;
}

type NavLabels = Record<AdminNavKey, string> & { home: string; menu: string; insights: string };

/** Section names, also used as page titles so the menu and the page always match */
export const ADMIN_NAV_LABELS: Record<AdminLang, NavLabels> = {
  en: {
    dashboard: "Dashboard",
    orders: "Orders",
    customers: "Customers",
    offers: "Offers",
    publish: "Preview & publish",
    categories: "Categories",
    items: "Dishes",
    about: "About & search",
    hours: "Opening hours",
    faqs: "FAQs",
    branches: "Branches",
    "ai-waiter": "AI waiter",
    analytics: "Analytics",
    qr: "QR codes",
    settings: "Settings",
    team: "Team",
    billing: "Plan & billing",
    home: "Home",
    menu: "Menu",
    insights: "Insights",
  },
  ar: {
    dashboard: "لوحة التحكم",
    orders: "الطلبات",
    customers: "الزبائن",
    offers: "العروض",
    publish: "المعاينة والنشر",
    categories: "الأقسام",
    items: "الأطباق",
    about: "من نحن ومحركات البحث",
    hours: "ساعات العمل",
    faqs: "الأسئلة الشائعة",
    branches: "الفروع",
    "ai-waiter": "النادل الذكي",
    analytics: "الإحصاءات",
    qr: "رموز QR",
    settings: "الإعدادات",
    team: "الفريق",
    billing: "الباقة والدفع",
    home: "الرئيسية",
    menu: "القائمة",
    insights: "الإحصاءات",
  },
};

/**
 * Section names with the module's own words: "Dishes" / "Products" / "Services", the AI
 * assistant's title, and "Requests" instead of "Orders" for services.
 */
export function adminNavLabels(lang: AdminLang, module: ModuleDefinition = MODULES.restaurant): NavLabels {
  const base = ADMIN_NAV_LABELS[lang];
  const v = module.vocab[lang];
  return {
    ...base,
    items: v.items,
    menu: module.id === "restaurant" || module.id === "cafe" ? base.menu : v.items,
    "ai-waiter": module.assistant.title[lang],
    orders: module.id === "services" ? (lang === "ar" ? "الطلبات" : "Requests") : base.orders,
  };
}

/**
 * Single source of truth for the merchant admin navigation, shared by the desktop sidebar and
 * the phone tab bar / "More" sheet so feature gating stays identical in both.
 */
export function getAdminNavItems(
  slug: string,
  features: NavFeatures | null | undefined,
  lang: AdminLang = "en",
  module: ModuleDefinition = MODULES.restaurant
): AdminNavItem[] {
  const basePath = `/c/${slug}/admin`;
  const l = adminNavLabels(lang, module);
  return [
    { key: "dashboard", href: basePath, label: l.dashboard, shortLabel: l.home, icon: LayoutDashboard, exact: true },
    { key: "orders", href: `${basePath}/orders`, label: l.orders, icon: Inbox, badgeKey: "newOrders" },
    { key: "customers", href: `${basePath}/customers`, label: l.customers, icon: Contact },
    { key: "offers", href: `${basePath}/offers`, label: l.offers, icon: TicketPercent },
    { key: "publish", href: `${basePath}/publish`, label: l.publish, icon: Rocket },
    { key: "categories", href: `${basePath}/categories`, label: l.categories, icon: FolderKanban },
    { key: "items", href: `${basePath}/items`, label: l.items, shortLabel: l.menu, icon: Package },
    { key: "about", href: `${basePath}/about`, label: l.about, icon: FileText },
    { key: "hours", href: `${basePath}/hours`, label: l.hours, icon: Clock },
    { key: "faqs", href: `${basePath}/faqs`, label: l.faqs, icon: MessageCircle },
    { key: "branches", href: `${basePath}/branches`, label: l.branches, icon: MapPin },
    { key: "ai-waiter", href: `${basePath}/ai-waiter`, label: l["ai-waiter"], icon: Brain },
    ...(features?.analytics_enabled
      ? [{ key: "analytics" as const, href: `${basePath}/analytics`, label: l.analytics, shortLabel: l.insights, icon: BarChart3 }]
      : []),
    { key: "qr", href: `${basePath}/qr`, label: l.qr, icon: QrCode },
    { key: "settings", href: `${basePath}/settings`, label: l.settings, icon: Settings },
    { key: "team", href: `${basePath}/team`, label: l.team, icon: Users },
    { key: "billing", href: `${basePath}/billing`, label: l.billing, icon: CreditCard },
  ];
}

export function isNavItemActive(item: Pick<AdminNavItem, "href" | "exact">, pathname: string | null): boolean {
  if (!pathname) return false;
  return item.exact ? pathname === item.href || pathname === `${item.href}/` : pathname.startsWith(item.href);
}

/** Keys shown as primary tabs on phones; everything else goes into the "More" sheet. */
export const PHONE_TAB_KEYS: AdminNavKey[] = ["dashboard", "orders", "items"];
