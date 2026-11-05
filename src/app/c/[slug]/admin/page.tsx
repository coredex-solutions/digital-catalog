"use client";

import { useEffect, useMemo, useState } from "react";
import type { ModuleDefinition } from "@/lib/modules/registry";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CatalogAdminShell, useCatalogAdmin } from "./_components/CatalogAdminShell";
import { pageWord, useModule } from "./_lib/module";
import { CatalogAdminHeader, CatalogAdminContent } from "./_components/CatalogAdminSidebar";
import { SetupChecklist } from "./_components/SetupChecklist";
import { ADMIN_NAV_LABELS } from "./_components/adminNav";
import { Inbox, Banknote } from "lucide-react";
import { useAdminLang, useCopy, useFormat, plural, type AdminLang } from "./_lib/i18n";
import {
  FolderKanban,
  Package,
  Eye,
  TrendingUp,
  Plus,
  type LucideIcon,
} from "lucide-react";

/** Dashboard text with the module's words (dishes / items / products / services, menu / store / page) */
function makeEn(module: ModuleDefinition) {
  const n = module.nouns.en;
  const page = pageWord(module, "en");
  const One = n.one.charAt(0).toUpperCase() + n.one.slice(1);
  const Many = n.many.charAt(0).toUpperCase() + n.many.slice(1);
  return {
    addDish: `Add ${n.one === "item" ? "an item" : `a ${n.one}`}`,
    categories: "Categories",
    categoriesSub: `Sections of your ${page}`,
    dishes: Many,
    dishesSub: `${Many} on your ${page}`,
    orders: module.id === "services" ? "Requests (30 days)" : module.nights ? "Bookings (30 days)" : "Orders (30 days)",
    ordersSub: (waiting: number, bookings: number, lang: AdminLang) =>
      [
        waiting > 0 ? plural(lang, waiting, { one: "# waiting", other: "# waiting" }) : "",
        bookings > 0 ? plural(lang, bookings, { one: "+ # table booking", other: "+ # table bookings" }) : "",
      ].filter(Boolean).join(" · ") || "Saved from your page",
    revenue: "Sales (30 days)",
    revenueSub: "Orders not cancelled, in dollars",
    views: "Page views",
    visitors: (x: number, lang: AdminLang) => plural(lang, x, { one: "# visitor", other: "# visitors" }),
    whatsappClicks: "WhatsApp order clicks",
    manageCategories: "Manage categories",
    manageCategoriesDesc: `Organise and reorder the sections of your ${page}.`,
    manageDishes: `Manage ${n.many}`,
    manageDishesDesc: `Add, edit or remove ${n.many}.`,
    manageOrders: module.id === "services" ? "Requests" : module.nights ? "Bookings" : "Orders",
    manageOrdersDesc: "Confirm, complete or cancel what customers send.",
    settings: "Settings",
    settingsDesc: "Update your branding, colours and features.",
    analyticsTitle: `${page.charAt(0).toUpperCase() + page.slice(1)} analytics`,
    analyticsDesc: `How customers use your ${page}`,
    visitorsLabel: "Visitors",
    bookingClicks: "Booking clicks",
    noData: "No numbers to show yet.",
    loading: "Loading…",
    one: One,
  };
}

function makeAr(module: ModuleDefinition): ReturnType<typeof makeEn> {
  const n = module.nouns.ar;
  const page = pageWord(module, "ar");
  return {
    addDish: `أضف ${n.acc}`,
    categories: "الأقسام",
    categoriesSub: `أقسام ${page}`,
    dishes: `ال${n.plural}`,
    dishesSub: `ال${n.plural} في ${page}`,
    orders: module.nights ? "الحجوزات (30 يوماً)" : "الطلبات (30 يوماً)",
    ordersSub: (waiting, bookings, lang) =>
      [
        waiting > 0 ? plural(lang, waiting, { one: "طلب واحد بانتظارك", two: "طلبان بانتظارك", few: "# طلبات بانتظارك", many: "# طلباً بانتظارك", other: "# طلب بانتظارك" }) : "",
        bookings > 0 ? plural(lang, bookings, { one: "+ حجز طاولة واحد", two: "+ حجزا طاولة", few: "+ # حجوزات طاولات", many: "+ # حجزاً", other: "+ # حجز" }) : "",
      ].filter(Boolean).join(" · ") || "محفوظة من صفحتك",
    revenue: "المبيعات (30 يوماً)",
    revenueSub: "الطلبات غير الملغاة، بالدولار",
    views: "مشاهدات الصفحة",
    visitors: (x, lang) =>
      plural(lang, x, { zero: "لا زوار", one: "زائر واحد", two: "زائران", few: "# زوار", many: "# زائراً", other: "# زائر" }),
    whatsappClicks: "نقرات الطلب عبر واتساب",
    manageCategories: "إدارة الأقسام",
    manageCategoriesDesc: `نظّم أقسام ${page} وغيّر ترتيبها.`,
    manageDishes: `إدارة ال${n.plural}`,
    manageDishesDesc: `أضف ${n.plural}ك أو عدّلها أو احذفها.`,
    manageOrders: module.nights ? "الحجوزات" : "الطلبات",
    manageOrdersDesc: "أكّد ما يرسله الزبائن أو أنهِه أو ألغِه.",
    settings: "الإعدادات",
    settingsDesc: "حدّث هويتك وألوانك وميزاتك.",
    analyticsTitle: "الإحصاءات",
    analyticsDesc: `كيف يستخدم الزبائن ${page}`,
    visitorsLabel: "الزوار",
    bookingClicks: "نقرات الحجز",
    noData: "لا توجد أرقام لعرضها بعد.",
    loading: "جارٍ التحميل…",
    one: n.one,
  };
}

interface DashboardStats {
  categories: number;
  items: number;
  analytics: {
    total_views: number;
    total_unique: number;
    total_whatsapp: number;
    total_bookings: number;
  };
  orders_30d?: { orders: number; bookings: number; waiting: number; revenue_usd: number };
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
  return (
    <CatalogAdminShell>
      <DashboardView />
    </CatalogAdminShell>
  );
}

function DashboardView() {
  const params = useParams();
  const slug = params.slug as string;
  const lang = useAdminLang();
  const { module } = useModule();
  const { newOrders } = useCatalogAdmin();
  const copy = useMemo(() => ({ en: makeEn(module), ar: makeAr(module) }), [module]);
  const t = useCopy(copy);
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

  const orders = stats?.orders_30d;

  return (
    <>
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
                icon={Inbox}
                label={t.orders}
                value={f.number(n(orders?.orders))}
                subtext={t.ordersSub(Math.max(newOrders, n(orders?.waiting)), n(orders?.bookings), lang)}
              />
              <StatCard
                icon={Banknote}
                label={t.revenue}
                value={`$${f.number(n(orders?.revenue_usd), { maximumFractionDigits: 0 })}`}
                subtext={t.revenueSub}
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
            </div>

            {/* Shortcuts */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-6">
              {[
                {
                  href: `/c/${slug}/admin/orders`,
                  icon: Inbox,
                  title: t.manageOrders,
                  desc: t.manageOrdersDesc,
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
                  href: `/c/${slug}/admin/categories`,
                  icon: FolderKanban,
                  title: t.manageCategories,
                  desc: t.manageCategoriesDesc,
                  color: "var(--color-accent)"
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
    </>
  );
}
