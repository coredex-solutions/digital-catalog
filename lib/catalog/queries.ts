import { getDb } from '../db/client';
import type { 
  Catalog, 
  CatalogSettings, 
  CatalogContact, 
  CatalogSubscription,
  Category,
  MenuItem,
  OperatingHours,
  SocialMedia,
  FAQ
} from '../db/types';

/**
 * Get catalog by slug
 */
export async function getCatalogBySlug(slug: string): Promise<Catalog | null> {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM catalogs WHERE slug = ? AND is_active = 1 AND is_suspended = 0',
    args: [slug],
  });

  if (result.rows.length === 0) return null;
  return result.rows[0] as unknown as Catalog;
}

/**
 * Get catalog by ID
 */
export async function getCatalogById(id: string): Promise<Catalog | null> {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM catalogs WHERE id = ?',
    args: [id],
  });

  if (result.rows.length === 0) return null;
  return result.rows[0] as unknown as Catalog;
}

/**
 * Get catalog settings
 */
export async function getCatalogSettings(catalogId: string): Promise<CatalogSettings | null> {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM catalog_settings WHERE catalog_id = ?',
    args: [catalogId],
  });

  if (result.rows.length === 0) return null;
  return result.rows[0] as unknown as CatalogSettings;
}

/**
 * Get catalog contact info
 */
export async function getCatalogContact(catalogId: string): Promise<CatalogContact | null> {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM catalog_contact WHERE catalog_id = ?',
    args: [catalogId],
  });

  if (result.rows.length === 0) return null;
  return result.rows[0] as unknown as CatalogContact;
}

/**
 * Get catalog subscription
 */
export async function getCatalogSubscription(catalogId: string): Promise<CatalogSubscription | null> {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM catalog_subscriptions WHERE catalog_id = ? AND is_active = 1',
    args: [catalogId],
  });

  if (result.rows.length === 0) return null;
  return result.rows[0] as unknown as CatalogSubscription;
}

/**
 * Check if subscription is valid (not expired)
 */
export async function isSubscriptionValid(catalogId: string): Promise<boolean> {
  const db = getDb();
  const result = await db.execute({
    sql: `
      SELECT id FROM catalog_subscriptions 
      WHERE catalog_id = ? 
        AND is_active = 1 
        AND (expires_at IS NULL OR expires_at > datetime('now'))
    `,
    args: [catalogId],
  });

  return result.rows.length > 0;
}

/**
 * Get categories for catalog
 */
export async function getCatalogCategories(catalogId: string): Promise<Category[]> {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM categories WHERE catalog_id = ? AND is_active = 1 ORDER BY display_order ASC',
    args: [catalogId],
  });

  return result.rows as unknown as Category[];
}

/**
 * Get menu items for category
 */
export async function getCategoryItems(catalogId: string, categoryId: string): Promise<MenuItem[]> {
  const db = getDb();
  const result = await db.execute({
    sql: `
      SELECT * FROM menu_items 
      WHERE catalog_id = ? AND category_id = ? AND is_active = 1 
      ORDER BY display_order ASC
    `,
    args: [catalogId, categoryId],
  });

  return result.rows as unknown as MenuItem[];
}

/**
 * Get all menu items for catalog
 */
export async function getCatalogItems(catalogId: string): Promise<MenuItem[]> {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM menu_items WHERE catalog_id = ? AND is_active = 1 ORDER BY display_order ASC',
    args: [catalogId],
  });

  return result.rows as unknown as MenuItem[];
}

/**
 * Get operating hours for catalog
 */
export async function getCatalogOperatingHours(catalogId: string): Promise<OperatingHours[]> {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM catalog_operating_hours WHERE catalog_id = ? ORDER BY id ASC',
    args: [catalogId],
  });

  return result.rows as unknown as OperatingHours[];
}

/**
 * Get social media links for catalog
 */
export async function getCatalogSocialMedia(catalogId: string): Promise<SocialMedia[]> {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM social_media WHERE catalog_id = ? AND is_active = 1',
    args: [catalogId],
  });

  return result.rows as unknown as SocialMedia[];
}

/**
 * Get FAQs for catalog
 */
export async function getCatalogFAQs(catalogId: string): Promise<FAQ[]> {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM faqs WHERE catalog_id = ? AND is_active = 1 ORDER BY display_order ASC',
    args: [catalogId],
  });

  return result.rows as unknown as FAQ[];
}

/**
 * Get category by ID
 */
export async function getCategoryById(catalogId: string, categoryId: string): Promise<Category | null> {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM categories WHERE id = ? AND catalog_id = ?',
    args: [categoryId, catalogId],
  });

  if (result.rows.length === 0) return null;
  return result.rows[0] as unknown as Category;
}

/**
 * Get full catalog data for rendering (cached)
 */
export async function getFullCatalogData(slug: string) {
  const catalog = await getCatalogBySlug(slug);
  if (!catalog) return null;

  const [settings, contact, subscription, categories, operatingHours, socialMedia, faqs] = await Promise.all([
    getCatalogSettings(catalog.id),
    getCatalogContact(catalog.id),
    getCatalogSubscription(catalog.id),
    getCatalogCategories(catalog.id),
    getCatalogOperatingHours(catalog.id),
    getCatalogSocialMedia(catalog.id),
    getCatalogFAQs(catalog.id),
  ]);

  // Check if subscription is expired
  const isExpired = subscription?.expires_at 
    ? new Date(subscription.expires_at) < new Date() 
    : false;

  return {
    catalog,
    settings,
    contact,
    subscription,
    categories,
    operatingHours,
    socialMedia,
    faqs,
    isExpired,
  };
}

