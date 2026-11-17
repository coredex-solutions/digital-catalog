-- Staff calendars for appointments, and reminders.
--
-- The staff list itself lives in catalog_settings.booking_config (JSON "staff", see
-- lib/orders/staff.ts), next to the booking times it belongs with.
--
-- orders.staff_id / staff_name: who the appointment is with (the name is kept so the booking still
--   reads right after the person is renamed or removed). NULL = no staff (or booked before staff
--   were set up).
-- orders.reminded_at: when the team sent the customer a reminder from the calendar.
ALTER TABLE orders ADD COLUMN staff_id TEXT;
ALTER TABLE orders ADD COLUMN staff_name TEXT;
ALTER TABLE orders ADD COLUMN reminded_at DATETIME;
CREATE INDEX IF NOT EXISTS idx_orders_staff ON orders(catalog_id, staff_id, requested_for);
