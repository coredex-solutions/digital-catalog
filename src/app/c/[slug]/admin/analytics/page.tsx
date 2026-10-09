"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CatalogAdminShell } from "../_components/CatalogAdminShell";
import {
  CatalogAdminHeader,
  CatalogAdminContent,
} from "../_components/CatalogAdminSidebar";
import {
  Eye,
  Users,
  MessageCircle,
  CalendarCheck,
  TrendingUp,
  TrendingDown,
  BarChart3,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface DayAnalytics {
  date: string;
  page_views: number;
  unique_visitors: number;
  whatsapp_order_clicks: number;
  booking_confirm_clicks: number;
}

interface AnalyticsData {
  period: string;
  daily: DayAnalytics[];
  totals: {
    page_views: number;
    unique_visitors: number;
    whatsapp_order_clicks: number;
    booking_confirm_clicks: number;
  };
  comparison: {
    page_views_change: number;
    unique_visitors_change: number;
    whatsapp_change: number;
    booking_change: number;
  };
}

function StatCard({
  icon: Icon,
  label,
  value,
  change,
  color = "var(--color-primary)",
}: {
  icon: any;
  label: string;
  value: number;
  change?: number;
  color?: string;
}) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div className="bg-ui-bg rounded-control p-4 sm:p-6 border border-ui-line">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-ui-muted text-sm font-medium">{label}</p>
          <p className="text-2xl sm:text-3xl font-bold text-ui-ink mt-1 tabular-nums">
            {value.toLocaleString()}
          </p>
          {change !== undefined && (
            <div className="flex flex-wrap items-center gap-1 mt-2">
              {isPositive ? (
                <TrendingUp className="w-4 h-4 text-ui-success" />
              ) : (
                <TrendingDown className="w-4 h-4 text-ui-primary" />
              )}
              <span className={isPositive ? "text-ui-success" : "text-ui-primary"}>
                {isPositive ? "+" : ""}
                {change.toFixed(1)}%
              </span>
              <span className="text-ui-muted text-sm">vs last period</span>
            </div>
          )}
        </div>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");

  useEffect(() => {
    const fetchAnalytics = async () => {
      const token = localStorage.getItem(`catalog_admin_token_${slug}`);
      if (!token) return;

      setLoading(true);
      try {
        const res = await fetch(
          `/api/c/${slug}/admin/analytics?period=${period}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (res.ok) {
          const data = await res.json();
          setAnalytics(data);
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [slug, period]);

  return (
    <CatalogAdminShell>
      <CatalogAdminHeader title="Analytics">
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as any)}
          aria-label="Time period"
          className="min-h-11 px-4 py-2 bg-ui-bg border border-ui-input rounded-xl text-ui-ink focus:outline-none"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </CatalogAdminHeader>

      <CatalogAdminContent>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-ui-bg rounded-control p-4 sm:p-6"
              >
                <div className="h-4 bg-ui-surface rounded w-24 mb-3" />
                <div className="h-8 bg-ui-surface rounded w-16" />
              </div>
            ))}
          </div>
        ) : analytics ? (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <StatCard
                icon={Eye}
                label="Page Views"
                value={analytics.totals.page_views}
                change={analytics.comparison.page_views_change}
                color="var(--color-primary)"
              />
              <StatCard
                icon={Users}
                label="Unique Visitors"
                value={analytics.totals.unique_visitors}
                change={analytics.comparison.unique_visitors_change}
                color="var(--color-secondary)"
              />
              <StatCard
                icon={MessageCircle}
                label="WhatsApp Orders"
                value={analytics.totals.whatsapp_order_clicks}
                change={analytics.comparison.whatsapp_change}
                color="#166534"
              />
              <StatCard
                icon={CalendarCheck}
                label="Booking Clicks"
                value={analytics.totals.booking_confirm_clicks}
                change={analytics.comparison.booking_change}
                color="var(--color-accent)"
              />
            </div>

            {/* Traffic Chart */}
            <div className="bg-ui-bg rounded-control p-4 sm:p-6 border border-ui-line">
              <h3 className="font-semibold text-ui-ink mb-6 flex items-center gap-2">
                <BarChart3
                  className="w-5 h-5"
                  style={{ color: "var(--color-primary)" }}
                />
                Traffic Overview
              </h3>
              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={[...analytics.daily].reverse().map((d) => ({
                      ...d,
                      date: new Date(d.date).toLocaleDateString("en-US", {
                        timeZone: "UTC",
                        month: "short",
                        day: "numeric",
                      }),
                    }))}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorViews"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="var(--color-primary)"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--color-primary)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorVisitors"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="var(--color-secondary)"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--color-secondary)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="date"
                      stroke="#64748b"
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="page_views"
                      name="Page Views"
                      stroke="var(--color-primary)"
                      fillOpacity={1}
                      fill="url(#colorViews)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="unique_visitors"
                      name="Unique Visitors"
                      stroke="var(--color-secondary)"
                      fillOpacity={1}
                      fill="url(#colorVisitors)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Engagement Chart */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-ui-bg rounded-control p-4 sm:p-6 border border-ui-line">
                <h3 className="font-semibold text-ui-ink mb-6">
                  WhatsApp & Booking Clicks
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[...analytics.daily]
                        .reverse()
                        .slice(-14)
                        .map((d) => ({
                          ...d,
                          date: new Date(d.date).toLocaleDateString("en-US", {
                            timeZone: "UTC",
                            month: "short",
                            day: "numeric",
                          }),
                        }))}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis
                        dataKey="date"
                        stroke="#64748b"
                        fontSize={11}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#64748b"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1e293b",
                          border: "1px solid #334155",
                          borderRadius: "8px",
                          color: "#fff",
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="whatsapp_order_clicks"
                        name="WhatsApp"
                        fill="#166534"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="booking_confirm_clicks"
                        name="Bookings"
                        fill="var(--color-accent)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Daily Table */}
              <div className="bg-ui-bg rounded-control p-4 sm:p-6 border border-ui-line">
                <h3 className="font-semibold text-ui-ink mb-4">
                  Daily Breakdown
                </h3>
                <div className="overflow-y-auto max-h-64">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-ui-surface">
                      <tr className="text-ui-muted border-b border-ui-line">
                        <th className="text-left py-2 px-2">Date</th>
                        <th className="text-right py-2 px-2">Views</th>
                        <th className="text-right py-2 px-2">Visitors</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.daily.map((day) => (
                        <tr
                          key={day.date}
                          className="border-b border-ui-line hover:bg-ui-subtle"
                        >
                          <td className="py-2 px-2 text-ui-ink">
                            {new Date(day.date).toLocaleDateString("en-US", {
                              timeZone: "UTC",
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </td>
                          <td className="text-right py-2 px-2 text-ui-ink">
                            {day.page_views.toLocaleString()}
                          </td>
                          <td className="text-right py-2 px-2 text-ui-ink">
                            {day.unique_visitors.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                      {analytics.daily.length === 0 && (
                        <tr>
                          <td
                            colSpan={3}
                            className="text-center py-5 sm:py-8 text-ui-muted"
                          >
                            No data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-ui-muted py-12">
            Failed to load analytics data
          </div>
        )}
      </CatalogAdminContent>
    </CatalogAdminShell>
  );
}
