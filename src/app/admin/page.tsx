"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import Link from "next/link";
import { Sidebar } from "./_components/Sidebar";

export default function AdminDashboard() {
  const menuItems = [
    { icon: Utensils, label: "Categories", href: "/admin/categories" },
    { icon: ShoppingBag, label: "Menu Items", href: "/admin/menu-items" },
    { icon: Settings, label: "Restaurant Settings", href: "/admin/settings" },
    { icon: Clock, label: "Operating Hours", href: "/admin/hours" },
    { icon: Share2, label: "Social Media", href: "/admin/social" },
    { icon: MessageCircle, label: "FAQs", href: "/admin/faqs" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-900">
      <Sidebar />
      <div className="lg:pl-64 pt-16 lg:pt-0">
        <main className="p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-slate-900 dark:text-white">
              Dashboard
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="bg-white dark:bg-navy-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-navy-700 hover:shadow-lg hover:border-purple-500/50 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-900/40 transition-colors">
                      <item.icon
                        size={24}
                        className="text-purple-600 dark:text-purple-400"
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {item.label}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Manage {item.label.toLowerCase()}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
