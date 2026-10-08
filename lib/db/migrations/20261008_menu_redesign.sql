-- Migration: Menu redesign (dual currency, order types, item availability)
-- Added: 2026-10-08

-- Pricing: which currency is the base, the merchant-set USD -> LBP rate and when it was set,
-- and whether the second currency is shown. There is deliberately no default rate: the menu
-- never converts prices with a rate the owner hasn't entered.
ALTER TABLE catalog_settings ADD COLUMN currency_primary TEXT DEFAULT 'USD';
ALTER TABLE catalog_settings ADD COLUMN lbp_exchange_rate REAL;
ALTER TABLE catalog_settings ADD COLUMN lbp_rate_updated_at TEXT;
ALTER TABLE catalog_settings ADD COLUMN show_dual_currency INTEGER DEFAULT 0;

-- Ordering: comma-separated list of enabled order types ('dine_in', 'takeaway', 'delivery')
ALTER TABLE catalog_settings ADD COLUMN order_types TEXT DEFAULT 'dine_in,takeaway';
ALTER TABLE catalog_settings ADD COLUMN delivery_note_ar TEXT;
ALTER TABLE catalog_settings ADD COLUMN delivery_note_en TEXT;

-- Availability: a dish can be temporarily sold out while staying on the menu
-- (is_active = 0 still hides it completely)
ALTER TABLE menu_items ADD COLUMN is_available INTEGER DEFAULT 1;
