import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Super Admin | Digital Catalog SaaS",
  description: "Manage all catalogs and subscriptions",
  robots: "noindex, nofollow",
};

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {children}
    </div>
  );
}

