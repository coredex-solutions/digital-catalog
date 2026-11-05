// Saving and following orders, bookings and service requests (table `orders`, migration
// 20261105_modules.sql). Each write is one database batch, which runs as a transaction: an order
// and the stock it takes are saved together or not at all.

import { randomBytes } from "node:crypto";
import { v4 as uuidv4 } from "uuid";
import type { InStatement, ResultSet } from "@libsql/client";
import { getDb } from "../db/client";
import type { PriceConfig } from "../catalog/price";
import { stockToReserve, type OrderLineSnapshot, type ValidOrder } from "./validate";
import type { StayBooking } from "./stays";

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
  /** Coupon discount on the items (taken off the total), in discount_currency */
  discount: number | null;
  discount_currency: string | null;
  coupon_code: string | null;
  /** Stays: the day guests leave (check-in is the date in requested_for, guests in party_size) */
  check_out: string | null;
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
    discount: num(row.discount),
    discount_currency: str(row.discount_currency),
    coupon_code: str(row.coupon_code),
    check_out: str(row.check_out),
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
  | { ok: false; code: "stock_changed" | "slot_taken" | "coupon_used_up" };

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

/** Stays that overlap the nights from `from` to `to` (not cancelled), for working out free rooms */
export async function stayBookings(catalogId: string, from: string, to: string): Promise<(StayBooking & { id: string })[]> {
  const result = await getDb().execute({
    sql: `SELECT id, requested_for, check_out, lines FROM orders
          WHERE catalog_id = ? AND check_out IS NOT NULL AND status != 'cancelled'
            AND check_out > ? AND substr(requested_for, 1, 10) < ?`,
    args: [catalogId, from, to],
  });
  return result.rows.map((row) => ({
    id: String(row.id),
    check_in: String(row.requested_for ?? "").slice(0, 10),
    check_out: String(row.check_out),
    lines: parseJson<{ item_id: string; quantity: number }[]>(row.lines, []).map((line) => ({ item_id: String(line.item_id), quantity: Number(line.quantity) || 0 })),
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
  source: "page" | "ai" | "admin" = "page",
  /** Bookings the team adds themselves start confirmed */
  status: "new" | "confirmed" = "new"
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
  // Stays: for each room asked, the rooms already taken on any of its nights plus this booking
  // must fit in what the item has, checked inside the INSERT so the last room can't go twice
  const stayChecks =
    order.checkOut && order.requestedFor && order.units
      ? order.units.map((unit) => ({
          sql: `(SELECT COALESCE(SUM(CAST(json_extract(j.value, '$.quantity') AS INTEGER)), 0)
                 FROM orders o, json_each(o.lines) j
                 WHERE o.catalog_id = ? AND o.check_out IS NOT NULL AND o.status != 'cancelled'
                   AND substr(o.requested_for, 1, 10) < ? AND o.check_out > ?
                   AND json_extract(j.value, '$.item_id') = ?) + ? <= ?`,
          args: [catalogId, order.checkOut!, order.requestedFor!.slice(0, 10), unit.itemId, unit.quantity, unit.count],
        }))
      : [];
  const stay = stayChecks.length
    ? { sql: stayChecks.map((check) => check.sql).join(" AND "), args: stayChecks.flatMap((check) => check.args) }
    : { sql: "1", args: [] };
  // A coupon must still have uses left when the order is saved
  const coupon = order.couponId
    ? {
        sql: "(SELECT is_active = 1 AND (max_uses IS NULL OR used_count < max_uses) FROM coupons WHERE id = ? AND catalog_id = ?) = 1",
        args: [order.couponId, catalogId],
      }
    : { sql: "1", args: [] };

  statements.push({
    // The number is taken inside the INSERT so two orders can't get the same one
    sql: `INSERT INTO orders (
            id, catalog_id, number, kind, status, order_type, customer_name, customer_phone,
            table_label, address, area, requested_for, party_size, lines, price_config, total_usd,
            note, lang, source, stock_reserved, client_key, delivery_fee, delivery_currency,
            payment_method, public_token, duration_minutes, discount, discount_currency, coupon_code,
            check_out, created_at, updated_at
          ) SELECT
            ?, ?, (SELECT COALESCE(MAX(number), 0) + 1 FROM orders WHERE catalog_id = ?), ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now')
          WHERE ${slot.sql} AND ${coupon.sql} AND ${stay.sql}
          RETURNING *`,
    args: [
      id,
      catalogId,
      catalogId,
      order.kind,
      status,
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
      order.discount,
      order.discountCurrency,
      order.couponCode,
      order.checkOut,
      ...slot.args,
      ...coupon.args,
      ...stay.args,
    ],
  });
  if (order.couponId) {
    statements.push({
      sql: "UPDATE coupons SET used_count = used_count + 1 WHERE id = ? AND EXISTS (SELECT 1 FROM orders WHERE id = ?)",
      args: [order.couponId, id],
    });
  }
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
    if (!row) {
      // Not saved: the coupon ran out of uses, or the time was taken
      if (order.couponId) {
        const left = await getDb().execute({
          sql: "SELECT is_active = 1 AND (max_uses IS NULL OR used_count < max_uses) AS ok FROM coupons WHERE id = ?",
          args: [order.couponId],
        });
        if (!Number(left.rows[0]?.ok)) return { ok: false, code: "coupon_used_up" };
      }
      return { ok: false, code: "slot_taken" };
    }
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
  | { ok: false; code: "not_found" | "invalid_status" | "out_of_stock" | "dates_taken" };

/**
 * Move an order to a new status, in one transaction. Cancelling gives its stock back, once: the
 * stock statements only run while the order still holds stock. Reopening a cancelled order takes
 * the same stock again, and fails with out_of_stock (changing nothing) if there isn't enough left.
 */
/** SQL that is true while each room of a stay is free on its nights, not counting the stay itself */
function stayRoomChecks(catalogId: string, orderId: string, checkIn: string, checkOut: string, lines: { item_id: string; quantity: number }[]) {
  const perItem = new Map<string, number>();
  for (const line of lines) perItem.set(line.item_id, (perItem.get(line.item_id) || 0) + line.quantity);
  const parts = [...perItem].map(([itemId, quantity]) => ({
    sql: `(SELECT COALESCE(SUM(CAST(json_extract(j.value, '$.quantity') AS INTEGER)), 0)
           FROM orders o, json_each(o.lines) j
           WHERE o.catalog_id = ? AND o.id != ? AND o.check_out IS NOT NULL AND o.status != 'cancelled'
             AND substr(o.requested_for, 1, 10) < ? AND o.check_out > ?
             AND json_extract(j.value, '$.item_id') = ?) + ?
          <= COALESCE((SELECT MAX(unit_count, 1) FROM menu_items WHERE id = ? AND catalog_id = ?), 1)`,
    args: [catalogId, orderId, checkOut, checkIn, itemId, quantity, itemId, catalogId],
  }));
  return parts.length ? { sql: parts.map((p) => p.sql).join(" AND "), args: parts.flatMap((p) => p.args) } : { sql: "1", args: [] };
}

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
  // A cancelled order gives its coupon use back; reopening it uses it again
  if (order.coupon_code && (giveBack || order.status === "cancelled")) {
    statements.push({
      sql: `UPDATE coupons SET used_count = MAX(used_count ${giveBack ? "- 1" : "+ 1"}, 0)
            WHERE catalog_id = ? AND code = ? AND (SELECT status = ? FROM orders WHERE id = ?) = 1`,
      args: [catalogId, order.coupon_code, order.status, orderId],
    });
  }
  const stockColumn = giveBack ? ", stock_reserved = 0" : takeAgain ? ", stock_reserved = 1" : "";
  // Reopening a cancelled stay: its rooms must still be free on its nights (other stays may
  // have taken them since)
  const reopenStay = order.status === "cancelled" && order.check_out && order.requested_for;
  const roomsFree = reopenStay
    ? stayRoomChecks(catalogId, orderId, order.requested_for!.slice(0, 10), order.check_out!, order.lines)
    : { sql: "1", args: [] };
  statements.push({
    // Guarded by the status read above, so two people changing it at once can't skip a step
    sql: `UPDATE orders SET status = ?, updated_at = datetime('now')${stockColumn}
          WHERE id = ? AND catalog_id = ? AND status = ? AND ${roomsFree.sql} RETURNING *`,
    args: [status, orderId, catalogId, order.status, ...roomsFree.args],
  });
  let results: ResultSet[];
  try {
    results = await db.batch(statements, "write");
  } catch (error) {
    if (String(error instanceof Error ? error.message : error).includes("out_of_stock")) return { ok: false, code: "out_of_stock" };
    throw error;
  }
  const updated = rowsOf(results[results.length - 1])[0];
  if (!updated && reopenStay) {
    const again = await db.execute({ sql: "SELECT status FROM orders WHERE id = ? AND catalog_id = ?", args: [orderId, catalogId] });
    if (String(again.rows[0]?.status) === "cancelled") return { ok: false, code: "dates_taken" };
  }
  if (!updated) {
    // Someone else changed it first; report what it is now
    const again = await db.execute({ sql: "SELECT * FROM orders WHERE id = ? AND catalog_id = ?", args: [orderId, catalogId] });
    const now = rowsOf(again)[0];
    return now ? { ok: true, order: toOrder(now) } : { ok: false, code: "not_found" };
  }
  return { ok: true, order: toOrder(updated) };
}
