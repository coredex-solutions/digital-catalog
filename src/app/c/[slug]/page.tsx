import { notFound } from 'next/navigation';
import { getFullCatalogData } from '@/lib/catalog/queries';
import { CatalogHomeClient } from './_components/CatalogHomeClient';
import { CatalogAnalyticsTracker } from './_components/AnalyticsTracker';

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
