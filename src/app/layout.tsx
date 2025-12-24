import type { Metadata } from "next";
import { Cairo, Inter, Aref_Ruqaa } from "next/font/google";
import { AppProvider } from "../providers/AppProvider";
import { GlobalModalsWrapper } from "./_components/GlobalModalsWrapper";
import { TopLoadingBar } from "../components/TopLoadingBar";
import "./globals.css";

// Optimize Google Fonts with next/font
const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-cairo",
  display: "swap",
  preload: true,
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
});

const arefRuqaa = Aref_Ruqaa({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  variable: "--font-handwriting",
  display: "swap",
  preload: false, // Not used above fold
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://mtabal.m.dynamicord.com"
  ),
  title: {
    default: "Mtabal Restaurant - Authentic Middle Eastern Cuisine",
    template: "%s | Mtabal Restaurant",
  },
  description:
    "Experience authentic Middle Eastern cuisine at Mtabal Restaurant. Explore our menu of grilled specialties, traditional dishes, and more.",
  keywords: [
    "Mtabal Restaurant",
    "Middle Eastern food",
    "Arabic cuisine",
    "Grilled chicken",
    "Mansaf",
    "Lebanese food",
    "Restaurant menu",
  ],
  authors: [{ name: "Mtabal Restaurant" }],
  creator: "Mtabal Restaurant",
  publisher: "Mtabal Restaurant",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["ar_SA", "fr_FR"],
    url: "/",
    title: "Mtabal Restaurant - Authentic Middle Eastern Cuisine",
    description:
      "Experience authentic Middle Eastern cuisine at Mtabal Restaurant",
    siteName: "Mtabal Restaurant",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mtabal Restaurant",
    description: "Experience authentic Middle Eastern cuisine",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
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
      className={`${inter.variable} ${cairo.variable} ${arefRuqaa.variable}`}
    >
      <body className={inter.className}>
        <AppProvider>
          <TopLoadingBar />
          {children}
          <GlobalModalsWrapper />
        </AppProvider>
      </body>
    </html>
  );
}
