"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CatalogAdminShell } from "./_components/CatalogAdminShell";
import { CatalogAdminHeader, CatalogAdminContent } from "./_components/CatalogAdminSidebar";
import { SetupChecklist } from "./_components/SetupChecklist";
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
  trend,
}: {
  icon: any;
  label: string;
  value: number | string;
  subtext?: string;
  trend?: string;
}) {
  return (
    <div className="glass-card p-4 sm:p-8 group relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full -translate-y-1/2 translate-x-1/2 opacity-10 transition-opacity group-hover:opacity-20" 
           style={{ backgroundColor: `var(--color-primary)` }} />
      
      <div className="relative z-10 flex items-start justify-between">
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-ui-muted">
              {label}
            </span>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl sm:text-4xl font-semibold text-ui-ink tabular-nums">
                {value}
              </h3>
              {trend && (
                <span className="text-xs font-semibold text-ui-primary bg-ui-subtle px-2 py-0.5 rounded-md border border-ui-line">
                  {trend}
                </span>
              )}
            </div>
          </div>
          {subtext && (
            <p className="text-xs font-semibold text-ui-muted">
              {subtext}
            </p>
          )}
        </div>
        <div className="hidden sm:flex w-14 h-14 shrink-0 rounded-control bg-ui-bg border border-ui-line items-center justify-center text-ui-muted group-hover:text-ui-primary transition-all duration-500">
          <Icon className="w-6 h-6" />
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
          className="group relative flex items-center gap-3 px-6 py-3.5 bg-ui-primary text-ui-primary-fg rounded-control transition-all duration-500 font-semibold text-xs overflow-hidden shadow-lg"
        >
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <Plus className="w-4 h-4" />
          Add Product
        </Link>
      </CatalogAdminHeader>

      <CatalogAdminContent>
        <SetupChecklist />
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass rounded-panel p-5 sm:p-8 lg:p-10">
                <div className="h-2 bg-ui-subtle rounded w-20 mb-4" />
                <div className="h-10 bg-ui-subtle rounded w-32" />
              </div>
            ))}
          </div>
        ) : stats ? (
          <div className="space-y-6 sm:space-y-12">
            {/* Critical Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
              <StatCard
                icon={FolderKanban}
                label="Categories"
                value={stats.categories}
                subtext="Total active categories"
              />
              <StatCard
                icon={Package}
                label="Products"
                value={stats.items}
                subtext="Total items in catalog"
              />
              <StatCard
                icon={Eye}
                label="Total Views"
                value={stats.analytics.total_views?.toLocaleString() || "0"}
                subtext={`${stats.analytics.total_unique?.toLocaleString() || 0} Unique Visitors`}
              />
              <StatCard
                icon={MessageCircle}
                label="WhatsApp Clicks"
                value={stats.analytics.total_whatsapp || 0}
                subtext="Customer inquiries"
              />
            </div>

            {/* Core Operation Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6">
              {[
                { 
                  href: `/c/${slug}/admin/categories`, 
                  icon: FolderKanban, 
                  title: "Manage Categories", 
                  desc: "Organize and reorder your product categories",
                  color: "var(--color-primary)"
                },
                { 
                  href: `/c/${slug}/admin/items`, 
                  icon: Package, 
                  title: "Manage Products", 
                  desc: "Add, edit or remove items from your catalog",
                  color: "var(--color-secondary)"
                },
                { 
                  href: `/c/${slug}/admin/settings`, 
                  icon: TrendingUp, 
                  title: "General Settings", 
                  desc: "Update branding, colors and features",
                  color: "var(--color-accent)"
                }
              ].map((action, i) => (
                <Link
                  key={i}
                  href={action.href}
                  className="group relative p-5 sm:p-8 glass rounded-panel border border-ui-line hover:border-ui-input transition-all duration-500 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-10 transition-opacity" 
                       style={{ backgroundColor: action.color }} />
                  
                  <div className="flex flex-row md:flex-col items-center md:items-start gap-4 md:gap-6 relative z-10">
                    <div className="w-12 h-12 md:w-14 md:h-14 shrink-0 rounded-control bg-ui-bg border border-ui-line flex items-center justify-center transition-all group-hover:border-ui-input">
                      <action.icon className="w-6 h-6 text-ui-muted group-hover:text-ui-ink" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-ui-ink group-hover:text-ui-primary transition-colors">{action.title}</h3>
                      <p className="text-xs font-semibold text-ui-muted mt-2 leading-relaxed">
                        {action.desc}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Analytics Overview */}
            <div className="glass rounded-panel border border-ui-line overflow-hidden">
              <div className="px-5 sm:px-10 py-5 sm:py-8 border-b border-ui-line flex items-center justify-between bg-ui-bg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-ui-subtle flex items-center justify-center text-ui-primary">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-ui-ink">Catalog Analytics</h2>
                    <p className="text-xs font-semibold text-ui-muted mt-1">Track how customers interact with your catalog</p>
                  </div>
                </div>
              </div>
              
              <div className="p-5 sm:p-8 lg:p-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-8">
                  {[
                    { label: "Total Views", val: stats.analytics.total_views },
                    { label: "Unique Visitors", val: stats.analytics.total_unique },
                    { label: "WhatsApp Clicks", val: stats.analytics.total_whatsapp },
                    { label: "Total Bookings", val: stats.analytics.total_bookings }
                  ].map((stat, i) => (
                    <div key={i} className="bg-ui-bg rounded-panel p-4 sm:p-8 border border-ui-line hover:border-ui-input transition-all text-center group">
                      <p className="text-2xl sm:text-4xl font-semibold text-ui-ink tabular-nums">
                        {stat.val || 0}
                      </p>
                      <p className="text-xs font-semibold text-ui-muted mt-4 leading-none">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-32 glass rounded-panel border border-ui-line">
            <TrendingUp className="w-16 h-16 text-ui-line mx-auto mb-6" />
            <p className="text-xs font-semibold text-ui-muted">No analytics data available yet</p>
          </div>
        )}
      </CatalogAdminContent>
    </CatalogAdminShell>
  );
}

