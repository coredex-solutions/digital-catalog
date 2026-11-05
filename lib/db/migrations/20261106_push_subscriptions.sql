-- Phone and computer notifications for new orders (Web Push), even when the dashboard is closed.
-- One row per device and catalog: the same browser can follow several catalogs with one endpoint.
-- Rows go when the team member or catalog is deleted, or when the push service says the device is gone.

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id TEXT PRIMARY KEY,
  catalog_id TEXT NOT NULL REFERENCES catalogs(id) ON DELETE CASCADE,
  admin_id TEXT NOT NULL REFERENCES catalog_admins(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  lang TEXT NOT NULL DEFAULT 'en',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_sent_at DATETIME,
  UNIQUE (catalog_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_catalog ON push_subscriptions(catalog_id);
