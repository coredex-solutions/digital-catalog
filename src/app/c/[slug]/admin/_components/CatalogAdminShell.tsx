"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { CatalogAdminSidebar } from "./CatalogAdminSidebar";
import { Loader2 } from "lucide-react";

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
  is_expired: boolean;
}

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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--color-primary)" }} />
      </div>
    );
  }

  if (!authenticated || !catalog) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <CatalogAdminSidebar catalog={catalog} features={features} />
      <div className="flex-1 ml-64">{children}</div>
    </div>
  );
}

// Export context for child components
export function useCatalogAdmin() {
  const params = useParams();
  const slug = params.slug as string;

  const getToken = () => localStorage.getItem(`catalog_admin_token_${slug}`);

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const token = getToken();
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  };

  return { slug, getToken, fetchWithAuth };
}

