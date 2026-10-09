import { NextRequest, NextResponse } from "next/server";
import { parseAIJson, AI_CONSTRAINTS } from "@/lib/ai-utils";
import { requireCatalogAdmin } from "@/lib/auth/catalog-admin-middleware";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit/middleware";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = "llama-3.1-8b-instant";

interface BusinessDetails {
  name: string;
  type: string;
  city: string;
  neighborhood?: string;
  specialty?: string;
  uniqueFeature?: string;
  targetAudience?: string;
}

interface GenerateRequest {
  action: "suggest_keywords" | "generate_content" | "enhance_content" | "generate_seo";
  business: BusinessDetails;
  keywords?: string[];
  currentContent?: {
    en?: string;
    ar?: string;
  };
  aboutContent?: {
    en?: string;
    ar?: string;
  };
  languages?: ContentLang[];
  language?: ContentLang;
}

/** Content is written in Arabic and English only */
type ContentLang = "en" | "ar";
const CONTENT_LANGS: readonly ContentLang[] = ["en", "ar"];
const isContentLang = (value: unknown): value is ContentLang =>
  typeof value === "string" && (CONTENT_LANGS as readonly string[]).includes(value);


async function callGroq(prompt: string, systemPrompt: string): Promise<string> {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2500,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Groq API error:", error);
    throw new Error("AI generation failed");
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
}

export async function POST(request: NextRequest) {
  // Authenticate first so anonymous callers learn nothing about the server's configuration
  const auth = await requireCatalogAdmin(request);
  if (!auth.success) return auth.response;

  if (!GROQ_API_KEY) {
    return NextResponse.json(
      { error: "AI service is not configured on this server." },
      { status: 503 }
    );
  }

  // Each catalog gets its own allowance, wherever its admins are calling from
  const rateLimit = await checkRateLimit(request, RATE_LIMITS.aiGenerate, auth.admin.catalog_id);
  if (!rateLimit.allowed) return rateLimitResponse(RATE_LIMITS.aiGenerate, rateLimit.resetAt);

  try {
    const body: GenerateRequest = await request.json();
    const { action, business, keywords, currentContent, language } = body;

    if (!business?.name || !business?.type) {
      return NextResponse.json(
        { error: "Business name and type are required" },
        { status: 400 }
      );
    }

    if (action === "suggest_keywords") {
      const systemPrompt = `You are an SEO expert for local businesses. Generate search keywords that real customers use on Google to find this type of business.

RULES:
- Return ONLY a valid JSON array
- Each item has "keyword" (string) and "category" (one of: "local", "service", "product", "brand")
- Keywords should be realistic search queries
- Include the actual city name in local keywords
- Mix short-tail and long-tail keywords

Example format:
[{"keyword": "italian restaurant downtown dubai", "category": "local"}]`;
      
      const prompt = `Generate 10 SEO keywords for:
- Business: ${business.name}
- Type: ${business.type}
- City: ${business.city}
${business.neighborhood ? `- Area: ${business.neighborhood}` : ""}
${business.specialty ? `- Specialty: ${business.specialty}` : ""}

Return only the JSON array.`;

      const result = await callGroq(prompt, systemPrompt);
      const parsedKeywords = parseAIJson(result);
      
      if (parsedKeywords && Array.isArray(parsedKeywords)) {
        return NextResponse.json({ keywords: parsedKeywords });
      }
      
      // Smart fallback based on business type
      const fallbackKeywords = [
        { keyword: `best ${business.type} in ${business.city}`, category: "local" },
        { keyword: `${business.type} near me`, category: "local" },
        { keyword: `${business.name} ${business.city}`, category: "brand" },
        { keyword: `top rated ${business.type} ${business.city}`, category: "local" },
        { keyword: `${business.type} delivery ${business.city}`, category: "service" },
        { keyword: `${business.specialty || business.type} ${business.city}`, category: "product" },
      ];
      return NextResponse.json({ keywords: fallbackKeywords });
    }

    if (action === "generate_content") {
      const systemPrompt = `You are a professional SEO copywriter for local businesses. Write compelling "About Us" content.

CRITICAL RULES:
1. NEVER use placeholders like [city], [name], [location], etc. Use the actual values provided.
2. Write 150-200 words per language
3. Be specific - mention the actual city, specialty, and unique features
4. Include a call to action at the end
5. Make it sound authentic, not generic
6. Naturally incorporate the provided keywords

OUTPUT FORMAT:
Return ONLY a valid JSON object with exactly two fields:
{
  "en": "English content here...",
  "ar": "Arabic content here (Modern Standard Arabic)..."
}

${AI_CONSTRAINTS}`;

      const keywordList = keywords?.length ? keywords.slice(0, 5).join(", ") : "";
      
      const prompt = `Write "About Us" content for this business:

BUSINESS DETAILS:
- Name: ${business.name}
- Type: ${business.type}
- City: ${business.city}
${business.neighborhood ? `- Neighborhood: ${business.neighborhood}` : ""}
${business.specialty ? `- Main Specialty: ${business.specialty}` : ""}
${business.uniqueFeature ? `- What Makes Them Special: ${business.uniqueFeature}` : ""}
${business.targetAudience ? `- Target Customers: ${business.targetAudience}` : ""}
${keywordList ? `- Keywords to Include: ${keywordList}` : ""}

Remember: Use the ACTUAL business name "${business.name}" and city "${business.city}" - never use placeholders!

Generate the content in English and Arabic. Return only the JSON object.`;

      const result = await callGroq(prompt, systemPrompt);
      const parsedContent = parseAIJson(result);

      if (parsedContent && typeof parsedContent === 'object') {
        const { en, ar } = parsedContent as Record<string, unknown>;
        return NextResponse.json({ content: { en, ar } });
      }

      throw new Error("Failed to generate or parse AI content");
    }

    if (action === "enhance_content") {
      const targetLang: ContentLang = isContentLang(language) ? language : "en";
      const currentText = currentContent?.[targetLang as keyof typeof currentContent] || "";
      
      if (!currentText || currentText.length < 20) {
        return NextResponse.json(
          { error: "Need existing content to enhance. Write something first or generate with AI." },
          { status: 400 }
        );
      }

      const langName = targetLang === "ar" ? "Arabic" : "English";
      
      const systemPrompt = `You are a professional copywriter. Improve the given business description to be more:
- SEO-friendly (natural keyword placement)
- Engaging and professional
- Specific and authentic (not generic)

RULES:
1. Keep the same language (${langName})
2. Keep similar length (don't make it much longer)
3. Preserve the business name and key details
4. Remove any placeholder text like [city] or [name]
5. Return ONLY the improved text, nothing else

Do not add any explanation or quotes - just the enhanced text.
${AI_CONSTRAINTS}`;

      const keywordList = keywords?.join(", ") || "";
      const prompt = `Improve this ${langName} business description for ${business.name} (${business.type} in ${business.city}):

---
${currentText}
---

${keywordList ? `Try to naturally include these keywords: ${keywordList}` : ""}

Return only the enhanced ${langName} text:`;

      const result = await callGroq(prompt, systemPrompt);
      
      // Clean the result
      let cleaned = result.trim();
      // Remove quotes if wrapped
      if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || 
          (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
        cleaned = cleaned.slice(1, -1);
      }
      // Remove any remaining placeholders
      cleaned = cleaned.replace(/\[[^\]]+\]/g, business.city || "");
      
      return NextResponse.json({ 
        content: { [targetLang]: cleaned }
      });
    }

    // Generate SEO titles and descriptions using AI
    if (action === "generate_seo") {
      const { aboutContent } = body;
      const targetLanguages = (Array.isArray(body.languages) ? body.languages : []).filter(isContentLang);
      
      if (!targetLanguages || targetLanguages.length === 0) {
        return NextResponse.json(
          { error: "No languages specified" },
          { status: 400 }
        );
      }

      // Check if about content exists for at least one language
      const hasContent = targetLanguages.some(lang => 
        aboutContent?.[lang as keyof typeof aboutContent]?.trim()
      );

      if (!hasContent) {
        return NextResponse.json(
          { error: "Please fill in the About content first. AI needs your story to generate optimized SEO." },
          { status: 400 }
        );
      }

      const systemPrompt = `You are an expert SEO specialist. Generate optimized page titles and meta descriptions for a business website.

RULES:
1. Title: 50-60 characters, include business name and location if provided
2. Description: 150-160 characters, compelling summary with call to action
3. Use the About content as your primary source
4. Include relevant keywords naturally
5. NEVER use placeholders like [city] or [name]
6. Make each language version culturally appropriate (not just translated)

OUTPUT FORMAT - Return ONLY a valid JSON object:
{
  "en": { "title": "...", "description": "..." },
  "ar": { "title": "...", "description": "..." }
}

Include only the languages requested. No markdown, no explanation.
${AI_CONSTRAINTS}`;

      const languagesText = targetLanguages.map(l => {
        const langName = l === "ar" ? "Arabic" : "English";
        const content = aboutContent?.[l as keyof typeof aboutContent] || "";
        return `${langName}:
About Content: ${content || "Not provided"}`;
      }).join("\n\n");

      const prompt = `Generate SEO title and meta description for:

Business Name: ${business.name}
Business Type: ${business.type}
City: ${business.city}

ABOUT CONTENT BY LANGUAGE:
${languagesText}

Generate SEO for these languages: ${targetLanguages.join(", ").toUpperCase()}

Return only the JSON object with title and description for each language.`;

      const result = await callGroq(prompt, systemPrompt);
      const seoData = parseAIJson(result);

      if (seoData && typeof seoData === 'object') {
        const seo: Record<string, unknown> = {};
        for (const lang of targetLanguages) seo[lang] = (seoData as Record<string, unknown>)[lang];
        return NextResponse.json({ seo });
      }

      throw new Error("Failed to generate or parse SEO data");
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );

  } catch (error: any) {
    console.error("AI generation error:", error);
    return NextResponse.json(
      { error: "AI generation failed. Please try again." },
      { status: 500 }
    );
  }
}
