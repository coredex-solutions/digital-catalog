import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireCatalogAdmin } from "@/lib/auth/catalog-admin-middleware";
import { getR2PublicUrl } from "@/lib/r2/client";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
// Nano Banana (Gemini 2.0) for high-end image generation/editing
const GEMINI_IMAGE_MODEL = "gemini-2.5-flash-image";

const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY || "");

interface EnhanceRequest {
  imageBase64?: string;
  imageUrl?: string;
  mimeType?: string;
  style?: "professional" | "vibrant" | "clean";
  productType?: string;
}

// Check and update AI enhancement limit
async function checkAndUpdateLimit(catalogId: string): Promise<{ allowed: boolean; remaining: number; limit: number; error?: string }> {
  const db = getDb();
  const currentMonth = new Date().toISOString().slice(0, 7);

  try {
    const subscription = await db.execute({
      sql: `SELECT ai_image_enhancement_limit, ai_image_enhancement_used, ai_enhancement_reset_date 
            FROM catalog_subscriptions WHERE catalog_id = ?`,
      args: [catalogId]
    });

    if (!subscription.rows || subscription.rows.length === 0) {
      return { allowed: true, remaining: 10, limit: 10 };
    }

    const sub = subscription.rows[0];
    let limit = (sub.ai_image_enhancement_limit as number) ?? 10;
    let used = (sub.ai_image_enhancement_used as number) ?? 0;
    const resetDate = sub.ai_enhancement_reset_date as string;

    if (resetDate !== currentMonth) {
      await db.execute({
        sql: `UPDATE catalog_subscriptions 
              SET ai_image_enhancement_used = 0, ai_enhancement_reset_date = ?
              WHERE catalog_id = ?`,
        args: [currentMonth, catalogId]
      });
      used = 0;
    }

    if (used >= limit) {
      return {
        allowed: false,
        remaining: 0,
        limit,
        error: `تم استنفاد رصيد التحسين بالذكاء الاصطناعي (${limit}/${limit}). تواصل مع المسؤول لزيادة الرصيد.`
      };
    }

    await db.execute({
      sql: `UPDATE catalog_subscriptions 
            SET ai_image_enhancement_used = ai_image_enhancement_used + 1,
                ai_enhancement_reset_date = COALESCE(ai_enhancement_reset_date, ?)
            WHERE catalog_id = ?`,
      args: [currentMonth, catalogId]
    });

    return { allowed: true, remaining: limit - used - 1, limit };
  } catch (error) {
    console.error("Failed to check AI limit:", error);
    return { allowed: false, remaining: 0, limit: 0, error: "Failed to check AI enhancement limit" };
  }
}

export async function POST(request: NextRequest) {
  if (!GOOGLE_API_KEY) {
    return NextResponse.json(
      { error: "Google API key not configured. Add GOOGLE_API_KEY to your .env file." },
      { status: 500 }
    );
  }

  const auth = await requireCatalogAdmin(request);
  if (!auth.success) return auth.response;
  // Usage is billed to the caller's own catalog, never one named in the request body
  const catalogId = auth.admin.catalog_id;

  try {
    const body: EnhanceRequest = await request.json();
    let { imageBase64, mimeType, style = "professional", productType = "food" } = body;
    const { imageUrl } = body;

    // Fetch Image if URL is provided
    if (!imageBase64 && imageUrl) {
      // Only fetch from our own R2 bucket so the server can't be pointed at arbitrary hosts
      if (!imageUrl.startsWith(`${getR2PublicUrl()}/`)) {
        return NextResponse.json({ error: "Image URL is not allowed" }, { status: 400 });
      }
      try {
        const imageRes = await fetch(imageUrl);
        if (!imageRes.ok) throw new Error(`Failed to fetch: ${imageRes.statusText}`);
        const arrayBuffer = await imageRes.arrayBuffer();
        imageBase64 = Buffer.from(arrayBuffer).toString("base64");
        mimeType = imageRes.headers.get("content-type") || "image/jpeg";
      } catch (fetchError: any) {
        console.error("Failed to fetch image:", fetchError);
        return NextResponse.json({ error: "فشل تحميل الصورة الأصلي" }, { status: 400 });
      }
    }

    if (!imageBase64) {
      return NextResponse.json({ error: "لم يتم تحميل صورة" }, { status: 400 });
    }

    const limitCheck = await checkAndUpdateLimit(catalogId);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: limitCheck.error, remaining: 0, limit: limitCheck.limit },
        { status: 429 }
      );
    }

    // Advanced prompt for Gemini 2.0 Commercial Photography
    const styleGuide = style === "vibrant"
      ? "rich saturated colors, dramatic three-point studio lighting, high contrast"
      : style === "clean"
        ? "soft natural daylight, minimalist high-key aesthetic, clean whites"
        : "balanced professional studio lighting, commercial quality, neutral grading";

    const prompt = `You are a master professional ${productType} photographer.
Task: Re-generate this amateur photo into a luxury commercial studio photograph.

CRITICAL REQUIREMENTS:
1. COMPLETION: If the item is cut off at the edges, you MUST complete it. Show the FULL object (plate, bottle, etc.) perfectly centered.
2. FRAMING: Leave professional breathing space (padding) around the entire item. It must not touch the frame edges.
3. ULTRA-REALISM: Result must look like an 8K high-resolution photograph taken with a medium-format camera (Hasselblad style). No cartoon/illusration textures.
4. LIGHTING: Use high-end ${styleGuide}. Ensure realistic specular highlights and soft contact shadows.
5. PRESERVATION: Keep the ID and core features of the item exactly as seen. Do not hallucinate new ingredients.
6. DEPTH: Use f/1.8 aperture for a creamy, beautiful depth-of-field background blur.

The final output must be just the image.`;

    console.log("Calling Nano Banana (Gemini 2.0) with @google/generative-ai library...");

    // Initialize the model with the correct configuration for multimodal output
    const model = genAI.getGenerativeModel({
      model: GEMINI_IMAGE_MODEL,
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        // @ts-ignore - responseModalities is currently experimental/beta in the library but required for Nano Banana
        responseModalities: ["IMAGE"]
      }
    });

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: mimeType || "image/jpeg",
          data: imageBase64
        }
      }
    ]);

    const candidates = result.response.candidates;
    if (candidates && candidates[0]?.content?.parts) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData) {
          return NextResponse.json({
            success: true,
            enhancedImage: {
              base64: part.inlineData.data,
              mimeType: part.inlineData.mimeType || "image/png"
            },
            remaining: limitCheck.remaining,
            limit: limitCheck.limit
          });
        }
      }
    }

    // Fallback if the image modality wasn't returned
    return NextResponse.json(
      { error: "لم يتم استلام صورة من الذكاء الاصطناعي. قد تكون ميزة Nano Banana غير مفعلة لهذا المفتاح." },
      { status: 500 }
    );

  } catch (error: any) {
    console.error("Gemini library error:", error);
    return NextResponse.json(
      { error: error.message || "فشل تحسين الصورة. حاول مرة أخرى." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireCatalogAdmin(request);
  if (!auth.success) return auth.response;
  const catalogId = auth.admin.catalog_id;

  const db = getDb();
  const currentMonth = new Date().toISOString().slice(0, 7);

  try {
    const subscription = await db.execute({
      sql: `SELECT ai_image_enhancement_limit, ai_image_enhancement_used, ai_enhancement_reset_date 
            FROM catalog_subscriptions WHERE catalog_id = ?`,
      args: [catalogId]
    });

    if (!subscription.rows || subscription.rows.length === 0) {
      return NextResponse.json({ remaining: 10, limit: 10, used: 0 });
    }

    const sub = subscription.rows[0];
    const limit = (sub.ai_image_enhancement_limit as number) ?? 10;
    let used = (sub.ai_image_enhancement_used as number) ?? 0;
    const resetDate = sub.ai_enhancement_reset_date as string;

    if (resetDate !== currentMonth) {
      used = 0;
    }

    return NextResponse.json({
      remaining: Math.max(0, limit - used),
      limit,
      used,
      resetsAt: currentMonth
    });
  } catch (error) {
    console.error("Failed to get AI limit:", error);
    return NextResponse.json({ remaining: 10, limit: 10, used: 0 });
  }
}
