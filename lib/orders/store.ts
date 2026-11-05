// Saving and following orders, bookings and service requests (table `orders`, migration
// 20261105_modules.sql). Each write is one database batch, which runs as a transaction: an order
// and the stock it takes are saved together or not at all.

import { randomBytes } from "node:crypto";
import { v4 as uuidv4 } from "uuid";
import type { InStatement, ResultSet } from "@libsql/client";
import { getDb } from "../db/client";
import type { PriceConfig } from "../catalog/price";
import { stockToReserve, type OrderLineSnapshot, type ValidOrder } from "./validate";

export const ORDER_STATUSES = ["new", "confirmed", "ready", "completed", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/**
 * Any status can follow any other, so a mistaken tap can be undone and a finished or cancelled
 * order reopened. Leaving "cancelled" takes the order's stock again (see setOrderStatus).
 */
export function canMoveTo(from: OrderStatus, to: OrderStatus): boolean {
  return (ORDER_STATUSES as readonly string[]).includes(from) && (ORDER_STATUSES as readonly string[]).includes(to) && from !== to;
}

export interface SavedOrder {
  id: string;
  number: number;
  kind: "order" | "booking" | "request";
  status: OrderStatus;
  order_type: string | null;
  customer_name: string;
  customer_phone: string;
  table_label: string | null;
  address: string | null;
  area: string | null;
  requested_for: string | null;
  party_size: number | null;
  lines: OrderLineSnapshot[];
  price_config: PriceConfig | null;
  total_usd: number | null;
  note: string | null;
  lang: string | null;
  /** Delivery fee for the chosen area (included in the total), in delivery_currency */
  delivery_fee: number | null;
  delivery_currency: string | null;
  /** cash, card, whish or omt; null for bookings, dine-in and older orders */
  payment_method: string | null;
  /** When the team marked it paid; null = not yet */
  paid_at: string | null;
  /** Key of the customer's status page; null for orders from before it existed */
  public_token: string | null;
  /** How long a booking or appointment lasts (set times only) */
  duration_minutes: number | null;
  created_at: string;
  updated_at: string;
}

function parseJson<T>(value: unknown, fallback: T): T {
  try {
    return value == null ? fallback : (JSON.parse(String(value)) as T);
  } catch {
    return fallback;
  }
}

function toOrder(row: Record<string, unknown>): SavedOrder {
  const num = (v: unknown) => (v == null ? null : Number(v));
  const str = (v: unknown) => (v == null ? null : String(v));
  return {
    id: String(row.id),
    number: Number(row.number),
    kind: (["order", "booking", "request"].includes(String(row.kind)) ? row.kind : "order") as SavedOrder["kind"],
    status: ((ORDER_STATUSES as readonly string[]).includes(String(row.status)) ? row.status : "new") as OrderStatus,
    order_type: str(row.order_type),
    customer_name: String(row.customer_name ?? ""),
    customer_phone: String(row.customer_phone ?? ""),
    table_label: str(row.table_label),
    address: str(row.address),
    area: str(row.area),
    requested_for: str(row.requested_for),
    party_size: num(row.party_size),
    lines: parseJson<OrderLineSnapshot[]>(row.lines, []),
    price_config: parseJson<PriceConfig | null>(row.price_config, null),
    total_usd: num(row.total_usd),
    note: str(row.note),
    lang: str(row.lang),
    delivery_fee: num(row.delivery_fee),
    delivery_currency: str(row.delivery_currency),
    payment_method: str(row.payment_method),
    paid_at: str(row.paid_at),
    public_token: str(row.public_token),
    duration_minutes: num(row.duration_minutes),
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
}

const rowsOf = (result: ResultSet) =>
  result.rows.map((row) => Object.fromEntries(result.columns.map((column) => [column, row[column]])));

/** Random key for an order's status page: 144 bits, so it can't be guessed */
export function newPublicToken(): string {
  return randomBytes(18).toString("base64url");
}

export const PUBLIC_TOKEN = /^[A-Za-z0-9_-]{24}$/;

/** An order by its status-page key, for the customer's status page */
export async function findByPublicToken(catalogId: string, token: string): Promise<SavedOrder | null> {
  if (!PUBLIC_TOKEN.test(token)) return null;
  const result = await getDb().execute({
    sql: "SELECT * FROM orders WHERE catalog_id = ? AND public_token = ?",
    args: [catalogId, token],
  });
  const row = rowsOf(result)[0];
  return row ? toOrder(row) : null;
}

export async function getOrder(catalogId: string, orderId: string): Promise<SavedOrder | null> {
  const result = await getDb().execute({ sql: "SELECT * FROM orders WHERE id = ? AND catalog_id = ?", args: [orderId, catalogId] });
  const row = rowsOf(result)[0];
  return row ? toOrder(row) : null;
}

/** Mark an order paid (now) or not paid */
export async function setOrderPaid(catalogId: string, orderId: string, paid: boolean): Promise<SavedOrder | null> {
  const result = await getDb().execute({
    sql: `UPDATE orders SET paid_at = ${paid ? "COALESCE(paid_at, datetime('now'))" : "NULL"}, updated_at = datetime('now')
          WHERE id = ? AND catalog_id = ? RETURNING *`,
    args: [orderId, catalogId],
  });
  const row = rowsOf(result)[0];
  return row ? toOrder(row) : null;
}

export type CreateResult =
  | { ok: true; order: SavedOrder; repeated: boolean }
  | { ok: false; code: "stock_changed" | "slot_taken" };

export async function findByClientKey(catalogId: string, clientKey: string): Promise<SavedOrder | null> {
  const result = await getDb().execute({
    sql: "SELECT * FROM orders WHERE catalog_id = ? AND client_key = ?",
    args: [catalogId, clientKey],
  });
  const row = rowsOf(result)[0];
  return row ? toOrder(row) : null;
}

/** Bookings of a kind on a date (not cancelled), for working out the free times */
export async function takenBookings(catalogId: string, kind: "booking" | "request", date: string, fallbackMinutes: number) {
  const result = await getDb().execute({
    sql: `SELECT requested_for, duration_minutes FROM orders
          WHERE catalog_id = ? AND kind = ? AND status != 'cancelled' AND requested_for >= ? AND requested_for < ?`,
    args: [catalogId, kind, `${date} 00:00`, `${date} 99:99`],
  });
  return result.rows.map((row) => ({
    start: String(row.requested_for),
    minutes: row.duration_minutes == null ? fallbackMinutes : Number(row.duration_minutes),
  }));
}

/**
 * Save a validated order and take its stock. A repeated request (same client key) returns the
 * first order. Fails with stock_changed when an item no longer has enough left.
 */
export async function createOrder(
  catalogId: string,
  order: ValidOrder,
  priceConfig: PriceConfig,
  source: "page" | "ai" = "page"
): Promise<CreateResult> {
  if (order.clientKey) {
    const existing = await findByClientKey(catalogId, order.clientKey);
    if (existing) return { ok: true, order: existing, repeated: true };
  }

  const id = uuidv4();
  const reserve = stockToReserve(order.lines);
  const statements: InStatement[] = [];

  // Set booking times: the order is only inserted while fewer than `capacity` bookings of the
  // same kind overlap its time, checked inside the INSERT so two customers can't take the last one
  const slot =
    order.capacity !== null && order.requestedFor && order.durationMinutes
      ? {
          sql: `(SELECT COUNT(*) FROM orders
                 WHERE catalog_id = ? AND kind = ? AND status != 'cancelled' AND requested_for IS NOT NULL
                   AND datetime(requested_for) < datetime(?, '+' || ? || ' minutes')
                   AND datetime(requested_for, '+' || COALESCE(duration_minutes, ?) || ' minutes') > datetime(?)) < ?`,
          args: [catalogId, order.kind, order.requestedFor, order.durationMinutes, order.durationMinutes, order.requestedFor, order.capacity],
        }
      : { sql: "1", args: [] };

  statements.push({
    // The number is taken inside the INSERT so two orders can't get the same one
    sql: `INSERT INTO orders (
            id, catalog_id, number, kind, status, order_type, customer_name, customer_phone,
            table_label, address, area, requested_for, party_size, lines, price_config, total_usd,
            note, lang, source, stock_reserved, client_key, delivery_fee, delivery_currency,
            payment_method, public_token, duration_minutes, created_at, updated_at
          ) SELECT
            ?, ?, (SELECT COALESCE(MAX(number), 0) + 1 FROM orders WHERE catalog_id = ?), ?, 'new', ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now')
          WHERE ${slot.sql}
          RETURNING *`,
    args: [
      id,
      catalogId,
      catalogId,
      order.kind,
      order.orderType,
      order.name,
      order.phone,
      order.table,
      order.address,
      order.area,
      order.requestedFor,
      order.partySize,
      JSON.stringify(order.lines),
      JSON.stringify(priceConfig),
      order.totalUsd,
      order.note,
      order.lang,
      source,
      reserve.size > 0 ? 1 : 0,
      order.clientKey,
      order.deliveryFee,
      order.deliveryCurrency,
      order.paymentMethod,
      newPublicToken(),
      order.durationMinutes,
      ...slot.args,
    ],
  });
  // Then its stock, only if the order was inserted. The menu_items_stock_not_negative trigger
  // aborts the whole batch (order included) if any item would go below zero.
  for (const [itemId, quantity] of reserve) {
    statements.push({
      sql: `UPDATE menu_items SET stock_qty = stock_qty - ?
            WHERE id = ? AND catalog_id = ? AND stock_qty IS NOT NULL AND EXISTS (SELECT 1 FROM orders WHERE id = ?)`,
      args: [quantity, itemId, catalogId, id],
    });
  }

  try {
    const results = await getDb().batch(statements, "write");
    const row = rowsOf(results[0])[0];
    if (!row) return { ok: false, code: "slot_taken" };
    return { ok: true, order: toOrder(row), repeated: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("out_of_stock")) return { ok: false, code: "stock_changed" };
    // The same request arrived twice at once: the other one saved it
    if (order.clientKey && /UNIQUE constraint failed: orders\.catalog_id, orders\.client_key/.test(message)) {
      const existing = await findByClientKey(catalogId, order.clientKey);
      if (existing) return { ok: true, order: existing, repeated: true };
    }
    throw error;
  }
}

export type OrderTab = "new" | "active" | "done";

const TAB_STATUSES: Record<OrderTab, OrderStatus[]> = {
  new: ["new"],
  active: ["confirmed", "ready"],
  done: ["completed", "cancelled"],
};

/** Orders for the dashboard, newest first (the "new" and "active" tabs show the oldest first) */
export async function listOrders(
  catalogId: string,
  options: {
    tab: OrderTab;
    kind?: "order" | "booking" | "request" | null;
    /** Only orders in the tab with a payment method that aren't marked paid (never cancelled ones) */
    unpaid?: boolean;
    /** Bookings and appointments still to come, by their time (the tab is ignored) */
    upcoming?: { from: string } | null;
    limit?: number;
    before?: string | null;
  }
): Promise<SavedOrder[]> {
  if (options.upcoming) {
    const result = await getDb().execute({
      sql: `SELECT * FROM orders WHERE catalog_id = ? AND kind != 'order' AND status IN ('new', 'confirmed', 'ready')
            AND requested_for >= ? ORDER BY requested_for ASC, number ASC LIMIT ?`,
      args: [catalogId, options.upcoming.from, Math.min(Math.max(options.limit ?? 50, 1), 100)],
    });
    return rowsOf(result).map(toOrder);
  }
  const statuses = TAB_STATUSES[options.tab].filter((s) => !options.unpaid || s !== "cancelled");
  const args: (string | number)[] = [catalogId, ...statuses];
  let sql = `SELECT * FROM orders WHERE catalog_id = ? AND status IN (${statuses.map(() => "?").join(", ")})`;
  if (options.kind) {
    sql += " AND kind = ?";
    args.push(options.kind);
  }
  if (options.unpaid) sql += " AND payment_method IS NOT NULL AND paid_at IS NULL";
  const oldestFirst = options.tab !== "done";
  if (options.before && !oldestFirst) {
    sql += " AND created_at < ?";
    args.push(options.before);
  }
  sql += ` ORDER BY created_at ${oldestFirst ? "ASC" : "DESC"}, number ${oldestFirst ? "ASC" : "DESC"} LIMIT ?`;
  args.push(Math.min(Math.max(options.limit ?? 50, 1), 100));
  const result = await getDb().execute({ sql, args });
  return rowsOf(result).map(toOrder);
}

/**
 * Counts per tab, for the tab labels and the navigation badge, plus the newest order's number
 * and kind: the dashboard alerts when that number goes up, so confirming one order while another
 * arrives still alerts.
 */
export async function countOrders(catalogId: string) {
  const result = await getDb().execute({
    sql: `SELECT
            SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) AS new_count,
            SUM(CASE WHEN status IN ('confirmed', 'ready') THEN 1 ELSE 0 END) AS active_count,
            (SELECT number FROM orders WHERE catalog_id = ? ORDER BY number DESC LIMIT 1) AS latest_number,
            (SELECT kind FROM orders WHERE catalog_id = ? ORDER BY number DESC LIMIT 1) AS latest_kind
          FROM orders WHERE catalog_id = ?`,
    args: [catalogId, catalogId, catalogId],
  });
  const row = result.rows[0];
  return {
    new: Number(row?.new_count ?? 0),
    active: Number(row?.active_count ?? 0),
    latest: row?.latest_number == null ? 0 : Number(row.latest_number),
    latestKind: (row?.latest_kind == null ? "order" : String(row.latest_kind)) as SavedOrder["kind"],
  };
}

export type StatusResult =
  | { ok: true; order: SavedOrder }
  | { ok: false; code: "not_found" | "invalid_status" | "out_of_stock" };

/**
 * Move an order to a new status, in one transaction. Cancelling gives its stock back, once: the
 * stock statements only run while the order still holds stock. Reopening a cancelled order takes
 * the same stock again, and fails with out_of_stock (changing nothing) if there isn't enough left.
 */
export async function setOrderStatus(catalogId: string, orderId: string, status: OrderStatus): Promise<StatusResult> {
  const db = getDb();
  const current = await db.execute({ sql: "SELECT * FROM orders WHERE id = ? AND catalog_id = ?", args: [orderId, catalogId] });
  const row = rowsOf(current)[0];
  if (!row) return { ok: false, code: "not_found" };
  const order = toOrder(row);
  if (order.status === status) return { ok: true, order };
  if (!canMoveTo(order.status, status)) return { ok: false, code: "invalid_status" };

  const statements: InStatement[] = [];
  const reserve = stockToReserve(order.lines);
  const giveBack = status === "cancelled";
  const takeAgain = order.status === "cancelled" && reserve.size > 0;
  for (const [itemId, quantity] of giveBack || takeAgain ? reserve : []) {
    statements.push({
      // Only while the order is still as read above (and holds, or doesn't hold, its stock), so
      // two people changing it at once can't move the stock twice. Taking stock below zero makes
      // the menu_items_stock_not_negative trigger abort the whole batch.
      sql: `UPDATE menu_items SET stock_qty = stock_qty ${giveBack ? "+" : "-"} ?
            WHERE id = ? AND catalog_id = ? AND stock_qty IS NOT NULL
              AND (SELECT stock_reserved = ? AND status = ? FROM orders WHERE id = ?) = 1`,
      args: [quantity, itemId, catalogId, giveBack ? 1 : 0, order.status, orderId],
    });
  }
  const stockColumn = giveBack ? ", stock_reserved = 0" : takeAgain ? ", stock_reserved = 1" : "";
  statements.push({
    // Guarded by the status read above, so two people changing it at once can't skip a step
    sql: `UPDATE orders SET status = ?, updated_at = datetime('now')${stockColumn}
          WHERE id = ? AND catalog_id = ? AND status = ? RETURNING *`,
    args: [status, orderId, catalogId, order.status],
  });
  let results: ResultSet[];
  try {
    results = await db.batch(statements, "write");
  } catch (error) {
    if (String(error instanceof Error ? error.message : error).includes("out_of_stock")) return { ok: false, code: "out_of_stock" };
    throw error;
  }
  const updated = rowsOf(results[results.length - 1])[0];
  if (!updated) {
    // Someone else changed it first; report what it is now
    const again = await db.execute({ sql: "SELECT * FROM orders WHERE id = ? AND catalog_id = ?", args: [orderId, catalogId] });
    const now = rowsOf(again)[0];
    return now ? { ok: true, order: toOrder(now) } : { ok: false, code: "not_found" };
  }
  return { ok: true, order: toOrder(updated) };
}
