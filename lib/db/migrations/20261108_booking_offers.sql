-- Set booking times, coupon codes and loyalty stamps.
--
-- catalog_settings.booking_config: JSON (lib/orders/slots.ts). NULL = no set times: customers
--   pick any date and time, as before.
-- catalog_settings.loyalty_config: JSON { enabled, every, reward_en, reward_ar }
--   (lib/orders/loyalty.ts). Stamps are counted from finished orders by phone number.
ALTER TABLE catalog_settings ADD COLUMN booking_config TEXT;
ALTER TABLE catalog_settings ADD COLUMN loyalty_config TEXT;

-- duration_minutes: how long a booking or appointment lasts, so set times don't overlap
-- discount / discount_currency / coupon_code: the coupon applied, worked out by the server
ALTER TABLE orders ADD COLUMN duration_minutes INTEGER;
ALTER TABLE orders ADD COLUMN discount REAL;
ALTER TABLE orders ADD COLUMN discount_currency TEXT;
ALTER TABLE orders ADD COLUMN coupon_code TEXT;
CREATE INDEX IF NOT EXISTS idx_orders_catalog_requested ON orders(catalog_id, kind, requested_for);

-- Coupon codes. kind: percent (value = % off the items) or amount (value off, in currency).
-- min_order is in currency too. starts_on / ends_on are Beirut dates (YYYY-MM-DD), inclusive.
-- used_count counts orders that used it (cancelled ones give it back).
CREATE TABLE IF NOT EXISTS coupons (
  id TEXT PRIMARY KEY,
  catalog_id TEXT NOT NULL REFERENCES catalogs(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'percent',
  value REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  min_order REAL,
  starts_on TEXT,
  ends_on TEXT,
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(catalog_id, code)
);
CREATE INDEX IF NOT EXISTS idx_coupons_catalog ON coupons(catalog_id);
