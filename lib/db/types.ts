// ============================================
// Multi-Tenant SaaS Types
// ============================================

// Business types supported
export type BusinessType = 'restaurant' | 'retail' | 'cafe' | 'salon' | 'bakery' | 'pharmacy' | 'grocery' | 'other';

// Subscription types
export type SubscriptionType = 'trial' | 'essential' | 'pro' | 'enterprise' | 'yearly' | 'forever' | 'custom_years';

// Languages supported
export type Language = 'ar' | 'en';

// ============================================
// Core Entities
// ============================================

export interface SuperAdmin {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

export interface Catalog {
  id: string;
  slug: string;
  name: string;
  name_ar?: string | null;
  name_en?: string | null;
  name_fr?: string | null;
  business_type: BusinessType;
  description: string | null;
  description_ar?: string | null;
  description_en?: string | null;
  description_fr?: string | null;
  logo_url: string | null;
  is_active: boolean;
  is_suspended: boolean;
  suspension_reason: string | null;
  max_images: number;
  current_image_count: number;
  created_at: string;
  updated_at: string;
}

export interface CatalogSubscription {
  id: string;
  catalog_id: string;
  subscription_type: SubscriptionType;
  custom_years: number | null;
  starts_at: string;
  expires_at: string | null;
  multi_language_enabled: boolean;
  booking_enabled: boolean;
  analytics_enabled: boolean;
  custom_domain_enabled: boolean;
  ai_image_enhancement_limit: number;
  ai_image_enhancement_used: number;
  max_items: number;
  max_categories: number;
  amount_paid: number | null;
  currency: string;
  payment_method: string | null;
  payment_notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlanRequest {
  id: string;
  catalog_id: string;
  catalog_name: string;
  catalog_slug: string;
  plan_name: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  created_at: string;
}

export interface CatalogAdmin {
  id: string;
  catalog_id: string;
  email: string;
  password_hash: string;
  name: string;
  role: 'admin' | 'editor' | 'owner' | 'viewer';
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

// ============================================
// Catalog Customization
// ============================================

export interface CatalogSettings {
  catalog_id: string;

  // Appearance
  hero_image_url: string | null;
  bg_pattern_enabled: boolean;
  bg_pattern_type: 'geometric' | 'dots' | 'lines' | 'none';

  // Color palette
  color_primary: string;
  color_secondary: string;
  color_accent: string;
  color_background: string;
  color_surface: string;
  color_text: string;
  color_text_muted: string;

  // Dark palette
  color_primary_dark: string;
  color_secondary_dark: string;
  color_accent_dark: string;
  color_background_dark: string;
  color_surface_dark: string;
  color_text_dark: string;
  color_text_muted_dark: string;

  // CTA Labels
  cta_menu_label_ar: string;
  cta_menu_label_en: string;
  cta_menu_label_fr: string;
  cta_booking_label_ar: string;
  cta_booking_label_en: string;
  cta_booking_label_fr: string;
  cta_order_label_ar: string;
  cta_order_label_en: string;
  cta_order_label_fr: string;

  // Features
  booking_enabled: boolean;
  whatsapp_order_enabled: boolean;
  live_chat_enabled: boolean;

  // SEO
  seo_title_ar: string | null;
  seo_title_en: string | null;
  seo_title_fr: string | null;
  seo_description_ar: string | null;
  seo_description_en: string | null;
  seo_description_fr: string | null;
  seo_keywords: string | null;

  // About content
  about_content_ar: string | null;
  about_content_en: string | null;
  about_content_fr: string | null;

  // Custom JSON-LD
  json_ld_custom: string | null;

  // Languages
  default_language: Language;
  enabled_languages: string; // comma-separated

  // AI Waiter
  ai_waiter_enabled: boolean;
  ai_waiter_name?: string;
  ai_waiter_persona?: string;

  // Pricing (migration 20261008_menu_redesign; optional until it has run)
  currency_primary?: 'USD' | 'LBP' | null;
  lbp_exchange_rate?: number | null;
  lbp_rate_updated_at?: string | null;
  show_dual_currency?: number | boolean | null;

  // Ordering
  order_types?: string | null;
  delivery_note_ar?: string | null;
  delivery_note_en?: string | null;

  updated_at: string;
}

export interface CatalogContact {
  catalog_id: string;
  phone_primary: string | null;
  phone_whatsapp: string | null;
  email: string | null;
  address_ar: string | null;
  address_en: string | null;
  address_fr: string | null;
  city_ar: string | null;
  city_en: string | null;
  city_fr: string | null;
  country_ar: string | null;
  country_en: string | null;
  country_fr: string | null;
  google_map_iframe_url: string | null;
  latitude: number | null;
  longitude: number | null;
  updated_at: string;
}

// ============================================
// Analytics
// ============================================

export interface CatalogAnalytics {
  id: string;
  catalog_id: string;
  date: string; // YYYY-MM-DD
  page_views: number;
  unique_visitors: number;
  whatsapp_order_clicks: number;
  booking_confirm_clicks: number;
  created_at: string;
}

export interface CatalogVisitor {
  id: string;
  catalog_id: string;
  fingerprint: string;
  first_visit: string;
  last_visit: string;
  visit_count: number;
}

// ============================================
// Content Entities (with catalog_id)
// ============================================

export interface Category {
  id: string;
  catalog_id: string;
  name_ar: string;
  name_en: string;
  name_fr: string;
  image_url: string | null;
  icon_name: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: string;
  catalog_id: string;
  category_id: string;
  name_ar: string;
  name_en: string;
  name_fr: string;
  description_ar: string | null;
  description_en: string | null;
  description_fr: string | null;
  price: number;
  currency: string;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
  is_featured: boolean;
  /** Sold out for now (shown, but can't be ordered). Optional until migration 20261008 has run */
  is_available?: boolean | number | null;
  created_at: string;
  updated_at: string;
}

export interface OperatingHours {
  id: number;
  catalog_id: string;
  day_name: string;
  open_hour: number;
  close_hour: number;
  is_closed: boolean;
  updated_at: string;
}

export interface SocialMedia {
  id: string;
  catalog_id: string;
  platform: string;
  url: string | null;
  is_active: boolean;
  updated_at: string;
}

export interface Branch {
  id: string;
  catalog_id: string;
  name_ar: string;
  name_en: string;
  name_fr: string;
  address_ar: string;
  address_en: string;
  address_fr: string;
  phone_numbers: string | null; // JSON array
  map_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FAQ {
  id: string;
  catalog_id: string;
  question_ar: string;
  question_en: string;
  question_fr: string;
  answer_ar: string;
  answer_en: string;
  answer_fr: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AIKnowledge {
  id: string;
  catalog_id: string;
  question: string;
  answer: string;
  source_type: 'manual' | 'ai_generated' | 'item_scrape';
  category: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// Rate Limiting
// ============================================

export interface RateLimit {
  id: string;
  identifier: string;
  endpoint: string;
  request_count: number;
  window_start: string;
}

// ============================================
// API/Form Types
// ============================================

export interface CreateCatalogInput {
  slug: string;
  name: string;
  business_type: BusinessType;
  description?: string;
}

export interface CreateSubscriptionInput {
  catalog_id: string;
  subscription_type: SubscriptionType;
  custom_years?: number;
  starts_at: string;
  expires_at?: string;
  multi_language_enabled?: boolean;
  booking_enabled?: boolean;
  analytics_enabled?: boolean;
  amount_paid?: number;
  currency?: string;
  payment_method?: string;
  payment_notes?: string;
}

export interface CreateCatalogAdminInput {
  catalog_id: string;
  email: string;
  password: string;
  name: string;
}

export interface UpdateCatalogSettingsInput {
  hero_image_url?: string;
  bg_pattern_enabled?: boolean;
  bg_pattern_type?: 'geometric' | 'dots' | 'lines' | 'none';
  color_primary?: string;
  color_secondary?: string;
  color_accent?: string;
  color_background?: string;
  color_surface?: string;
  color_text?: string;
  color_text_muted?: string;
  color_primary_dark?: string;
  color_secondary_dark?: string;
  color_accent_dark?: string;
  color_background_dark?: string;
  color_surface_dark?: string;
  color_text_dark?: string;
  color_text_muted_dark?: string;
  cta_menu_label_ar?: string;
  cta_menu_label_en?: string;
  cta_menu_label_fr?: string;
  cta_booking_label_ar?: string;
  cta_booking_label_en?: string;
  cta_booking_label_fr?: string;
  cta_order_label_ar?: string;
  cta_order_label_en?: string;
  cta_order_label_fr?: string;
  booking_enabled?: boolean;
  whatsapp_order_enabled?: boolean;
  live_chat_enabled?: boolean;
  seo_title_ar?: string;
  seo_title_en?: string;
  seo_title_fr?: string;
  seo_description_ar?: string;
  seo_description_en?: string;
  seo_description_fr?: string;
  seo_keywords?: string;
  about_content_ar?: string;
  about_content_en?: string;
  about_content_fr?: string;
  json_ld_custom?: string;
  default_language?: Language;
  enabled_languages?: string;
  ai_waiter_enabled?: boolean;
}

// ============================================
// Dashboard/Analytics Types
// ============================================

export interface CatalogWithStats extends Catalog {
  subscription?: CatalogSubscription;
  admin_count?: number;
  category_count?: number;
  item_count?: number;
  total_views?: number;
}

export interface AnalyticsSummary {
  total_views: number;
  total_unique_visitors: number;
  total_whatsapp_clicks: number;
  total_booking_clicks: number;
  daily_stats: CatalogAnalytics[];
}

// ============================================
// JWT Payload Types
// ============================================

export interface SuperAdminJWTPayload {
  type: 'super_admin';
  id: string;
  email: string;
}

export interface CatalogAdminJWTPayload {
  type: 'catalog_admin';
  id: string;
  catalog_id: string;
  email: string;
  role: 'admin' | 'editor' | 'owner' | 'viewer';
}

export type JWTPayload = SuperAdminJWTPayload | CatalogAdminJWTPayload;

