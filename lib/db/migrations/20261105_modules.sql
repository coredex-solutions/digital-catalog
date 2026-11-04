-- Business modules (lib/modules/registry.ts) and saved orders.
--
-- catalogs.module: the main module (restaurant, cafe, shop, services). business_type stays as the
--   finer sub-type (e.g. bakery, clothing, salon), used for schema.org and labels.
-- catalogs.addons: comma list of add-ons switched on; NULL = the module's defaults.
ALTER TABLE catalogs ADD COLUMN module TEXT NOT NULL DEFAULT 'restaurant';
ALTER TABLE catalogs ADD COLUMN addons TEXT;

-- Existing catalogs: module from the old business type (same mapping as legacyBusinessTypeToModule)
UPDATE catalogs SET module = CASE
  WHEN business_type IN ('cafe', 'bakery', 'pastry', 'juice') THEN 'cafe'
  WHEN business_type IN ('retail', 'grocery', 'pharmacy', 'supermarket', 'clothing', 'electronics', 'gifts') THEN 'shop'
  WHEN business_type IN ('salon', 'gym', 'medical', 'beauty', 'clinic', 'fitness', 'repair', 'car_care', 'other_service') THEN 'services'
  ELSE 'restaurant'
END
WHERE module = 'restaurant';

-- Catalogs moved off the restaurant module still have the restaurant order types (dine-in,
-- takeaway), which their module doesn't offer: give them their module's defaults
UPDATE catalog_settings SET order_types = 'delivery,pickup'
WHERE order_types = 'dine_in,takeaway' AND catalog_id IN (SELECT id FROM catalogs WHERE module = 'shop');
UPDATE catalog_settings SET order_types = 'at_location'
WHERE order_types = 'dine_in,takeaway' AND catalog_id IN (SELECT id FROM catalogs WHERE module = 'services');

-- Item fields for shops and services. All optional; NULL = not used.
-- stock_qty: units left (NULL = not tracked). Like the sold-out switch it is live, not part of a
--   published version, so orders change it straight away.
-- compare_at_price: the old price, shown crossed out next to a lower price
-- duration_minutes: how long a service takes
ALTER TABLE menu_items ADD COLUMN stock_qty INTEGER;
ALTER TABLE menu_items ADD COLUMN sku TEXT;
ALTER TABLE menu_items ADD COLUMN compare_at_price REAL;
ALTER TABLE menu_items ADD COLUMN duration_minutes INTEGER;

-- Orders, table bookings and service requests sent from a catalog page. The customer also sends
-- them on WhatsApp; this copy lets the owner follow them in the dashboard.
-- lines: JSON snapshot [{ item_id, name_en, name_ar, variant_id, variant_en, variant_ar,
--   price, currency, quantity, note }] with the server's prices at the time of the order.
-- price_config: the catalog's currency settings at the time, so totals show as the customer saw them.
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  catalog_id TEXT NOT NULL REFERENCES catalogs(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  kind TEXT NOT NULL DEFAULT 'order',          -- order, booking, request
  status TEXT NOT NULL DEFAULT 'new',          -- new, confirmed, ready, completed, cancelled
  order_type TEXT,                             -- dine_in, takeaway, delivery, pickup, at_location, home_visit
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  table_label TEXT,
  address TEXT,
  area TEXT,
  requested_for TEXT,                          -- 'YYYY-MM-DD HH:MM' (Beirut), for bookings, appointments and pre-orders
  party_size INTEGER,
  lines TEXT NOT NULL DEFAULT '[]',
  price_config TEXT,
  total_usd REAL,                              -- for reports; NULL when it can't be converted
  note TEXT,
  lang TEXT,
  source TEXT NOT NULL DEFAULT 'page',
  stock_reserved INTEGER NOT NULL DEFAULT 0,   -- 1 while this order holds stock (given back on cancel)
  client_key TEXT,                             -- sent by the page, so a repeated request saves the order once
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(catalog_id, number)
);
CREATE INDEX IF NOT EXISTS idx_orders_catalog_status ON orders(catalog_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_catalog_created ON orders(catalog_id, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_client_key ON orders(catalog_id, client_key);
-- The rule that stock never goes below zero is a trigger in scripts/init-db.mjs (its body has
-- semicolons, which this file format splits on)
