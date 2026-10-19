"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CatalogAdminShell } from "./_components/CatalogAdminShell";
import { CatalogAdminHeader, CatalogAdminContent } from "./_components/CatalogAdminSidebar";
import { SetupChecklist } from "./_components/SetupChecklist";
import { ADMIN_NAV_LABELS } from "./_components/adminNav";
import { useAdminLang, useCopy, useFormat, plural, type AdminLang } from "./_lib/i18n";
import {
  FolderKanban,
  Package,
  Eye,
  MessageCircle,
  TrendingUp,
  Plus,
  type LucideIcon,
} from "lucide-react";

const en = {
  addDish: "Add a dish",
  categories: "Categories",
  categoriesSub: "Sections on your menu",
  dishes: "Dishes",
  dishesSub: "Dishes on your menu",
  views: "Menu views",
  visitors: (n: number, lang: AdminLang) => plural(lang, n, { one: "# visitor", other: "# visitors" }),
  whatsappClicks: "WhatsApp order clicks",
  whatsappSub: "Guests who tapped to order",
  manageCategories: "Manage categories",
  manageCategoriesDesc: "Organise and reorder the sections of your menu.",
  manageDishes: "Manage dishes",
  manageDishesDesc: "Add, edit or remove dishes on your menu.",
  settings: "Settings",
  settingsDesc: "Update your branding, colours and features.",
  analyticsTitle: "Menu analytics",
  analyticsDesc: "How guests use your menu",
  visitorsLabel: "Visitors",
  bookingClicks: "Booking clicks",
  noData: "No numbers to show yet.",
  loading: "Loading…",
};
const ar: typeof en = {
  addDish: "أضف طبقاً",
  categories: "الأقسام",
  categoriesSub: "أقسام قائمتك",
  dishes: "الأطباق",
  dishesSub: "الأطباق في قائمتك",
  views: "مشاهدات القائمة",
  visitors: (n, lang) =>
    plural(lang, n, { zero: "لا زوار", one: "زائر واحد", two: "زائران", few: "# زوار", many: "# زائراً", other: "# زائر" }),
  whatsappClicks: "نقرات الطلب عبر واتساب",
  whatsappSub: "زبائن ضغطوا للطلب",
  manageCategories: "إدارة الأقسام",
  manageCategoriesDesc: "نظّم أقسام قائمتك وغيّر ترتيبها.",
  manageDishes: "إدارة الأطباق",
  manageDishesDesc: "أضف أطباق قائمتك أو عدّلها أو احذفها.",
  settings: "الإعدادات",
  settingsDesc: "حدّث هويتك وألوانك وميزات قائمتك.",
  analyticsTitle: "إحصاءات القائمة",
  analyticsDesc: "كيف يستخدم الزبائن قائمتك",
  visitorsLabel: "الزوار",
  bookingClicks: "نقرات الحجز",
  noData: "لا توجد أرقام لعرضها بعد.",
  loading: "جارٍ التحميل…",
};

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
  icon: LucideIcon;
  label: string;
  value: number | string;
  subtext?: string;
  trend?: string;
}) {
  return (
    <div className="glass-card p-4 sm:p-8 group relative overflow-hidden">
      <div className="absolute top-0 end-0 w-32 h-32 rounded-full -translate-y-1/2 translate-x-1/2 rtl:-translate-x-1/2 opacity-10 transition-opacity group-hover:opacity-20"
           style={{ backgroundColor: `var(--color-primary)` }} />

      <div className="relative z-10 flex items-start justify-between">
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-ui-muted">
              {label}
            </span>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl sm:text-4xl font-semibold text-ui-heading tabular-nums">
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
          <Icon className="w-6 h-6" aria-hidden />
        </div>
      </div>
    </div>
  );
}

export default function CatalogAdminDashboard() {
  const params = useParams();
  const slug = params.slug as string;
  const lang = useAdminLang();
  const t = useCopy({ en, ar });
  const f = useFormat();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem(`catalog_admin_token_${slug}`);
      if (!token) return;

      try {
        const res = await fetch(`/api/c/${slug}/admin/stats/`, {
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

  // SUM() comes back as null when there are no analytics rows yet
  const n = (value: unknown) => Number(value) || 0;

  return (
    <CatalogAdminShell>
      <CatalogAdminHeader title={ADMIN_NAV_LABELS[lang].dashboard}>
        <Link
          href={`/c/${slug}/admin/items?new=true`}
          className="group relative flex items-center gap-3 px-6 py-3.5 bg-ui-primary text-ui-primary-fg rounded-control transition-all duration-500 font-semibold text-xs overflow-hidden shadow-lg"
        >
          <Plus className="w-4 h-4" aria-hidden />
          {t.addDish}
        </Link>
      </CatalogAdminHeader>

      <CatalogAdminContent>
        <SetupChecklist />
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8" role="status" aria-label={t.loading}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass rounded-panel p-5 sm:p-8 lg:p-10">
                <div className="h-2 bg-ui-subtle rounded w-20 mb-4" />
                <div className="h-10 bg-ui-subtle rounded w-32" />
              </div>
            ))}
          </div>
        ) : stats ? (
          <div className="space-y-6 sm:space-y-12">
            {/* Key numbers */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
              <StatCard
                icon={FolderKanban}
                label={t.categories}
                value={f.number(n(stats.categories))}
                subtext={t.categoriesSub}
              />
              <StatCard
                icon={Package}
                label={t.dishes}
                value={f.number(n(stats.items))}
                subtext={t.dishesSub}
              />
              <StatCard
                icon={Eye}
                label={t.views}
                value={f.number(n(stats.analytics.total_views))}
                subtext={t.visitors(n(stats.analytics.total_unique), lang)}
              />
              <StatCard
                icon={MessageCircle}
                label={t.whatsappClicks}
                value={f.number(n(stats.analytics.total_whatsapp))}
                subtext={t.whatsappSub}
              />
            </div>

            {/* Shortcuts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6">
              {[
                {
                  href: `/c/${slug}/admin/categories`,
                  icon: FolderKanban,
                  title: t.manageCategories,
                  desc: t.manageCategoriesDesc,
                  color: "var(--color-primary)"
                },
                {
                  href: `/c/${slug}/admin/items`,
                  icon: Package,
                  title: t.manageDishes,
                  desc: t.manageDishesDesc,
                  color: "var(--color-secondary)"
                },
                {
                  href: `/c/${slug}/admin/settings`,
                  icon: TrendingUp,
                  title: t.settings,
                  desc: t.settingsDesc,
                  color: "var(--color-accent)"
                }
              ].map((action, i) => (
                <Link
                  key={i}
                  href={action.href}
                  className="group relative p-5 sm:p-8 glass rounded-panel border border-ui-line hover:border-ui-input transition-all duration-500 overflow-hidden"
                >
                  <div className="absolute top-0 end-0 w-32 h-32 rounded-full -translate-y-1/2 translate-x-1/2 rtl:-translate-x-1/2 opacity-0 group-hover:opacity-10 transition-opacity"
                       style={{ backgroundColor: action.color }} />

                  <div className="flex flex-row md:flex-col items-center md:items-start gap-4 md:gap-6 relative z-10">
                    <div className="w-12 h-12 md:w-14 md:h-14 shrink-0 rounded-control bg-ui-bg border border-ui-line flex items-center justify-center transition-all group-hover:border-ui-input">
                      <action.icon className="w-6 h-6 text-ui-muted group-hover:text-ui-ink" aria-hidden />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-ui-heading group-hover:text-ui-primary transition-colors">{action.title}</h3>
                      <p className="text-xs font-semibold text-ui-muted mt-2 leading-relaxed">
                        {action.desc}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Analytics overview */}
            <div className="glass rounded-panel border border-ui-line overflow-hidden">
              <div className="px-5 sm:px-10 py-5 sm:py-8 border-b border-ui-line flex items-center justify-between bg-ui-bg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-ui-subtle flex items-center justify-center text-ui-primary">
                    <TrendingUp className="w-5 h-5" aria-hidden />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-ui-heading">{t.analyticsTitle}</h2>
                    <p className="text-xs font-semibold text-ui-muted mt-1">{t.analyticsDesc}</p>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-8 lg:p-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-8">
                  {[
                    { label: t.views, val: stats.analytics.total_views },
                    { label: t.visitorsLabel, val: stats.analytics.total_unique },
                    { label: t.whatsappClicks, val: stats.analytics.total_whatsapp },
                    { label: t.bookingClicks, val: stats.analytics.total_bookings }
                  ].map((stat, i) => (
                    <div key={i} className="bg-ui-bg rounded-panel p-4 sm:p-8 border border-ui-line hover:border-ui-input transition-all text-center group">
                      <p className="text-2xl sm:text-4xl font-semibold text-ui-ink tabular-nums">
                        {f.number(n(stat.val))}
                      </p>
                      <p className="text-xs font-semibold text-ui-muted mt-4 leading-snug">
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
            <TrendingUp className="w-16 h-16 text-ui-line mx-auto mb-6" aria-hidden />
            <p className="text-xs font-semibold text-ui-muted">{t.noData}</p>
          </div>
        )}
      </CatalogAdminContent>
    </CatalogAdminShell>
  );
}
