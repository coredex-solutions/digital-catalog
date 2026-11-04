// Reading a catalog's module and add-ons safely, whatever is (or isn't) stored.

import {
  ADDON_IDS,
  MODULES,
  MODULE_IDS,
  ORDER_TYPES,
  type AddonId,
  type ModuleDefinition,
  type ModuleId,
  type OrderType,
} from "./registry";

export function isModuleId(value: unknown): value is ModuleId {
  return typeof value === "string" && (MODULE_IDS as readonly string[]).includes(value);
}

/**
 * The module for a business type saved before modules existed (catalogs.business_type).
 * Also accepts the sub-type ids in the registry.
 */
export function legacyBusinessTypeToModule(businessType: unknown): ModuleId {
  const type = typeof businessType === "string" ? businessType.trim().toLowerCase() : "";
  if (isModuleId(type)) return type;
  for (const definition of Object.values(MODULES)) {
    if (definition.subTypes.some((sub) => sub.id === type)) return definition.id;
  }
  if (["supermarket"].includes(type)) return "shop";
  if (["gym", "medical"].includes(type)) return "services";
  return "restaurant";
}

/** The module definition for a catalog row (falls back to the old business_type, then restaurant) */
export function getModule(catalog?: { module?: unknown; business_type?: unknown } | null): ModuleDefinition {
  if (catalog && isModuleId(catalog.module)) return MODULES[catalog.module];
  return MODULES[legacyBusinessTypeToModule(catalog?.business_type)];
}

/**
 * The add-ons a catalog has on. catalogs.addons NULL = the module's defaults (catalogs created
 * before add-ons existed); otherwise a comma list, where '' means the owner turned them all off.
 * Add-ons the module doesn't allow are ignored.
 */
export function resolveAddons(module: ModuleDefinition, stored: unknown): AddonId[] {
  const wanted =
    stored === null || stored === undefined
      ? new Set<string>(module.defaultAddons)
      : new Set(String(stored).split(",").map((s) => s.trim()));
  return ADDON_IDS.filter((id) => wanted.has(id) && module.allowedAddons.includes(id));
}

/** Validate add-ons from a request: only known ids the module allows, in canonical order */
export function parseAddonsInput(module: ModuleDefinition, value: unknown): AddonId[] | null {
  if (!Array.isArray(value)) return null;
  const wanted = new Set(value.filter((v): v is string => typeof v === "string"));
  return ADDON_IDS.filter((id) => wanted.has(id) && module.allowedAddons.includes(id));
}

/** A sub-type id valid for the module, or the module's first one */
export function resolveSubType(module: ModuleDefinition, value: unknown): string {
  const id = typeof value === "string" ? value.trim().toLowerCase() : "";
  return module.subTypes.some((sub) => sub.id === id) ? id : module.subTypes[0].id;
}

export function isOrderType(value: unknown): value is OrderType {
  return typeof value === "string" && (ORDER_TYPES as readonly string[]).includes(value);
}

/**
 * The order types a catalog offers: the stored list (catalog_settings.order_types) limited to
 * what its module allows, in the module's order. NULL = the module's defaults.
 */
export function resolveOrderTypes(module: ModuleDefinition, stored: unknown): OrderType[] {
  if (stored === null || stored === undefined) return [...module.defaultOrderTypes];
  const wanted = new Set(String(stored).split(",").map((s) => s.trim()));
  return module.orderTypes.filter((type) => wanted.has(type));
}

/** schema.org type: the sub-type's when it has one, else the module's */
export function schemaTypeFor(module: ModuleDefinition, businessType: unknown): string {
  const sub = module.subTypes.find((s) => s.id === businessType);
  return sub?.schemaType || module.schemaType;
}

export interface CatalogModuleInfo {
  module: ModuleId;
  addons: AddonId[];
}

/** What screens need to know about a catalog row's module, in a form safe to send to the browser */
export function moduleInfo(catalog?: { module?: unknown; business_type?: unknown; addons?: unknown } | null): CatalogModuleInfo {
  const def = getModule(catalog);
  return { module: def.id, addons: resolveAddons(def, catalog?.addons) };
}

/** Settings a new catalog of this module starts with (catalog_settings columns) */
export function newCatalogSettings(module: ModuleDefinition) {
  return {
    order_types: module.defaultOrderTypes.join(","),
    // Table booking only exists for restaurants and cafés; services book through their requests
    booking_enabled: module.tableBooking ? 1 : 0,
  };
}

/** catalogs columns for a new catalog: module, sub-type and the module's default add-ons */
export function newCatalogModuleColumns(moduleValue: unknown, subTypeValue: unknown) {
  // Older clients only send a business type: take the module from it
  const def = MODULES[isModuleId(moduleValue) ? moduleValue : legacyBusinessTypeToModule(subTypeValue)];
  return {
    module: def,
    business_type: resolveSubType(def, subTypeValue),
    addons: def.defaultAddons.join(","),
  };
}

/** Module definition and add-ons from what the server sent to the browser (see moduleInfo) */
export function moduleFor(catalog: { module?: unknown; business_type?: unknown; addons?: AddonId[] | null } | null | undefined) {
  const def = getModule(catalog);
  const addons = catalog?.addons ? catalog.addons.filter((id) => def.allowedAddons.includes(id)) : resolveAddons(def, null);
  return { module: def, addons };
}
