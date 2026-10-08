-- Migration: Add limits and plan requests
-- Added: 2026-01-30

-- 1. Add limits to catalog_subscriptions
ALTER TABLE catalog_subscriptions ADD COLUMN max_items INTEGER DEFAULT 100;
ALTER TABLE catalog_subscriptions ADD COLUMN max_categories INTEGER DEFAULT 20;

-- 2. Create plan_requests table
CREATE TABLE IF NOT EXISTS plan_requests (
    id TEXT PRIMARY KEY,
    catalog_id TEXT NOT NULL REFERENCES catalogs(id) ON DELETE CASCADE,
    plan_name TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    admin_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for plan_requests
CREATE INDEX IF NOT EXISTS idx_plan_requests_catalog ON plan_requests(catalog_id);
CREATE INDEX IF NOT EXISTS idx_plan_requests_status ON plan_requests(status);
