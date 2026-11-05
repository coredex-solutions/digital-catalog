// New-order notifications on owners' phones and computers (Web Push), even when the dashboard is
// closed. Needs VAPID keys on the server (npx web-push generate-vapid-keys); without them push is
// off and the dashboard keeps its in-page alerts. Payloads are encrypted for the device, so the
// browser's push service (Google, Apple, Mozilla, Microsoft) only delivers them.

import webpush from "web-push";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "../db/client";
import { formatTotal } from "../catalog/price";
import { SALES_EMAIL } from "../contact";
import type { SavedOrder } from "../orders/store";

export interface PushConfig {
  publicKey: string;
  privateKey: string;
  subject: string;
}

/** The server's VAPID keys, or null when push isn't set up */
export function pushConfig(): PushConfig | null {
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  if (!publicKey || !privateKey) return null;
  const subject = process.env.VAPID_SUBJECT?.trim() || `mailto:${SALES_EMAIL}`;
  return { publicKey, privateKey, subject };
}

// Push services the browsers use. Anything else is refused, so a crafted subscription can't make
// the server send requests to an address of the sender's choosing.
const PUSH_HOSTS = [/^fcm\.googleapis\.com$/, /^android\.googleapis\.com$/, /\.push\.services\.mozilla\.com$/, /\.notify\.windows\.com$/, /^web\.push\.apple\.com$/, /\.push\.apple\.com$/];

export function isAllowedEndpoint(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    return url.protocol === "https:" && PUSH_HOSTS.some((host) => host.test(url.hostname)) && endpoint.length <= 1000;
  } catch {
    return false;
  }
}

export interface IncomingSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/** Read the browser's PushSubscription JSON; null when it isn't a usable one */
export function parseSubscription(value: unknown): IncomingSubscription | null {
  if (!value || typeof value !== "object") return null;
  const sub = value as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
  const endpoint = typeof sub.endpoint === "string" ? sub.endpoint : "";
  const p256dh = typeof sub.keys?.p256dh === "string" ? sub.keys.p256dh : "";
  const auth = typeof sub.keys?.auth === "string" ? sub.keys.auth : "";
  const base64url = /^[A-Za-z0-9_-]+={0,2}$/;
  if (!isAllowedEndpoint(endpoint) || !base64url.test(p256dh) || !base64url.test(auth) || p256dh.length > 200 || auth.length > 100) return null;
  return { endpoint, p256dh, auth };
}

export async function savePushSubscription(catalogId: string, adminId: string, sub: IncomingSubscription, lang: "en" | "ar") {
  await getDb().execute({
    sql: `INSERT INTO push_subscriptions (id, catalog_id, admin_id, endpoint, p256dh, auth, lang)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT (catalog_id, endpoint) DO UPDATE SET admin_id = excluded.admin_id, p256dh = excluded.p256dh, auth = excluded.auth, lang = excluded.lang`,
    args: [uuidv4(), catalogId, adminId, sub.endpoint, sub.p256dh, sub.auth, lang],
  });
}

export async function removePushSubscription(catalogId: string, endpoint: string) {
  await getDb().execute({ sql: "DELETE FROM push_subscriptions WHERE catalog_id = ? AND endpoint = ?", args: [catalogId, endpoint] });
}

export async function hasPushSubscription(catalogId: string, endpoint: string): Promise<boolean> {
  const result = await getDb().execute({ sql: "SELECT 1 FROM push_subscriptions WHERE catalog_id = ? AND endpoint = ?", args: [catalogId, endpoint] });
  return result.rows.length > 0;
}

const TITLES = {
  en: { order: "New order", booking: "New table booking", request: "New request" },
  ar: { order: "طلب جديد", booking: "حجز طاولة جديد", request: "طلب موعد جديد" },
} as const;

/** What the notification says: "New order #12" / "Rami · $27" */
export function notificationFor(order: SavedOrder, lang: "en" | "ar", slug: string) {
  const title = `${TITLES[lang][order.kind] ?? TITLES[lang].order} #${order.number}`;
  const parts = [order.customer_name];
  if (order.lines.length > 0 && order.price_config) parts.push(formatTotal(order.lines, order.price_config, lang).primary);
  if (order.requested_for) parts.push(order.requested_for.replace("T", " "));
  if (order.table_label) parts.push(lang === "ar" ? `طاولة ${order.table_label}` : `Table ${order.table_label}`);
  return {
    title,
    body: parts.filter(Boolean).join(" · "),
    url: `/c/${slug}/admin/orders/`,
    tag: `order-${slug}-${order.number}`,
  };
}

/**
 * Tell every device that follows this catalog about a new order. Never throws: a failed
 * notification must not fail the order. Devices the push service no longer knows are removed.
 */
export async function notifyNewOrder(catalogId: string, slug: string, order: SavedOrder): Promise<void> {
  const config = pushConfig();
  if (!config) return;
  try {
    const db = getDb();
    const result = await db.execute({
      // Only team members who still have access
      sql: `SELECT ps.id, ps.endpoint, ps.p256dh, ps.auth, ps.lang
            FROM push_subscriptions ps
            JOIN catalog_admins ca ON ca.id = ps.admin_id AND ca.catalog_id = ps.catalog_id
            WHERE ps.catalog_id = ? AND ca.is_active = 1`,
      args: [catalogId],
    });
    if (result.rows.length === 0) return;
    webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);

    const gone: string[] = [];
    const sent: string[] = [];
    await Promise.all(
      result.rows.map(async (row) => {
        const lang = row.lang === "ar" ? "ar" : "en";
        const payload = JSON.stringify(notificationFor(order, lang, slug));
        try {
          await webpush.sendNotification(
            { endpoint: String(row.endpoint), keys: { p256dh: String(row.p256dh), auth: String(row.auth) } },
            payload,
            { TTL: 60 * 60, urgency: "high", timeout: 10000 }
          );
          sent.push(String(row.id));
        } catch (error) {
          const status = (error as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) gone.push(String(row.id));
          else console.error("Push failed:", status ?? (error instanceof Error ? error.message : error));
        }
      })
    );
    const statements = [
      ...gone.map((id) => ({ sql: "DELETE FROM push_subscriptions WHERE id = ?", args: [id] })),
      ...sent.map((id) => ({ sql: "UPDATE push_subscriptions SET last_sent_at = datetime('now') WHERE id = ?", args: [id] })),
    ];
    if (statements.length) await db.batch(statements, "write");
  } catch (error) {
    console.error("Push notifications failed:", error);
  }
}
