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
  TrendingUp
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
  color = "emerald" 
}: { 
  icon: any; 
  label: string; 
  value: number | string;
  subtext?: string;
  color?: "emerald" | "blue" | "amber" | "purple";
}) {
  const colors = {
    emerald: "from-emerald-500 to-teal-600",
    blue: "from-blue-500 to-indigo-600",
    amber: "from-amber-500 to-orange-600",
    purple: "from-purple-500 to-pink-600",
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
          {subtext && <p className="text-slate-500 text-sm mt-1">{subtext}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
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
      <SuperAdminHeader title="Dashboard">
        <Link
          href="/superadmin/catalogs/new"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all font-medium"
        >
          <Plus className="w-5 h-5" />
          New Catalog
        </Link>
      </SuperAdminHeader>

      <SuperAdminContent>
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
                label="Total Catalogs"
                value={stats.catalogs.total}
                subtext={`${stats.catalogs.active} active`}
                color="emerald"
              />
              <StatCard
                icon={Eye}
                label="Total Views (30d)"
                value={stats.analytics.total_views?.toLocaleString() || "0"}
                subtext={`${stats.analytics.total_unique?.toLocaleString() || 0} unique`}
                color="blue"
              />
              <StatCard
                icon={MessageCircle}
                label="WhatsApp Orders"
                value={stats.analytics.total_whatsapp || 0}
                subtext="Last 30 days"
                color="amber"
              />
              <StatCard
                icon={Calendar}
                label="Booking Clicks"
                value={stats.analytics.total_bookings || 0}
                subtext="Last 30 days"
                color="purple"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Catalogs */}
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
                  <h2 className="font-semibold text-white">Recent Catalogs</h2>
                  <Link 
                    href="/superadmin/catalogs" 
                    className="text-emerald-400 text-sm hover:text-emerald-300 flex items-center gap-1"
                  >
                    View all <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="divide-y divide-slate-700/50">
                  {stats.recent_catalogs.slice(0, 5).map((catalog) => (
                    <Link
                      key={catalog.id}
                      href={`/superadmin/catalogs/${catalog.id}`}
                      className="flex items-center justify-between px-6 py-4 hover:bg-slate-700/20 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-white">{catalog.name}</p>
                        <p className="text-sm text-slate-400">
                          {catalog.slug} • {catalog.business_type}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {catalog.subscription_type}
                      </span>
                    </Link>
                  ))}
                  {stats.recent_catalogs.length === 0 && (
                    <div className="px-6 py-8 text-center text-slate-500">
                      No catalogs yet
                    </div>
                  )}
                </div>
              </div>

              {/* Expiring Soon */}
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-700/50 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <h2 className="font-semibold text-white">Expiring Soon</h2>
                </div>
                <div className="divide-y divide-slate-700/50">
                  {stats.expiring_soon.map((catalog) => {
                    const daysLeft = Math.ceil(
                      (new Date(catalog.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                    );
                    return (
                      <Link
                        key={catalog.id}
                        href={`/superadmin/catalogs/${catalog.id}`}
                        className="flex items-center justify-between px-6 py-4 hover:bg-slate-700/20 transition-colors"
                      >
                        <div>
                          <p className="font-medium text-white">{catalog.name}</p>
                          <p className="text-sm text-slate-400">{catalog.slug}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          daysLeft <= 7 
                            ? "bg-red-500/10 text-red-400 border border-red-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}>
                          {daysLeft} days left
                        </span>
                      </Link>
                    );
                  })}
                  {stats.expiring_soon.length === 0 && (
                    <div className="px-6 py-8 text-center text-slate-500">
                      No subscriptions expiring soon
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Subscription Breakdown */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
              <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Subscription Breakdown
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {stats.subscriptions.map((sub) => (
                  <div key={sub.subscription_type} className="bg-slate-900/50 rounded-xl p-4">
                    <p className="text-slate-400 text-sm capitalize">{sub.subscription_type.replace("_", " ")}</p>
                    <p className="text-2xl font-bold text-white">{sub.count}</p>
                    {sub.expired > 0 && (
                      <p className="text-red-400 text-sm">{sub.expired} expired</p>
                    )}
                  </div>
                ))}
                {stats.subscriptions.length === 0 && (
                  <p className="text-slate-500 col-span-3">No subscriptions yet</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-slate-500 py-12">
            Failed to load dashboard data
          </div>
        )}
      </SuperAdminContent>
    </SuperAdminShell>
  );
}

