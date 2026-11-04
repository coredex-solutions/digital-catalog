// The order rules for one catalog, built from its published data (getFullCatalogData).

import { getPriceConfig } from "../catalog/price";
import { getModule, resolveAddons } from "../modules/resolve";
import type { getFullCatalogData } from "../catalog/queries";
import { beirutToday, type OrderContext, type OrderableItem } from "./validate";

type CatalogData = NonNullable<Awaited<ReturnType<typeof getFullCatalogData>>>;

const on = (value: unknown, fallback: number) => Number(value ?? fallback) === 1;

/** True while an item can be ordered: not switched to sold out, and (when tracked) not at zero */
export function isItemAvailable(item: { is_available?: unknown; stock_qty?: unknown }, trackStock: boolean): boolean {
  const switchedOn = item.is_available === undefined || item.is_available === null || Boolean(Number(item.is_available));
  const stock = item.stock_qty === undefined || item.stock_qty === null ? null : Number(item.stock_qty);
  return switchedOn && !(trackStock && stock !== null && stock <= 0);
}

export function buildOrderContext(data: CatalogData): OrderContext {
  const def = getModule(data.catalog);
  const trackStock = resolveAddons(def, data.catalog.addons).includes("stock");
  const items: OrderableItem[] = data.menuItems.map((item) => {
    const row = item as unknown as Record<string, unknown>;
    const stock = row.stock_qty === undefined || row.stock_qty === null ? null : Number(row.stock_qty);
    return {
      id: String(item.id),
      name_en: item.name_en,
      name_ar: item.name_ar,
      price: Number(item.price),
      currency: item.currency || "USD",
      is_available: isItemAvailable(row, trackStock),
      stock_qty: trackStock ? stock : null,
      variants: row.variants,
    };
  });
  return {
    module: def,
    items,
    orderTypesSetting: (data.settings as unknown as Record<string, unknown> | null)?.order_types as string | null ?? null,
    orderingEnabled: on(data.settings?.whatsapp_order_enabled, 1),
    bookingEnabled: on(data.settings?.booking_enabled, 1),
    trackStock,
    priceConfig: getPriceConfig(data.settings as Parameters<typeof getPriceConfig>[0]),
    today: beirutToday(),
  };
}
