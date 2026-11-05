// The business's customers, gathered from its saved orders by phone number: one row per person,
// with how often they ordered and how much they spent. Nothing is stored separately.

import { getDb } from "../db/client";

export interface Customer {
  /** Phone number as the customer last typed it */
  phone: string;
  /** Digits used to group the same number typed differently (03 123 456, +961 3 123 456) */
  key: string;
  name: string;
  /** Orders and requests that weren't cancelled (bookings included) */
  orders: number;
  /** Total of those orders in USD; null when none could be converted */
  spentUsd: number | null;
  /** Finished orders and requests: the loyalty stamps */
  finished: number;
  firstAt: string;
  lastAt: string;
}

/** Same number, however it was typed: drop spaces, the international prefix and the leading 0 */
export function phoneKey(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("961") && digits.length >= 10) digits = digits.slice(3);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return digits;
}

interface OrderRow {
  customer_name: string;
  customer_phone: string;
  status: string;
  total_usd: number | null;
  created_at: string;
  kind?: string;
}

/** Group order rows into customers, most recent first. Pure, for tests. */
export function groupCustomers(rows: OrderRow[]): Customer[] {
  const byKey = new Map<string, Customer>();
  // Oldest first, so the latest name and number win
  const sorted = [...rows].sort((a, b) => (a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0));
  for (const row of sorted) {
    const key = phoneKey(row.customer_phone);
    if (!key) continue;
    const counted = row.status !== "cancelled";
    const existing = byKey.get(key);
    const customer: Customer = existing ?? {
      phone: row.customer_phone,
      key,
      name: row.customer_name,
      orders: 0,
      spentUsd: null,
      finished: 0,
      firstAt: row.created_at,
      lastAt: row.created_at,
    };
    customer.phone = row.customer_phone;
    customer.name = row.customer_name || customer.name;
    customer.lastAt = row.created_at;
    if (row.status === "completed" && row.kind !== "booking") customer.finished += 1;
    if (counted) {
      customer.orders += 1;
      if (row.total_usd != null) customer.spentUsd = Math.round(((customer.spentUsd ?? 0) + Number(row.total_usd)) * 100) / 100;
    }
    byKey.set(key, customer);
  }
  return [...byKey.values()].sort((a, b) => (a.lastAt < b.lastAt ? 1 : a.lastAt > b.lastAt ? -1 : 0));
}

/** Upper bound on the orders read for the list (years of orders for a small business) */
const MAX_ROWS = 20_000;

export async function listCustomers(catalogId: string): Promise<Customer[]> {
  const result = await getDb().execute({
    sql: `SELECT customer_name, customer_phone, status, total_usd, created_at, kind FROM orders
          WHERE catalog_id = ? ORDER BY created_at DESC LIMIT ?`,
    args: [catalogId, MAX_ROWS],
  });
  const rows = result.rows.map((row) => ({
    customer_name: String(row.customer_name ?? ""),
    customer_phone: String(row.customer_phone ?? ""),
    status: String(row.status ?? ""),
    total_usd: row.total_usd == null ? null : Number(row.total_usd),
    created_at: String(row.created_at ?? ""),
    kind: String(row.kind ?? "order"),
  }));
  return groupCustomers(rows);
}
