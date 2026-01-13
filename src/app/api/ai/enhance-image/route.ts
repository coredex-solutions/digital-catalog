import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
// Nano Banana model for image generation/editing
const GEMINI_IMAGE_MODEL = "gemini-2.0-flash";

interface EnhanceRequest {
  imageBase64?: string;
  imageUrl?: string;
  mimeType?: string;
  style?: "professional" | "studio" | "clean" | "vibrant";
  productType?: string;
  catalogId: string;
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
    return { allowed: true, remaining: 10, limit: 10 };
  }
}

export async function POST(request: NextRequest) {
  if (!GOOGLE_API_KEY) {
    return NextResponse.json(
      { error: "Google API key not configured. Add GOOGLE_API_KEY to your .env file." },
      { status: 500 }
    );
  }

  try {
    const body: EnhanceRequest = await request.json();
    let { imageBase64, mimeType, style = "professional", productType = "food", catalogId } = body;
    const { imageUrl } = body;

    // If URL provided, fetch server-side
    if (!imageBase64 && imageUrl) {
      try {
        console.log("Fetching image from URL:", imageUrl);
        const imageRes = await fetch(imageUrl);
        if (!imageRes.ok) throw new Error(`Failed to fetch: ${imageRes.statusText}`);
        const arrayBuffer = await imageRes.arrayBuffer();
        imageBase64 = Buffer.from(arrayBuffer).toString("base64");
        mimeType = imageRes.headers.get("content-type") || "image/jpeg";
        console.log("Image fetched successfully, type:", mimeType);
      } catch (fetchError: any) {
        console.error("Failed to fetch image:", fetchError);
        return NextResponse.json(
          { error: "فشل تحميل الصورة. تأكد من أن الرابط صحيح." },
          { status: 400 }
        );
      }
    }

    if (!imageBase64) {
      return NextResponse.json({ error: "لم يتم تحميل صورة" }, { status: 400 });
    }

    if (!catalogId) {
      return NextResponse.json({ error: "Catalog ID is required" }, { status: 400 });
    }

    const limitCheck = await checkAndUpdateLimit(catalogId);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: limitCheck.error, remaining: 0, limit: limitCheck.limit },
        { status: 429 }
      );
    }

    // Build prompt - balance between preservation and enhancement
    const styleGuide = style === "vibrant" 
      ? "rich saturated colors, dramatic lighting, high contrast" 
      : style === "clean" 
        ? "soft natural lighting, minimal shadows, clean aesthetic" 
        : "professional studio lighting, balanced colors, commercial quality";

    const prompt = `Transform this ${productType} photo into a professional ${productType === "food" ? "food photography" : "product photography"} shot.

KEEP: The exact same ${productType === "food" ? "dish, ingredients, and plating" : "product and its features"}
CHANGE: Everything else to make it look professional

Improvements to make:
- Replace the background with a clean, professional ${productType === "food" ? "restaurant/studio" : "studio"} setting
- Add professional ${styleGuide}
- Make it look like it was shot by a professional photographer with a high-end camera
- Enhance the ${productType === "food" ? "food to look more appetizing and delicious" : "product to look premium and desirable"}
- Add subtle depth of field (blur background slightly)
- Make colors more ${style === "vibrant" ? "vibrant and rich" : "balanced and appealing"}

The final image should look like a ${productType === "food" ? "restaurant menu photo or food advertisement" : "catalog or advertisement photo"}.`;

    console.log("Calling Nano Banana API with model:", GEMINI_IMAGE_MODEL);

    // Call Nano Banana (Gemini) API for image generation/editing
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${GEMINI_IMAGE_MODEL}:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                },
                {
                  inlineData: {
                    mimeType: mimeType || "image/jpeg",
                    data: imageBase64
                  }
                }
              ]
            }
          ],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"]
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Nano Banana API error:", errorText);
      
      // Parse error for better message
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message) {
          return NextResponse.json(
            { error: `خطأ في الذكاء الاصطناعي: ${errorJson.error.message}` },
            { status: 400 }
          );
        }
      } catch {}
      
      return NextResponse.json(
        { error: "فشل تحسين الصورة. حاول مرة أخرى." },
        { status: 500 }
      );
    }

    const result = await response.json();
    console.log("Nano Banana response received");

    // Extract the generated image from the response
    const candidates = result.candidates;
    if (candidates && candidates[0]?.content?.parts) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData) {
          console.log("Enhanced image received successfully");
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

    // If no image was generated
    console.log("No image in response:", JSON.stringify(result).slice(0, 500));
    return NextResponse.json(
      { error: "لم يتمكن الذكاء الاصطناعي من تحسين الصورة. جرب صورة مختلفة أو نمط مختلف." },
      { status: 400 }
    );

  } catch (error: any) {
    console.error("Image enhancement error:", error);
    return NextResponse.json(
      { error: error.message || "فشل تحسين الصورة. حاول مرة أخرى." },
      { status: 500 }
    );
  }
}

// GET endpoint to check remaining limit
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const catalogId = searchParams.get("catalogId");

  if (!catalogId) {
    return NextResponse.json({ error: "Catalog ID required" }, { status: 400 });
  }

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
