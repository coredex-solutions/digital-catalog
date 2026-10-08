import { notFound } from 'next/navigation';
import { getFullCatalogData } from '@/lib/catalog/queries';
import { CatalogAnalyticsTracker } from '../_components/AnalyticsTracker';
import { MenuView } from '../_components/menu/MenuView';

// Metadata, language, theme and the expired state are handled by (menu)/layout.tsx
export default async function CatalogMenuPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getFullCatalogData(slug);

  if (!data) {
    notFound();
  }

  return (
    <>
      <CatalogAnalyticsTracker catalogId={data.catalog.id} />
      <MenuView />
    </>
  );
}
