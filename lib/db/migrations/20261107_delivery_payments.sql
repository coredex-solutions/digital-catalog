-- Delivery areas with fees, payment methods, and a status page for each order.
--
-- catalog_settings.delivery_config: JSON { currency, free_over, zones: [{ id, name_en, name_ar,
--   fee, min_order, eta_minutes }] } (lib/orders/delivery.ts). NULL = no areas: the customer types
--   the area and no fee is added, as before.
-- catalog_settings.payment_config: JSON { methods: [cash, card, whish, omt], whish_phone,
--   omt_name, omt_phone } (lib/orders/payment.ts). NULL = cash only.
ALTER TABLE catalog_settings ADD COLUMN delivery_config TEXT;
ALTER TABLE catalog_settings ADD COLUMN payment_config TEXT;

-- delivery_fee / delivery_currency: the fee worked out by the server for the chosen area
-- payment_method: how the customer said they'll pay; paid_at: when the team marked it paid
-- public_token: random key for the customer's order status page (/c/<slug>/order/<token>/)
ALTER TABLE orders ADD COLUMN delivery_fee REAL;
ALTER TABLE orders ADD COLUMN delivery_currency TEXT;
ALTER TABLE orders ADD COLUMN payment_method TEXT;
ALTER TABLE orders ADD COLUMN paid_at DATETIME;
ALTER TABLE orders ADD COLUMN public_token TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_public_token ON orders(public_token);
