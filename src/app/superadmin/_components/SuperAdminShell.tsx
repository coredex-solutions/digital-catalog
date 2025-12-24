"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SuperAdminSidebar } from "./SuperAdminSidebar";
import { Loader2 } from "lucide-react";

interface SuperAdminShellProps {
  children: React.ReactNode;
}

export function SuperAdminShell({ children }: SuperAdminShellProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem("superadmin_token");
      
      if (!token) {
        router.push("/superadmin/login");
        return;
      }

      try {
        const res = await fetch("/api/superadmin/auth/verify", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Invalid token");
        }

        setAuthenticated(true);
      } catch {
        localStorage.removeItem("superadmin_token");
        router.push("/superadmin/login");
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <SuperAdminSidebar />
      <div className="flex-1 ml-64">
        {children}
      </div>
    </div>
  );
}

