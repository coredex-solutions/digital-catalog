// Loyalty stamps: every finished order is a stamp for that phone number, and every Nth order
// earns the reward the owner set ("A free coffee"). No app or sign-up: the team sees "reward due"
// on the order and gives it in person. Settings live in catalog_settings.loyalty_config.

import { getDb } from "../db/client";
import { phoneKey } from "./customers";

export interface LoyaltyConfig {
  enabled: boolean;
  /** The reward comes with every Nth order */
  every: number;
  reward_en: string;
  reward_ar: string;
}

export const DEFAULT_LOYALTY: LoyaltyConfig = { enabled: false, every: 6, reward_en: "", reward_ar: "" };

export function parseLoyaltyConfig(raw: unknown): LoyaltyConfig {
  let value = raw;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return DEFAULT_LOYALTY;
    }
  }
  if (!value || typeof value !== "object") return DEFAULT_LOYALTY;
  const input = value as Record<string, unknown>;
  const every = Math.round(Number(input.every));
  const text = (v: unknown) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, 80) : "");
  const reward_en = text(input.reward_en);
  const reward_ar = text(input.reward_ar);
  return {
    // A programme needs a reward to show
    enabled: Boolean(input.enabled) && Boolean(reward_en || reward_ar),
    every: Number.isFinite(every) && every >= 2 && every <= 50 ? every : DEFAULT_LOYALTY.every,
    reward_en,
    reward_ar,
  };
}

export function rewardText(config: LoyaltyConfig, lang: string): string {
  return (lang === "ar" ? config.reward_ar || config.reward_en : config.reward_en || config.reward_ar) || "";
}

/** Where a customer stands: stamps towards the next reward, and whether the next order earns it */
export function loyaltyProgress(finishedOrders: number, every: number) {
  const stamps = finishedOrders % every;
  return { stamps, nextIsReward: stamps === every - 1 };
}

/** Is this order a reward order, given how many orders the customer finished before it? */
export const isRewardOrder = (finishedBefore: number, every: number) => (finishedBefore + 1) % every === 0;

/**
 * Finished orders per phone number (keys from phoneKey), for orders and service requests.
 * `before` limits it to orders created before a date-time (to know if an order is the Nth).
 */
export async function finishedOrdersByPhone(catalogId: string): Promise<{ key: string; created_at: string }[]> {
  const result = await getDb().execute({
    sql: `SELECT customer_phone, created_at FROM orders
          WHERE catalog_id = ? AND status = 'completed' AND kind != 'booking'
          ORDER BY created_at DESC LIMIT 20000`,
    args: [catalogId],
  });
  return result.rows.map((row) => ({ key: phoneKey(String(row.customer_phone ?? "")), created_at: String(row.created_at ?? "") }));
}

/** How many orders this phone number finished (optionally only those before a time) */
export function countFor(finished: { key: string; created_at: string }[], phone: string, before?: string): number {
  const key = phoneKey(phone);
  if (!key) return 0;
  return finished.filter((row) => row.key === key && (!before || row.created_at < before)).length;
}
