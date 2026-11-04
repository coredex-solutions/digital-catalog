import type { Metadata } from "next";
import { fontStack, inter } from "./fonts";
import { documentLang } from "./document-lang";
import "./globals.css";

const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Coredex: online menus, stores and service pages in Arabic and English",
    template: "%s | Coredex",
  },
  description:
    "Your menu, store or services page, opened from a QR code or a link. Arabic and English, prices in dollars and Lebanese pounds, and every order saved and sent to your WhatsApp.",
  keywords: ["QR menu", "online store", "digital menu", "Lebanon", "booking", "WhatsApp ordering", "Arabic English"],
  creator: "Coredex",
  publisher: "Coredex",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Coredex: online menus, stores and service pages in Arabic and English",
    description: "Menus, stores and service pages in Arabic and English, with dollar and pound prices and orders saved and sent to WhatsApp.",
    siteName: "Coredex",
    images: [{ url: "/og/coredex-en.jpg", width: 1200, height: 630, alt: "Coredex: online menus, stores and service pages in Arabic and English" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og/coredex-en.jpg"],
    title: "Coredex",
    description: "Online menus, stores and service pages for restaurants, cafés, shops and services.",
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
