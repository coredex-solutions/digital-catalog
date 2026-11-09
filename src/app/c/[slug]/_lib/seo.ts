import type { getFullCatalogData } from "@/lib/catalog/queries";
import { getModule, moduleInfo, schemaTypeFor } from "@/lib/modules/resolve";
import { isItemAvailable } from "@/lib/orders/context";
import { getSiteUrl } from "@/lib/utils/base-url";
import { localized } from "./i18n";
import type { Language } from "@/types";

type CatalogData = NonNullable<Awaited<ReturnType<typeof getFullCatalogData>>>;

/**
 * The language a page address without ?lang= shows to a visitor with no saved choice and no
 * browser language (search engines): the owner's default, else the first enabled language.
 * Mirrors the fallback at the end of resolveMenuLanguage.
 */
export function baseMenuLanguage(enabled: Language[], defaultLanguage?: string | null): Language {
  const fallback = (defaultLanguage || "").toLowerCase();
  return (enabled as string[]).includes(fallback) ? (fallback as Language) : (enabled[0] ?? "ar");
}

/**
 * One address per language, so search engines can index the Arabic and the English page:
 * /c/<slug>/ in the base language and /c/<slug>/?lang=<other> for the other one. Any other
 * query (table numbers from QR codes, ?c= category links) is left out of the canonical address.
 */
export function menuAlternates(slug: string, lang: Language, enabled: Language[], defaultLanguage?: string | null) {
  const base = baseMenuLanguage(enabled, defaultLanguage);
  const path = `/c/${encodeURIComponent(slug)}/`;
  const url = (l: Language) => (l === base ? path : `${path}?lang=${l}`);
  return {
    canonical: url(enabled.includes(lang) ? lang : base),
    languages:
      enabled.length > 1
        ? { ...Object.fromEntries(enabled.map((l) => [l, url(l)])), "x-default": url(base) }
        : undefined,
  };
}

function formatSchemaHour(hour: number): string {
  const normalized = ((Number(hour) % 24) + 24) % 24;
  const h = Math.floor(normalized);
  const m = Math.round((normalized - h) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Photos uploaded to storage are absolute already; demo photos are site paths */
function absolute(url: unknown): string | undefined {
  if (typeof url !== "string" || !url) return undefined;
  return url.startsWith("/") ? `${getSiteUrl()}${url}` : url;
}

// Enough for search engines to understand the catalogue without making very large pages heavier
const MAX_ITEMS = 250;

/**
 * schema.org JSON-LD for a business page: the business (type from its module and sub-type),
 * contact, hours, social profiles, what it sells (a Menu for food, an OfferCatalog for shops,
 * services and stays) and its questions. Text is in the language the page is shown in.
 */
export function catalogJsonLd(data: CatalogData, lang: Language, pageUrl: string): string {
  const { catalog, settings, contact, operatingHours, socialMedia, categories, menuItems, faqs } = data;
  const def = getModule(catalog);
  const trackStock = moduleInfo(catalog).addons.includes("stock");
  const id = `${pageUrl}#business`;
  const name = localized(catalog, "name", lang) || catalog.name;

  const business: Record<string, unknown> = {
    "@type": schemaTypeFor(def, catalog.business_type),
    "@id": id,
    name,
    description: localized(catalog, "description", lang) || settings?.[`seo_description_${lang}` as const] || settings?.seo_description_en || undefined,
    image: absolute(settings?.hero_image_url) || absolute(catalog.logo_url),
    logo: absolute(catalog.logo_url),
    url: pageUrl,
  };

  if (contact) {
    if (contact.phone_primary) business.telephone = contact.phone_primary;
    if (contact.email) business.email = contact.email;
    const street = localized(contact, "address", lang);
    const city = localized(contact, "city", lang);
    if (street || city) {
      business.address = {
        "@type": "PostalAddress",
        streetAddress: street || undefined,
        addressLocality: city || undefined,
        addressCountry: contact.country_en || "LB",
      };
    }
    if (contact.google_map_iframe_url && /^https:\/\//.test(String(contact.google_map_iframe_url))) business.hasMap = contact.google_map_iframe_url;
  }

  const open = operatingHours.filter((h) => !Number(h.is_closed));
  if (open.length > 0) {
    business.openingHoursSpecification = open.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: h.day_name,
      opens: formatSchemaHour(h.open_hour),
      closes: formatSchemaHour(h.close_hour),
    }));
  }

  const profiles = socialMedia.map((s) => s.url).filter((url): url is string => typeof url === "string" && /^https?:\/\//.test(url));
  if (profiles.length > 0) business.sameAs = profiles;

  // What the business sells, grouped by category, in menu order
  const items = (menuItems || []).slice(0, MAX_ITEMS);
  const sections = categories
    .map((category) => ({ category, items: items.filter((item) => item.category_id === category.id) }))
    .filter((section) => section.items.length > 0);

  const offer = (item: (typeof items)[number]) => {
    const row = item as unknown as Record<string, unknown>;
    return {
      "@type": "Offer",
      price: Number(item.price),
      priceCurrency: item.currency || "USD",
      availability: isItemAvailable(row, trackStock) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    };
  };

  if (sections.length > 0) {
    if (def.id === "restaurant" || def.id === "cafe") {
      business.hasMenu = {
        "@type": "Menu",
        url: pageUrl,
        inLanguage: lang,
        hasMenuSection: sections.map(({ category, items: sectionItems }) => ({
          "@type": "MenuSection",
          name: localized(category, "name", lang),
          hasMenuItem: sectionItems.map((item) => ({
            "@type": "MenuItem",
            name: localized(item, "name", lang),
            description: localized(item, "description", lang) || undefined,
            image: absolute(item.image_url),
            offers: offer(item),
          })),
        })),
      };
    } else {
      const kind = def.id === "shop" ? "Product" : def.id === "stays" ? "Accommodation" : "Service";
      business.hasOfferCatalog = {
        "@type": "OfferCatalog",
        name,
        itemListElement: sections.map(({ category, items: sectionItems }) => ({
          "@type": "OfferCatalog",
          name: localized(category, "name", lang),
          itemListElement: sectionItems.map((item) => ({
            ...offer(item),
            itemOffered: {
              "@type": kind,
              name: localized(item, "name", lang),
              description: localized(item, "description", lang) || undefined,
              image: absolute(item.image_url),
            },
          })),
        })),
      };
    }
  }

  const graph: Record<string, unknown>[] = [business];
  const questions = faqs
    .map((f) => ({ q: localized(f, "question", lang), a: localized(f, "answer", lang) }))
    .filter((f) => f.q && f.a);
  if (questions.length > 0) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${pageUrl}#faq`,
      inLanguage: lang,
      about: { "@id": id },
      mainEntity: questions.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    });
  }

  // "<" escaped so text written by the owner can't close the script tag
  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c");
}
