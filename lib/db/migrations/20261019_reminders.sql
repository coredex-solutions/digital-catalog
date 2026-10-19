-- Emails sent to owners before and after their plan ends (see /api/cron/reminders).
-- One row per catalog, kind and expiry date, so each reminder goes out once per plan period
-- and a renewal (new expiry) starts a fresh cycle.
CREATE TABLE IF NOT EXISTS subscription_reminders (
  id TEXT PRIMARY KEY,
  catalog_id TEXT NOT NULL REFERENCES catalogs(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,          -- 'ending_soon' or 'ended'
  expires_at TEXT NOT NULL,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(catalog_id, kind, expires_at)
);
