// Phones read a QR code by telling its dark modules from the light background. Ink on paper,
// glare and dim restaurant light all lower the contrast a camera sees, so a printed code needs a
// dark-on-light pair with plenty of margin (DESIGN.md §8: solid dark modules on white).

/** Below this contrast ratio the code is refused: too many phones fail to read it. */
export const QR_MIN_CONTRAST = 4;
/** Below this ratio the code is allowed, but the owner is asked to test a print first. */
export const QR_GOOD_CONTRAST = 7;

export const QR_INVERTED_MESSAGE =
  "Many phones can't read a light code on a dark background. Make the code darker than its background.";
export const QR_LOW_CONTRAST_MESSAGE =
  "These colours are too close for phones to scan reliably. Use a darker code colour or a lighter background.";

const HEX = /^#[0-9a-fA-F]{6}$/;

export type QrContrastLevel = "good" | "test" | "unreadable";

export interface QrContrast {
  /** WCAG contrast ratio between the code and its background, 1 to 21 */
  ratio: number;
  level: QrContrastLevel;
  /** The code is lighter than its background */
  inverted: boolean;
  /** Owner-facing reason when the level is "unreadable" */
  message: string | null;
}

function luminance(hex: string): number {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

/**
 * Checks a code colour against its background. A transparent background is judged against
 * white, the paper it will usually be printed on. Returns null when a colour isn't #RRGGBB.
 */
export function checkQrColors(dark: string, light: string): QrContrast | null {
  const background = light === "transparent" ? "#ffffff" : light;
  if (!HEX.test(dark) || !HEX.test(background)) return null;

  const code = luminance(dark);
  const paper = luminance(background);
  const ratio = (Math.max(code, paper) + 0.05) / (Math.min(code, paper) + 0.05);
  const inverted = code > paper;

  if (inverted) return { ratio, level: "unreadable", inverted, message: QR_INVERTED_MESSAGE };
  if (ratio < QR_MIN_CONTRAST) return { ratio, level: "unreadable", inverted, message: QR_LOW_CONTRAST_MESSAGE };
  return { ratio, level: ratio < QR_GOOD_CONTRAST ? "test" : "good", inverted, message: null };
}
