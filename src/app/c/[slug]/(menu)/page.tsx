import { notFound } from 'next/navigation';
import { getMenuData, isMenuPreview } from '../_lib/menu-data';
import { CatalogAnalyticsTracker } from '../_components/AnalyticsTracker';
import { MenuView } from '../_components/menu/MenuView';

// Metadata, language, theme and the expired state are handled by (menu)/layout.tsx
export default async function CatalogMenuPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getMenuData(slug);
  // Owner previews are not guest visits
  const preview = await isMenuPreview(slug);

  if (!data) {
    notFound();
  }

  return (
    <>
      {!preview && <CatalogAnalyticsTracker catalogId={data.catalog.id} />}
      <MenuView />
    </>
  );
}
