-- ============================================
-- Multi-Tenant SaaS Schema for Digital Catalog
-- Version 2.0
-- ============================================

-- ============================================
-- CORE TENANT TABLES
-- ============================================

-- Super admins (platform owners)
CREATE TABLE IF NOT EXISTS super_admins (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME
);

-- Catalogs (tenants) - each catalog is a separate business
CREATE TABLE IF NOT EXISTS catalogs (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  business_type TEXT NOT NULL DEFAULT 'restaurant', -- 'restaurant', 'retail', 'cafe', 'salon', 'other'
  description TEXT,
  logo_url TEXT,
  
  -- Status
  is_active INTEGER DEFAULT 1,
  is_suspended INTEGER DEFAULT 0,
  suspension_reason TEXT,
  
  -- Limits
  max_images INTEGER DEFAULT 500,
  current_image_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Catalog subscriptions (billing without payment integration)
CREATE TABLE IF NOT EXISTS catalog_subscriptions (
  id TEXT PRIMARY KEY,
  catalog_id TEXT NOT NULL UNIQUE REFERENCES catalogs(id) ON DELETE CASCADE,
  
  -- Subscription type: 'yearly', 'forever', 'custom_years'
  subscription_type TEXT NOT NULL DEFAULT 'yearly',
  custom_years INTEGER, -- For custom_years type (1,2,3,4,5...)
  
  -- Dates
  starts_at DATETIME NOT NULL,
  expires_at DATETIME, -- NULL for 'forever' subscriptions
  
  -- Features (what's enabled for this subscription)
  multi_language_enabled INTEGER DEFAULT 0,
  booking_enabled INTEGER DEFAULT 1,
  analytics_enabled INTEGER DEFAULT 1,
  custom_domain_enabled INTEGER DEFAULT 0,
  
  -- Payment tracking (manual, no Stripe)
  amount_paid REAL,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT, -- 'cash', 'bank_transfer', 'other'
  payment_notes TEXT,
  
  -- Status
  is_active INTEGER DEFAULT 1,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Catalog admins (each catalog can have its own admin users)
CREATE TABLE IF NOT EXISTS catalog_admins (
  id TEXT PRIMARY KEY,
  catalog_id TEXT NOT NULL REFERENCES catalogs(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'admin', -- 'admin', 'editor' (for future)
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME,
  
  -- Unique email per catalog
  UNIQUE(catalog_id, email)
);

-- ============================================
-- CATALOG CUSTOMIZATION
-- ============================================

-- Catalog settings (appearance, SEO, features)
CREATE TABLE IF NOT EXISTS catalog_settings (
  catalog_id TEXT PRIMARY KEY REFERENCES catalogs(id) ON DELETE CASCADE,
  
  -- Appearance
  hero_image_url TEXT,
  bg_pattern_enabled INTEGER DEFAULT 1,
  bg_pattern_type TEXT DEFAULT 'geometric', -- 'geometric', 'dots', 'lines', 'none'
  
  -- Color palette
  color_primary TEXT DEFAULT '#FF6B35',
  color_secondary TEXT DEFAULT '#4A90A4',
  color_accent TEXT DEFAULT '#F7C948',
  color_background TEXT DEFAULT '#1a1a2e',
  color_surface TEXT DEFAULT '#16213e',
  color_text TEXT DEFAULT '#ffffff',
  color_text_muted TEXT DEFAULT '#a0aec0',
  
  -- CTA Labels (multilingual)
  cta_menu_label_ar TEXT DEFAULT 'عرض القائمة',
  cta_menu_label_en TEXT DEFAULT 'View Menu',
  cta_menu_label_fr TEXT DEFAULT 'Voir le Menu',
  cta_booking_label_ar TEXT DEFAULT 'حجز طاولة',
  cta_booking_label_en TEXT DEFAULT 'Book a Table',
  cta_booking_label_fr TEXT DEFAULT 'Réserver',
  cta_order_label_ar TEXT DEFAULT 'اطلب عبر واتساب',
  cta_order_label_en TEXT DEFAULT 'Order via WhatsApp',
  cta_order_label_fr TEXT DEFAULT 'Commander via WhatsApp',
  
  -- Features toggles
  booking_enabled INTEGER DEFAULT 1,
  whatsapp_order_enabled INTEGER DEFAULT 1,
  live_chat_enabled INTEGER DEFAULT 0,
  
  -- SEO
  seo_title_ar TEXT,
  seo_title_en TEXT,
  seo_title_fr TEXT,
  seo_description_ar TEXT,
  seo_description_en TEXT,
  seo_description_fr TEXT,
  seo_keywords TEXT, -- comma-separated
  
  -- About page content (for SEO)
  about_content_ar TEXT,
  about_content_en TEXT,
  about_content_fr TEXT,
  
  -- Custom JSON-LD override
  json_ld_custom TEXT,
  
  -- Default language
  default_language TEXT DEFAULT 'en', -- 'ar', 'en', 'fr'
  enabled_languages TEXT DEFAULT 'en,ar,fr', -- comma-separated
  
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Catalog contact info (replaces restaurant_settings)
CREATE TABLE IF NOT EXISTS catalog_contact (
  catalog_id TEXT PRIMARY KEY REFERENCES catalogs(id) ON DELETE CASCADE,
  
  -- Phone numbers
  phone_primary TEXT,
  phone_whatsapp TEXT,
  
  -- Email
  email TEXT,
  
  -- Address (multilingual)
  address_ar TEXT,
  address_en TEXT,
  address_fr TEXT,
  city_ar TEXT,
  city_en TEXT,
  city_fr TEXT,
  country_ar TEXT,
  country_en TEXT,
  country_fr TEXT,
  
  -- Location
  google_map_iframe_url TEXT,
  latitude REAL,
  longitude REAL,
  
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ANALYTICS
-- ============================================

-- Catalog analytics (aggregated daily stats)
CREATE TABLE IF NOT EXISTS catalog_analytics (
  id TEXT PRIMARY KEY,
  catalog_id TEXT NOT NULL REFERENCES catalogs(id) ON DELETE CASCADE,
  date TEXT NOT NULL, -- YYYY-MM-DD format
  
  -- Core metrics (4 main metrics as requested)
  page_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  whatsapp_order_clicks INTEGER DEFAULT 0,
  booking_confirm_clicks INTEGER DEFAULT 0,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- One row per catalog per day
  UNIQUE(catalog_id, date)
);

-- Visitor fingerprints (for unique visitor tracking)
CREATE TABLE IF NOT EXISTS catalog_visitors (
  id TEXT PRIMARY KEY,
  catalog_id TEXT NOT NULL REFERENCES catalogs(id) ON DELETE CASCADE,
  fingerprint TEXT NOT NULL, -- Browser fingerprint hash
  first_visit DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_visit DATETIME DEFAULT CURRENT_TIMESTAMP,
  visit_count INTEGER DEFAULT 1,
  
  UNIQUE(catalog_id, fingerprint)
);

-- ============================================
-- CONTENT TABLES (with catalog_id)
-- ============================================

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  catalog_id TEXT NOT NULL REFERENCES catalogs(id) ON DELETE CASCADE,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  image_url TEXT,
  icon_name TEXT DEFAULT 'Utensils',
  display_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Menu items table
CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY,
  catalog_id TEXT NOT NULL REFERENCES catalogs(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  description_fr TEXT,
  price REAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  is_featured INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Operating hours table
CREATE TABLE IF NOT EXISTS operating_hours (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  catalog_id TEXT NOT NULL REFERENCES catalogs(id) ON DELETE CASCADE,
  day_name TEXT NOT NULL,
  open_hour REAL NOT NULL,
  close_hour REAL NOT NULL,
  is_closed INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(catalog_id, day_name)
);

-- Social media links table
CREATE TABLE IF NOT EXISTS social_media (
  id TEXT PRIMARY KEY,
  catalog_id TEXT NOT NULL REFERENCES catalogs(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  url TEXT,
  is_active INTEGER DEFAULT 1,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(catalog_id, platform)
);

-- Branches table
CREATE TABLE IF NOT EXISTS branches (
  id TEXT PRIMARY KEY,
  catalog_id TEXT NOT NULL REFERENCES catalogs(id) ON DELETE CASCADE,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  address_ar TEXT NOT NULL,
  address_en TEXT NOT NULL,
  address_fr TEXT NOT NULL,
  phone_numbers TEXT, -- JSON array
  map_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- FAQs table
CREATE TABLE IF NOT EXISTS faqs (
  id TEXT PRIMARY KEY,
  catalog_id TEXT NOT NULL REFERENCES catalogs(id) ON DELETE CASCADE,
  question_ar TEXT NOT NULL,
  question_en TEXT NOT NULL,
  question_fr TEXT NOT NULL,
  answer_ar TEXT NOT NULL,
  answer_en TEXT NOT NULL,
  answer_fr TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- RATE LIMITING
-- ============================================

-- Rate limit tracking
CREATE TABLE IF NOT EXISTS rate_limits (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL, -- IP address or API key
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start DATETIME NOT NULL,
  
  UNIQUE(identifier, endpoint, window_start)
);

-- ============================================
-- INDEXES
-- ============================================

-- Catalog indexes
CREATE INDEX IF NOT EXISTS idx_catalogs_slug ON catalogs(slug);
CREATE INDEX IF NOT EXISTS idx_catalogs_active ON catalogs(is_active);
CREATE INDEX IF NOT EXISTS idx_catalogs_business_type ON catalogs(business_type);

-- Subscription indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_catalog ON catalog_subscriptions(catalog_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires ON catalog_subscriptions(expires_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON catalog_subscriptions(is_active);

-- Admin indexes
CREATE INDEX IF NOT EXISTS idx_catalog_admins_catalog ON catalog_admins(catalog_id);
CREATE INDEX IF NOT EXISTS idx_catalog_admins_email ON catalog_admins(email);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_analytics_catalog ON catalog_analytics(catalog_id);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON catalog_analytics(date);
CREATE INDEX IF NOT EXISTS idx_analytics_catalog_date ON catalog_analytics(catalog_id, date);
CREATE INDEX IF NOT EXISTS idx_visitors_catalog ON catalog_visitors(catalog_id);
CREATE INDEX IF NOT EXISTS idx_visitors_fingerprint ON catalog_visitors(catalog_id, fingerprint);

-- Content indexes
CREATE INDEX IF NOT EXISTS idx_categories_catalog ON categories(catalog_id);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_order ON categories(display_order);
CREATE INDEX IF NOT EXISTS idx_menu_items_catalog ON menu_items(catalog_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_active ON menu_items(is_active);
CREATE INDEX IF NOT EXISTS idx_menu_items_order ON menu_items(display_order);
CREATE INDEX IF NOT EXISTS idx_operating_hours_catalog ON operating_hours(catalog_id);
CREATE INDEX IF NOT EXISTS idx_social_media_catalog ON social_media(catalog_id);
CREATE INDEX IF NOT EXISTS idx_branches_catalog ON branches(catalog_id);
CREATE INDEX IF NOT EXISTS idx_faqs_catalog ON faqs(catalog_id);
CREATE INDEX IF NOT EXISTS idx_faqs_order ON faqs(display_order);

-- Rate limit indexes
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier, endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_start);

