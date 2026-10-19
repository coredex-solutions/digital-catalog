import { redirect } from "next/navigation";

// Old sign-in address (printed in early welcome emails and bookmarks). Everyone signs in at
// /login now; ?r= keeps the sign-in limited to this restaurant.
export default async function CatalogAdminLoginRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/login/?r=${encodeURIComponent(slug)}`);
}
