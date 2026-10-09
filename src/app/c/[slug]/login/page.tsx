import { redirect } from "next/navigation";

// Old link target; the owner login lives under /admin.
export default async function CatalogLoginRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/c/${encodeURIComponent(slug)}/admin/login`);
}
