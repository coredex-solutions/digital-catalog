"use client";

import { useEffect, useState } from "react";
import { SuperAdminShell } from "../_components/SuperAdminShell";
import { SuperAdminHeader, SuperAdminContent } from "../_components/SuperAdminSidebar";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Eye,
  MessageCircle,
  Calendar as CalendarIcon,
  Loader2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

interface PlatformStats {
  total_views: number;
  views_change: number;
  total_whatsapp_clicks: number;
  whatsapp_change: number;
  total_bookings: number;
  bookings_change: number;
  top_catalogs: {
    id: string;
    name: string;
    slug: string;
    views: number;
    whatsapp_clicks: number;
    bookings: number;
  }[];
  daily_stats: {
    date: string;
    views: number;
    whatsapp_clicks: number;
    bookings: number;
  }[];
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d">("30d");

  useEffect(() => {
    fetchStats();
  }, [dateRange]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("superadmin_token");
      const res = await fetch(`/api/superadmin/analytics?range=${dateRange}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({
    icon: Icon,
    label,
    value,
    change,
    color = "emerald",
  }: {
    icon: any;
    label: string;
    value: number;
    change: number;
    color?: "emerald" | "blue" | "amber" | "purple";
  }) => {

    const isPositive = change >= 0;

    return (
      <div className="bg-ui-surface rounded-panel p-6 border border-ui-line">
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-12 h-12 rounded-control bg-ui-subtle flex items-center justify-center"
          >
            <Icon className="w-6 h-6 text-ui-primary" />
          </div>
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${isPositive
                ? "bg-ui-subtle text-ui-success"
                : "bg-ui-bg text-ui-danger"
              }`}
          >
            {isPositive ? (
              <ArrowUp className="w-3 h-3" />
            ) : (
              <ArrowDown className="w-3 h-3" />
            )}
            {Math.abs(change)}%
          </div>
        </div>
        <p className="text-3xl font-bold text-ui-ink mb-1">
          {value.toLocaleString()}
        </p>
        <p className="text-ui-muted text-sm">{label}</p>
      </div>
    );
  };

  return (
    <SuperAdminShell>
      <SuperAdminHeader title="Platform Analytics">
        <div className="flex items-center gap-3">
          <div className="flex bg-ui-surface border border-ui-line rounded-control p-1">
            {(["7d", "30d", "90d"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${dateRange === range
                    ? "bg-ui-primary text-ui-primary-fg"
                    : "text-ui-muted hover:text-ui-ink"
                  }`}
              >
                {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
              </button>
            ))}
          </div>
        </div>
      </SuperAdminHeader>

      <SuperAdminContent>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-ui-primary" />
          </div>
        ) : stats ? (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-6">
              <StatCard
                icon={Eye}
                label="Total Views"
                value={stats.total_views}
                change={stats.views_change}
                color="emerald"
              />
              <StatCard
                icon={MessageCircle}
                label="WhatsApp Orders"
                value={stats.total_whatsapp_clicks}
                change={stats.whatsapp_change}
                color="blue"
              />
              <StatCard
                icon={CalendarIcon}
                label="Bookings"
                value={stats.total_bookings}
                change={stats.bookings_change}
                color="purple"
              />
            </div>

            {/* Top Catalogs */}
            <div className="bg-ui-surface rounded-panel border border-ui-line overflow-hidden">
              <div className="px-6 py-4 border-b border-ui-line">
                <h3 className="font-semibold text-ui-ink flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-ui-primary" />
                  Top Performing Catalogs
                </h3>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-ui-line">
                    <th className="text-left px-6 py-3 text-ui-muted font-medium text-sm">
                      Catalog
                    </th>
                    <th className="text-right px-6 py-3 text-ui-muted font-medium text-sm">
                      Views
                    </th>
                    <th className="text-right px-6 py-3 text-ui-muted font-medium text-sm">
                      WhatsApp
                    </th>
                    <th className="text-right px-6 py-3 text-ui-muted font-medium text-sm">
                      Bookings
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.top_catalogs.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-8 text-center text-ui-muted"
                      >
                        No data available
                      </td>
                    </tr>
                  ) : (
                    stats.top_catalogs.map((catalog, index) => (
                      <tr
                        key={catalog.id}
                        className="border-b border-ui-line hover:bg-ui-bg transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0
                                  ? "bg-ui-primary text-ui-primary-fg"
                                  : index === 1
                                    ? "bg-ui-subtle text-ui-primary"
                                    : index === 2
                                      ? "bg-ui-subtle text-ui-primary"
                                      : "bg-ui-bg text-ui-muted"
                                }`}
                            >
                              {index + 1}
                            </span>
                            <div>
                              <p className="font-medium text-ui-ink">
                                {catalog.name}
                              </p>
                              <p className="text-sm text-ui-muted">
                                /{catalog.slug}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-ui-ink font-medium">
                          {catalog.views.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right text-ui-ink font-medium">
                          {catalog.whatsapp_clicks.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right text-ui-ink font-medium">
                          {catalog.bookings.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>


          </div>
        ) : (
          <div className="text-center py-12 text-ui-muted">
            Failed to load analytics data
          </div>
        )}
      </SuperAdminContent>
    </SuperAdminShell>
  );
}
