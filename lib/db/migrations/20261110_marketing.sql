-- Marketing tools (lib/marketing.ts): catalog_settings.marketing_config is JSON with the
-- Meta Pixel ID, the Google Analytics 4 ID and a review link shown when an order is done
ALTER TABLE catalog_settings ADD COLUMN marketing_config TEXT;
