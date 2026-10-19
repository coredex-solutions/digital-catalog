import { redirect } from "next/navigation";

// Old link target; owners sign in at /login.
export default async function CatalogLoginRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/login/?r=${encodeURIComponent(slug)}`);
}
