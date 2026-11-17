-- Waiting lists for fully booked days (services with set times; lib/orders/waitlist.ts).
--
-- A customer who finds a day full leaves their name and phone, the services and the person they
-- wanted. The team sees the list on the calendar and messages them on WhatsApp when a time opens.
-- status: waiting → contacted (the team sent the message) or removed. One entry per phone per day.
-- services: JSON [{ id, name_en, name_ar }] as they were when joining.
CREATE TABLE IF NOT EXISTS booking_waitlist (
  id TEXT PRIMARY KEY,
  catalog_id TEXT NOT NULL REFERENCES catalogs(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  lang TEXT NOT NULL DEFAULT 'en',
  services TEXT,
  staff_id TEXT,
  staff_name TEXT,
  status TEXT NOT NULL DEFAULT 'waiting',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  contacted_at DATETIME
);
CREATE INDEX IF NOT EXISTS idx_waitlist_catalog_date ON booking_waitlist(catalog_id, date, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_waitlist_phone_day ON booking_waitlist(catalog_id, date, phone);
