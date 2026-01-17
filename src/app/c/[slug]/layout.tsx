import { notFound } from 'next/navigation';
import { getFullCatalogData } from '@/lib/catalog/queries';
import type { Metadata } from 'next';
import { CatalogProvider } from './_providers/CatalogProvider';
import AIWaiterBubble from './_components/AIWaiterBubble';
import type { CatalogUIData } from '@/types';

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

  const title = settings?.seo_title_en || catalog.name;
  const description = settings?.seo_description_en || catalog.description || `Welcome to ${catalog.name}`;

  return {
    title: {
      default: title,
      template: `%s | ${catalog.name}`,
    },
    description,
    keywords: settings?.seo_keywords || undefined,
    openGraph: {
      title,
      description,
      images: catalog.logo_url ? [catalog.logo_url] : undefined,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
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
    image: catalog.logo_url,
    url: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/c/${catalog.slug}`,
  };

  if (contact) {
    if (contact.phone_primary) schema.telephone = contact.phone_primary;
    if (contact.email) schema.email = contact.email;
    if (contact.address_en || contact.city_en) {
      schema.address = {
        '@type': 'PostalAddress',
        streetAddress: contact.address_en,
        addressLocality: contact.city_en,
        addressCountry: contact.country_en,
      };
    }
  }

  if (operatingHours && operatingHours.length > 0) {
    schema.openingHoursSpecification = operatingHours
      .filter(h => !h.is_closed)
      .map(h => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: h.day_name,
        opens: `${Math.floor(h.open_hour)}:00`,
        closes: `${Math.floor(h.close_hour)}:00`,
      }));
  }

  return schema;
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

  if (data.isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold mb-4">Catalog Unavailable</h1>
          <p className="text-slate-400">This catalog's subscription has expired.</p>
        </div>
      </div>
    );
  }

  const { catalog, settings, contact, operatingHours, socialMedia, menuItems } = data;

  const themeStyles = settings ? {
    '--color-primary': settings.color_primary || '#FF6B35',
    '--color-secondary': settings.color_secondary || '#4A90A4',
    '--color-accent': settings.color_accent || '#F7C948',
    '--color-background': settings.color_background || '#1a1a2e',
    '--color-surface': settings.color_surface || '#16213e',
    '--color-text': settings.color_text || '#ffffff',
    '--color-text-muted': settings.color_text_muted || '#a0aec0',
  } as React.CSSProperties : {};

  const jsonLd = generateJsonLd(data);

  const catalogUIData: CatalogUIData = {
    catalog: {
      id: catalog.id,
      slug: catalog.slug,
      name: catalog.name,
      description: catalog.description,
      logo_url: catalog.logo_url,
    },
    settings: settings ? {
      ...settings,
      ai_waiter_enabled: Boolean((settings as any).ai_waiter_enabled),
    } as any : null,
    contact: contact ? { ...contact } : null,
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
    menuItems: (menuItems || []).map((i: any) => ({
      ...i,
      is_featured: Boolean(i.is_featured),
    })),
  };

  return (
    <div style={themeStyles} className="min-h-screen" data-catalog-id={data.catalog.id}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div
        className="fixed inset-0 -z-10"
        style={{ backgroundColor: settings?.color_background || '#1a1a2e' }}
      >
        {settings?.bg_pattern_enabled && (
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: settings.bg_pattern_type === 'dots'
                ? 'radial-gradient(circle, currentColor 1px, transparent 1px)'
                : 'none',
              backgroundSize: '20px 20px',
              color: settings.color_primary || '#FF6B35',
            }}
          />
        )}
      </div>

      <CatalogProvider data={catalogUIData}>
        {children}
        {catalogUIData.settings?.ai_waiter_enabled && <AIWaiterBubble />}
      </CatalogProvider>
    </div>
  );
}
