import type { MetadataRoute } from "next";
import { getDb } from "@/lib/db/client";
import { getSiteUrl } from "@/lib/utils/base-url";
import { SQL_GRACE_MODIFIER } from "@/lib/plans";
import { getEnabledLanguages } from "./c/[slug]/_lib/locale";
import { menuAlternates } from "./c/[slug]/_lib/seo";

// Rebuilt at most once an hour, so new restaurants appear without a deploy
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const pages: MetadataRoute.Sitemap = [
    ...["/", "/ar/"].map((path) => ({
      url: `${baseUrl}${path}`,
      changeFrequency: "weekly" as const,
      priority: 1,
      alternates: { languages: { en: `${baseUrl}/`, ar: `${baseUrl}/ar/`, "x-default": `${baseUrl}/` } },
    })),
    { url: `${baseUrl}/privacy/`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/terms/`, changeFrequency: "yearly", priority: 0.2 },
  ];

  try {
    // Only menus a diner can actually open: active, not suspended, subscription current
    const result = await getDb().execute(`
      SELECT c.slug, c.updated_at, cs.enabled_languages, cs.default_language
      FROM catalogs c
      LEFT JOIN catalog_settings cs ON cs.catalog_id = c.id
      JOIN catalog_subscriptions s ON s.catalog_id = c.id AND s.is_active = 1
      WHERE c.is_active = 1 AND c.is_suspended = 0
        AND (s.expires_at IS NULL OR datetime(s.expires_at, '${SQL_GRACE_MODIFIER}') > datetime('now'))
      ORDER BY c.updated_at DESC
    `);

    for (const row of result.rows) {
      // Each language the page is offered in has its own address (see _lib/seo.ts)
      const slug = String(row.slug);
      const enabled = getEnabledLanguages(row.enabled_languages as string | null);
      const lastModified = row.updated_at ? new Date(String(row.updated_at)) : undefined;
      const languages = menuAlternates(slug, enabled[0], enabled, row.default_language as string | null).languages;
      const absolute = languages ? Object.fromEntries(Object.entries(languages).map(([l, path]) => [l, `${baseUrl}${path}`])) : undefined;
      for (const lang of enabled) {
        const { canonical } = menuAlternates(slug, lang, enabled, row.default_language as string | null);
        pages.push({
          url: `${baseUrl}${canonical}`,
          lastModified,
          changeFrequency: "weekly",
          priority: 0.8,
          ...(absolute ? { alternates: { languages: absolute } } : {}),
        });
      }
    }
  } catch (error) {
    console.error("Sitemap: could not list menus", error);
  }

  return pages;
}
