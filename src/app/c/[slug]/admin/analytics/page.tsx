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
import { useAdminLang, useCopy, useFormat } from "../_lib/i18n";
import { ADMIN_NAV_LABELS } from "../_components/adminNav";

const en = {
  period: "Time period",
  periods: { "7d": "Last 7 days", "30d": "Last 30 days", "90d": "Last 90 days" },
  pageViews: "Page views",
  uniqueVisitors: "Unique visitors",
  whatsappOrders: "WhatsApp order clicks",
  bookingClicks: "Booking clicks",
  vsLastPeriod: "vs. the previous period",
  traffic: "Visits over time",
  whatsappBooking: "WhatsApp and booking clicks",
  whatsappShort: "WhatsApp",
  bookingsShort: "Bookings",
  last14: "The last 14 days of the period",
  daily: "Day by day",
  date: "Date",
  views: "Views",
  visitors: "Visitors",
  noData: "No data yet for this period. Visits will show here once guests open your menu.",
  loading: "Loading analytics…",
  loadFailed: "Couldn't load your analytics. Please try again.",
};
const ar: typeof en = {
  period: "الفترة",
  periods: { "7d": "آخر 7 أيام", "30d": "آخر 30 يوماً", "90d": "آخر 90 يوماً" },
  pageViews: "مشاهدات الصفحة",
  uniqueVisitors: "الزوار",
  whatsappOrders: "نقرات الطلب عبر واتساب",
  bookingClicks: "نقرات الحجز",
  vsLastPeriod: "مقارنة بالفترة السابقة",
  traffic: "الزيارات مع الوقت",
  whatsappBooking: "نقرات واتساب والحجز",
  whatsappShort: "واتساب",
  bookingsShort: "الحجوزات",
  last14: "آخر 14 يوماً من الفترة",
  daily: "يوماً بيوم",
  date: "التاريخ",
  views: "المشاهدات",
  visitors: "الزوار",
  noData: "لا توجد بيانات بعد لهذه الفترة. ستظهر الزيارات هنا عندما يفتح الزبائن قائمتك.",
  loading: "جارٍ تحميل الإحصاءات…",
  loadFailed: "تعذّر تحميل الإحصاءات. يُرجى المحاولة مرة أخرى.",
};

type Period = "7d" | "30d" | "90d";
const PERIODS: Period[] = ["7d", "30d", "90d"];

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
  const t = useCopy({ en, ar });
  const f = useFormat();
  const isPositive = change !== undefined && change >= 0;

  return (
    <div className="bg-ui-bg rounded-control p-4 sm:p-6 border border-ui-line">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-ui-muted text-sm font-medium">{label}</p>
          <p className="text-2xl sm:text-3xl font-bold text-ui-ink mt-1 tabular-nums">
            {f.number(value)}
          </p>
          {change !== undefined && (
            <div className="flex flex-wrap items-center gap-1 mt-2">
              {isPositive ? (
                <TrendingUp className="w-4 h-4 text-ui-success rtl:-scale-x-100" aria-hidden />
              ) : (
                <TrendingDown className="w-4 h-4 text-ui-primary rtl:-scale-x-100" aria-hidden />
              )}
              <span dir="ltr" className={isPositive ? "text-ui-success" : "text-ui-primary"}>
                {isPositive ? "+" : ""}
                {f.number(change, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
              </span>
              <span className="text-ui-muted text-sm">{t.vsLastPeriod}</span>
            </div>
          )}
        </div>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-6 h-6" style={{ color }} aria-hidden />
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const t = useCopy({ en, ar });
  const lang = useAdminLang();
  const f = useFormat();
  const isRtl = lang === "ar";

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("30d");

  // Charts are drawn inside a dir="ltr" box (SVG text anchors flip under dir="rtl" and the
  // tick labels would overlap the axes) and mirrored by hand in Arabic: time runs right to
  // left like the reading direction (oldest day on the right, newest on the left), the value
  // axis sits on the right, and the legend and tooltip read right to left.
  const shortDate = (date: string) => f.date(date, { timeZone: "UTC", month: "short", day: "numeric" });
  const tooltipProps = {
    contentStyle: {
      backgroundColor: "var(--ui-surface)",
      border: "1px solid var(--ui-line)",
      borderRadius: "10px",
      color: "var(--ui-ink)",
      direction: isRtl ? ("rtl" as const) : ("ltr" as const),
      textAlign: isRtl ? ("right" as const) : ("left" as const),
    },
    formatter: (value: unknown) => (typeof value === "number" ? f.number(value) : String(value ?? "")),
  };
  // Own legend: Recharts labels its legend icons "… legend icon" in English for screen readers
  const legend = (
    <Legend
      content={({ payload }) => (
        <ul dir={isRtl ? "rtl" : "ltr"} className="mt-2 flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm text-ui-muted">
          {payload?.map((entry) => (
            <li key={String(entry.value)} className="flex items-center gap-1.5">
              <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.value}
            </li>
          ))}
        </ul>
      )}
    />
  );
  const chartMargin = { top: 10, right: 10, left: 10, bottom: 0 };
  const xAxisProps = { dataKey: "date", stroke: "#64748b", tickLine: false, reversed: isRtl };
  const yAxisProps = {
    stroke: "#64748b",
    fontSize: 12,
    tickLine: false,
    axisLine: false,
    allowDecimals: false,
    orientation: isRtl ? ("right" as const) : ("left" as const),
    tickFormatter: (v: number) => f.number(v),
  };

  useEffect(() => {
    const fetchAnalytics = async () => {
      const token = localStorage.getItem(`catalog_admin_token_${slug}`);
      // No token: the shell is already sending the owner to sign in
      if (!token) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(
          `/api/c/${slug}/admin/analytics/?period=${period}`,
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

  const hasDays = !!analytics && analytics.daily.length > 0;

  return (
    <CatalogAdminShell>
      <CatalogAdminHeader title={ADMIN_NAV_LABELS[lang].analytics}>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as Period)}
          aria-label={t.period}
          className="min-h-11 px-4 py-2 bg-ui-bg border border-ui-input rounded-xl text-ui-ink focus:outline-none"
        >
          {PERIODS.map((p) => (
            <option key={p} value={p}>
              {t.periods[p]}
            </option>
          ))}
        </select>
      </CatalogAdminHeader>

      <CatalogAdminContent>
        {loading ? (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6"
            role="status"
            aria-label={t.loading}
          >
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-ui-bg rounded-control p-4 sm:p-6"
                aria-hidden
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
                label={t.pageViews}
                value={analytics.totals.page_views}
                change={analytics.comparison.page_views_change}
                color="var(--color-primary)"
              />
              <StatCard
                icon={Users}
                label={t.uniqueVisitors}
                value={analytics.totals.unique_visitors}
                change={analytics.comparison.unique_visitors_change}
                color="var(--color-secondary)"
              />
              <StatCard
                icon={MessageCircle}
                label={t.whatsappOrders}
                value={analytics.totals.whatsapp_order_clicks}
                change={analytics.comparison.whatsapp_change}
                color="#166534"
              />
              <StatCard
                icon={CalendarCheck}
                label={t.bookingClicks}
                value={analytics.totals.booking_confirm_clicks}
                change={analytics.comparison.booking_change}
                color="var(--color-accent)"
              />
            </div>

            {/* Traffic Chart */}
            <div className="bg-ui-bg rounded-control p-4 sm:p-6 border border-ui-line">
              <h3 className="font-semibold text-ui-heading mb-6 flex items-center gap-2">
                <BarChart3
                  className="w-5 h-5"
                  style={{ color: "var(--color-primary)" }}
                  aria-hidden
                />
                {t.traffic}
              </h3>
              {hasDays ? (
                <div className="h-64 sm:h-80" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={[...analytics.daily].reverse().map((d) => ({
                        ...d,
                        date: shortDate(d.date),
                      }))}
                      margin={chartMargin}
                    >
                      <defs>
                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-secondary)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="var(--color-secondary)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--ui-line)" />
                      <XAxis {...xAxisProps} fontSize={12} />
                      <YAxis {...yAxisProps} />
                      <Tooltip {...tooltipProps} />
                      {legend}
                      <Area
                        type="monotone"
                        dataKey="page_views"
                        name={t.pageViews}
                        stroke="var(--color-primary)"
                        fillOpacity={1}
                        fill="url(#colorViews)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="unique_visitors"
                        name={t.uniqueVisitors}
                        stroke="var(--color-secondary)"
                        fillOpacity={1}
                        fill="url(#colorVisitors)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="py-12 text-center text-sm text-ui-muted">{t.noData}</p>
              )}
            </div>

            {/* Engagement Chart */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-ui-bg rounded-control p-4 sm:p-6 border border-ui-line">
                <h3 className="font-semibold text-ui-heading">{t.whatsappBooking}</h3>
                <p className="mt-1 mb-5 text-sm text-ui-muted">{t.last14}</p>
                {hasDays ? (
                  <div className="h-64" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[...analytics.daily]
                          .reverse()
                          .slice(-14)
                          .map((d) => ({
                            ...d,
                            date: shortDate(d.date),
                          }))}
                        margin={chartMargin}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--ui-line)" />
                        <XAxis {...xAxisProps} fontSize={11} />
                        <YAxis {...yAxisProps} />
                        <Tooltip {...tooltipProps} />
                        {legend}
                        <Bar
                          dataKey="whatsapp_order_clicks"
                          name={t.whatsappShort}
                          fill="#166534"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="booking_confirm_clicks"
                          name={t.bookingsShort}
                          fill="var(--color-accent)"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="py-12 text-center text-sm text-ui-muted">{t.noData}</p>
                )}
              </div>

              {/* Daily Table */}
              <div className="bg-ui-bg rounded-control p-4 sm:p-6 border border-ui-line">
                <h3 className="font-semibold text-ui-heading mb-4">{t.daily}</h3>
                <div className="overflow-y-auto max-h-64">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-ui-surface">
                      <tr className="text-ui-muted border-b border-ui-line">
                        <th className="text-start py-2 px-2">{t.date}</th>
                        <th className="text-end py-2 px-2">{t.views}</th>
                        <th className="text-end py-2 px-2">{t.visitors}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.daily.map((day) => (
                        <tr
                          key={day.date}
                          className="border-b border-ui-line hover:bg-ui-subtle"
                        >
                          <td className="py-2 px-2 text-ui-ink">
                            {f.date(day.date, {
                              timeZone: "UTC",
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </td>
                          <td className="text-end py-2 px-2 text-ui-ink tabular-nums">
                            {f.number(day.page_views)}
                          </td>
                          <td className="text-end py-2 px-2 text-ui-ink tabular-nums">
                            {f.number(day.unique_visitors)}
                          </td>
                        </tr>
                      ))}
                      {analytics.daily.length === 0 && (
                        <tr>
                          <td
                            colSpan={3}
                            className="text-center py-5 sm:py-8 text-ui-muted"
                          >
                            {t.noData}
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
          <div className="text-center text-ui-muted py-12" role="alert">
            {t.loadFailed}
          </div>
        )}
      </CatalogAdminContent>
    </CatalogAdminShell>
  );
}
