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
  type LucideIcon,
} from "lucide-react";

export type AdminNavKey =
  | "dashboard"
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
  icon: LucideIcon;
  exact?: boolean;
}

interface NavFeatures {
  analytics_enabled?: boolean;
}

/**
 * Single source of truth for the merchant admin navigation, shared by the desktop sidebar and
 * the phone tab bar / "More" sheet so feature gating stays identical in both.
 */
export function getAdminNavItems(slug: string, features: NavFeatures | null | undefined): AdminNavItem[] {
  const basePath = `/c/${slug}/admin`;
  return [
    { key: "dashboard", href: basePath, label: "Dashboard", shortLabel: "Home", icon: LayoutDashboard, exact: true },
    { key: "publish", href: `${basePath}/publish`, label: "Preview & Publish", icon: Rocket },
    { key: "categories", href: `${basePath}/categories`, label: "Categories", icon: FolderKanban },
    { key: "items", href: `${basePath}/items`, label: "Products", shortLabel: "Menu", icon: Package },
    { key: "about", href: `${basePath}/about`, label: "About & SEO", icon: FileText },
    { key: "hours", href: `${basePath}/hours`, label: "Business Hours", icon: Clock },
    { key: "faqs", href: `${basePath}/faqs`, label: "FAQs", icon: MessageCircle },
    { key: "branches", href: `${basePath}/branches`, label: "Branches", icon: MapPin },
    { key: "ai-waiter", href: `${basePath}/ai-waiter`, label: "AI Waiter", icon: Brain },
    ...(features?.analytics_enabled
      ? [{ key: "analytics" as const, href: `${basePath}/analytics`, label: "Analytics", shortLabel: "Insights", icon: BarChart3 }]
      : []),
    { key: "qr", href: `${basePath}/qr`, label: "QR Codes", icon: QrCode },
    { key: "settings", href: `${basePath}/settings`, label: "Settings", icon: Settings },
    { key: "team", href: `${basePath}/team`, label: "Team", icon: Users },
    { key: "billing", href: `${basePath}/billing`, label: "Billing & Plan", icon: CreditCard },
  ];
}

export function isNavItemActive(item: Pick<AdminNavItem, "href" | "exact">, pathname: string | null): boolean {
  if (!pathname) return false;
  return item.exact ? pathname === item.href || pathname === `${item.href}/` : pathname.startsWith(item.href);
}

/** Keys shown as primary tabs on phones; everything else goes into the "More" sheet. */
export const PHONE_TAB_KEYS: AdminNavKey[] = ["dashboard", "items", "analytics"];
