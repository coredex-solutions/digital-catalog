"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Utensils,
  ShoppingBag,
  Settings,
  MapPin,
  Clock,
  Share2,
  LogOut,
  Menu,
  X,
  MessageCircle,
  Home,
} from "lucide-react";
import { useRouter } from "next/navigation";

const menuItems = [
  { icon: Home, label: "Dashboard", href: "/admin" },
  { icon: Utensils, label: "Categories", href: "/admin/categories" },
  { icon: ShoppingBag, label: "Menu Items", href: "/admin/menu-items" },
  { icon: Settings, label: "Restaurant Settings", href: "/admin/settings" },
  { icon: Clock, label: "Operating Hours", href: "/admin/hours" },
  { icon: Share2, label: "Social Media", href: "/admin/social" },
  { icon: MessageCircle, label: "FAQs", href: "/admin/faqs" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    router.push("/admin/login");
  };

  return (
    <>
      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          sidebarOpen ? "block" : "hidden"
        }`}
      >
        <div
          className="fixed inset-0 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
        <motion.div
          initial={{ x: -300 }}
          animate={{ x: 0 }}
          className="fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-navy-800 shadow-xl p-6"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Admin Panel
            </h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-navy-700 rounded-lg"
            >
              <X size={20} className="text-slate-600 dark:text-slate-400" />
            </button>
          </div>
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.href || pathname === `${item.href}/`;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    isActive
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30"
                      : "hover:bg-purple-50 dark:hover:bg-purple-900/20 text-slate-700 dark:text-slate-300"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-600 dark:text-purple-400 transition-colors"
            >
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </nav>
        </motion.div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-navy-800 border-r border-slate-200 dark:border-navy-700 p-6 overflow-y-auto">
        <h2 className="text-xl font-bold mb-8 text-slate-900 dark:text-white">
          Admin Panel
        </h2>
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname === `${item.href}/`;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30 font-semibold"
                    : "hover:bg-purple-50 dark:hover:bg-purple-900/20 text-slate-700 dark:text-slate-300"
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-600 dark:text-purple-400 transition-colors mt-4"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </nav>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden bg-white dark:bg-navy-800 border-b border-slate-200 dark:border-navy-700 p-4 flex items-center justify-between fixed top-0 left-0 right-0 z-40">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          Admin Panel
        </h1>
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 hover:bg-slate-100 dark:hover:bg-navy-700 rounded-lg"
        >
          <Menu size={24} className="text-slate-600 dark:text-slate-400" />
        </button>
      </header>
    </>
  );
}

