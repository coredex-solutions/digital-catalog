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
      <div className="min-h-screen flex items-center justify-center bg-[#020203] text-white p-6 font-outfit">
        <div className="fixed inset-0 pointer-events-none opacity-40">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[160px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-600/5 rounded-full blur-[160px]" />
        </div>

        <div className="relative z-10 w-full max-w-lg text-center">
          <div className="w-24 h-24 rounded-[2rem] bg-white/[0.03] border border-white/5 flex items-center justify-center mx-auto mb-10 group">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Zap className="w-8 h-8 text-primary fill-primary" />
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-6 italic uppercase">
            Catalog <span className="text-primary not-italic">Paused</span>
          </h1>

          <p className="text-white/40 text-lg font-medium leading-relaxed mb-12">
            The subscription for <span className="text-white font-bold">{data.catalog.name}</span> has reached its limit or expired. Please contact the business owner to re-activate access.
          </p>

          <a
            href={`https://wa.me/966540679669?text=I%20want%20to%20reactivate%20the%20catalog%20${data.catalog.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-4 px-10 py-5 bg-white text-black rounded-[1.5rem] font-black uppercase tracking-widest text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/5"
          >
            Contact Support
          </a>
        </div>
      </div>
    );
  }

  const { catalog, settings, contact, operatingHours, socialMedia, menuItems } = data;

  const themeStyles = settings ? {
    '--color-primary': settings.color_primary || '#FF6B35',
    '--color-secondary': settings.color_secondary || '#4A90A4',
    '--color-accent': settings.color_accent || '#c084fc',
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

      {/* Background with CSS variable injection controlled by CatalogProvider */}
      <div
        className="fixed inset-0 -z-10 transition-colors duration-700"
        style={{ backgroundColor: 'var(--background-hex)' }}
      />

      <CatalogProvider data={catalogUIData}>
        {children}
        {catalogUIData.settings?.ai_waiter_enabled && <AIWaiterBubble />}
      </CatalogProvider>
    </div>
  );
}
