// Price formatting for catalogs, including Lebanon's dual USD / LBP display.
// Lebanese menus use Western digits in both Arabic and English, so numbers are always
// grouped with en-US rules; only the currency label changes with the language.

export type PrimaryCurrency = "USD" | "LBP";

export interface PriceConfig {
  primary: PrimaryCurrency;
  /** How many LBP one USD buys, as set by the owner. Null until they set one: prices are then
   *  never converted, each is shown in the currency it was entered in. */
  lbpRate: number | null;
  /** When the owner last changed the rate (ISO date-time), shown next to converted prices */
  rateUpdatedAt: string | null;
  /** Show the second currency beside the first (only possible once a rate is set) */
  showDual: boolean;
}

const numberFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

/** Build the price config from catalog settings, tolerating catalogs that predate the columns */
export function getPriceConfig(settings?: {
  currency_primary?: string | null;
  lbp_exchange_rate?: number | null;
  lbp_rate_updated_at?: string | null;
  show_dual_currency?: number | boolean | null;
} | null): PriceConfig {
  const rate = Number(settings?.lbp_exchange_rate);
  const lbpRate = settings?.lbp_exchange_rate != null && Number.isFinite(rate) && rate > 0 ? rate : null;
  return {
    primary: settings?.currency_primary === "LBP" ? "LBP" : "USD",
    lbpRate,
    rateUpdatedAt: lbpRate ? settings?.lbp_rate_updated_at || null : null,
    showDual: lbpRate !== null && Boolean(Number(settings?.show_dual_currency ?? 0)),
  };
}

/** Format one amount in one currency, e.g. "$3.50", "270,000 L.L." or "270,000 ل.ل." */
export function formatMoney(amount: number, currency: string, lang: string): string {
  const code = (currency || "USD").toUpperCase();
  if (code === "USD") {
    const fixed = Number.isInteger(amount) ? amount : Math.round(amount * 100) / 100;
    return `$${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: Number.isInteger(fixed) ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(fixed)}`;
  }
  if (code === "LBP") {
    return `${numberFormat.format(Math.round(amount))} ${lang === "ar" ? "ل.ل." : "L.L."}`;
  }
  return `${numberFormat.format(amount)} ${code}`;
}

/** LBP prices are shown rounded to the nearest 1,000, as Lebanese menus do */
function roundLbp(amount: number): number {
  return Math.round(amount / 1000) * 1000;
}

export interface FormattedPrice {
  /** Shown prominently */
  primary: string;
  /** The other currency, when dual pricing applies */
  secondary?: string;
}

/**
 * Format an item price stored in `currency`. USD and LBP prices convert to each other;
 * any other currency is shown as-is.
 */
export function formatPrice(amount: number, currency: string | null | undefined, config: PriceConfig, lang: string): FormattedPrice {
  const code = (currency || "USD").toUpperCase();

  // Other currencies, or no rate to convert with: show the price exactly as entered
  if ((code !== "USD" && code !== "LBP") || config.lbpRate === null) {
    return { primary: formatMoney(amount, code, lang) };
  }

  const usd = code === "USD" ? amount : amount / config.lbpRate;
  const lbp = code === "LBP" ? amount : roundLbp(amount * config.lbpRate);

  const usdText = formatMoney(usd, "USD", lang);
  const lbpText = formatMoney(lbp, "LBP", lang);

  // Without dual pricing, show the item in the catalog's primary currency only
  if (!config.showDual) {
    return { primary: config.primary === "LBP" ? lbpText : usdText };
  }

  return config.primary === "LBP"
    ? { primary: lbpText, secondary: usdText }
    : { primary: usdText, secondary: lbpText };
}

export interface PricedLine {
  price: number;
  currency?: string | null;
  quantity: number;
}

/**
 * Total a set of lines. USD and LBP lines are combined (converted through the rate) when a
 * rate is set; otherwise, and for any other currency, each currency is totalled separately
 * and appended, e.g. "$12 + 500,000 L.L.".
 */
export function formatTotal(lines: PricedLine[], config: PriceConfig, lang: string): FormattedPrice {
  let usdTotal = 0;
  let hasUsdFamily = false;
  const others = new Map<string, number>();

  for (const line of lines) {
    const code = (line.currency || "USD").toUpperCase();
    const amount = line.price * line.quantity;
    if (code === "USD") {
      usdTotal += amount;
      hasUsdFamily = true;
    } else if (code === "LBP" && config.lbpRate !== null) {
      usdTotal += amount / config.lbpRate;
      hasUsdFamily = true;
    } else {
      others.set(code, (others.get(code) || 0) + amount);
    }
  }

  const otherText = [...others.entries()].map(([code, amount]) => formatMoney(amount, code, lang));

  if (!hasUsdFamily) {
    return { primary: otherText.join(" + ") || formatMoney(0, config.primary, lang) };
  }

  const base = formatPrice(usdTotal, "USD", config, lang);
  if (otherText.length === 0) return base;
  return {
    primary: [base.primary, ...otherText].join(" + "),
    secondary: base.secondary,
  };
}
