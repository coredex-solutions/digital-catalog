import { notFound } from 'next/navigation';
import { Inter, Noto_Sans_Arabic } from 'next/font/google';
import { getFullCatalogData } from '@/lib/catalog/queries';
import type { Metadata } from 'next';
import { CatalogProvider, type MenuData } from '../_providers/CatalogProvider';
import AIWaiterBubble from '../_components/AIWaiterBubble';
import { buildMenuTheme } from '../_lib/theme';
import { getEnabledLanguages, resolveMenuLanguage, resolveMenuTheme } from '../_lib/locale';
import { localized } from '../_lib/i18n';

// Diner menu typefaces (MENUDESIGN.md §4): Inter for English/French, Noto Sans Arabic for Arabic,
// 400/500/600 only. Both are preloaded: most Lebanese menus are read in Arabic and English.
const latinFont = Inter({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600'],
  variable: '--font-menu-sans',
  display: 'swap',
});

const arabicFont = Noto_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600'],
  variable: '--font-menu-arabic',
  display: 'swap',
});

const fontVariables = [latinFont.variable, arabicFont.variable].join(' ');

// Generate metadata for SEO
export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getFullCatalogData(slug);

  if (!data) {
    return { title: 'Not Found' };
  }

  const { catalog, settings } = data;
  const lang = await resolveMenuLanguage(slug, getEnabledLanguages(settings?.enabled_languages), settings?.default_language);

  const name = localized(catalog, 'name', lang) || catalog.name;
  const title = (settings as any)?.[`seo_title_${lang}`] || settings?.seo_title_en || name;
  const description = (settings as any)?.[`seo_description_${lang}`] || settings?.seo_description_en
    || localized(catalog, 'description', lang) || `${name} — menu`;
  const image = settings?.hero_image_url || catalog.logo_url;

  return {
    title: {
      default: title,
      template: `%s | ${name}`,
    },
    description,
    keywords: settings?.seo_keywords || undefined,
    openGraph: {
      title,
      description,
      images: image ? [image] : undefined,
      type: 'website',
      locale: lang === 'ar' ? 'ar_LB' : 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

function formatSchemaHour(hour: number): string {
  const normalized = ((Number(hour) % 24) + 24) % 24;
  const h = Math.floor(normalized);
  const m = Math.round((normalized - h) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// JSON-LD Schema for SEO
function generateJsonLd(data: NonNullable<Awaited<ReturnType<typeof getFullCatalogData>>>) {
  const { catalog, settings, contact, operatingHours } = data;

  const schemaType = catalog.business_type === 'restaurant' ? 'Restaurant'
    : catalog.business_type === 'cafe' ? 'CafeOrCoffeeShop'
      : catalog.business_type === 'bakery' ? 'Bakery'
        : 'LocalBusiness';

  const schema: any = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    name: catalog.name,
    description: catalog.description || settings?.seo_description_en,
    image: settings?.hero_image_url || catalog.logo_url,
    url: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/c/${catalog.slug}`,
    hasMenu: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/c/${catalog.slug}`,
  };

  if (contact) {
    if (contact.phone_primary) schema.telephone = contact.phone_primary;
    if (contact.email) schema.email = contact.email;
    if (contact.address_en || contact.city_en) {
      schema.address = {
        '@type': 'PostalAddress',
        streetAddress: contact.address_en,
        addressLocality: contact.city_en,
        addressCountry: contact.country_en || 'LB',
      };
    }
  }

  if (operatingHours && operatingHours.length > 0) {
    schema.openingHoursSpecification = operatingHours
      .filter(h => !h.is_closed)
      .map(h => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: h.day_name,
        opens: formatSchemaHour(h.open_hour),
        closes: formatSchemaHour(h.close_hour),
      }));
  }

  return schema;
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
  const data = await getFullCatalogData(slug);

  if (!data) {
    notFound();
  }

  const { catalog, settings, contact, operatingHours, socialMedia, menuItems, categories, faqs, branches } = data;

  const enabledLanguages = getEnabledLanguages(settings?.enabled_languages);
  const [lang, theme] = await Promise.all([
    resolveMenuLanguage(slug, enabledLanguages, settings?.default_language),
    resolveMenuTheme(),
  ]);
  const themeStyle = buildMenuTheme(settings?.color_primary);

  if (data.isExpired) {
    const isAr = lang === 'ar';
    return (
      <div
        className={`menu ${fontVariables} min-h-screen flex items-center justify-center p-6 font-menu-sans`}
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
            {isAr
              ? 'القائمة غير متاحة مؤقتاً. يرجى سؤال فريق المطعم.'
              : "This menu is temporarily unavailable. Please ask the restaurant team."}
          </p>
          {contact?.phone_primary && (
            <a
              href={`tel:${contact.phone_primary}`}
              className="inline-flex items-center justify-center min-h-12 px-6 rounded-control bg-brand text-brand-fg font-semibold"
            >
              {isAr ? 'اتصل بالمطعم' : 'Call the restaurant'}
            </a>
          )}
        </div>
      </div>
    );
  }

  // Escape "<" so restaurant-provided text can't close the script tag
  const jsonLd = JSON.stringify(generateJsonLd(data)).replace(/</g, '\\u003c');

  const menuData: MenuData = {
    catalog: {
      id: catalog.id,
      slug: catalog.slug,
      name: catalog.name,
      name_ar: catalog.name_ar,
      name_en: catalog.name_en,
      name_fr: catalog.name_fr,
      description: catalog.description,
      description_ar: catalog.description_ar,
      description_en: catalog.description_en,
      description_fr: catalog.description_fr,
      logo_url: catalog.logo_url,
    },
    settings: settings ? {
      ...settings,
      ai_waiter_enabled: Boolean((settings as any).ai_waiter_enabled),
    } as any : null,
    contact: contact ? { ...contact } : null,
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
      name_fr: c.name_fr,
      image_url: c.image_url,
    })),
    menuItems: (menuItems || []).map((i) => ({
      id: i.id,
      category_id: i.category_id,
      name_ar: i.name_ar,
      name_en: i.name_en,
      name_fr: i.name_fr,
      description_ar: i.description_ar,
      description_en: i.description_en,
      description_fr: i.description_fr,
      price: Number(i.price),
      currency: i.currency || 'USD',
      image_url: i.image_url,
      is_featured: Boolean(Number(i.is_featured)),
      // Missing column (migration not run yet) means available
      is_available: i.is_available === undefined || i.is_available === null ? true : Boolean(Number(i.is_available)),
    })),
    faqs: faqs.map((f) => ({
      id: f.id,
      question_ar: f.question_ar,
      question_en: f.question_en,
      question_fr: f.question_fr,
      answer_ar: f.answer_ar,
      answer_en: f.answer_en,
      answer_fr: f.answer_fr,
    })),
    branches: branches.map((b) => ({
      id: b.id,
      name_ar: b.name_ar,
      name_en: b.name_en,
      name_fr: b.name_fr,
      address_ar: b.address_ar,
      address_en: b.address_en,
      address_fr: b.address_fr,
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
      className={`menu ${fontVariables} min-h-screen font-menu-sans antialiased`}
      style={themeStyle}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      {children}
      {menuData.settings?.ai_waiter_enabled && <AIWaiterBubble />}
    </CatalogProvider>
  );
}
