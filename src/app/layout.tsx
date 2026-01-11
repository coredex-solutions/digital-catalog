import type { Metadata } from "next";
import { Cairo, Inter, Outfit } from "next/font/google";
import { AppProvider } from "../providers/AppProvider";
import { GlobalModalsWrapper } from "./_components/GlobalModalsWrapper";
import { TopLoadingBar } from "../components/TopLoadingBar";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-cairo",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://coredex.digital"
  ),
  title: {
    default: "Coredex | Next-Gen Multi-Tenant Digital Catalog Platform",
    template: "%s | Coredex",
  },
  description:
    "The world's most advanced digital catalog infrastructure. Multi-tenant SaaS with hyper-dynamic interfaces, AI optimization, and enterprise-grade scalability.",
  keywords: [
    "Digital Catalog SaaS",
    "Multi-tenant Platform",
    "Digital Menu",
    "QR Menu",
    "Retail Catalog",
    "Enterprise SEO Catalog",
  ],
  authors: [{ name: "Coredex Engineering" }],
  creator: "Coredex",
  publisher: "Coredex",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Coredex | Next-Gen Digital Catalog Platform",
    description: "Multi-tenant SaaS for the next era of commerce.",
    siteName: "Coredex",
  },
  twitter: {
    card: "summary_large_image",
    title: "Coredex",
    description: "The infrastructure for digital catalogs.",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${cairo.variable} ${outfit.variable}`}
    >
      <body className={`${inter.className} bg-black antialiased`}>
        <AppProvider>
          <TopLoadingBar />
          <div className="relative min-h-screen">
            {children}
          </div>
          <GlobalModalsWrapper />
        </AppProvider>
      </body>
    </html>
  );
}
