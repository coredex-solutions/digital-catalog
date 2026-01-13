import { notFound } from 'next/navigation';
import { getFullCatalogData } from '@/lib/catalog/queries';
import { CatalogProvider } from './_providers/CatalogProvider';
import { CatalogHomeClient } from './_components/CatalogHomeClient';
import { CatalogAnalyticsTracker } from './_components/AnalyticsTracker';
import type { CatalogUIData } from '@/types';

export default async function CatalogHomePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getFullCatalogData(slug);

  if (!data) {
    notFound();
  }

  const { catalog, settings, contact, operatingHours, socialMedia, isExpired } = data;

  // Check if subscription is expired (handled in layout, but double-check here)
  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold mb-4">Catalog Unavailable</h1>
          <p className="text-slate-400">This catalog's subscription has expired.</p>
        </div>
      </div>
    );
  }

  // Transform data for the provider
  const catalogUIData: CatalogUIData = {
    catalog: {
      id: catalog.id,
      slug: catalog.slug,
      name: catalog.name,
      description: catalog.description,
      logo_url: catalog.logo_url,
    },
    settings: settings ? {
      hero_image_url: settings.hero_image_url,
      bg_pattern_enabled: settings.bg_pattern_enabled,
      bg_pattern_type: settings.bg_pattern_type,
      color_primary: settings.color_primary,
      color_secondary: settings.color_secondary,
      color_accent: settings.color_accent,
      color_background: settings.color_background,
      color_surface: settings.color_surface,
      color_text: settings.color_text,
      color_text_muted: settings.color_text_muted,
      booking_enabled: settings.booking_enabled,
      whatsapp_order_enabled: settings.whatsapp_order_enabled,
      cta_menu_label_ar: settings.cta_menu_label_ar,
      cta_menu_label_en: settings.cta_menu_label_en,
      cta_menu_label_fr: settings.cta_menu_label_fr,
      cta_booking_label_ar: settings.cta_booking_label_ar,
      cta_booking_label_en: settings.cta_booking_label_en,
      cta_booking_label_fr: settings.cta_booking_label_fr,
      cta_order_label_ar: settings.cta_order_label_ar,
      cta_order_label_en: settings.cta_order_label_en,
      cta_order_label_fr: settings.cta_order_label_fr,
      default_language: settings.default_language,
      enabled_languages: settings.enabled_languages,
      ai_waiter_enabled: Boolean((settings as any).ai_waiter_enabled),
    } : null,
    contact: contact ? {
      phone_primary: contact.phone_primary,
      phone_whatsapp: contact.phone_whatsapp,
      email: contact.email,
      address_ar: contact.address_ar,
      address_en: contact.address_en,
      address_fr: contact.address_fr,
      city_ar: contact.city_ar,
      city_en: contact.city_en,
      city_fr: contact.city_fr,
      google_map_iframe_url: contact.google_map_iframe_url,
    } : null,
    operatingHours: operatingHours.map((h) => ({
      day_name: h.day_name,
      open_hour: h.open_hour,
      close_hour: h.close_hour,
      is_closed: h.is_closed,
    })),
    socialMedia: socialMedia.map((s) => ({
      id: s.id,
      platform: s.platform,
      url: s.url,
    })),
  };

  return (
    <>
      <CatalogAnalyticsTracker catalogId={catalog.id} />
      <CatalogProvider data={catalogUIData}>
        <CatalogHomeClient />
      </CatalogProvider>
    </>
  );
}
