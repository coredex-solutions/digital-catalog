// Centralized type definitions
export type Language = "ar" | "en";

// Localized string object for multilingual content
export interface LocalizedString {
  ar: string;
  en: string;
}

// Language option for selection page
export interface LanguageOption {
  code: Language;
  label: string;
  font: string;
}

// Operating hours structure
export interface OperatingHoursData {
  day_name: string;
  open_hour: number;
  close_hour: number;
  is_closed: boolean;
}

// Social media link structure
export interface SocialMediaLink {
  id: string;
  platform: string;
  url: string | null;
}

// Catalog contact data for UI components
export interface CatalogContactData {
  phone_primary?: string | null;
  phone_whatsapp?: string | null;
  email?: string | null;
  address_ar?: string | null;
  address_en?: string | null;
  city_ar?: string | null;
  city_en?: string | null;
  google_map_iframe_url?: string | null;
}

// Catalog settings data for UI components
export interface CatalogSettingsData {
  hero_image_url?: string | null;
  bg_pattern_enabled?: boolean;
  bg_pattern_type?: string;
  color_primary?: string;
  color_secondary?: string;
  color_accent?: string;
  color_background?: string;
  color_surface?: string;
  color_text?: string;
  color_text_muted?: string;

  // Dark Mode specific colors
  color_primary_dark?: string;
  color_secondary_dark?: string;
  color_accent_dark?: string;
  color_background_dark?: string;
  color_surface_dark?: string;
  color_text_dark?: string;
  color_text_muted_dark?: string;
  booking_enabled?: boolean;
  whatsapp_order_enabled?: boolean;
  cta_menu_label_ar?: string;
  cta_menu_label_en?: string;
  cta_booking_label_ar?: string;
  cta_booking_label_en?: string;
  cta_order_label_ar?: string;
  cta_order_label_en?: string;
  default_language?: Language;
  enabled_languages?: string;
  ai_waiter_enabled?: boolean;
  ai_waiter_name?: string;
  ai_waiter_persona?: string;

  // SEO Fields
  seo_title_ar?: string | null;
  seo_title_en?: string | null;
  seo_description_ar?: string | null;
  seo_description_en?: string | null;
  seo_keywords?: string | null;
  json_ld_custom?: string | null;

  // About Fields
  about_content_ar?: string | null;
  about_content_en?: string | null;

  // Pricing (dual USD / LBP)
  currency_primary?: string | null;
  lbp_exchange_rate?: number | null;
  lbp_rate_updated_at?: string | null;
  show_dual_currency?: number | boolean | null;

  // Ordering
  order_types?: string | null;
  delivery_note_ar?: string | null;
  delivery_note_en?: string | null;
}

// Full catalog data for SaaS pages
export interface CatalogUIData {
  catalog: {
    id: string;
    slug: string;
    name: string;
    name_ar?: string | null;
    name_en?: string | null;
    description?: string | null;
    description_ar?: string | null;
    description_en?: string | null;
    logo_url?: string | null;
  };
  settings: CatalogSettingsData | null;
  contact: CatalogContactData | null;
  operatingHours: OperatingHoursData[];
  socialMedia: SocialMediaLink[];
  menuItems: any[];
  subscriptionType?: string;
  isExpired?: boolean;
}

