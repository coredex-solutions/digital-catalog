import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "@/lib/db/client";
import { sendBrandedEmail } from "@/lib/email";
import { getPlanForSubscriptionType, getSubscriptionState, parseExpiry } from "@/lib/plans";
import { getBaseUrl } from "@/lib/utils/base-url";

const DAY = 24 * 60 * 60 * 1000;
// How early the "ending soon" email goes out: trials are only 2 days long
const NOTICE_DAYS = { trial: 1, paid: 7 };

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Beirut" }).format(date);

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization") || "";
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(header);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

// GET with "Authorization: Bearer $CRON_SECRET", once a day from the server's crontab
// (deploy/README.md). Emails each restaurant's owners when the plan is about to end and again
// when it has ended (the menu stays up for the grace period). Safe to run more often: each
// email is recorded in subscription_reminders before it is sent.
export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET) return NextResponse.json({ error: "CRON_SECRET is not set" }, { status: 503 });
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const now = new Date();
  const base = getBaseUrl(request);

  const rows = (
    await db.execute(`
      SELECT c.id, c.slug, c.name, cs.subscription_type, cs.expires_at
      FROM catalogs c
      JOIN catalog_subscriptions cs ON cs.catalog_id = c.id
      WHERE c.is_active = 1 AND c.is_suspended = 0 AND cs.expires_at IS NOT NULL
    `)
  ).rows;

  const sent: { slug: string; kind: string }[] = [];
  const failed: { slug: string; kind: string; error: string }[] = [];

  for (const row of rows) {
    const expires = parseExpiry(row.expires_at);
    if (!expires) continue;
    const { state, offlineAt } = getSubscriptionState(row.expires_at, now);
    const isTrial = row.subscription_type === "trial";

    let kind: "ending_soon" | "ended" | null = null;
    if (state === "active" && expires.getTime() - now.getTime() <= (isTrial ? NOTICE_DAYS.trial : NOTICE_DAYS.paid) * DAY) kind = "ending_soon";
    else if (state === "grace") kind = "ended";
    if (!kind) continue;

    // Claim the reminder first so overlapping runs can't send it twice
    const claimId = uuidv4();
    const claim = await db.execute({
      sql: "INSERT OR IGNORE INTO subscription_reminders (id, catalog_id, kind, expires_at) VALUES (?, ?, ?, ?)",
      args: [claimId, row.id, kind, String(row.expires_at)],
    });
    if (claim.rowsAffected === 0) continue;

    const owners = (
      await db.execute({
        sql: `SELECT email FROM catalog_admins
              WHERE catalog_id = ? AND is_active = 1 AND (role IS NULL OR role IN ('owner', 'admin'))`,
        args: [row.id],
      })
    ).rows.map((r) => String(r.email));

    const name = String(row.name);
    const plan = isTrial ? "free trial" : `${getPlanForSubscriptionType(String(row.subscription_type)).name} plan`;
    const billing = `${base}/c/${row.slug}/admin/billing/`;
    const email =
      kind === "ending_soon"
        ? {
            subject: `Your Coredex ${plan} for ${name} ends on ${formatDate(expires)}`,
            paragraphs: [
              `The ${plan} for ${name} ends on ${formatDate(expires)}.`,
              isTrial
                ? "To keep your menu online after that, choose a plan. We'll contact you to arrange payment."
                : "To keep your menu online without a break, request a renewal. We'll contact you to arrange payment.",
            ],
            button: { label: isTrial ? "Choose a plan" : "Renew my plan", url: billing },
          }
        : {
            subject: `Your Coredex ${plan} for ${name} has ended`,
            paragraphs: [
              `The ${plan} for ${name} ended on ${formatDate(expires)}.`,
              `Your menu stays online and you can keep editing until ${formatDate(offlineAt!)}. After that, guests who scan your QR code will see that the menu is unavailable.`,
              "Request a plan to keep it running. We'll contact you to arrange payment.",
            ],
            button: { label: "Keep my menu online", url: billing },
          };

    try {
      for (const to of owners) {
        await sendBrandedEmail({ to, ...email, footer: "You're receiving this because you own this restaurant's Coredex menu." });
      }
      sent.push({ slug: String(row.slug), kind });
    } catch (error) {
      // Release the claim so the next run tries again
      await db.execute({ sql: "DELETE FROM subscription_reminders WHERE id = ?", args: [claimId] });
      failed.push({ slug: String(row.slug), kind, error: error instanceof Error ? error.message : String(error) });
    }
  }

  return NextResponse.json({ checked: rows.length, sent, failed });
}
