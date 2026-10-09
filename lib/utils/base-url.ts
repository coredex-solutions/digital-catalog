import type { NextRequest } from "next/server";

/**
 * Public origin of the site, without a trailing slash. Uses NEXT_PUBLIC_BASE_URL when set,
 * otherwise the host the request came in on (as forwarded by the proxy).
 */
export function getBaseUrl(request: NextRequest): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, "");
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "localhost:3000";
  const proto = request.headers.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** Public origin for code without a request (sitemap, robots, structured data) */
export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
}
