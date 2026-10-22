import type { Metadata } from "next";
import { resolveSiteLang } from "../../_landing/site-lang";
import { getAccountCopy } from "../_copy";
import { SignupForm } from "../_components/SignupForm";

const PLANS = ["essential", "pro", "enterprise"];

export async function generateMetadata(): Promise<Metadata> {
  return { title: { absolute: getAccountCopy(await resolveSiteLang()).signup.metaTitle }, robots: { index: false } };
}

// Free-trial signup; ?plan=<id> comes from the pricing cards and is queued as a plan request
export default async function SignupPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan } = await searchParams;
  return <SignupForm lang={await resolveSiteLang()} plan={typeof plan === "string" && PLANS.includes(plan) ? plan : "essential"} />;
}
