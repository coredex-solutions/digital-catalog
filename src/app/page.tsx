import { Metadata } from "next";
import { SaaSLandingClient } from "./SaaSLandingClient";

export const metadata: Metadata = {
  title: "Coredex | The Future of Digital Catalogs",
  description: "Experience hyper-dynamic digital catalogs and menu SaaS platform engineered for 2030. Scales your business with multi-tenancy, AI-powered visuals, and seamless QR experiences.",
  openGraph: {
    title: "Coredex | Next-Gen Digital Catalogs",
    description: "Multi-tenant SaaS for restaurants, retail, and hospitality.",
    images: [{ url: "/og-image.webp" }], // Note: You'll need to generate this or I can do it
  },
};

export default function SaasHomePage() {
  return (
    <main className="min-h-screen bg-black text-white selection:bg-primary/30 selection:text-primary">
      {/* Background Mesh */}
      <div className="fixed inset-0 z-[-1] opacity-50">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
      </div>
      
      <SaaSLandingClient />
    </main>
  );
}
