import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/utils/base-url";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Owner and platform dashboards and the API are not for search engines
      disallow: ["/c/*/admin", "/superadmin", "/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
