"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if we're on login page - always allow it to render
  // Handle both with and without trailing slash (Next.js config has trailingSlash: true)
  const isLoginPage = pathname === "/admin/login" || pathname === "/admin/login/";

  useEffect(() => {
    // Skip everything for login page
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    // For other pages, check authentication
    const checkAuth = async () => {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        router.push("/admin/login");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok || !data.valid) {
          localStorage.removeItem("admin_token");
          router.push("/admin/login");
          setLoading(false);
          return;
        }

        setIsAuthenticated(true);
        setLoading(false);
      } catch (error) {
        console.error("Auth check error:", error);
        localStorage.removeItem("admin_token");
        router.push("/admin/login");
        setLoading(false);
      }
    };

    checkAuth();
  }, [pathname, router, isLoginPage]);

  // CRITICAL: Always render login page - don't block it
  if (isLoginPage) {
    return <>{children}</>;
  }
  
  // During initial render/SSR, pathname might be null - render children to avoid blocking
  // This allows Next.js to handle routing properly
  if (!pathname) {
    return <>{children}</>;
  }

  // Show loading spinner for other pages while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // For other pages, check authentication
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

