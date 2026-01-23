"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  FolderKanban, 
  Users, 
  CreditCard, 
  Settings,
  LogOut,
  Shield,
  BarChart3
} from "lucide-react";
import { clsx } from "clsx";

const navItems = [
  { href: "/superadmin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/superadmin/catalogs", label: "Catalogs", icon: FolderKanban },
  { href: "/superadmin/admins", label: "Catalog Admins", icon: Users },
  { href: "/superadmin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/superadmin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/superadmin/settings", label: "Settings", icon: Settings },
];

export function SuperAdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("superadmin_token");
    router.push("/superadmin/login");
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-black/60 backdrop-blur-2xl border-r border-white/5 flex flex-col z-40">
      {/* Header */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-purple-400 flex items-center justify-center shadow-lg shadow-primary/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white tracking-tight">Super Admin</h1>
            <p className="text-xs text-white/40 font-medium tracking-widest uppercase">Platform Control</p>
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
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_20px_-5px_rgba(124,58,237,0.3)]"
                  : "text-white/40 hover:text-white hover:bg-white/5 border border-transparent"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/40 hover:text-purple-400 hover:bg-purple-500/10 transition-all w-full border border-transparent hover:border-purple-500/20"
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
    <header className="bg-black/20 backdrop-blur-xl border-b border-white/5 px-8 py-6 sticky top-0 z-30">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
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

