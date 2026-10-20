import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireCatalogAdmin } from "@/lib/auth/catalog-admin-middleware";
import { getCatalogBySlug } from "@/lib/catalog/queries";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit/middleware";
import { categoriesFromExtraction, IMPORT_LIMITS } from "@/lib/catalog/import";
import { AI_MODELS } from "@/lib/ai/models";

// Reads dishes from photos or a PDF of a printed menu. Nothing is saved here: the dashboard shows
// the result for the owner to check and edit, and only then sends it to /import.
// Model: AI_MODELS.menuReading (GEMINI_TEXT_MODEL). AI_IMPORT_FAKE=1 returns a sample menu
// outside production, for local testing without a key.

const FAKE = process.env.NODE_ENV !== "production" && process.env.AI_IMPORT_FAKE === "1";
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "application/pdf"];

const PROMPT = `You read photos or PDFs of restaurant and café menus and copy the dishes into JSON.

Return only this JSON shape:
{"categories":[{"name_en":"","name_ar":"","dishes":[{"name_en":"","name_ar":"","description_en":"","description_ar":"","price_text":"","options":[{"name_en":"","name_ar":"","price_text":""}]}]}]}

Rules:
- Copy text exactly as printed. Do not translate, invent, complete or correct anything.
- Arabic-script text goes in the *_ar fields. Latin-script text (English or French) goes in the *_en fields. If something is printed in only one language, leave the other field empty.
- price_text is the price exactly as printed, with any currency sign or word (for example "$4", "4.50", "350,000 L.L.", "٣٥٠ ألف"). Leave it empty when no price is printed.
- When a dish lists sizes or variations with their own prices (small/large, half/full), put each in options with its own price_text.
- Use the menu's section headings as categories, in the printed order. Dishes before any heading go in a category with empty names.
- Do not add allergens, calories, dietary labels or ingredients that are not printed.
- Leave out the restaurant's name, address, phone numbers, opening hours, slogans and decorative text.
- If the files are not a menu, return {"categories":[]}.`;

const SAMPLE = {
  categories: [
    {
      name_en: "Cold mezze",
      name_ar: "مازة باردة",
      dishes: [
        { name_en: "Hummus", name_ar: "حمص", description_en: "Chickpeas, tahini, lemon", description_ar: "", price_text: "$4", options: [] },
        { name_en: "Moutabal", name_ar: "متبل", description_en: "", description_ar: "", price_text: "$4.5", options: [] },
      ],
    },
    {
      name_en: "",
      name_ar: "مناقيش",
      dishes: [
        { name_en: "", name_ar: "منقوشة زعتر", description_en: "", description_ar: "", price_text: "150,000 ل.ل.", options: [] },
        { name_en: "Cheese", name_ar: "جبنة", description_en: "", description_ar: "", price_text: "", options: [{ name_en: "Small", name_ar: "صغير", price_text: "200,000 L.L." }, { name_en: "Large", name_ar: "كبير", price_text: "350,000 L.L." }] },
      ],
    },
  ],
};

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const catalog = await getCatalogBySlug(slug);
  if (!catalog) return NextResponse.json({ error: "Catalog not found" }, { status: 404 });

  const auth = await requireCatalogAdmin(request, catalog.id);
  if (!auth.success) return auth.response;

  if (!FAKE && !process.env.GOOGLE_API_KEY) {
    return NextResponse.json({ error: "Reading menus with AI isn't set up on this server yet." }, { status: 503 });
  }

  const limit = await checkRateLimit(request, RATE_LIMITS.menuRead, catalog.id);
  if (!limit.allowed) return rateLimitResponse(RATE_LIMITS.menuRead, limit.resetAt);

  const form = await request.formData().catch(() => null);
  const files = (form?.getAll("files") ?? []).filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return NextResponse.json({ error: "Choose a photo or PDF of your menu" }, { status: 400 });
  const total = files.reduce((sum, f) => sum + f.size, 0);
  if (files.length > IMPORT_LIMITS.files || total > IMPORT_LIMITS.totalBytes || files.some((f) => f.size > IMPORT_LIMITS.fileBytes)) {
    return NextResponse.json({ error: "These files are too large. Use up to 5 photos or one PDF, 9 MB in total." }, { status: 413 });
  }
  if (files.some((f) => !TYPES.includes(f.type))) {
    return NextResponse.json({ error: "Use photos (JPEG, PNG, WebP or HEIC) or a PDF." }, { status: 400 });
  }

  let data: unknown;
  if (FAKE) {
    data = SAMPLE;
  } else {
    try {
      const model = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!).getGenerativeModel({
        model: AI_MODELS.menuReading,
        generationConfig: { responseMimeType: "application/json", temperature: 0 },
      });
      const parts = [
        PROMPT,
        ...(await Promise.all(
          files.map(async (f) => ({ inlineData: { mimeType: f.type, data: Buffer.from(await f.arrayBuffer()).toString("base64") } }))
        )),
      ];
      const result = await model.generateContent(parts);
      data = JSON.parse(result.response.text());
    } catch (error) {
      console.error("Menu read failed:", error);
      return NextResponse.json({ error: "We couldn't read this menu. Try again with a clearer photo, or use a spreadsheet." }, { status: 502 });
    }
  }

  // Same cleaning the dashboard applies, only to check that something usable came back
  if (categoriesFromExtraction(data, "USD").length === 0) {
    return NextResponse.json({ error: "We couldn't find any dishes in these files. Try a clearer photo, or use a spreadsheet." }, { status: 422 });
  }
  return NextResponse.json({ menu: data });
}
