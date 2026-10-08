// Server-side theme for the diner menu. The neutral palette (Pine & Ivory, MENUDESIGN.md) lives
// in globals.css under `.menu`; each restaurant contributes only its brand colour, from which
// we derive variants that keep WCAG AA contrast on both the light and dark backgrounds.

import type { CSSProperties } from "react";

const LIGHT_BG = "#F7F8F5"; // must match --menu-bg in globals.css
const DARK_BG = "#0F1714"; // must match --menu-bg in [data-theme="dark"]
const FALLBACK_BRAND = "#0F6B5B"; // platform pine

type RGB = [number, number, number];

function parseHex(color: string | null | undefined): RGB | null {
  const hex = (color || "").trim().replace(/^#/, "");
  const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as RGB;
}

function toHex([r, g, b]: RGB): string {
  return `#${[r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("")}`;
}

function luminance([r, g, b]: RGB): number {
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a: RGB, b: RGB): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function mix(color: RGB, target: RGB, amount: number): RGB {
  return color.map((v, i) => v + (target[i] - v) * amount) as RGB;
}

/** Move the colour toward black or white until it reaches the contrast ratio against `bg` */
function ensureContrast(color: RGB, bg: RGB, ratio: number): RGB {
  if (contrast(color, bg) >= ratio) return color;
  const target: RGB = luminance(bg) > 0.5 ? [0, 0, 0] : [255, 255, 255];
  for (let step = 0.05; step <= 1; step += 0.05) {
    const candidate = mix(color, target, step);
    if (contrast(candidate, bg) >= ratio) return candidate;
  }
  return target;
}

export function buildMenuTheme(brandColor: string | null | undefined): CSSProperties {
  const lightBg = parseHex(LIGHT_BG)!;
  const darkBg = parseHex(DARK_BG)!;
  const white: RGB = [255, 255, 255];
  const ink: RGB = [23, 43, 38]; // --menu-ink

  // Solid brand buttons: pick white or ink text, whichever reads better. Mid-tone brand
  // colours that reach 4.5:1 with neither are darkened until white text does.
  let brand = parseHex(brandColor) || parseHex(FALLBACK_BRAND)!;
  let onBrand = contrast(brand, white) >= contrast(brand, ink) ? "#FFFFFF" : "#172B26";
  if (Math.max(contrast(brand, white), contrast(brand, ink)) < 4.5) {
    brand = ensureContrast(brand, white, 4.5);
    onBrand = "#FFFFFF";
  }

  return {
    "--brand": toHex(brand),
    "--brand-fg": onBrand,
    // Brand used as text/icons on the page background
    "--brand-ink-light": toHex(ensureContrast(brand, lightBg, 4.5)),
    "--brand-ink-dark": toHex(ensureContrast(brand, darkBg, 4.5)),
    // Soft tints for chips and highlights
    "--brand-soft-light": toHex(mix(brand, lightBg, 0.88)),
    "--brand-soft-dark": toHex(mix(brand, darkBg, 0.8)),
  } as CSSProperties;
}
