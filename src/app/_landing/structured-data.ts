import { PAID_PLAN_IDS, getPlanPrice } from "@/lib/plans";
import { getSiteUrl } from "@/lib/utils/base-url";
import { SALES_EMAIL, getSiteCopy, type SiteLang } from "./copy";

/**
 * Structured data for the home page (schema.org JSON-LD): the company, the website, the product
 * with its yearly plans, and the questions section. Search engines and AI answers read this to
 * show the name, logo, prices and answers correctly.
 */
export function landingJsonLd(lang: SiteLang, path: string): string {
  const t = getSiteCopy(lang);
  const site = getSiteUrl();
  const page = `${site}${path}`;
  const org = `${site}/#organization`;

  const graph = [
    {
      "@type": "Organization",
      "@id": org,
      name: "Coredex Solutions",
      url: `${site}/`,
      logo: `${site}/icons/icon-512.png`,
      email: SALES_EMAIL,
      brand: { "@type": "Brand", name: "Core Commerce" },
    },
    {
      "@type": "WebSite",
      "@id": `${site}/#website`,
      name: "Core Commerce",
      url: `${site}/`,
      inLanguage: ["en", "ar"],
      publisher: { "@id": org },
    },
    {
      "@type": "WebPage",
      "@id": `${page}#webpage`,
      url: page,
      name: t.metaTitle,
      description: t.metaDescription,
      inLanguage: lang,
      isPartOf: { "@id": `${site}/#website` },
      about: { "@id": `${site}/#product` },
      primaryImageOfPage: `${site}/og/core-commerce-${lang}.jpg`,
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${site}/#product`,
      name: "Core Commerce",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: t.metaDescription,
      url: page,
      image: `${site}/og/core-commerce-${lang}.jpg`,
      publisher: { "@id": org },
      offers: PAID_PLAN_IDS.map((id) => {
        const plan = t.pricing.plans.find((p) => p.id === id);
        return {
          "@type": "Offer",
          name: plan?.name ?? id,
          description: plan?.summary,
          price: getPlanPrice(id),
          priceCurrency: "USD",
          url: `${site}/signup/?plan=${id}`,
          category: "subscription",
        };
      }),
    },
    {
      "@type": "FAQPage",
      "@id": `${page}#faq`,
      inLanguage: lang,
      mainEntity: t.faq.items.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ];

  // "<" escaped so no text can close the script tag
  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c");
}
