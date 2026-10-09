// Draft → preview → publish (MENUDESIGN.md: "Preview an unpublished change, publish and restore a
// prior revision"; "Keep public published-menu data separate from private drafts").
//
// Owners edit the live `categories` / `menu_items` rows: that is the draft. Publishing copies
// them into `catalog_menu_versions` as a JSON snapshot, and guests see the latest snapshot.
// Not versioned (stay instant): an item's sold-out switch (`is_available`), settings and the
// exchange rate, hours, branches, FAQs and contact details.
// Catalogs that have never published (created before this feature) show the live rows.

import { v4 as uuidv4 } from "uuid";
import type { InStatement, ResultSet } from "@libsql/client";
import { getDb } from "../db/client";

type Row = Record<string, unknown>;

export interface MenuSnapshot {
  categories: Row[];
  items: Row[];
}

export interface MenuVersion {
  id: string;
  version: number;
  note: string | null;
  published_by: string | null;
  published_at: string;
  data: MenuSnapshot;
}

/** Plain objects (libsql rows also carry numeric keys) */
function toRows(result: ResultSet): Row[] {
  return result.rows.map((row) => Object.fromEntries(result.columns.map((column) => [column, row[column]])));
}

function parseSnapshot(text: unknown): MenuSnapshot {
  try {
    const data = JSON.parse(String(text));
    return {
      categories: Array.isArray(data?.categories) ? data.categories : [],
      items: Array.isArray(data?.items) ? data.items : [],
    };
  } catch {
    return { categories: [], items: [] };
  }
}

/** Every category and item row of the catalog, as the owner currently has them */
export async function getLiveMenu(catalogId: string): Promise<MenuSnapshot> {
  const db = getDb();
  const [categories, items] = await Promise.all([
    db.execute({ sql: "SELECT * FROM categories WHERE catalog_id = ? ORDER BY display_order ASC, id ASC", args: [catalogId] }),
    db.execute({ sql: "SELECT * FROM menu_items WHERE catalog_id = ? ORDER BY display_order ASC, id ASC", args: [catalogId] }),
  ]);
  return { categories: toRows(categories), items: toRows(items) };
}

/** The latest published version, or null if the catalog has never published */
export async function getPublishedVersion(catalogId: string): Promise<MenuVersion | null> {
  const result = await getDb().execute({
    sql: `SELECT id, version, note, published_by, published_at, data FROM catalog_menu_versions
          WHERE catalog_id = ? ORDER BY version DESC LIMIT 1`,
    args: [catalogId],
  });
  const row = result.rows[0];
  if (!row) return null;
  return {
    id: String(row.id),
    version: Number(row.version),
    note: row.note == null ? null : String(row.note),
    published_by: row.published_by == null ? null : String(row.published_by),
    published_at: String(row.published_at),
    data: parseSnapshot(row.data),
  };
}

const isOn = (value: unknown) => Number(value ?? 1) === 1;
const byOrder = (a: Row, b: Row) => Number(a.display_order ?? 0) - Number(b.display_order ?? 0);

/** What guests see from a snapshot: active items in active categories, in display order */
function visibleMenu(menu: MenuSnapshot) {
  const categories = menu.categories.filter((c) => isOn(c.is_active)).sort(byOrder);
  const activeCategoryIds = new Set(categories.map((c) => String(c.id)));
  const items = menu.items
    .filter((i) => isOn(i.is_active) && activeCategoryIds.has(String(i.category_id)))
    .sort(byOrder);
  return { categories, items };
}

/**
 * The menu guests see: the latest published version with today's sold-out switches applied,
 * or (preview, or never published) the owner's live rows.
 */
export async function getPublicMenu(catalogId: string, options: { preview?: boolean } = {}) {
  const published = options.preview ? null : await getPublishedVersion(catalogId);
  if (!published) {
    const live = visibleMenu(await getLiveMenu(catalogId));
    return { ...live, version: null as number | null };
  }

  const { categories, items } = visibleMenu(published.data);
  // Sold out is operational, not content: always use the live switch where the item still exists
  const availability = await getDb().execute({
    sql: "SELECT id, is_available FROM menu_items WHERE catalog_id = ?",
    args: [catalogId],
  });
  const live = new Map(availability.rows.map((row) => [String(row.id), row.is_available]));
  return {
    categories,
    items: items.map((item) => (live.has(String(item.id)) ? { ...item, is_available: live.get(String(item.id)) } : item)),
    version: published.version,
  };
}

// ---- Changes since the last publish ----

const ITEM_FIELDS = [
  "name_en", "name_ar", "description_en", "description_ar", "price", "currency", "image_url",
  "category_id", "display_order", "is_active", "is_featured", "variants", "dietary", "allergens",
] as const;
const CATEGORY_FIELDS = ["name_en", "name_ar", "image_url", "display_order", "is_active"] as const;

export type ChangeKind = "added" | "removed" | "changed";

export interface MenuChange {
  kind: ChangeKind;
  type: "item" | "category";
  id: string;
  name: string;
  /** Changed fields, e.g. [{ field: "price", from: 4, to: 5 }] */
  fields?: { field: string; from: unknown; to: unknown }[];
}

function same(a: unknown, b: unknown): boolean {
  const norm = (v: unknown) => (v === undefined || v === "" ? null : typeof v === "number" || typeof v === "bigint" ? Number(v) : v);
  const x = norm(a);
  const y = norm(b);
  if (typeof x === "number" || typeof y === "number") return Number(x) === Number(y);
  return x === y;
}

function diffRows(type: "item" | "category", live: Row[], published: Row[], fields: readonly string[]): MenuChange[] {
  const before = new Map(published.map((row) => [String(row.id), row]));
  const after = new Map(live.map((row) => [String(row.id), row]));
  const name = (row: Row) => String(row.name_en || row.name_ar || "");
  const changes: MenuChange[] = [];

  for (const [id, row] of after) {
    const old = before.get(id);
    if (!old) {
      changes.push({ kind: "added", type, id, name: name(row) });
      continue;
    }
    const changed = fields
      .filter((field) => !same(row[field], old[field]))
      .map((field) => ({ field, from: old[field] ?? null, to: row[field] ?? null }));
    if (changed.length > 0) changes.push({ kind: "changed", type, id, name: name(row), fields: changed });
  }
  for (const [id, row] of before) {
    if (!after.has(id)) changes.push({ kind: "removed", type, id, name: name(row) });
  }
  return changes;
}

/** Draft vs latest published version (sold-out switches are not changes: they're instant) */
export function diffMenus(live: MenuSnapshot, published: MenuSnapshot | null): MenuChange[] {
  const base = published ?? { categories: [], items: [] };
  return [
    ...diffRows("category", live.categories, base.categories, CATEGORY_FIELDS),
    ...diffRows("item", live.items, base.items, ITEM_FIELDS),
  ];
}

// ---- Publishing and restoring ----

function insertVersion(catalogId: string, menu: MenuSnapshot, note: string | null, by: string | null): InStatement {
  // The version number is taken inside the INSERT, so two publishes can't get the same number
  return {
    sql: `INSERT INTO catalog_menu_versions (id, catalog_id, version, data, note, published_by, published_at)
          VALUES (?, ?, (SELECT COALESCE(MAX(version), 0) + 1 FROM catalog_menu_versions WHERE catalog_id = ?), ?, ?, ?, datetime('now'))`,
    args: [uuidv4(), catalogId, catalogId, JSON.stringify(menu), note, by],
  };
}

/** Publish the owner's current draft as a new version */
export async function publishMenu(catalogId: string, by: string | null, note?: string | null) {
  const live = await getLiveMenu(catalogId);
  const cleanNote = note?.trim().slice(0, 200) || null;
  await getDb().execute(insertVersion(catalogId, live, cleanNote, by));
  return getPublishedVersion(catalogId);
}

/** The statement that creates an empty first version, so a new catalog starts in draft mode */
export function initialVersionStatement(catalogId: string): InStatement {
  return insertVersion(catalogId, { categories: [], items: [] }, "Created", null);
}

function insertRow(table: "categories" | "menu_items", row: Row): InStatement {
  const columns = Object.keys(row).filter((c) => /^[a-z_][a-z0-9_]*$/.test(c));
  return {
    sql: `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`,
    args: columns.map((c) => {
      const value = row[c];
      return value === undefined ? null : (value as string | number | null);
    }),
  };
}

/**
 * Put an older version back: the draft is replaced by that version's categories and items, and
 * it is published again as a new version (history is never rewritten). Columns that no longer
 * exist are skipped; today's sold-out switches are kept for items that still exist.
 */
export async function restoreVersion(catalogId: string, versionId: string, by: string | null) {
  const db = getDb();
  const target = await db.execute({
    sql: "SELECT version, data FROM catalog_menu_versions WHERE id = ? AND catalog_id = ?",
    args: [versionId, catalogId],
  });
  const row = target.rows[0];
  if (!row) return null;
  const snapshot = parseSnapshot(row.data);

  const [categoryColumns, itemColumns, availability] = await Promise.all([
    db.execute("PRAGMA table_info(categories)"),
    db.execute("PRAGMA table_info(menu_items)"),
    db.execute({ sql: "SELECT id, is_available FROM menu_items WHERE catalog_id = ?", args: [catalogId] }),
  ]);
  const keep = (columnsResult: ResultSet, source: Row) => {
    const allowed = new Set(columnsResult.rows.map((c) => String(c.name)));
    return Object.fromEntries(Object.entries(source).filter(([key]) => allowed.has(key)));
  };
  const soldOut = new Map(availability.rows.map((r) => [String(r.id), r.is_available]));

  const statements: InStatement[] = [
    { sql: "DELETE FROM menu_items WHERE catalog_id = ?", args: [catalogId] },
    { sql: "DELETE FROM categories WHERE catalog_id = ?", args: [catalogId] },
    ...snapshot.categories.map((c) => insertRow("categories", keep(categoryColumns, { ...c, catalog_id: catalogId }))),
    ...snapshot.items.map((i) => {
      const id = String(i.id);
      const withAvailability = soldOut.has(id) ? { ...i, is_available: soldOut.get(id) } : i;
      return insertRow("menu_items", keep(itemColumns, { ...withAvailability, catalog_id: catalogId }));
    }),
  ];
  statements.push(insertVersion(catalogId, snapshot, `Restored version ${Number(row.version)}`, by));
  await db.batch(statements, "write");
  return getPublishedVersion(catalogId);
}

/** Version history, newest first, without the snapshot payloads */
export async function listVersions(catalogId: string, limit = 20) {
  const result = await getDb().execute({
    sql: `SELECT id, version, note, published_by, published_at,
            json_array_length(json_extract(data, '$.items')) AS item_count
          FROM catalog_menu_versions WHERE catalog_id = ? ORDER BY version DESC LIMIT ?`,
    args: [catalogId, limit],
  });
  return result.rows.map((r) => ({
    id: String(r.id),
    version: Number(r.version),
    note: r.note == null ? null : String(r.note),
    published_by: r.published_by == null ? null : String(r.published_by),
    published_at: String(r.published_at),
    item_count: Number(r.item_count ?? 0),
  }));
}
