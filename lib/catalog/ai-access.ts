import { getDb } from '../db/client';
import { getSubscriptionState } from '../plans';

export interface AiWaiterCatalog {
  id: string;
  name: string;
  business_type: string;
  /** The owner switched the AI waiter on in settings */
  aiWaiterEnabled: boolean;
  /** The catalog has an active subscription that has not expired */
  subscriptionLive: boolean;
}

/**
 * Load a public catalog for the AI endpoints: only active, unsuspended catalogs are returned.
 * Expiry is compared in JS like the guest menu layout does, since expires_at is stored in
 * more than one date format.
 */
export async function getAiWaiterCatalog(slug: string): Promise<AiWaiterCatalog | null> {
  const db = getDb();
  const result = await db.execute({
    sql: `
      SELECT c.id, c.name, c.business_type, s.ai_waiter_enabled,
        (SELECT sub.expires_at FROM catalog_subscriptions sub
          WHERE sub.catalog_id = c.id AND sub.is_active = 1 LIMIT 1) as expires_at,
        (SELECT COUNT(*) FROM catalog_subscriptions sub
          WHERE sub.catalog_id = c.id AND sub.is_active = 1) as active_subscriptions
      FROM catalogs c
      LEFT JOIN catalog_settings s ON s.catalog_id = c.id
      WHERE c.slug = ? AND c.is_active = 1 AND c.is_suspended = 0
    `,
    args: [slug],
  });

  const row = result.rows[0];
  if (!row) return null;

  // Same rule as the menu: available until the grace period after the plan's end has passed
  const notExpired = getSubscriptionState(row.expires_at).state !== 'expired';

  return {
    id: String(row.id),
    name: String(row.name),
    business_type: String(row.business_type || ''),
    aiWaiterEnabled: Number(row.ai_waiter_enabled || 0) === 1,
    subscriptionLive: Number(row.active_subscriptions || 0) > 0 && notExpired,
  };
}
