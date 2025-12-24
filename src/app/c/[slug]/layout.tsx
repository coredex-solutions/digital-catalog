import { notFound } from 'next/navigation';
import { getFullCatalogData } from '@/lib/catalog/queries';
import type { Metadata } from 'next';

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

  const { catalog, settings, contact } = data;

  // Use custom SEO or fall back to defaults
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

  // Add contact info
  if (contact) {
    if (contact.phone_primary) {
      schema.telephone = contact.phone_primary;
    }
    if (contact.email) {
      schema.email = contact.email;
    }
    if (contact.address_en || contact.city_en) {
      schema.address = {
        '@type': 'PostalAddress',
        streetAddress: contact.address_en,
        addressLocality: contact.city_en,
        addressCountry: contact.country_en,
      };
    }
    if (contact.latitude && contact.longitude) {
      schema.geo = {
        '@type': 'GeoCoordinates',
        latitude: contact.latitude,
        longitude: contact.longitude,
      };
    }
  }

  // Add opening hours
  if (operatingHours && operatingHours.length > 0) {
    const dayMapping: Record<string, string> = {
      'Sunday': 'Su',
      'Monday': 'Mo',
      'Tuesday': 'Tu',
      'Wednesday': 'We',
      'Thursday': 'Th',
      'Friday': 'Fr',
      'Saturday': 'Sa',
    };

    schema.openingHoursSpecification = operatingHours
      .filter(h => !h.is_closed)
      .map(h => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: dayMapping[h.day_name] || h.day_name,
        opens: `${Math.floor(h.open_hour)}:${((h.open_hour % 1) * 60).toString().padStart(2, '0')}`,
        closes: `${Math.floor(h.close_hour)}:${((h.close_hour % 1) * 60).toString().padStart(2, '0')}`,
      }));
  }

  // Merge custom JSON-LD if provided
  if (settings?.json_ld_custom) {
    try {
      const custom = JSON.parse(settings.json_ld_custom);
      Object.assign(schema, custom);
    } catch {
      // Ignore invalid JSON
    }
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

  // Check if subscription is expired
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

  const { settings } = data;

  // Generate CSS variables for theming
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

  return (
    <div style={themeStyles} className="min-h-screen" data-catalog-id={data.catalog.id}>
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* Background with pattern */}
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
                : settings.bg_pattern_type === 'lines'
                ? 'repeating-linear-gradient(45deg, currentColor 0, currentColor 1px, transparent 0, transparent 50%)'
                : 'linear-gradient(30deg, currentColor 12%, transparent 12.5%, transparent 87%, currentColor 87.5%, currentColor), linear-gradient(150deg, currentColor 12%, transparent 12.5%, transparent 87%, currentColor 87.5%, currentColor), linear-gradient(30deg, currentColor 12%, transparent 12.5%, transparent 87%, currentColor 87.5%, currentColor), linear-gradient(150deg, currentColor 12%, transparent 12.5%, transparent 87%, currentColor 87.5%, currentColor), linear-gradient(60deg, rgba(255,255,255,.8) 25%, transparent 25.5%, transparent 75%, rgba(255,255,255,.8) 75%, rgba(255,255,255,.8)), linear-gradient(60deg, rgba(255,255,255,.8) 25%, transparent 25.5%, transparent 75%, rgba(255,255,255,.8) 75%, rgba(255,255,255,.8))',
              backgroundSize: settings.bg_pattern_type === 'dots'
                ? '20px 20px'
                : settings.bg_pattern_type === 'lines'
                ? '10px 10px'
                : '80px 140px',
              backgroundPosition: settings.bg_pattern_type === 'geometric'
                ? '0 0, 0 0, 40px 70px, 40px 70px, 0 0, 40px 70px'
                : undefined,
              color: settings.color_primary || '#FF6B35',
            }}
          />
        )}
      </div>

      {children}
    </div>
  );
}

