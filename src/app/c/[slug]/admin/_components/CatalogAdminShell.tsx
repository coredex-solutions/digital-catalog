"use client";

import { useCallback, useEffect, useState, createContext, useContext } from "react";
import Link from "next/link";
import { useRouter, useParams, usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CatalogAdminSidebar } from "./CatalogAdminSidebar";
import { CatalogAdminTopBar, CatalogAdminBottomNav } from "./CatalogAdminMobileNav";
import { Loader2, Zap, MessageCircle, CreditCard, AlertTriangle, Rocket } from "lucide-react";

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

  // One stable function, so pages that load data with it don't refetch on every shell render
  const fetchWithAuth = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem(`catalog_admin_token_${slug}`);
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  }, [slug]);

  // Unpublished menu changes: shown as a bar on every page except the publish page itself.
  // Refreshed on navigation, when the tab regains focus and when a page announces a change.
  const [draftChanges, setDraftChanges] = useState(0);
  const onPublishPage = pathname?.startsWith(`/c/${slug}/admin/publish`) ?? false;
  useEffect(() => {
    if (!authenticated) return;
    let cancelled = false;
    const refresh = () => {
      fetchWithAuth(`/api/c/${slug}/admin/publish`)
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
        router.push(`/c/${slug}/admin/login`);
        return;
      }

      try {
        const res = await fetch(`/api/c/${slug}/auth/verify`, {
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
        router.push(`/c/${slug}/admin/login`);
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
        <p className="text-xs font-semibold text-ui-muted">
          Establishing Secure Uplink...
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
        <div className="flex-1 min-w-0 lg:ml-64 relative min-h-screen pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
          <CatalogAdminTopBar slug={slug} catalogName={catalog.name} />

          {features?.is_expired && !showPausedModal && (
            <div
              role="status"
              className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-ui-line bg-ui-surface px-4 py-3 sm:px-6 lg:px-10"
            >
              <AlertTriangle className="h-5 w-5 shrink-0 text-ui-warning" aria-hidden />
              <p className="min-w-0 flex-1 text-sm text-ui-ink">
                <span className="font-semibold">Catalog paused.</span>{" "}
                <span className="text-ui-muted">Your menu is offline and changes can&apos;t be saved until you renew.</span>
              </p>
              {!onBillingPage && (
                <Link
                  href={`/c/${slug}/admin/billing`}
                  className="inline-flex min-h-11 items-center gap-2 rounded-control bg-ui-primary px-4 text-sm font-semibold text-ui-primary-fg hover:bg-ui-primary-hover"
                >
                  <CreditCard className="h-4 w-4" aria-hidden />
                  Renew plan
                </Link>
              )}
            </div>
          )}

          {features?.in_grace && features.offline_at && (
            <div role="status" className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-ui-line bg-ui-surface px-4 py-3 sm:px-6 lg:px-10">
              <AlertTriangle className="h-5 w-5 shrink-0 text-ui-warning" aria-hidden />
              <p className="min-w-0 flex-1 text-sm">
                <span className="font-semibold">Your plan has ended.</span>{" "}
                <span className="text-ui-muted">
                  Your menu stays online until{" "}
                  {new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Beirut", dateStyle: "long" }).format(new Date(features.offline_at))}. Renew
                  before then to keep it running.
                </span>
              </p>
              {!onBillingPage && (
                <Link
                  href={`/c/${slug}/admin/billing`}
                  className="inline-flex min-h-11 items-center gap-2 rounded-control bg-ui-primary px-4 text-sm font-semibold text-ui-primary-fg hover:bg-ui-primary-hover"
                >
                  <CreditCard className="h-4 w-4" aria-hidden />
                  Renew plan
                </Link>
              )}
            </div>
          )}

          {draftChanges > 0 && !onPublishPage && (
            <div role="status" className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-ui-line bg-ui-subtle px-4 py-2.5 sm:px-6 lg:px-10">
              <Rocket className="h-4 w-4 shrink-0 text-ui-primary" aria-hidden />
              <p className="min-w-0 flex-1 text-sm">
                <span className="font-semibold">
                  {draftChanges} unpublished {draftChanges === 1 ? "change" : "changes"}.
                </span>{" "}
                <span className="text-ui-muted">Guests don&apos;t see them yet.</span>
              </p>
              <Link
                href={`/c/${slug}/admin/publish`}
                className="inline-flex min-h-11 items-center rounded-control bg-ui-primary px-4 text-sm font-semibold text-ui-primary-fg hover:bg-ui-primary-hover"
              >
                Review &amp; publish
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
                      Catalog <span className="text-ui-primary">Paused</span>
                    </h2>

                    <p id="catalog-paused-desc" className="text-ui-muted text-sm mb-8 leading-relaxed">
                      Your free trial has ended, so your menu is offline and changes can&apos;t be saved. Renew your plan to bring it back.
                    </p>

                    <div className="space-y-3">
                      <Link
                        href={`/c/${slug}/admin/billing`}
                        autoFocus
                        className="w-full min-h-12 py-3 bg-ui-primary text-ui-primary-fg hover:bg-ui-primary-hover rounded-control font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        <CreditCard className="w-5 h-5" aria-hidden />
                        Go to Billing
                      </Link>
                      <a
                        href={`https://wa.me/966540679669?text=I%20want%20to%20upgrade%20my%20catalog%20${slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full min-h-12 py-3 border border-ui-input text-ui-ink hover:bg-ui-subtle rounded-control font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        <MessageCircle className="w-5 h-5" aria-hidden />
                        Contact support on WhatsApp
                      </a>
                      <button
                        type="button"
                        onClick={() => setPausedDismissed(true)}
                        className="w-full min-h-11 text-sm font-medium text-ui-muted hover:text-ui-ink rounded-control"
                      >
                        View dashboard (read-only)
                      </button>

                      <p className="text-xs text-ui-muted pt-1">
                        Reference ID: {catalog.id.split('-')[0]}
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

