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
      
      <div className="relative z-10 flex items-start justify-between">
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-ui-muted">
              {label}
            </span>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-semibold text-ui-ink">
                {value}
              </h3>
              {trend && (
                <span className="text-xs font-bold text-ui-primary bg-ui-subtle px-1.5 py-0.5 rounded-md border border-ui-line">
                  {trend}
                </span>
              )}
            </div>
          </div>
          {subtext && (
            <p className="text-xs font-bold text-ui-muted leading-relaxed">
              {subtext}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-control bg-ui-subtle border border-ui-line flex items-center justify-center text-ui-muted group-hover:text-ui-primary group-hover:border-ui-primary transition-all duration-500`}>
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
          className="flex items-center gap-2 px-5 py-2.5 bg-ui-primary text-ui-primary-fg hover:bg-ui-primary-hover rounded-control transition-colors font-semibold text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Catalog
        </Link>
      </SuperAdminHeader>

      <SuperAdminContent>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass rounded-panel p-8">
                <div className="h-2 bg-ui-subtle rounded w-20 mb-4" />
                <div className="h-8 bg-ui-subtle rounded w-32" />
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
              <div className="glass rounded-panel border border-ui-line overflow-hidden">
                <div className="px-8 py-6 border-b border-ui-line flex items-center justify-between bg-ui-bg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-ui-primary" />
                    <h2 className="text-sm font-semibold text-ui-ink">Recent Catalogs</h2>
                  </div>
                  <Link 
                    href="/superadmin/catalogs" 
                    className="group min-h-11 px-2 text-xs font-semibold text-ui-muted hover:text-ui-primary transition-all flex items-center gap-2"
                  >
                    View All
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
                <div className="p-2">
                  <div className="divide-y divide-ui-line">
                    {stats.recent_catalogs.slice(0, 5).map((catalog) => (
                      <Link
                        key={catalog.id}
                        href={`/superadmin/catalogs/${catalog.id}`}
                        className="flex items-center justify-between p-6 hover:bg-ui-subtle rounded-control transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-ui-subtle border border-ui-line flex items-center justify-center text-ui-muted group-hover:text-ui-primary group-hover:border-ui-primary transition-all">
                            <Shield className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-ui-ink group-hover:text-ui-primary transition-colors">{catalog.name}</p>
                            <p className="text-xs font-bold text-ui-muted mt-1">
                              {catalog.slug} <span className="mx-2">•</span> {catalog.business_type}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-ui-subtle text-ui-muted border border-ui-line group-hover:border-ui-primary group-hover:text-ui-primary transition-all">
                            {catalog.subscription_type}
                          </span>
                        </div>
                      </Link>
                    ))}
                    {stats.recent_catalogs.length === 0 && (
                      <div className="px-8 py-20 text-center">
                        <p className="text-xs font-semibold text-ui-input">No catalogs found</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Expiring Soon */}
              <div className="glass rounded-panel border border-ui-line overflow-hidden">
                <div className="px-8 py-6 border-b border-ui-line flex items-center gap-3 bg-ui-bg">
                  <AlertTriangle className="w-4 h-4 text-ui-warning" />
                  <h2 className="text-sm font-semibold text-ui-ink">Expiring Soon</h2>
                </div>
                <div className="p-2">
                  <div className="divide-y divide-ui-line">
                    {stats.expiring_soon.map((catalog) => {
                      const daysLeft = Math.ceil(
                        (new Date(catalog.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                      );
                      return (
                        <Link
                          key={catalog.id}
                          href={`/superadmin/catalogs/${catalog.id}`}
                          className="flex items-center justify-between p-6 hover:bg-ui-subtle rounded-control transition-all group"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-2 h-2 rounded-full ${daysLeft <= 7 ? "bg-ui-danger" : "bg-ui-warning"}`} />
                            <div>
                              <p className="font-bold text-ui-ink">{catalog.name}</p>
                              <p className="text-xs font-bold text-ui-muted mt-1">{catalog.slug}</p>
                            </div>
                          </div>
                          <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${
                            daysLeft <= 7 
                              ? "bg-ui-surface text-ui-danger border border-ui-danger"
                              : "bg-ui-surface text-ui-warning border border-ui-line"
                          }`}>
                            {daysLeft} days left
                          </span>
                        </Link>
                      );
                    })}
                    {stats.expiring_soon.length === 0 && (
                      <div className="px-8 py-20 text-center">
                        <p className="text-xs font-semibold text-ui-input">No urgent renewals</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Subscription Breakdown */}
            <div className="glass rounded-panel p-10 border border-ui-line">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-control bg-ui-subtle flex items-center justify-center text-ui-primary">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-ui-ink">Subscription Plans</h2>
                    <p className="text-xs font-bold text-ui-muted mt-1">Distribution of active service plans</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {stats.subscriptions.map((sub) => (
                  <div key={sub.subscription_type} className="relative group p-8 rounded-panel bg-ui-surface border border-ui-line hover:border-ui-primary transition-all duration-500 overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 text-ui-line group-hover:text-ui-subtle transition-colors">
                      <CreditCard className="w-16 h-16" />
                    </div>
                    <p className="text-xs font-semibold text-ui-muted mb-4">
                      {sub.subscription_type.replace("_", " ")}
                    </p>
                    <div className="flex items-baseline gap-3">
                      <p className="text-4xl font-semibold text-ui-ink">{sub.count}</p>
                      <span className="text-xs font-bold text-ui-muted">Active catalogs</span>
                    </div>
                    {sub.expired > 0 && (
                      <div className="mt-6 flex items-center gap-2 text-ui-danger font-semibold text-xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-ui-danger" />
                        {sub.expired} Expired
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 glass rounded-panel border border-ui-line">
            <AlertTriangle className="w-12 h-12 text-ui-input mx-auto mb-4" />
            <p className="text-xs font-semibold text-ui-muted">Could not load statistics</p>
          </div>
        )}
      </SuperAdminContent>
    </SuperAdminShell>
  );
}

