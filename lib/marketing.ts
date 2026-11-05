// Marketing tools an owner turns on in Settings: Meta Pixel and Google Analytics on their page,
// and a review link shown to customers once an order is done. Stored as JSON in
// catalog_settings.marketing_config.
//
// Only IDs are stored, never code: the page builds the official script URLs itself, so an
// owner can't add their own scripts. Google Tag Manager (GTM-...) is not accepted for that
// reason: a GTM container can run any code.

export interface MarketingConfig {
  /** Meta (Facebook/Instagram) Pixel ID: digits only */
  meta_pixel_id: string;
  /** Google Analytics 4 measurement ID, e.g. G-AB12CD34EF */
  ga_id: string;
  /** Where customers leave a review (Google, Facebook, TripAdvisor…): an https link */
  review_url: string;
}

export const EMPTY_MARKETING: MarketingConfig = { meta_pixel_id: "", ga_id: "", review_url: "" };

const PIXEL_ID = /^\d{8,20}$/;
const GA_ID = /^G-[A-Z0-9]{4,16}$/;

export function cleanPixelId(value: unknown): string {
  const id = String(value ?? "").replace(/\s/g, "");
  return PIXEL_ID.test(id) ? id : "";
}

export function cleanGaId(value: unknown): string {
  const id = String(value ?? "").trim().toUpperCase();
  return GA_ID.test(id) ? id : "";
}

/** An https link up to 500 characters, or "" */
export function cleanReviewUrl(value: unknown): string {
  const text = String(value ?? "").trim();
  if (!text || text.length > 500) return "";
  try {
    const url = new URL(text);
    return url.protocol === "https:" && url.hostname.includes(".") ? url.toString() : "";
  } catch {
    return "";
  }
}

/** Cleaned settings from the stored JSON (or an object from the settings form); bad values become "" */
export function parseMarketingConfig(value: unknown): MarketingConfig {
  let raw: unknown = value;
  if (typeof value === "string") {
    try {
      raw = JSON.parse(value);
    } catch {
      raw = null;
    }
  }
  if (!raw || typeof raw !== "object") return { ...EMPTY_MARKETING };
  const input = raw as Record<string, unknown>;
  return {
    meta_pixel_id: cleanPixelId(input.meta_pixel_id),
    ga_id: cleanGaId(input.ga_id),
    review_url: cleanReviewUrl(input.review_url),
  };
}

/** Which fields the owner filled in but couldn't be used, so the form can say so */
export function invalidMarketingFields(input: Record<string, unknown>): (keyof MarketingConfig)[] {
  const out: (keyof MarketingConfig)[] = [];
  if (String(input.meta_pixel_id ?? "").trim() && !cleanPixelId(input.meta_pixel_id)) out.push("meta_pixel_id");
  if (String(input.ga_id ?? "").trim() && !cleanGaId(input.ga_id)) out.push("ga_id");
  if (String(input.review_url ?? "").trim() && !cleanReviewUrl(input.review_url)) out.push("review_url");
  return out;
}
