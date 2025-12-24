import { notFound } from 'next/navigation';
import {
  getCatalogBySlug,
  getCatalogCategories,
  getCatalogSettings,
  getCatalogContact,
  getCatalogOperatingHours,
  getCatalogSocialMedia,
} from '@/lib/catalog/queries';
import { CatalogAnalyticsTracker } from '../_components/AnalyticsTracker';
import { CatalogCategoriesPageClient } from './_components/CatalogCategoriesPageClient';
import { CatalogProvider } from '../_providers/CatalogProvider';
import type { CatalogUIData } from '@/types';

export default async function CatalogCategoriesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const catalog = await getCatalogBySlug(slug);

  if (!catalog) {
    notFound();
  }

  const [categories, settings, contact, operatingHours, socialMedia] = await Promise.all([
    getCatalogCategories(catalog.id),
    getCatalogSettings(catalog.id),
    getCatalogContact(catalog.id),
    getCatalogOperatingHours(catalog.id),
    getCatalogSocialMedia(catalog.id),
  ]);

  // Transform categories
  const categoriesData = categories.map((cat) => ({
    id: cat.id,
    name_ar: cat.name_ar,
    name_en: cat.name_en,
    name_fr: cat.name_fr,
    image_url: cat.image_url,
    icon_name: cat.icon_name,
  }));

  // Transform for CatalogProvider
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
      enabled_languages: settings.enabled_languages,
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
        <CatalogCategoriesPageClient categories={categoriesData} />
      </CatalogProvider>
    </>
  );
}
