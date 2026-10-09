// Server-only: loads a menu for the guest pages, in preview mode when the owner opened a
// preview link (see ../preview/route.ts). One load per request, shared by layout and pages.

import { cache } from "react";
import { cookies } from "next/headers";
import { getCatalogBySlug, getFullCatalogData } from "@/lib/catalog/queries";
import { verifyMenuPreviewToken } from "@/lib/auth/jwt";

export const PREVIEW_COOKIE = "menu_preview";

/** True when this request carries a valid preview token for this catalog */
export const isMenuPreview = cache(async (slug: string): Promise<boolean> => {
  const token = (await cookies()).get(PREVIEW_COOKIE)?.value;
  if (!token) return false;
  const catalog = await getCatalogBySlug(slug);
  return !!catalog && verifyMenuPreviewToken(token, catalog.id);
});

/** The published menu, or the owner's draft while previewing */
export const getMenuData = cache(async (slug: string) => getFullCatalogData(slug, await isMenuPreview(slug)));
