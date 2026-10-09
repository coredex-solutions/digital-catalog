import type { MetadataRoute } from "next";
import { getDb } from "@/lib/db/client";
import { getSiteUrl } from "@/lib/utils/base-url";
import { SQL_GRACE_MODIFIER } from "@/lib/plans";

// Rebuilt at most once an hour, so new restaurants appear without a deploy
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const pages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/signup/`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/privacy/`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/terms/`, changeFrequency: "yearly", priority: 0.2 },
  ];

  try {
    // Only menus a diner can actually open: active, not suspended, subscription current
    const result = await getDb().execute(`
      SELECT c.slug, c.updated_at
      FROM catalogs c
      JOIN catalog_subscriptions s ON s.catalog_id = c.id AND s.is_active = 1
      WHERE c.is_active = 1 AND c.is_suspended = 0
        AND (s.expires_at IS NULL OR datetime(s.expires_at, '${SQL_GRACE_MODIFIER}') > datetime('now'))
      ORDER BY c.updated_at DESC
    `);

    for (const row of result.rows) {
      pages.push({
        url: `${baseUrl}/c/${row.slug}/`,
        lastModified: row.updated_at ? new Date(String(row.updated_at)) : undefined,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } catch (error) {
    console.error("Sitemap: could not list menus", error);
  }

  return pages;
}
