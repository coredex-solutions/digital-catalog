import { Inter, Noto_Sans_Arabic } from "next/font/google";

// One copy of each typeface for the whole site (DESIGN.md: Inter + Noto Sans Arabic). Both are
// variable fonts, so every weight comes from a single file.
export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Not preloaded: the file is 160 KB, and a preload makes every page download it, English ones
// included, where it competes with the cover photo on a slow connection. The browser fetches it
// by itself as soon as a page lays out Arabic text. The "عربي" language buttons on English pages
// use the phone's own font (`font-system`) so they don't pull it in.
// No metric-adjusted fallback of its own: that is a local Arial, which would catch characters
// meant for the fonts after it.
export const notoArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600"],
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});

// Inter first, for Latin text, digits and prices. Inter has no Arabic letters, so those fall
// through to Noto Sans Arabic. Inter's size-matched fallback comes last, for the moment before
// Inter has loaded. Arabic can't go first: Google's CSS for it also has a Latin face, which
// would take over prices and English text.
const [interFamily, ...interFallbacks] = inter.style.fontFamily.split(",").map((name) => name.trim());
export const fontStack = [interFamily, notoArabic.style.fontFamily, ...interFallbacks].join(", ");

