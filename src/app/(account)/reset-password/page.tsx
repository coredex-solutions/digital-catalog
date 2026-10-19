import type { Metadata } from "next";
import { resolveSiteLang } from "../../_landing/site-lang";
import { getAccountCopy } from "../_copy";
import { ResetForm } from "../_components/ResetForm";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: { absolute: getAccountCopy(await resolveSiteLang()).reset.metaTitle },
    robots: { index: false },
    // The token is in the URL: don't pass it on to other sites
    referrer: "no-referrer",
  };
}

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return <ResetForm lang={await resolveSiteLang()} token={typeof token === "string" ? token : ""} />;
}
