import { notFound } from 'next/navigation';
import {
  getCatalogBySlug,
  getCatalogCategories,
} from '@/lib/catalog/queries';
import { CatalogAnalyticsTracker } from '../_components/AnalyticsTracker';
import { CatalogCategoriesPageClient } from './_components/CatalogCategoriesPageClient';

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

  const categories = await getCatalogCategories(catalog.id);

  // Transform categories
  const categoriesData = categories.map((cat) => ({
    id: cat.id,
    name_ar: cat.name_ar,
    name_en: cat.name_en,
    name_fr: cat.name_fr,
    image_url: cat.image_url,
    icon_name: cat.icon_name,
  }));

  return (
    <>
      <CatalogAnalyticsTracker catalogId={catalog.id} />
      <CatalogCategoriesPageClient categories={categoriesData} />
    </>
  );
}
