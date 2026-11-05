// Reading and changing a catalog's coupons (table `coupons`, migration 20261108_booking_offers.sql).

import { v4 as uuidv4 } from "uuid";
import { getDb } from "../db/client";
import { MAX_COUPONS, normalizeCode, rowToCoupon, type Coupon, type CouponInput } from "./coupons";

export async function findCouponByCode(catalogId: string, code: string): Promise<Coupon | null> {
  const normalized = normalizeCode(code);
  if (!normalized) return null;
  const result = await getDb().execute({ sql: "SELECT * FROM coupons WHERE catalog_id = ? AND code = ?", args: [catalogId, normalized] });
  const row = result.rows[0];
  return row ? rowToCoupon(row as unknown as Record<string, unknown>) : null;
}

/** Is there a coupon customers could use today? (Decides whether checkout shows the code field.) */
export async function hasUsableCoupons(catalogId: string, today: string): Promise<boolean> {
  const result = await getDb().execute({
    sql: `SELECT 1 FROM coupons WHERE catalog_id = ? AND is_active = 1
          AND (starts_on IS NULL OR starts_on <= ?) AND (ends_on IS NULL OR ends_on >= ?)
          AND (max_uses IS NULL OR used_count < max_uses) LIMIT 1`,
    args: [catalogId, today, today],
  });
  return result.rows.length > 0;
}

export async function listCoupons(catalogId: string): Promise<Coupon[]> {
  const result = await getDb().execute({ sql: "SELECT * FROM coupons WHERE catalog_id = ? ORDER BY created_at DESC", args: [catalogId] });
  return result.rows.map((row) => rowToCoupon(row as unknown as Record<string, unknown>));
}

export type SaveCouponResult = { ok: true; coupon: Coupon } | { ok: false; code: "duplicate" | "too_many" | "not_found" };

export async function createCoupon(catalogId: string, input: CouponInput): Promise<SaveCouponResult> {
  const db = getDb();
  const count = await db.execute({ sql: "SELECT COUNT(*) AS n FROM coupons WHERE catalog_id = ?", args: [catalogId] });
  if (Number(count.rows[0]?.n ?? 0) >= MAX_COUPONS) return { ok: false, code: "too_many" };
  try {
    const result = await db.execute({
      sql: `INSERT INTO coupons (id, catalog_id, code, kind, value, currency, min_order, starts_on, ends_on, max_uses, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
      args: [uuidv4(), catalogId, input.code, input.kind, input.value, input.currency, input.min_order, input.starts_on, input.ends_on, input.max_uses, input.is_active ? 1 : 0],
    });
    return { ok: true, coupon: rowToCoupon(result.rows[0] as unknown as Record<string, unknown>) };
  } catch (error) {
    if (/UNIQUE constraint failed/.test(error instanceof Error ? error.message : String(error))) return { ok: false, code: "duplicate" };
    throw error;
  }
}

export async function updateCoupon(catalogId: string, id: string, input: CouponInput): Promise<SaveCouponResult> {
  try {
    const result = await getDb().execute({
      sql: `UPDATE coupons SET code = ?, kind = ?, value = ?, currency = ?, min_order = ?, starts_on = ?, ends_on = ?, max_uses = ?, is_active = ?
            WHERE id = ? AND catalog_id = ? RETURNING *`,
      args: [input.code, input.kind, input.value, input.currency, input.min_order, input.starts_on, input.ends_on, input.max_uses, input.is_active ? 1 : 0, id, catalogId],
    });
    const row = result.rows[0];
    return row ? { ok: true, coupon: rowToCoupon(row as unknown as Record<string, unknown>) } : { ok: false, code: "not_found" };
  } catch (error) {
    if (/UNIQUE constraint failed/.test(error instanceof Error ? error.message : String(error))) return { ok: false, code: "duplicate" };
    throw error;
  }
}

export async function deleteCoupon(catalogId: string, id: string): Promise<boolean> {
  const result = await getDb().execute({ sql: "DELETE FROM coupons WHERE id = ? AND catalog_id = ?", args: [id, catalogId] });
  return result.rowsAffected > 0;
}
