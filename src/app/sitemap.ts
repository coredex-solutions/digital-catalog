import { MetadataRoute } from "next";
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://mtabal.m.dynamicord.com";

  try {
    // Fetch all categories for dynamic routes
    const categoriesResult = await client.execute(`
      SELECT id, updated_at FROM categories WHERE is_active = 1 ORDER BY display_order
    `);

    const categoryUrls = categoriesResult.rows.map((category) => ({
      url: `${baseUrl}/menu/${category.id}`,
      lastModified: category.updated_at
        ? new Date(category.updated_at as string)
        : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 1,
      },
      {
        url: `${baseUrl}/categories`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.9,
      },
      ...categoryUrls,
    ];
  } catch (error) {
    console.error("Error generating sitemap:", error);
    // Return basic sitemap if DB fails
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 1,
      },
      {
        url: `${baseUrl}/categories`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.9,
      },
    ];
  }
}
