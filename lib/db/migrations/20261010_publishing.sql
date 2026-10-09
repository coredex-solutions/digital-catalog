-- Draft / preview / publish: published menu versions
-- Each row is a full snapshot of a catalog's categories + menu items (JSON:
-- {"categories":[...rows],"items":[...rows]}). The guest menu reads the latest version;
-- catalogs with no version yet read the live tables (legacy behaviour).
CREATE TABLE IF NOT EXISTS catalog_menu_versions (
  id TEXT PRIMARY KEY,
  catalog_id TEXT NOT NULL REFERENCES catalogs(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  data TEXT NOT NULL,
  note TEXT,
  published_by TEXT,
  published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(catalog_id, version)
);

CREATE INDEX IF NOT EXISTS idx_catalog_menu_versions_catalog ON catalog_menu_versions(catalog_id);
