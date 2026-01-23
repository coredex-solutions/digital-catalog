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
  trend,
}: {
  icon: any;
  label: string;
  value: number | string;
  subtext?: string;
  trend?: string;
}) {
  return (
    <div className="glass-card p-8 group relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2 opacity-10 transition-opacity group-hover:opacity-20" 
           style={{ backgroundColor: `var(--color-primary)` }} />
      
      <div className="relative z-10 flex items-start justify-between">
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
              {label}
            </span>
            <div className="flex items-baseline gap-2">
              <h3 className="text-4xl font-black text-white tracking-tighter">
                {value}
              </h3>
              {trend && (
                <span className="text-[10px] font-black text-violet-400 bg-violet-400/10 px-2 py-0.5 rounded-md border border-violet-400/20">
                  {trend}
                </span>
              )}
            </div>
          </div>
          {subtext && (
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
              {subtext}
            </p>
          )}
        </div>
        <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-white/40 group-hover:text-primary group-hover:border-primary/30 group-hover:shadow-[0_0_20px_rgba(124,58,237,0.1)] transition-all duration-500">
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
          className="group relative flex items-center gap-3 px-6 py-3.5 bg-primary text-white rounded-2xl hover:shadow-[0_0_30px_rgba(124,58,237,0.4)] transition-all duration-500 font-black text-[11px] uppercase tracking-widest overflow-hidden shadow-lg"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <Plus className="w-4 h-4" />
          Add Product
        </Link>
      </CatalogAdminHeader>

      <CatalogAdminContent>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass rounded-[2rem] p-10 animate-pulse">
                <div className="h-2 bg-white/5 rounded w-20 mb-4" />
                <div className="h-10 bg-white/5 rounded w-32" />
              </div>
            ))}
          </div>
        ) : stats ? (
          <div className="space-y-12">
            {/* Critical Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
                trend="+8%"
              />
              <StatCard
                icon={MessageCircle}
                label="WhatsApp Clicks"
                value={stats.analytics.total_whatsapp || 0}
                subtext="Customer inquiries"
              />
            </div>

            {/* Core Operation Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  className="group relative p-8 glass rounded-[2.5rem] border border-white/5 hover:border-white/20 transition-all duration-500 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-10 transition-opacity" 
                       style={{ backgroundColor: action.color }} />
                  
                  <div className="flex flex-col gap-6 relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center transition-all group-hover:scale-110 group-hover:border-white/20">
                      <action.icon className="w-6 h-6 text-white/40 group-hover:text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white tracking-tight group-hover:text-primary transition-colors">{action.title}</h3>
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mt-2 leading-relaxed">
                        {action.desc}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Analytics Overview */}
            <div className="glass rounded-[3rem] border border-white/5 overflow-hidden">
              <div className="px-10 py-8 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(124,58,237,0.2)]">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white tracking-tight">Catalog Analytics</h2>
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mt-1">Track how customers interact with your catalog</p>
                  </div>
                </div>
              </div>
              
              <div className="p-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  {[
                    { label: "Total Views", val: stats.analytics.total_views },
                    { label: "Unique Visitors", val: stats.analytics.total_unique },
                    { label: "WhatsApp Clicks", val: stats.analytics.total_whatsapp },
                    { label: "Total Bookings", val: stats.analytics.total_bookings }
                  ].map((stat, i) => (
                    <div key={i} className="bg-white/[0.02] rounded-[2rem] p-8 border border-white/5 hover:border-white/10 transition-all text-center group">
                      <p className="text-4xl font-black text-white tracking-tighter group-hover:scale-110 transition-transform duration-500">
                        {stat.val || 0}
                      </p>
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mt-4 leading-none">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-32 glass rounded-[3rem] border border-white/5">
            <TrendingUp className="w-16 h-16 text-white/5 mx-auto mb-6" />
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">No analytics data available yet</p>
          </div>
        )}
      </CatalogAdminContent>
    </CatalogAdminShell>
  );
}

