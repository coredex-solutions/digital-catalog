-- Migration to add dark mode color columns to catalog_settings
ALTER TABLE catalog_settings ADD COLUMN color_background_dark TEXT DEFAULT '#0f172a';
ALTER TABLE catalog_settings ADD COLUMN color_surface_dark TEXT DEFAULT '#1e293b';
ALTER TABLE catalog_settings ADD COLUMN color_text_dark TEXT DEFAULT '#f8fafc';
ALTER TABLE catalog_settings ADD COLUMN color_text_muted_dark TEXT DEFAULT '#94a3b8';
