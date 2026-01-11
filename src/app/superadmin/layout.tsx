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
    <div className="min-h-screen bg-black text-white selection:bg-primary/30">
      <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-20 pointer-events-none" />
      {children}
    </div>
  );
}

