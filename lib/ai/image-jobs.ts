/**
 * AI photos for dishes, done as reviewable jobs (DESIGN.md §6):
 *
 *   owner asks → queued → processing → ready (review) → approved | discarded
 *                                   ↘ failed (credit returned) → retry
 *   approved → reverted (the dish goes back to its previous photo)
 *
 * - "enhance" improves the owner's own photo (lighting, background) without changing the food;
 *   "illustrate" creates an image from the dish's name and is labelled "Illustrative" for guests.
 * - One monthly credit is taken when a job is created and given back if it fails. Repeating
 *   the same request (same idempotency key) returns the same job and never charges twice.
 * - Results only reach the dish when the owner approves them, and like any menu edit they only
 *   reach guests after publishing, so an AI failure can't affect the live menu.
 * - Work runs after the response (next/server `after`), so the owner can close the form; jobs
 *   left unfinished by a restart are failed and refunded when next read.
 */
import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "@/lib/db/client";
import { getR2PublicUrl } from "@/lib/r2/client";
import { uploadBufferToR2 } from "@/lib/r2/upload";

export type ImageJobKind = "enhance" | "illustrate";
export type ImageJobStatus = "queued" | "processing" | "failed" | "ready" | "approved" | "discarded" | "reverted";

export const IMAGE_STYLES = {
  natural: { label: "Natural daylight", prompt: "soft natural daylight from a nearby window, true-to-life colours" },
  bright: { label: "Clean and bright", prompt: "bright, even light and a plain, light, uncluttered background" },
  warm: { label: "Warm restaurant", prompt: "warm, gentle restaurant lighting with a softly blurred table in the background" },
} as const;
export type ImageStyle = keyof typeof IMAGE_STYLES;

const GEMINI_IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const STALE_MINUTES = 10;
const MAX_SOURCE_BYTES = 8 * 1024 * 1024;

/** Test mode for local development only: no AI or storage calls, a plain generated image instead */
const FAKE = process.env.AI_IMAGE_FAKE === "1" && process.env.NODE_ENV !== "production";

export function aiImagesConfigured(): boolean {
  return FAKE || Boolean(process.env.GOOGLE_API_KEY);
}

// ---------- Credits (catalog_subscriptions.ai_image_enhancement_*) ----------

const currentMonth = () => new Date().toISOString().slice(0, 7);

export async function getCredits(catalogId: string) {
  const row = (
    await getDb().execute({
      sql: "SELECT ai_image_enhancement_limit AS lim, ai_image_enhancement_used AS used, ai_enhancement_reset_date AS month FROM catalog_subscriptions WHERE catalog_id = ?",
      args: [catalogId],
    })
  ).rows[0];
  const limit = Number(row?.lim || 0);
  const used = row?.month === currentMonth() ? Number(row?.used || 0) : 0;
  return { limit, used, remaining: Math.max(0, limit - used) };
}

/** Take one credit for this month. A single conditional UPDATE, so parallel requests can't overspend. */
async function reserveCredit(catalogId: string): Promise<boolean> {
  const db = getDb();
  const month = currentMonth();
  // First use in a new month starts the count again
  await db.execute({
    sql: `UPDATE catalog_subscriptions SET ai_image_enhancement_used = 0, ai_enhancement_reset_date = ?
          WHERE catalog_id = ? AND (ai_enhancement_reset_date IS NULL OR ai_enhancement_reset_date != ?)`,
    args: [month, catalogId, month],
  });
  const reserved = await db.execute({
    sql: `UPDATE catalog_subscriptions SET ai_image_enhancement_used = COALESCE(ai_image_enhancement_used, 0) + 1
          WHERE catalog_id = ? AND COALESCE(ai_image_enhancement_used, 0) < COALESCE(ai_image_enhancement_limit, 0)`,
    args: [catalogId],
  });
  return reserved.rowsAffected > 0;
}

async function refundCredit(catalogId: string) {
  await getDb().execute({
    sql: `UPDATE catalog_subscriptions SET ai_image_enhancement_used = MAX(0, COALESCE(ai_image_enhancement_used, 0) - 1)
          WHERE catalog_id = ? AND ai_enhancement_reset_date = ?`,
    args: [catalogId, currentMonth()],
  });
}

// ---------- Jobs ----------

export interface ImageJob {
  id: string;
  itemId: string | null;
  kind: ImageJobKind;
  style: ImageStyle;
  status: ImageJobStatus;
  sourceUrl: string | null;
  resultUrl: string | null;
  previousImageUrl: string | null;
  error: string | null;
  creditCharged: boolean;
  createdAt: string;
  decidedAt: string | null;
}

type Row = Record<string, unknown>;

function toJob(row: Row): ImageJob {
  return {
    id: String(row.id),
    itemId: row.item_id ? String(row.item_id) : null,
    kind: row.kind as ImageJobKind,
    style: row.style as ImageStyle,
    status: row.status as ImageJobStatus,
    sourceUrl: (row.source_url as string) || null,
    resultUrl: (row.result_url as string) || null,
    previousImageUrl: (row.previous_image_url as string) || null,
    error: (row.error as string) || null,
    creditCharged: Number(row.credit_charged) === 1,
    createdAt: String(row.created_at),
    decidedAt: (row.decided_at as string) || null,
  };
}

/** Jobs that never finished (server restart, provider hung) are failed and their credit returned */
async function failStaleJobs(catalogId: string) {
  const db = getDb();
  const stale = await db.execute({
    sql: `UPDATE ai_image_jobs
          SET status = 'failed', error = 'This took too long and was stopped. Your credit was returned.', updated_at = datetime('now')
          WHERE catalog_id = ? AND status IN ('queued', 'processing') AND updated_at < datetime('now', ?)
          RETURNING id, credit_charged`,
    args: [catalogId, `-${STALE_MINUTES} minutes`],
  });
  for (const row of stale.rows) {
    if (Number(row.credit_charged) === 1) await settleRefund(catalogId, String(row.id));
  }
}

/** Return a job's credit exactly once */
async function settleRefund(catalogId: string, jobId: string) {
  const cleared = await getDb().execute({
    sql: "UPDATE ai_image_jobs SET credit_charged = 0 WHERE id = ? AND catalog_id = ? AND credit_charged = 1",
    args: [jobId, catalogId],
  });
  if (cleared.rowsAffected > 0) await refundCredit(catalogId);
}

export async function listJobs(catalogId: string, itemId?: string | null, limit = 10): Promise<ImageJob[]> {
  await failStaleJobs(catalogId);
  const result = await getDb().execute({
    sql: `SELECT * FROM ai_image_jobs WHERE catalog_id = ? ${itemId ? "AND item_id = ?" : ""}
          ORDER BY created_at DESC, rowid DESC LIMIT ?`,
    args: itemId ? [catalogId, itemId, limit] : [catalogId, limit],
  });
  return result.rows.map((row) => toJob(row as Row));
}

export async function getJob(catalogId: string, jobId: string): Promise<ImageJob | null> {
  await failStaleJobs(catalogId);
  const row = (await getDb().execute({ sql: "SELECT * FROM ai_image_jobs WHERE id = ? AND catalog_id = ?", args: [jobId, catalogId] })).rows[0];
  return row ? toJob(row as Row) : null;
}

export class JobError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

/**
 * Create a job and charge one credit. The same idempotency key returns the existing job
 * (no second charge). Returns `created: false` in that case.
 */
export async function createJob(input: {
  catalogId: string;
  itemId: string;
  kind: ImageJobKind;
  style: ImageStyle;
  idempotencyKey: string;
  by: string;
}): Promise<{ job: ImageJob; created: boolean }> {
  const db = getDb();
  const { catalogId, itemId, kind, style, idempotencyKey, by } = input;

  const existing = await db.execute({
    sql: "SELECT * FROM ai_image_jobs WHERE catalog_id = ? AND idempotency_key = ?",
    args: [catalogId, idempotencyKey],
  });
  if (existing.rows[0]) return { job: toJob(existing.rows[0] as Row), created: false };

  const item = (
    await db.execute({ sql: "SELECT id, image_url, name_en, name_ar FROM menu_items WHERE id = ? AND catalog_id = ?", args: [itemId, catalogId] })
  ).rows[0];
  if (!item) throw new JobError("This dish no longer exists.", 404);

  let sourceUrl: string | null = null;
  if (kind === "enhance") {
    sourceUrl = (item.image_url as string) || null;
    if (!sourceUrl) throw new JobError("Add a photo of the dish first, then enhance it.", 400);
    // Only photos the owner uploaded can be sent: never fetch arbitrary addresses
    if (!FAKE && !sourceUrl.startsWith(`${getR2PublicUrl()}/`)) {
      throw new JobError("Only photos you uploaded can be enhanced. Upload your own photo of the dish first.", 400);
    }
  }

  await failStaleJobs(catalogId);
  const busy = await db.execute({
    sql: "SELECT id FROM ai_image_jobs WHERE catalog_id = ? AND item_id = ? AND status IN ('queued', 'processing') LIMIT 1",
    args: [catalogId, itemId],
  });
  if (busy.rows.length > 0) throw new JobError("We're already working on an image for this dish.", 409);

  if (!(await reserveCredit(catalogId))) {
    const { limit } = await getCredits(catalogId);
    throw new JobError(
      limit > 0 ? `You've used all ${limit} AI photo credits for this month. They renew on the 1st.` : "Your plan doesn't include AI photos.",
      402
    );
  }

  const id = uuidv4();
  const inserted = await db.execute({
    sql: `INSERT INTO ai_image_jobs (id, catalog_id, item_id, kind, style, status, source_url, credit_charged, idempotency_key, created_by)
          VALUES (?, ?, ?, ?, ?, 'queued', ?, 1, ?, ?)
          ON CONFLICT(catalog_id, idempotency_key) DO NOTHING`,
    args: [id, catalogId, itemId, kind, style, sourceUrl, idempotencyKey, by],
  });
  if (inserted.rowsAffected === 0) {
    // A parallel identical request won the race: give this credit back and return that job
    await refundCredit(catalogId);
    const winner = await db.execute({ sql: "SELECT * FROM ai_image_jobs WHERE catalog_id = ? AND idempotency_key = ?", args: [catalogId, idempotencyKey] });
    return { job: toJob(winner.rows[0] as Row), created: false };
  }
  return { job: (await getJob(catalogId, id))!, created: true };
}

/** Run a queued job. Safe to call twice: only the call that moves it to "processing" does the work. */
export async function runJob(catalogId: string, jobId: string) {
  const db = getDb();
  const claimed = await db.execute({
    sql: `UPDATE ai_image_jobs SET status = 'processing', attempts = attempts + 1, error = NULL, updated_at = datetime('now')
          WHERE id = ? AND catalog_id = ? AND status = 'queued' RETURNING *`,
    args: [jobId, catalogId],
  });
  const row = claimed.rows[0] as Row | undefined;
  if (!row) return;

  try {
    const item = (
      await db.execute({ sql: "SELECT name_en, name_ar, description_en FROM menu_items WHERE id = ? AND catalog_id = ?", args: [String(row.item_id), catalogId] })
    ).rows[0];
    if (!item) throw new Error("This dish was deleted.");

    const image = await generate(row.kind as ImageJobKind, row.style as ImageStyle, row.source_url as string | null, item as Row);
    const resultUrl = await storeResult(catalogId, image);
    await db.execute({
      sql: "UPDATE ai_image_jobs SET status = 'ready', result_url = ?, updated_at = datetime('now') WHERE id = ? AND status = 'processing'",
      args: [resultUrl, jobId],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`AI image job ${jobId} failed:`, message);
    await db.execute({
      sql: "UPDATE ai_image_jobs SET status = 'failed', error = ?, updated_at = datetime('now') WHERE id = ? AND status = 'processing'",
      args: [friendlyError(message), jobId],
    });
    await settleRefund(catalogId, jobId);
  }
}

function friendlyError(message: string): string {
  if (/deleted/.test(message)) return message;
  if (/safety|blocked|policy/i.test(message)) return "The AI service declined this image. Your credit was returned. Try a different photo or style.";
  return "The AI service couldn't make this image. Your credit was returned. You can try again.";
}

/** owner decisions on a job */
export async function decideJob(catalogId: string, jobId: string, action: "approve" | "discard" | "retry" | "revert", by: string) {
  const db = getDb();
  const job = await getJob(catalogId, jobId);
  if (!job) throw new JobError("This image request no longer exists.", 404);

  if (action === "approve") {
    if (job.status !== "ready" || !job.resultUrl) throw new JobError("Only a finished image can be used.", 409);
    const item = (
      await db.execute({ sql: "SELECT image_url, image_is_illustrative FROM menu_items WHERE id = ? AND catalog_id = ?", args: [job.itemId, catalogId] })
    ).rows[0];
    if (!item) throw new JobError("This dish no longer exists.", 404);
    const claimed = await db.execute({
      sql: `UPDATE ai_image_jobs SET status = 'approved', decided_by = ?, decided_at = datetime('now'), updated_at = datetime('now'),
              previous_image_url = ?, previous_is_illustrative = ?
            WHERE id = ? AND catalog_id = ? AND status = 'ready'`,
      args: [by, (item.image_url as string) || null, Number(item.image_is_illustrative) || 0, jobId, catalogId],
    });
    if (claimed.rowsAffected === 0) throw new JobError("This image was already handled.", 409);
    await db.execute({
      sql: "UPDATE menu_items SET image_url = ?, image_is_illustrative = ?, updated_at = datetime('now') WHERE id = ? AND catalog_id = ?",
      args: [job.resultUrl, job.kind === "illustrate" ? 1 : 0, job.itemId, catalogId],
    });
  } else if (action === "discard") {
    const done = await db.execute({
      sql: `UPDATE ai_image_jobs SET status = 'discarded', decided_by = ?, decided_at = datetime('now'), updated_at = datetime('now')
            WHERE id = ? AND catalog_id = ? AND status = 'ready'`,
      args: [by, jobId, catalogId],
    });
    if (done.rowsAffected === 0) throw new JobError("Only a finished image can be discarded.", 409);
  } else if (action === "retry") {
    if (job.status !== "failed") throw new JobError("Only a failed request can be tried again.", 409);
    if (!(await reserveCredit(catalogId))) throw new JobError("You have no AI photo credits left this month.", 402);
    const requeued = await db.execute({
      sql: "UPDATE ai_image_jobs SET status = 'queued', credit_charged = 1, error = NULL, updated_at = datetime('now') WHERE id = ? AND catalog_id = ? AND status = 'failed'",
      args: [jobId, catalogId],
    });
    if (requeued.rowsAffected === 0) {
      await refundCredit(catalogId);
      throw new JobError("This request is already running again.", 409);
    }
  } else if (action === "revert") {
    if (job.status !== "approved") throw new JobError("Only an image in use can be switched back.", 409);
    const row = (await db.execute({ sql: "SELECT previous_image_url, previous_is_illustrative FROM ai_image_jobs WHERE id = ?", args: [jobId] })).rows[0];
    const claimed = await db.execute({
      sql: "UPDATE ai_image_jobs SET status = 'reverted', decided_by = ?, decided_at = datetime('now'), updated_at = datetime('now') WHERE id = ? AND catalog_id = ? AND status = 'approved'",
      args: [by, jobId, catalogId],
    });
    if (claimed.rowsAffected === 0) throw new JobError("This image was already switched back.", 409);
    // Only switch back if the dish still shows this job's image (the owner may have changed it since)
    await db.execute({
      sql: "UPDATE menu_items SET image_url = ?, image_is_illustrative = ?, updated_at = datetime('now') WHERE id = ? AND catalog_id = ? AND image_url = ?",
      args: [(row?.previous_image_url as string) || null, Number(row?.previous_is_illustrative) || 0, job.itemId, catalogId, job.resultUrl],
    });
  }
  return getJob(catalogId, jobId);
}

// ---------- Generation and storage ----------

interface GeneratedImage {
  buffer: Buffer;
  mimeType: string;
}

function enhancePrompt(style: ImageStyle): string {
  return `Edit this photo of a real dish served at a restaurant. It will be shown to guests as the photo of what they will receive.
Improve only the lighting, white balance, sharpness and background: ${IMAGE_STYLES[style].prompt}.
Do not add, remove, move, resize or change any food, ingredient, garnish, sauce, portion, piece count, plate, bowl, glass or container.
Do not complete or extend anything cut off at the edges of the frame; keep the original framing.
Keep the food's real colours and texture. No filters, no text, no logos, no watermark. Return only the edited photo.`;
}

function illustratePrompt(style: ImageStyle, item: Row): string {
  const name = String(item.name_en || item.name_ar || "the dish");
  const description = item.description_en ? `: ${String(item.description_en)}` : "";
  return `Create a realistic, appetising photograph-style image of "${name}"${description}, as a single serving typically presented in a Lebanese restaurant.
Lighting and background: ${IMAGE_STYLES[style].prompt}. Natural three-quarter angle, the dish centred with space around it.
Show only this dish and what is described. No text, no logos, no watermark, no people, no hands.`;
}

async function generate(kind: ImageJobKind, style: ImageStyle, sourceUrl: string | null, item: Row): Promise<GeneratedImage> {
  if (FAKE) {
    await new Promise((resolve) => setTimeout(resolve, Number(process.env.AI_IMAGE_FAKE_DELAY_MS || 1500)));
    if (String(item.name_en || "").includes("[fail]")) throw new Error("fake failure");
    const color = kind === "enhance" ? "#C9A27E" : "#7E9CC9";
    const buffer = await sharp({ create: { width: 64, height: 48, channels: 3, background: color } }).png().toBuffer();
    return { buffer, mimeType: "image/png" };
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_API_KEY is not set");
  const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
    model: GEMINI_IMAGE_MODEL,
    generationConfig: {
      temperature: kind === "enhance" ? 0.2 : 0.7,
      // @ts-expect-error responseModalities is supported by the image model but missing from the SDK types
      responseModalities: ["IMAGE"],
    },
  });

  const parts: Array<string | { inlineData: { mimeType: string; data: string } }> = [];
  if (kind === "enhance") {
    const res = await fetch(sourceUrl!);
    if (!res.ok) throw new Error(`Couldn't load the photo (${res.status})`);
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length > MAX_SOURCE_BYTES) throw new Error("The photo is too large to enhance");
    // Normalise to JPEG so any uploaded format is accepted
    const jpeg = await sharp(bytes).rotate().jpeg({ quality: 90 }).toBuffer();
    parts.push(enhancePrompt(style), { inlineData: { mimeType: "image/jpeg", data: jpeg.toString("base64") } });
  } else {
    parts.push(illustratePrompt(style, item));
  }

  const result = await model.generateContent(parts);
  for (const part of result.response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData?.data) {
      return { buffer: Buffer.from(part.inlineData.data, "base64"), mimeType: part.inlineData.mimeType || "image/png" };
    }
  }
  const reason = result.response.candidates?.[0]?.finishReason || result.response.promptFeedback?.blockReason || "no image returned";
  throw new Error(`AI returned no image: ${reason}`);
}

async function storeResult(catalogId: string, image: GeneratedImage): Promise<string> {
  if (FAKE) return `data:${image.mimeType};base64,${image.buffer.toString("base64")}`;
  // Same size and format rules as uploads: at most 1600px, WebP
  const webp = await sharp(image.buffer).resize(1600, 1600, { fit: "inside", withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
  const url = await uploadBufferToR2(webp, `${catalogId}/ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`, "image/webp");
  await getDb().execute({ sql: "UPDATE catalogs SET current_image_count = current_image_count + 1 WHERE id = ?", args: [catalogId] });
  return url;
}
