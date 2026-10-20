-- Dishes imported from a spreadsheet or a photo of a printed menu (see /api/c/[slug]/admin/import).
-- One row per import: who did it and how much was added. The key the dashboard sends makes a
-- repeated request (double click, retry) add the dishes only once.
CREATE TABLE IF NOT EXISTS menu_imports (
  id TEXT PRIMARY KEY,
  catalog_id TEXT NOT NULL REFERENCES catalogs(id) ON DELETE CASCADE,
  import_key TEXT NOT NULL,
  source TEXT NOT NULL,        -- 'spreadsheet' or 'photo'
  category_count INTEGER NOT NULL DEFAULT 0,
  dish_count INTEGER NOT NULL DEFAULT 0,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(catalog_id, import_key)
);
