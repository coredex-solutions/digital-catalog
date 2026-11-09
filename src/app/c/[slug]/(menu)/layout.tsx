import { notFound } from 'next/navigation';
import { getMenuData, isMenuPreview } from '../_lib/menu-data';
import type { Metadata, Viewport } from 'next';
import { CatalogProvider, type MenuData } from '../_providers/CatalogProvider';
import AIWaiterBubble from '../_components/AIWaiterBubble';
import { buildMenuTheme } from '../_lib/theme';
import { getMenuLanguages, resolveMenuLanguage, resolveMenuTheme } from '../_lib/locale';
import { getSiteUrl } from '@/lib/utils/base-url';
import { catalogJsonLd, menuAlternates } from '../_lib/seo';
import { getDictionary, localized } from '../_lib/i18n';
import { readDishInfo } from '@/lib/catalog/dish-info';
import { getModule, moduleInfo } from '@/lib/modules/resolve';
import { isItemAvailable } from '@/lib/orders/context';
import { hasUsableCoupons } from '@/lib/orders/coupons-store';
import { beirutToday } from '@/lib/orders/validate';
import { parseMarketingConfig } from '@/lib/marketing';
import { MarketingTags } from '../_components/MarketingTags';

// Generate metadata for SEO
export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getMenuData(slug);

  if (!data) {
    return { title: 'Not Found' };
  }

  const { catalog, settings, subscription } = data;
  const enabled = getMenuLanguages(settings?.enabled_languages, subscription);
  const lang = await resolveMenuLanguage(slug, enabled, settings?.default_language);
  const alternates = menuAlternates(catalog.slug, lang, enabled, settings?.default_language);

  const name = localized(catalog, 'name', lang) || catalog.name;
  const title = settings?.[`seo_title_${lang}` as const] || settings?.seo_title_en || name;
  const description = settings?.[`seo_description_${lang}` as const] || settings?.seo_description_en
    || localized(catalog, 'description', lang) || `${name} — ${getModule(catalog).vocab[lang].catalog}`;
  const image = settings?.hero_image_url || catalog.logo_url;

  return {
    title: {
      absolute: title,
      template: `%s | ${name}`,
    },
    description,
    keywords: settings?.seo_keywords || undefined,
    // One address per language, without table numbers or other query parts
    alternates,
    openGraph: {
      title,
      description,
      url: alternates.canonical,
      siteName: name,
      images: image ? [image] : undefined,
      type: 'website',
      locale: lang === 'ar' ? 'ar_LB' : 'en_US',
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      images: image ? [image] : undefined,
    },
    // An owner's preview of unpublished changes must never be indexed
    ...((await isMenuPreview(slug)) ? { robots: { index: false, follow: false } } : {}),
  };
}

// The phone browser bar matches the menu background (light or dark theme)
export async function generateViewport(): Promise<Viewport> {
  return { themeColor: (await resolveMenuTheme()) === 'dark' ? '#100F1F' : '#F7F8FC' };
}

/** Drop French columns (name_fr, about_content_fr…): the menu is only shown in Arabic and English */
function withoutFrench<T extends object>(row: T): T {
  return Object.fromEntries(Object.entries(row).filter(([key]) => !key.endsWith('_fr'))) as T;
}

function parsePhoneList(value: unknown): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [String(parsed)];
  } catch {
    return String(value).split(',').map((s) => s.trim()).filter(Boolean);
  }
}

export default async function CatalogLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getMenuData(slug);

  if (!data) {
    notFound();
  }

  const { catalog, settings, subscription, contact, operatingHours, socialMedia, menuItems, categories, faqs, branches } = data;

  const enabledLanguages = getMenuLanguages(settings?.enabled_languages, subscription);
  const preview = await isMenuPreview(slug);
  const [lang, theme] = await Promise.all([
    resolveMenuLanguage(slug, enabledLanguages, settings?.default_language),
    resolveMenuTheme(),
  ]);
  const themeStyle = buildMenuTheme(settings?.color_primary);
  const modules = moduleInfo(catalog);
  const trackStock = modules.addons.includes('stock');
  const nights = getModule(catalog).nights;
  // Older databases without the coupons table simply show no code field
  const hasCoupons = await hasUsableCoupons(catalog.id, beirutToday()).catch(() => false);

  if (data.isExpired) {
    const isAr = lang === 'ar';
    const t = getDictionary(lang, modules.module);
    return (
      <div
        className={`menu min-h-screen flex items-center justify-center p-6 font-menu-sans`}
        style={themeStyle}
        lang={lang}
        dir={isAr ? 'rtl' : 'ltr'}
        data-theme={theme}
      >
        <div className="w-full max-w-sm text-center">
          {catalog.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={catalog.logo_url} alt="" className="w-20 h-20 rounded-2xl object-cover mx-auto mb-6 shadow-menu-sm" />
          )}
          <h1 className="font-menu-display text-3xl font-semibold mb-3">
            {localized(catalog, 'name', lang) || catalog.name}
          </h1>
          <p className="text-menu-muted leading-relaxed mb-8">
            {t.menuUnavailable}
          </p>
          {contact?.phone_primary && (
            <a
              href={`tel:${contact.phone_primary}`}
              className="inline-flex items-center justify-center min-h-12 px-6 rounded-control bg-brand text-brand-fg font-semibold"
            >
              {t.callRestaurant}
            </a>
          )}
        </div>
      </div>
    );
  }

  const jsonLd = catalogJsonLd(data, lang, `${getSiteUrl()}${menuAlternates(catalog.slug, lang, enabledLanguages, settings?.default_language).canonical}`);

  const menuData: MenuData = {
    catalog: {
      id: catalog.id,
      slug: catalog.slug,
      name: catalog.name,
      name_ar: catalog.name_ar,
      name_en: catalog.name_en,
      description: catalog.description,
      description_ar: catalog.description_ar,
      description_en: catalog.description_en,
      logo_url: catalog.logo_url,
      business_type: catalog.business_type,
      ...modules,
    },
    settings: settings ? {
      ...withoutFrench(settings),
      ai_waiter_enabled: Boolean(settings.ai_waiter_enabled),
      has_coupons: hasCoupons,
    } : null,
    contact: contact ? withoutFrench(contact) : null,
    operatingHours: operatingHours.map((h) => ({
      day_name: h.day_name,
      open_hour: Number(h.open_hour),
      close_hour: Number(h.close_hour),
      is_closed: Boolean(Number(h.is_closed)),
    })),
    socialMedia: socialMedia
      .filter((s) => s.url)
      .map((s) => ({
        id: s.id,
        platform: s.platform,
        url: s.url,
      })),
    categories: categories.map((c) => ({
      id: c.id,
      name_ar: c.name_ar,
      name_en: c.name_en,
      image_url: c.image_url,
    })),
    menuItems: (menuItems || []).map((i) => {
      const row = i as unknown as Record<string, unknown>;
      const stock = trackStock && row.stock_qty != null ? Number(row.stock_qty) : null;
      return {
      id: i.id,
      category_id: i.category_id,
      name_ar: i.name_ar,
      name_en: i.name_en,
      description_ar: i.description_ar,
      description_en: i.description_en,
      price: Number(i.price),
      currency: i.currency || 'USD',
      image_url: i.image_url,
      image_is_illustrative: Boolean(Number((i as unknown as Record<string, unknown>).image_is_illustrative)),
      is_featured: Boolean(Number(i.is_featured)),
      // Sold-out switch, and (with the stock add-on) zero units left
      is_available: isItemAvailable(row, trackStock),
      // Options, dietary tags and verified allergens (stored as JSON text)
      ...readDishInfo(row),
      // Units left, only shown when few are left and stock is tracked
      stock_qty: stock,
      compare_at_price: row.compare_at_price != null && Number(row.compare_at_price) > Number(i.price) ? Number(row.compare_at_price) : null,
      duration_minutes: row.duration_minutes != null && Number(row.duration_minutes) > 0 ? Number(row.duration_minutes) : null,
      // Stays only: how many of this room (at least 1), guests it sleeps, and the Friday/Saturday price
      ...(nights
        ? {
            unit_count: row.unit_count != null && Number(row.unit_count) > 0 ? Number(row.unit_count) : 1,
            max_guests: row.max_guests != null && Number(row.max_guests) > 0 ? Number(row.max_guests) : null,
            weekend_price: row.weekend_price != null && Number(row.weekend_price) > 0 ? Number(row.weekend_price) : null,
          }
        : {}),
      };
    }),
    faqs: faqs.map((f) => ({
      id: f.id,
      question_ar: f.question_ar,
      question_en: f.question_en,
      answer_ar: f.answer_ar,
      answer_en: f.answer_en,
    })),
    branches: branches.map((b) => ({
      id: b.id,
      name_ar: b.name_ar,
      name_en: b.name_en,
      address_ar: b.address_ar,
      address_en: b.address_en,
      phone_numbers: parsePhoneList(b.phone_numbers),
      map_url: b.map_url,
    })),
  };

  return (
    <CatalogProvider
      data={menuData}
      lang={lang}
      enabledLanguages={enabledLanguages}
      initialTheme={theme}
      className={`menu min-h-screen font-menu-sans antialiased`}
      style={themeStyle}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      {preview && (
        <div role="status" className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-menu-ink px-4 py-2 text-center text-sm font-semibold text-menu-bg">
          <span>{getDictionary(lang, modules.module).previewBanner}</span>
          <a href={`/c/${slug}/preview/?exit=1`} className="underline underline-offset-4">
            {getDictionary(lang, modules.module).previewExit}
          </a>
        </div>
      )}
      {children}
      {menuData.settings?.ai_waiter_enabled && <AIWaiterBubble />}
      {/* The owner's Meta Pixel and Google Analytics; not while they preview unpublished changes */}
      {!preview && <MarketingTags config={parseMarketingConfig((settings as unknown as Record<string, unknown> | null)?.marketing_config)} />}
    </CatalogProvider>
  );
}
