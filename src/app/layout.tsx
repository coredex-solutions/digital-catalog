import type { Metadata } from "next";
import { fontStack, inter } from "./fonts";
import { documentLang } from "./document-lang";
import "./globals.css";

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
    images: [{ url: "/og/coredex-en.jpg", width: 1200, height: 630, alt: "Coredex: QR menus for restaurants and cafés" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og/coredex-en.jpg"],
    title: "Coredex",
    description: "QR menus for restaurants and cafés.",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const lang = await documentLang();
  return (
    <html lang={lang} dir={lang === "ar" ? "rtl" : "ltr"} suppressHydrationWarning className={inter.variable} style={{ ["--font-sans" as string]: fontStack }}>
      <body className={`font-sans bg-[#F7F8FC] text-[#17152E] antialiased`}>
        {children}
      </body>
    </html>
  );
}
