import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LandingPage, LANDING_PATH, landingMetadata } from "./_landing/LandingPage";
import { resolveSiteLang } from "./_landing/site-lang";

export const metadata: Metadata = landingMetadata("en");

// English home page. Visitors who chose Arabic, or whose browser asks for it, go to /ar/;
// search engines (no cookie, no Accept-Language) index this English page.
export default async function Home() {
  if ((await resolveSiteLang()) === "ar") redirect(LANDING_PATH.ar);
  return <LandingPage lang="en" />;
}
