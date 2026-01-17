// Centralized type definitions
export type Language = "ar" | "en" | "fr";

// Localized string object for multilingual content
export interface LocalizedString {
  ar: string;
  en: string;
  fr: string;
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
  address_fr?: string | null;
  city_ar?: string | null;
  city_en?: string | null;
  city_fr?: string | null;
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
  booking_enabled?: boolean;
  whatsapp_order_enabled?: boolean;
  cta_menu_label_ar?: string;
  cta_menu_label_en?: string;
  cta_menu_label_fr?: string;
  cta_booking_label_ar?: string;
  cta_booking_label_en?: string;
  cta_booking_label_fr?: string;
  cta_order_label_ar?: string;
  cta_order_label_en?: string;
  cta_order_label_fr?: string;
  default_language?: Language;
  enabled_languages?: string;
  ai_waiter_enabled?: boolean;
}

// Full catalog data for SaaS pages
export interface CatalogUIData {
  catalog: {
    id: string;
    slug: string;
    name: string;
    description?: string | null;
    logo_url?: string | null;
  };
  settings: CatalogSettingsData | null;
  contact: CatalogContactData | null;
  operatingHours: OperatingHoursData[];
  socialMedia: SocialMediaLink[];
  menuItems: any[];
}

