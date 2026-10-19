import type { Metadata } from "next";
import { resolveSiteLang } from "../../_landing/site-lang";
import { getAccountCopy } from "../_copy";
import { LoginForm } from "../_components/LoginForm";

export async function generateMetadata(): Promise<Metadata> {
  return { title: { absolute: getAccountCopy(await resolveSiteLang()).login.metaTitle }, robots: { index: false } };
}

// One sign-in page for every restaurant; ?r=<slug> limits it to one (old admin login links)
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ r?: string }> }) {
  const { r } = await searchParams;
  const restaurant = typeof r === "string" && /^[a-z0-9-]{1,50}$/.test(r) ? r : undefined;
  return <LoginForm lang={await resolveSiteLang()} restaurant={restaurant} />;
}
