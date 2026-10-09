"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  CreditCard,
  Settings,
  LogOut,
  Shield,
  BarChart3,
  Inbox
} from "lucide-react";
import { clsx } from "clsx";

const navItems = [
  { href: "/superadmin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/superadmin/requests", label: "Upgrade Requests", icon: Inbox },
  { href: "/superadmin/catalogs", label: "Catalogs", icon: FolderKanban },
  { href: "/superadmin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/superadmin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/superadmin/settings", label: "Platform", icon: Settings },
];

export function SuperAdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("superadmin_token");
    router.push("/superadmin/login");
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-ui-surface border-r border-ui-line flex flex-col z-40">
      {/* Header */}
      <div className="p-6 border-b border-ui-line">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-control bg-ui-primary flex items-center justify-center">
            <Shield className="w-5 h-5 text-ui-primary-fg" />
          </div>
          <div>
            <p className="font-bold text-ui-ink">Super Admin</p>
            <p className="text-xs text-ui-muted font-medium">Platform Control</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/superadmin" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 rounded-control transition-all duration-300 group",
                isActive
                  ? "bg-ui-subtle text-ui-primary font-semibold border border-ui-line"
                  : "text-ui-muted hover:text-ui-ink hover:bg-ui-subtle border border-transparent"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-ui-line">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-control text-ui-muted hover:text-ui-danger hover:bg-ui-subtle transition-all w-full border border-transparent hover:border-ui-line"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

export function SuperAdminHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <header className="bg-ui-surface border-b border-ui-line px-8 py-6 sticky top-0 z-30">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ui-ink">{title}</h1>
        {children}
      </div>
    </header>
  );
}

export function SuperAdminContent({ children }: { children: React.ReactNode }) {
  return (
    <main className="p-8">
      {children}
    </main>
  );
}

