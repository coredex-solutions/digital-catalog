import { permanentRedirect } from 'next/navigation';

// Old per-category links (shared or printed) open the one-page menu at that category.
export default async function CatalogMenuRedirect({
  params,
}: {
  params: Promise<{ slug: string; categoryId: string }>;
}) {
  const { slug, categoryId } = await params;
  permanentRedirect(`/c/${slug}?c=${encodeURIComponent(categoryId)}`);
}
