-- Guesthouses, chalets and hotels (module "stays"): rooms and chalets booked by the night.
--
-- menu_items.unit_count: how many identical rooms or chalets this item is (NULL = 1)
-- menu_items.max_guests: most guests one of them sleeps (NULL = not limited)
-- menu_items.weekend_price: price for Friday and Saturday nights (NULL = same as price)
ALTER TABLE menu_items ADD COLUMN unit_count INTEGER;
ALTER TABLE menu_items ADD COLUMN max_guests INTEGER;
ALTER TABLE menu_items ADD COLUMN weekend_price REAL;

-- orders.check_out: the day guests leave (YYYY-MM-DD). The check-in day and time are in
-- requested_for and the number of guests in party_size, so upcoming lists and reminders work
-- as for other bookings. Only stays have a check_out.
ALTER TABLE orders ADD COLUMN check_out TEXT;
CREATE INDEX IF NOT EXISTS idx_orders_catalog_check_out ON orders(catalog_id, check_out);

-- catalog_settings.stay_config: JSON (lib/orders/stays.ts): check-in and check-out times,
-- shortest and longest stay, how far ahead, closed dates and the deposit
ALTER TABLE catalog_settings ADD COLUMN stay_config TEXT;
