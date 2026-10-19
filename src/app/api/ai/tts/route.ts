import { NextRequest } from "next/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit/middleware";
import { getAiWaiterCatalog } from "@/lib/catalog/ai-access";

// Spoken replies for the AI waiter, from official paid providers only (Google Cloud
// Text-to-Speech, then OpenAI). When neither is configured, or the restaurant doesn't run the
// AI waiter, this answers 503 and the browser reads the reply with the phone's own voice
// (AIWaiterBubble falls back automatically).
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GOOGLE_TTS_API_KEY = process.env.GOOGLE_TTS_API_KEY || process.env.GOOGLE_API_KEY;

const GOOGLE_VOICES: Record<string, { languageCode: string; name: string }> = {
  ar: { languageCode: "ar-XA", name: "ar-XA-Wavenet-B" },
  en: { languageCode: "en-US", name: "en-US-Wavenet-D" },
};
const OPENAI_VOICE = "onyx";

const MAX_TEXT_LENGTH = 1000;
const LANGUAGES = ["ar", "en"];

const audio = (body: ArrayBuffer | Buffer) =>
  new Response(new Uint8Array(body), {
    // The same sentence always sounds the same, so the browser may reuse it
    headers: { "Content-Type": "audio/mpeg", "Cache-Control": "private, max-age=3600" },
  });

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get("text");
  const lang = searchParams.get("lang") || "en";
  const slug = searchParams.get("slug");

  const rateLimit = await checkRateLimit(request, RATE_LIMITS.tts);
  if (!rateLimit.allowed) {
    return new Response("Too many requests", { status: 429 });
  }

  if (!text || text.length > MAX_TEXT_LENGTH) {
    return new Response("Invalid text", { status: 400 });
  }

  if (!LANGUAGES.includes(lang)) {
    return new Response("Invalid language", { status: 400 });
  }

  // Speech is only served for a live catalog's menu that runs the AI waiter
  const catalog = slug ? await getAiWaiterCatalog(slug) : null;
  if (!catalog) {
    return new Response("Catalog not found", { status: 404 });
  }
  if (!catalog.aiWaiterEnabled || !catalog.subscriptionLive) {
    return new Response("Voice not available", { status: 503 });
  }

  const referer = request.headers.get("referer");
  if (process.env.NODE_ENV === "production" && referer && !referer.includes(request.headers.get("host") || "")) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    if (GOOGLE_TTS_API_KEY) {
      const result = await tryGoogleTTS(text, lang);
      if (result) return result;
    }
    if (OPENAI_API_KEY) {
      const result = await tryOpenAITTS(text);
      if (result) return result;
    }
    // Nothing configured or every provider failed: the browser's own voice takes over
    return new Response("Voice not available", { status: 503 });
  } catch (error) {
    console.error("TTS error:", error);
    return new Response("Voice not available", { status: 503 });
  }
}

async function tryGoogleTTS(text: string, lang: string) {
  try {
    const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { text },
        voice: GOOGLE_VOICES[lang] || GOOGLE_VOICES.en,
        audioConfig: { audioEncoding: "MP3" },
      }),
    });
    const data = await res.json();
    if (data.audioContent) return audio(Buffer.from(data.audioContent, "base64"));
    console.error("Google TTS returned no audio:", data.error?.message || res.status);
  } catch (error) {
    console.error("Google TTS error:", error);
  }
  return null;
}

async function tryOpenAITTS(text: string) {
  try {
    const res = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: "tts-1", voice: OPENAI_VOICE, input: text }),
    });
    if (res.ok) return audio(await res.arrayBuffer());
    console.error("OpenAI TTS error:", res.status);
  } catch (error) {
    console.error("OpenAI TTS error:", error);
  }
  return null;
}
