"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SuperAdminShell } from "./_components/SuperAdminShell";
import { SuperAdminHeader, SuperAdminContent } from "./_components/SuperAdminSidebar";
import { 
  FolderKanban, 
  Users, 
  Eye, 
  MessageCircle,
  Calendar,
  AlertTriangle,
  Plus,
  ArrowRight,
  TrendingUp,
  Shield,
  CreditCard
} from "lucide-react";

interface DashboardStats {
  catalogs: {
    total: number;
    active: number;
    suspended: number;
  };
  subscriptions: Array<{
    subscription_type: string;
    count: number;
    expired: number;
  }>;
  analytics: {
    total_views: number;
    total_unique: number;
    total_whatsapp: number;
    total_bookings: number;
  };
  recent_catalogs: Array<{
    id: string;
    slug: string;
    name: string;
    business_type: string;
    created_at: string;
    subscription_type: string;
    expires_at: string | null;
  }>;
  expiring_soon: Array<{
    id: string;
    slug: string;
    name: string;
    expires_at: string;
  }>;
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subtext,
  trend,
  color = "primary" 
}: { 
  icon: any; 
  label: string; 
  value: number | string;
  subtext?: string;
  trend?: string;
  color?: "primary" | "blue" | "amber" | "purple";
}) {
  return (
    <div className="glass-card p-6 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[50px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors duration-500" />
      
      <div className="relative z-10 flex items-start justify-between">
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">
              {label}
            </span>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-white tracking-tighter">
                {value}
              </h3>
              {trend && (
                <span className="text-[10px] font-bold text-violet-400 bg-violet-400/10 px-1.5 py-0.5 rounded-md border border-violet-400/20">
                  {trend}
                </span>
              )}
            </div>
          </div>
          {subtext && (
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest leading-relaxed">
              {subtext}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 group-hover:text-primary group-hover:border-primary/30 group-hover:shadow-[0_0_20px_rgba(124,58,237,0.2)] transition-all duration-500`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem("superadmin_token");
      if (!token) return;

      try {
        const res = await fetch("/api/superadmin/stats", {
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
  }, []);

  return (
    <SuperAdminShell>
      <SuperAdminHeader title="Platform Dashboard">
        <Link
          href="/superadmin/catalogs/new"
          className="group relative flex items-center gap-3 px-6 py-3 bg-primary text-white rounded-2xl hover:shadow-[0_0_30px_rgba(124,58,237,0.4)] transition-all duration-500 font-bold text-xs uppercase tracking-widest overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <Plus className="w-4 h-4" />
          Add Catalog
        </Link>
      </SuperAdminHeader>

      <SuperAdminContent>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass rounded-[2rem] p-8 animate-pulse">
                <div className="h-2 bg-white/5 rounded w-20 mb-4" />
                <div className="h-8 bg-white/5 rounded w-32" />
              </div>
            ))}
          </div>
        ) : stats ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon={FolderKanban}
                label="Total Catalogs"
                value={stats.catalogs.total}
                subtext={`${stats.catalogs.active} Active / ${stats.catalogs.suspended} Suspended`}
                color="primary"
              />
              <StatCard
                icon={Eye}
                label="Total Views"
                value={stats.analytics.total_views?.toLocaleString() || "0"}
                subtext={`${stats.analytics.total_unique?.toLocaleString() || 0} Unique Visitors`}
                trend="+12%"
                color="primary"
              />
              <StatCard
                icon={MessageCircle}
                label="WhatsApp Orders"
                value={stats.analytics.total_whatsapp || 0}
                subtext="Last 30 days"
                color="primary"
              />
              <StatCard
                icon={Calendar}
                label="Bookings"
                value={stats.analytics.total_bookings || 0}
                subtext="Customer requests"
                color="primary"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Catalogs */}
              <div className="glass rounded-[2.5rem] border border-white/5 overflow-hidden">
                <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <h2 className="text-sm font-black text-white uppercase tracking-widest">Recent Catalogs</h2>
                  </div>
                  <Link 
                    href="/superadmin/catalogs" 
                    className="group text-[10px] font-black text-white/30 hover:text-primary uppercase tracking-[0.2em] transition-all flex items-center gap-2"
                  >
                    View All
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
                <div className="p-2">
                  <div className="divide-y divide-white/5">
                    {stats.recent_catalogs.slice(0, 5).map((catalog) => (
                      <Link
                        key={catalog.id}
                        href={`/superadmin/catalogs/${catalog.id}`}
                        className="flex items-center justify-between p-6 hover:bg-white/[0.03] rounded-2xl transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white/20 group-hover:text-primary group-hover:border-primary/20 transition-all">
                            <Shield className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-white group-hover:text-primary transition-colors tracking-tight">{catalog.name}</p>
                            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mt-1">
                              {catalog.slug} <span className="mx-2">•</span> {catalog.business_type}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-white/5 text-white/40 border border-white/5 uppercase tracking-widest group-hover:border-primary/30 group-hover:text-primary transition-all">
                            {catalog.subscription_type}
                          </span>
                        </div>
                      </Link>
                    ))}
                    {stats.recent_catalogs.length === 0 && (
                      <div className="px-8 py-20 text-center">
                        <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.3em]">No catalogs found</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Expiring Soon */}
              <div className="glass rounded-[2.5rem] border border-white/5 overflow-hidden">
                <div className="px-8 py-6 border-b border-white/5 flex items-center gap-3 bg-white/[0.02]">
                  <AlertTriangle className="w-4 h-4 text-purple-500" />
                  <h2 className="text-sm font-black text-white uppercase tracking-widest">Expiring Soon</h2>
                </div>
                <div className="p-2">
                  <div className="divide-y divide-white/5">
                    {stats.expiring_soon.map((catalog) => {
                      const daysLeft = Math.ceil(
                        (new Date(catalog.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                      );
                      return (
                        <Link
                          key={catalog.id}
                          href={`/superadmin/catalogs/${catalog.id}`}
                          className="flex items-center justify-between p-6 hover:bg-white/[0.03] rounded-2xl transition-all group"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-2 h-2 rounded-full ${daysLeft <= 7 ? "bg-purple-500 animate-pulse" : "bg-purple-500"}`} />
                            <div>
                              <p className="font-bold text-white tracking-tight">{catalog.name}</p>
                              <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mt-1">{catalog.slug}</p>
                            </div>
                          </div>
                          <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest ${
                            daysLeft <= 7 
                              ? "bg-purple-500/10 text-purple-500 border border-purple-500/20"
                              : "bg-purple-500/10 text-purple-500 border border-purple-500/20"
                          }`}>
                            {daysLeft} days left
                          </span>
                        </Link>
                      );
                    })}
                    {stats.expiring_soon.length === 0 && (
                      <div className="px-8 py-20 text-center">
                        <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.3em]">No urgent renewals</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Subscription Breakdown */}
            <div className="glass rounded-[2.5rem] p-10 border border-white/5">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(124,58,237,0.2)]">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight">Subscription Plans</h2>
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mt-1">Distribution of active service plans</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {stats.subscriptions.map((sub) => (
                  <div key={sub.subscription_type} className="relative group p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-primary/30 transition-all duration-500 overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 text-white/5 group-hover:text-primary/10 transition-colors">
                      <CreditCard className="w-16 h-16" />
                    </div>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-4">
                      {sub.subscription_type.replace("_", " ")}
                    </p>
                    <div className="flex items-baseline gap-3">
                      <p className="text-4xl font-black text-white tracking-tighter">{sub.count}</p>
                      <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Active catalogs</span>
                    </div>
                    {sub.expired > 0 && (
                      <div className="mt-6 flex items-center gap-2 text-purple-500/60 font-black text-[10px] uppercase tracking-widest">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                        {sub.expired} Expired
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 glass rounded-[2.5rem] border border-white/5">
            <AlertTriangle className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Could not load statistics</p>
          </div>
        )}
      </SuperAdminContent>
    </SuperAdminShell>
  );
}

