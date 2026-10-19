import { Inter, Noto_Sans_Arabic } from "next/font/google";

// One copy of each typeface for the whole site (DESIGN.md: Inter + Noto Sans Arabic). Both are
// variable fonts, so every weight comes from a single file.
export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// The Arabic file is large (~165 KB) and only needed where Arabic text is on screen, so it is not
// preloaded: the browser fetches it when Arabic letters appear. No metric-adjusted fallback of its
// own: that is a local Arial, which would catch characters meant for the fonts after it.
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
