"use client";

import { useEffect, useState, createContext, useContext } from "react";
import { useRouter, useParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CatalogAdminSidebar } from "./CatalogAdminSidebar";
import { Loader2, Zap, MessageCircle } from "lucide-react";

interface CatalogInfo {
  id: string;
  slug: string;
  name: string;
  business_type: string;
}

interface Features {
  multi_language_enabled: boolean;
  booking_enabled: boolean;
  analytics_enabled: boolean;
  ai_waiter_enabled: boolean;
  ai_image_enhancement_limit: number;
  ai_image_enhancement_used: number;
  enabled_languages: string;
  default_language: string;
  is_expired: boolean;
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
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border border-primary/20 animate-ping absolute inset-0" />
          <Loader2 className="w-16 h-16 text-primary animate-spin relative z-10" />
        </div>
        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] animate-pulse">
          Establishing Secure Uplink...
        </p>
      </div>
    );
  }

  if (!authenticated || !catalog) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[#050505] selection:bg-primary selection:text-white">
      {/* Background Intelligence Glows */}
      <div className="fixed top-0 -left-1/4 w-1/2 h-1/2 bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 -right-1/4 w-1/2 h-1/2 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />

      <AdminContext.Provider
        value={{
          slug,
          catalog,
          user,
          features,
          getToken: () => localStorage.getItem(`catalog_admin_token_${slug}`),
          fetchWithAuth: async (url: string, options: RequestInit = {}) => {
            const token = localStorage.getItem(`catalog_admin_token_${slug}`);
            return fetch(url, {
              ...options,
              headers: {
                ...options.headers,
                Authorization: `Bearer ${token}`,
              },
            });
          }
        }}
      >
        <CatalogAdminSidebar catalog={catalog} features={features} />
        <div className="flex-1 ml-72 relative min-h-screen">
          {children}

          {/* Expiration Modal */}
          <AnimatePresence>
            {features?.is_expired && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
              >
                <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  className="w-full max-w-lg glass-card p-12 rounded-[3rem] border border-primary/20 text-center relative overflow-hidden"
                >
                  {/* Abstract Background Elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />

                  <div className="relative z-10">
                    <div className="w-20 h-20 rounded-3xl bg-primary/20 flex items-center justify-center mx-auto mb-8 animate-pulse">
                      <Zap className="w-10 h-10 text-primary fill-primary" />
                    </div>

                    <h2 className="text-4xl font-black tracking-tighter mb-4 italic uppercase">
                      Catalog <span className="text-primary not-italic">Paused</span>
                    </h2>

                    <p className="text-white/40 text-sm font-black uppercase tracking-[0.2em] mb-10 leading-relaxed">
                      Your 2-day free trial has reached its final sequence. To keep your catalog live and continue scaling, please upgrade your instance.
                    </p>

                    <div className="space-y-4">
                      <a
                        href={`https://wa.me/966540679669?text=I%20want%20to%20upgrade%20my%20catalog%20${slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-[1.05] active:scale-95 transition-all shadow-xl shadow-white/10 flex items-center justify-center gap-3"
                      >
                        <MessageCircle className="w-5 h-5 fill-black" />
                        Live Support Upgrade
                      </a>

                      <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">
                        Reference ID: {catalog.id.split('-')[0]}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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

