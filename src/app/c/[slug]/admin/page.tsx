"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CatalogAdminShell } from "./_components/CatalogAdminShell";
import { CatalogAdminHeader, CatalogAdminContent } from "./_components/CatalogAdminSidebar";
import {
  FolderKanban,
  Package,
  Eye,
  MessageCircle,
  CalendarCheck,
  Users,
  TrendingUp,
  Plus,
} from "lucide-react";

interface DashboardStats {
  categories: number;
  items: number;
  analytics: {
    total_views: number;
    total_unique: number;
    total_whatsapp: number;
    total_bookings: number;
  };
  recent_items: Array<{
    id: string;
    name_en: string;
    price: number;
    created_at: string;
  }>;
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
}: {
  icon: any;
  label: string;
  value: number | string;
  subtext?: string;
}) {
  return (
    <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
          {subtext && <p className="text-slate-500 text-sm mt-1">{subtext}</p>}
        </div>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
          style={{
            background: `linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)`,
          }}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function CatalogAdminDashboard() {
  const params = useParams();
  const slug = params.slug as string;
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem(`catalog_admin_token_${slug}`);
      if (!token) return;

      try {
        const res = await fetch(`/api/c/${slug}/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [slug]);

  return (
    <CatalogAdminShell>
      <CatalogAdminHeader title="Dashboard">
        <Link
          href={`/c/${slug}/admin/items?new=true`}
          className="flex items-center gap-2 px-4 py-2 text-white rounded-xl font-medium transition-all"
          style={{
            background: `linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)`,
          }}
        >
          <Plus className="w-5 h-5" />
          Add Product
        </Link>
      </CatalogAdminHeader>

      <CatalogAdminContent>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-slate-800/50 rounded-2xl p-6 animate-pulse">
                <div className="h-4 bg-slate-700 rounded w-24 mb-3" />
                <div className="h-8 bg-slate-700 rounded w-16" />
              </div>
            ))}
          </div>
        ) : stats ? (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon={FolderKanban}
                label="Categories"
                value={stats.categories}
              />
              <StatCard
                icon={Package}
                label="Products"
                value={stats.items}
              />
              <StatCard
                icon={Eye}
                label="Total Views"
                value={stats.analytics.total_views?.toLocaleString() || "0"}
                subtext={`${stats.analytics.total_unique?.toLocaleString() || 0} unique`}
              />
              <StatCard
                icon={MessageCircle}
                label="WhatsApp Orders"
                value={stats.analytics.total_whatsapp || 0}
              />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href={`/c/${slug}/admin/categories`}
                className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-all"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 20%, transparent)" }}
                >
                  <FolderKanban className="w-6 h-6" style={{ color: "var(--color-primary)" }} />
                </div>
                <div>
                  <p className="font-semibold text-white">Manage Categories</p>
                  <p className="text-sm text-slate-400">Add, edit, reorder categories</p>
                </div>
              </Link>

              <Link
                href={`/c/${slug}/admin/items`}
                className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-all"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "color-mix(in srgb, var(--color-secondary) 20%, transparent)" }}
                >
                  <Package className="w-6 h-6" style={{ color: "var(--color-secondary)" }} />
                </div>
                <div>
                  <p className="font-semibold text-white">Manage Products</p>
                  <p className="text-sm text-slate-400">Add, edit, manage products</p>
                </div>
              </Link>

              <Link
                href={`/c/${slug}/admin/settings`}
                className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-all"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "color-mix(in srgb, var(--color-accent) 20%, transparent)" }}
                >
                  <TrendingUp className="w-6 h-6" style={{ color: "var(--color-accent)" }} />
                </div>
                <div>
                  <p className="font-semibold text-white">Customize</p>
                  <p className="text-sm text-slate-400">Colors, branding, features</p>
                </div>
              </Link>
            </div>

            {/* Analytics Summary */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
              <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
                Performance Overview
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-white">
                    {stats.analytics.total_views || 0}
                  </p>
                  <p className="text-sm text-slate-400">Page Views</p>
                </div>
                <div className="bg-slate-900/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-white">
                    {stats.analytics.total_unique || 0}
                  </p>
                  <p className="text-sm text-slate-400">Unique Visitors</p>
                </div>
                <div className="bg-slate-900/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-white">
                    {stats.analytics.total_whatsapp || 0}
                  </p>
                  <p className="text-sm text-slate-400">WhatsApp Clicks</p>
                </div>
                <div className="bg-slate-900/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-white">
                    {stats.analytics.total_bookings || 0}
                  </p>
                  <p className="text-sm text-slate-400">Booking Clicks</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-slate-500 py-12">
            Failed to load dashboard data
          </div>
        )}
      </CatalogAdminContent>
    </CatalogAdminShell>
  );
}

