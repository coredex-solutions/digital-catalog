import { permanentRedirect } from 'next/navigation';

// The menu is now a single page; old category-list links land on it.
export default async function CatalogCategoriesRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  permanentRedirect(`/c/${slug}`);
}
