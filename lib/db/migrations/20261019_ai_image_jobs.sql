-- AI photo jobs (lib/ai/image-jobs.ts). Each job is one request to enhance the owner's photo
-- or to create an illustrative image for a dish. Nothing reaches the dish until the owner
-- approves the result, and the original is kept so they can switch back.
CREATE TABLE IF NOT EXISTS ai_image_jobs (
  id TEXT PRIMARY KEY,
  catalog_id TEXT NOT NULL REFERENCES catalogs(id) ON DELETE CASCADE,
  item_id TEXT,
  kind TEXT NOT NULL,                 -- enhance (the owner's photo) or illustrate (made from the dish's name)
  style TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued', -- queued, processing, failed, ready, approved, discarded, reverted
  source_url TEXT,                    -- the photo that was enhanced
  result_url TEXT,
  previous_image_url TEXT,            -- what the dish showed before approval
  previous_is_illustrative INTEGER DEFAULT 0,
  error TEXT,
  credit_charged INTEGER NOT NULL DEFAULT 0,
  attempts INTEGER NOT NULL DEFAULT 0,
  idempotency_key TEXT NOT NULL,      -- repeating the same request returns the same job
  created_by TEXT,
  decided_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  decided_at DATETIME,
  UNIQUE(catalog_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_ai_image_jobs_item ON ai_image_jobs(catalog_id, item_id, created_at);

-- Guests see an "Illustrative image" label on dishes whose photo was generated, not taken
ALTER TABLE menu_items ADD COLUMN image_is_illustrative INTEGER DEFAULT 0;
