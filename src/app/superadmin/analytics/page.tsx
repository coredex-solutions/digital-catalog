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
    const colors = {
      emerald: "from-violet-500 to-violet-600",
      blue: "from-violet-500 to-violet-600",
      amber: "from-purple-500 to-purple-600",
      purple: "from-purple-500 to-purple-600",
    };

    const isPositive = change >= 0;

    return (
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
        <div className="flex items-start justify-between mb-4">
          <div
            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center shadow-lg`}
          >
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              isPositive
                ? "bg-violet-500/10 text-violet-400"
                : "bg-purple-500/10 text-purple-400"
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
        <p className="text-3xl font-bold text-white mb-1">
          {value.toLocaleString()}
        </p>
        <p className="text-slate-400 text-sm">{label}</p>
      </div>
    );
  };

  return (
    <SuperAdminShell>
      <SuperAdminHeader title="Platform Analytics">
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-800/50 rounded-lg p-1">
            {(["7d", "30d", "90d"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  dateRange === range
                    ? "bg-violet-500 text-white"
                    : "text-slate-400 hover:text-white"
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
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
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
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-700/50">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-violet-500" />
                  Top Performing Catalogs
                </h3>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left px-6 py-3 text-slate-400 font-medium text-sm">
                      Catalog
                    </th>
                    <th className="text-right px-6 py-3 text-slate-400 font-medium text-sm">
                      Views
                    </th>
                    <th className="text-right px-6 py-3 text-slate-400 font-medium text-sm">
                      WhatsApp
                    </th>
                    <th className="text-right px-6 py-3 text-slate-400 font-medium text-sm">
                      Bookings
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.top_catalogs.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-8 text-center text-slate-500"
                      >
                        No data available
                      </td>
                    </tr>
                  ) : (
                    stats.top_catalogs.map((catalog, index) => (
                      <tr
                        key={catalog.id}
                        className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                index === 0
                                  ? "bg-purple-500 text-black"
                                  : index === 1
                                  ? "bg-slate-400 text-black"
                                  : index === 2
                                  ? "bg-purple-700 text-white"
                                  : "bg-slate-700 text-slate-400"
                              }`}
                            >
                              {index + 1}
                            </span>
                            <div>
                              <p className="font-medium text-white">
                                {catalog.name}
                              </p>
                              <p className="text-sm text-slate-500">
                                /{catalog.slug}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-white font-medium">
                          {catalog.views.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right text-white font-medium">
                          {catalog.whatsapp_clicks.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right text-white font-medium">
                          {catalog.bookings.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Simple Chart Placeholder */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-violet-500" />
                Daily Performance
              </h3>
              <div className="h-64 flex items-center justify-center text-slate-500">
                <p>Chart visualization would go here</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            Failed to load analytics data
          </div>
        )}
      </SuperAdminContent>
    </SuperAdminShell>
  );
}
