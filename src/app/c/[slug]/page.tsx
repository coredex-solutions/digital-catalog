import { notFound } from 'next/navigation';
import { getFullCatalogData } from '@/lib/catalog/queries';
import { CatalogHomeClient } from './_components/CatalogHomeClient';
import { CatalogAnalyticsTracker } from './_components/AnalyticsTracker';
import { Metadata } from 'next';

export async function generateMetadata({ params, searchParams }: { params: Promise<{ slug: string }>, searchParams: Promise<{ lang?: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { lang = 'en' } = await searchParams;
  const data = await getFullCatalogData(slug);

  if (!data) return { title: "Not Found" };

  const { settings, catalog } = data;
  const title = (settings as any)?.[`seo_title_${lang}`] || catalog.name;
  const description = (settings as any)?.[`seo_description_${lang}`] || catalog.description;

  return {
    title,
    description,
    keywords: settings?.seo_keywords || "",
    openGraph: {
      title,
      description,
      images: [settings?.hero_image_url || ""],
    }
  };
}

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

  return (
    <>
      <CatalogAnalyticsTracker catalogId={data.catalog.id} />
      <CatalogHomeClient />
    </>
  );
}
