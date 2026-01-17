import { notFound } from 'next/navigation';
import {
  getCatalogBySlug,
  getCatalogCategories,
  getCategoryById,
  getCategoryItems,
} from '@/lib/catalog/queries';
import { CatalogAnalyticsTracker } from '../../_components/AnalyticsTracker';
import { CatalogMenuPageClient } from './_components/CatalogMenuPageClient';

export default async function CatalogMenuPage({
  params,
}: {
  params: Promise<{ slug: string; categoryId: string }>;
}) {
  const { slug, categoryId } = await params;
  const catalog = await getCatalogBySlug(slug);

  if (!catalog) {
    notFound();
  }

  const [
    category,
    menuItems,
    allCategories,
  ] = await Promise.all([
    getCategoryById(catalog.id, categoryId),
    getCategoryItems(catalog.id, categoryId),
    getCatalogCategories(catalog.id),
  ]);

  if (!category) {
    notFound();
  }

  // Transform menu items
  const itemsData = menuItems.map((item) => ({
    id: item.id,
    name_ar: item.name_ar,
    name_en: item.name_en,
    name_fr: item.name_fr,
    description_ar: item.description_ar,
    description_en: item.description_en,
    description_fr: item.description_fr,
    price: item.price,
    currency: item.currency || 'IQD',
    image_url: item.image_url,
    is_featured: Boolean(item.is_featured),
  }));

  // Transform categories
  const categoriesData = allCategories.map((cat) => ({
    id: cat.id,
    name_ar: cat.name_ar,
    name_en: cat.name_en,
    name_fr: cat.name_fr,
    image_url: cat.image_url,
  }));

  // Transform current category
  const currentCategory = {
    id: category.id,
    name_ar: category.name_ar,
    name_en: category.name_en,
    name_fr: category.name_fr,
    image_url: category.image_url,
  };

  return (
    <>
      <CatalogAnalyticsTracker catalogId={catalog.id} />
      <CatalogMenuPageClient
        currentCategory={currentCategory}
        menuItems={itemsData}
        allCategories={categoriesData}
      />
    </>
  );
}
