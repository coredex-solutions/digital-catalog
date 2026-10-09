import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Platform admin",
  description: "Manage all catalogs and subscriptions",
  robots: "noindex, nofollow",
};

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div lang="en" dir="ltr" className="platform min-h-screen bg-ui-bg text-ui-ink selection:bg-ui-subtle">
      {children}
    </div>
  );
}

