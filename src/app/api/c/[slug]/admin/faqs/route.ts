import { NextRequest, NextResponse } from "next/server";
import { requireCatalogAdmin } from "@/lib/auth/catalog-admin-middleware";
import { getCatalogBySlug } from "@/lib/catalog/queries";
import { getDb } from "@/lib/db/client";
import { v4 as uuidv4 } from "uuid";

const MAX_FAQS = 50;
const MAX_QUESTION_LENGTH = 500;
const MAX_ANSWER_LENGTH = 4000;
// French columns stay in the table but are no longer edited
const LANGS = ["ar", "en"] as const;

type FaqInput = Record<`question_${(typeof LANGS)[number]}` | `answer_${(typeof LANGS)[number]}`, string>;

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/** Validate the FAQ list: each entry needs a question and its answer in at least one language */
function parseFaqs(raw: unknown): { faqs: FaqInput[] } | { error: string } {
  if (!Array.isArray(raw)) return { error: "FAQs must be a list" };
  if (raw.length > MAX_FAQS) return { error: `At most ${MAX_FAQS} FAQs are allowed` };

  const faqs: FaqInput[] = [];
  for (const [index, entry] of raw.entries()) {
    const faq = {} as FaqInput;
    for (const lang of LANGS) {
      faq[`question_${lang}`] = text(entry?.[`question_${lang}`], MAX_QUESTION_LENGTH);
      faq[`answer_${lang}`] = text(entry?.[`answer_${lang}`], MAX_ANSWER_LENGTH);
    }
    if (!LANGS.some((lang) => faq[`question_${lang}`] && faq[`answer_${lang}`])) {
      return { error: `FAQ ${index + 1} needs a question and an answer in at least one language` };
    }
    faqs.push(faq);
  }
  return { faqs };
}

// GET: Get FAQs
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  
  const catalog = await getCatalogBySlug(slug);
  if (!catalog) {
    return NextResponse.json({ error: "Catalog not found" }, { status: 404 });
  }

  const auth = await requireCatalogAdmin(request, catalog.id);
  if (!auth.success) return auth.response;

  try {
    const db = getDb();
    const result = await db.execute({
      sql: `
        SELECT * FROM faqs 
        WHERE catalog_id = ? 
        ORDER BY display_order ASC
      `,
      args: [catalog.id],
    });

    return NextResponse.json({ faqs: result.rows });
  } catch (error) {
    console.error("Failed to fetch FAQs:", error);
    return NextResponse.json({ error: "Failed to fetch FAQs" }, { status: 500 });
  }
}

// PUT: Update FAQs
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  
  const catalog = await getCatalogBySlug(slug);
  if (!catalog) {
    return NextResponse.json({ error: "Catalog not found" }, { status: 404 });
  }

  const auth = await requireCatalogAdmin(request, catalog.id);
  if (!auth.success) return auth.response;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = parseFaqs(body?.faqs);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const db = getDb();

    // Delete all and re-insert in one transaction (simplest way to handle reordering and updates)
    await db.batch([
      {
        sql: "DELETE FROM faqs WHERE catalog_id = ?",
        args: [catalog.id],
      },
      ...parsed.faqs.map((faq, index) => ({
        sql: `
          INSERT INTO faqs (
            id, catalog_id, 
            question_ar, question_en, question_fr,
            answer_ar, answer_en, answer_fr,
            display_order, created_at, updated_at
          ) VALUES (?, ?, ?, ?, '', ?, ?, '', ?, datetime('now'), datetime('now'))
        `,
        args: [
          uuidv4(),
          catalog.id,
          faq.question_ar,
          faq.question_en,
          faq.answer_ar,
          faq.answer_en,
          index,
        ],
      })),
    ], "write");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update FAQs:", error);
    return NextResponse.json({ error: "Failed to update FAQs" }, { status: 500 });
  }
}
