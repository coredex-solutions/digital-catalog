"use client";

import { useCallback, useEffect, useState, createContext, useContext } from "react";
import Link from "next/link";
import { useRouter, useParams, usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CatalogAdminSidebar } from "./CatalogAdminSidebar";
import { CatalogAdminTopBar, CatalogAdminBottomNav } from "./CatalogAdminMobileNav";
import { Loader2, Zap, MessageCircle, CreditCard, AlertTriangle, Rocket } from "lucide-react";
import { SALES_WHATSAPP } from "@/lib/contact";
import { useAdminLang, useCopy, useFormat, plural, type AdminLang } from "../_lib/i18n";
import { translateApiMessage } from "../_lib/api-errors";

const en = {
  loading: "Loading your dashboard…",
  pausedShort: "Your menu is paused.",
  pausedShortBody: "It is offline and changes can't be saved until you renew.",
  renew: "Renew plan",
  endedShort: "Your plan has ended.",
  endedBody: (date: string) => `Your menu stays online until ${date}. Renew before then to keep it running.`,
  changes: (n: number, lang: AdminLang) => plural(lang, n, { one: "# unpublished change.", other: "# unpublished changes." }),
  changesBody: "Guests don't see them yet.",
  reviewPublish: "Review & publish",
  pausedTitle: "Your menu is paused",
  pausedBody: "Your plan has ended, so your menu is offline and changes can't be saved. Renew your plan to bring it back.",
  goBilling: "Go to Plan & billing",
  whatsapp: "Contact us on WhatsApp",
  whatsappText: (slug: string) => `Hello, I want to renew the Coredex plan for my menu "${slug}".`,
  readOnly: "View dashboard (read-only)",
  reference: "Reference:",
};
const ar: typeof en = {
  loading: "جارٍ تحميل لوحة التحكم…",
  pausedShort: "قائمتك متوقفة.",
  pausedShortBody: "هي غير متاحة للزبائن ولا يمكن حفظ التعديلات حتى تجدّد باقتك.",
  renew: "تجديد الباقة",
  endedShort: "انتهت باقتك.",
  endedBody: (date) => `تبقى قائمتك متاحة حتى ${date}. جدّد قبل ذلك لتبقى تعمل.`,
  changes: (n, lang) =>
    plural(lang, n, {
      one: "تعديل واحد غير منشور.",
      two: "تعديلان غير منشورين.",
      few: "# تعديلات غير منشورة.",
      many: "# تعديلاً غير منشور.",
      other: "# تعديل غير منشور.",
    }),
  changesBody: "لا يراها الزبائن بعد.",
  reviewPublish: "مراجعة ونشر",
  pausedTitle: "قائمتك متوقفة",
  pausedBody: "انتهت باقتك، لذلك القائمة غير متاحة للزبائن ولا يمكن حفظ التعديلات. جدّد باقتك لإعادتها.",
  goBilling: "الانتقال إلى الباقة والدفع",
  whatsapp: "تواصل معنا على واتساب",
  whatsappText: (slug) => `مرحباً، أريد تجديد باقة Coredex لقائمتي "${slug}".`,
  readOnly: "عرض لوحة التحكم (للقراءة فقط)",
  reference: "الرقم المرجعي:",
};

interface CatalogInfo {
  id: string;
  slug: string;
  name: string;
  business_type: string;
}

interface Features {
  booking_enabled: boolean;
  analytics_enabled: boolean;
  ai_waiter_enabled: boolean;
  ai_image_enhancement_limit: number;
  ai_image_enhancement_used: number;
  max_items: number;
  max_categories: number;
  enabled_languages: string;
  default_language: string;
  is_expired: boolean;
  /** The plan has ended but the menu stays online until offline_at */
  in_grace?: boolean;
  /** When the current plan ends; null when it has no end date */
  expires_at?: string | null;
  plan_ended_at?: string | null;
  offline_at?: string | null;
  subscription_type: string;
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'owner' | 'viewer';
}

interface AdminContextType {
  slug: string;
  catalog: CatalogInfo | null;
  user: AdminUser | null;
  features: Features | null;
  getToken: () => string | null;
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>;
}

const AdminContext = createContext<AdminContextType | null>(null);

interface CatalogAdminShellProps {
  children: React.ReactNode;
}

export function CatalogAdminShell({ children }: CatalogAdminShellProps) {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const lang = useAdminLang();
  const t = useCopy({ en, ar });
  const format = useFormat();

  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [catalog, setCatalog] = useState<CatalogInfo | null>(null);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [features, setFeatures] = useState<Features | null>(null);
  const pathname = usePathname();
  // The paused notice is dismissible (the dashboard stays readable) and never covers Billing,
  // which is where owners renew.
  const [pausedDismissed, setPausedDismissed] = useState(false);
  const onBillingPage = pathname?.startsWith(`/c/${slug}/admin/billing`) ?? false;
  const showPausedModal = !!features?.is_expired && !pausedDismissed && !onBillingPage;

  // One stable function, so pages that load data with it don't refetch on every shell render.
  // The APIs answer in English; in Arabic, their error and message texts are translated here.
  const fetchWithAuth = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem(`catalog_admin_token_${slug}`);
    const res = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
    if (lang === "ar") {
      const readJson = res.json.bind(res);
      res.json = async () => {
        const data = await readJson();
        if (data && typeof data === "object") {
          if (typeof data.error === "string") data.error = translateApiMessage(data.error, "ar");
          if (typeof data.message === "string") data.message = translateApiMessage(data.message, "ar", { fallback: false });
        }
        return data;
      };
    }
    return res;
  }, [slug, lang]);

  // Unpublished menu changes: shown as a bar on every page except the publish page itself.
  // Refreshed on navigation, when the tab regains focus and when a page announces a change.
  const [draftChanges, setDraftChanges] = useState(0);
  const onPublishPage = pathname?.startsWith(`/c/${slug}/admin/publish`) ?? false;
  useEffect(() => {
    if (!authenticated) return;
    let cancelled = false;
    const refresh = () => {
      fetchWithAuth(`/api/c/${slug}/admin/publish/`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!cancelled) setDraftChanges(data?.hasUnpublishedChanges ? data.changes.length : 0);
        })
        .catch(() => {});
    };
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("menu-draft-changed", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", refresh);
      window.removeEventListener("menu-draft-changed", refresh);
    };
  }, [authenticated, pathname, slug, fetchWithAuth]);

  useEffect(() => {
    if (!showPausedModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPausedDismissed(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showPausedModal]);

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem(`catalog_admin_token_${slug}`);

      if (!token) {
        router.push(`/login/?r=${slug}`);
        return;
      }

      try {
        const res = await fetch(`/api/c/${slug}/auth/verify/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Invalid token");
        }

        const data = await res.json();
        setCatalog(data.catalog);
        setUser(data.user);
        setFeatures(data.features);
        setAuthenticated(true);
      } catch {
        localStorage.removeItem(`catalog_admin_token_${slug}`);
        router.push(`/login/?r=${slug}`);
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, [router, slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-ui-bg flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border border-ui-line animate-ping absolute inset-0" />
          <Loader2 className="w-16 h-16 text-ui-primary animate-spin relative z-10" />
        </div>
        <p className="text-sm font-medium text-ui-muted" role="status">
          {t.loading}
        </p>
      </div>
    );
  }

  if (!authenticated || !catalog) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-ui-bg selection:bg-ui-subtle selection:text-ui-ink">

      <AdminContext.Provider
        value={{
          slug,
          catalog,
          user,
          features,
          getToken: () => localStorage.getItem(`catalog_admin_token_${slug}`),
          fetchWithAuth,
        }}
      >
        <CatalogAdminSidebar catalog={catalog} features={features} />
        <div className="flex-1 min-w-0 lg:ms-64 relative min-h-screen pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
          <CatalogAdminTopBar slug={slug} catalogName={catalog.name} />

          {features?.is_expired && !showPausedModal && (
            <div
              role="status"
              className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-ui-line bg-ui-surface px-4 py-3 sm:px-6 lg:px-10"
            >
              <AlertTriangle className="h-5 w-5 shrink-0 text-ui-warning" aria-hidden />
              <p className="min-w-0 flex-1 text-sm text-ui-ink">
                <span className="font-semibold">{t.pausedShort}</span>{" "}
                <span className="text-ui-muted">{t.pausedShortBody}</span>
              </p>
              {!onBillingPage && (
                <Link
                  href={`/c/${slug}/admin/billing`}
                  className="inline-flex min-h-11 items-center gap-2 rounded-control bg-ui-primary px-4 text-sm font-semibold text-ui-primary-fg hover:bg-ui-primary-hover"
                >
                  <CreditCard className="h-4 w-4" aria-hidden />
                  {t.renew}
                </Link>
              )}
            </div>
          )}

          {features?.in_grace && features.offline_at && (
            <div role="status" className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-ui-line bg-ui-surface px-4 py-3 sm:px-6 lg:px-10">
              <AlertTriangle className="h-5 w-5 shrink-0 text-ui-warning" aria-hidden />
              <p className="min-w-0 flex-1 text-sm">
                <span className="font-semibold">{t.endedShort}</span>{" "}
                <span className="text-ui-muted">{t.endedBody(format.date(features.offline_at))}</span>
              </p>
              {!onBillingPage && (
                <Link
                  href={`/c/${slug}/admin/billing`}
                  className="inline-flex min-h-11 items-center gap-2 rounded-control bg-ui-primary px-4 text-sm font-semibold text-ui-primary-fg hover:bg-ui-primary-hover"
                >
                  <CreditCard className="h-4 w-4" aria-hidden />
                  {t.renew}
                </Link>
              )}
            </div>
          )}

          {draftChanges > 0 && !onPublishPage && (
            <div role="status" className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-ui-line bg-ui-subtle px-4 py-2.5 sm:px-6 lg:px-10">
              <Rocket className="h-4 w-4 shrink-0 text-ui-primary" aria-hidden />
              <p className="min-w-0 flex-1 text-sm">
                <span className="font-semibold">{t.changes(draftChanges, lang)}</span>{" "}
                <span className="text-ui-muted">{t.changesBody}</span>
              </p>
              <Link
                href={`/c/${slug}/admin/publish`}
                className="inline-flex min-h-11 items-center rounded-control bg-ui-primary px-4 text-sm font-semibold text-ui-primary-fg hover:bg-ui-primary-hover"
              >
                {t.reviewPublish}
              </Link>
            </div>
          )}

          {children}

          {/* Expiration Modal */}
          <AnimatePresence>
            {showPausedModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center sm:p-6 bg-black/40"
              >
                <motion.div
                  role="alertdialog"
                  aria-modal="true"
                  aria-labelledby="catalog-paused-title"
                  aria-describedby="catalog-paused-desc"
                  initial={{ y: 20 }}
                  animate={{ y: 0 }}
                  className="w-full sm:max-w-lg max-h-[100dvh] overflow-y-auto bg-ui-surface p-6 sm:p-10 rounded-t-panel sm:rounded-panel border border-ui-line text-center relative"
                  style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
                >
                  <div className="relative z-10">
                    <div className="w-16 h-16 rounded-panel bg-ui-subtle flex items-center justify-center mx-auto mb-6">
                      <Zap className="w-8 h-8 text-ui-primary fill-ui-primary" aria-hidden />
                    </div>

                    <h2 id="catalog-paused-title" className="text-2xl sm:text-3xl font-semibold mb-3">
                      {t.pausedTitle}
                    </h2>

                    <p id="catalog-paused-desc" className="text-ui-muted text-sm mb-8 leading-relaxed">
                      {t.pausedBody}
                    </p>

                    <div className="space-y-3">
                      <Link
                        href={`/c/${slug}/admin/billing`}
                        autoFocus
                        className="w-full min-h-12 py-3 bg-ui-primary text-ui-primary-fg hover:bg-ui-primary-hover rounded-control font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        <CreditCard className="w-5 h-5" aria-hidden />
                        {t.goBilling}
                      </Link>
                      <a
                        href={`https://wa.me/${SALES_WHATSAPP}?text=${encodeURIComponent(t.whatsappText(slug))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full min-h-12 py-3 border border-ui-input text-ui-ink hover:bg-ui-subtle rounded-control font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        <MessageCircle className="w-5 h-5" aria-hidden />
                        {t.whatsapp}
                      </a>
                      <button
                        type="button"
                        onClick={() => setPausedDismissed(true)}
                        className="w-full min-h-11 text-sm font-medium text-ui-muted hover:text-ui-ink rounded-control"
                      >
                        {t.readOnly}
                      </button>

                      <p className="text-xs text-ui-muted pt-1">
                        {t.reference} <span dir="ltr">{catalog.id.split('-')[0]}</span>
                      </p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <CatalogAdminBottomNav slug={slug} catalogName={catalog.name} features={features} />
      </AdminContext.Provider>
    </div>
  );
}

// Export context for child components
export function useCatalogAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useCatalogAdmin must be used within a CatalogAdminShell");
  }
  return context;
}

