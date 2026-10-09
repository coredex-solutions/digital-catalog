import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Inter backs the .platform UI (globals.css: var(--font-inter)). The guest menu loads its own
// fonts in the catalog layout and the landing page loads its Arabic face itself.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Coredex: QR menus for restaurants and cafés",
    template: "%s | Coredex",
  },
  description:
    "A fast QR menu guests open in the browser, in Arabic and English, with prices in dollars and Lebanese pounds and orders sent to WhatsApp.",
  keywords: ["QR menu", "digital menu", "Lebanon", "restaurant menu", "WhatsApp ordering", "menu Arabic English"],
  creator: "Coredex",
  publisher: "Coredex",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Coredex: QR menus for restaurants and cafés",
    description: "QR menus in Arabic and English, with dollar and pound prices and WhatsApp orders.",
    siteName: "Coredex",
  },
  twitter: {
    card: "summary",
    title: "Coredex",
    description: "QR menus for restaurants and cafés.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className={`${inter.className} bg-[#F7F8F5] text-[#172B26] antialiased`}>
        {children}
      </body>
    </html>
  );
}
