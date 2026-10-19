import type { Metadata } from "next";
import { resolveSiteLang } from "../../_landing/site-lang";
import { getAccountCopy } from "../_copy";
import { ForgotForm } from "../_components/ForgotForm";

export async function generateMetadata(): Promise<Metadata> {
  return { title: { absolute: getAccountCopy(await resolveSiteLang()).forgot.metaTitle }, robots: { index: false } };
}

export default async function ForgotPasswordPage() {
  return <ForgotForm lang={await resolveSiteLang()} />;
}
