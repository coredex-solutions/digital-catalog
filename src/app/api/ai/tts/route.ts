import { NextRequest } from "next/server";
import { checkRateLimit } from "../../../../../lib/ratelimit";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

const OPENAI_VOICE = "onyx";
const GOOGLE_VOICE = "ar-XA-Wavenet-B";

const RATE_LIMIT_REQUESTS = 30;
const RATE_LIMIT_WINDOW = 60000;
const MAX_TEXT_LENGTH = 1000;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get("text");
  const lang = searchParams.get("lang") || "en";

  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (!checkRateLimit(ip, RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW)) {
    return new Response("Too many requests", { status: 429 });
  }

  if (!text || text.length > MAX_TEXT_LENGTH) {
    return new Response("Invalid text", { status: 400 });
  }

  const referer = request.headers.get("referer");
  if (process.env.NODE_ENV === "production" && referer && !referer.includes(request.headers.get("host") || "")) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const cleanText = text.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "").replace(/[^\w\s\u0600-\u06FF,.!?]/g, "");

    const ttsResult = await tryUnlimitedHack(cleanText, lang);
    if (ttsResult) return ttsResult;

    if (GOOGLE_API_KEY) {
      const googleRes = await tryGoogleTTS(text, lang);
      if (googleRes) return googleRes;
    }

    if (OPENAI_API_KEY) {
      const openaiRes = await tryOpenAITTS(text);
      if (openaiRes) return openaiRes;
    }

    return new Response("TTS Failed", { status: 500 });
  } catch (error) {
    console.error("TTS Proxy Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

async function tryUnlimitedHack(text: string, lang: string) {
  const cleanForBing = text.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "").replace(/ـ/g, "");

  const voices: Record<string, string[]> = {
    ar: ["ar-SA-HamedNeural", "ar-SA-NaayfNeural", "ar-JO-TaimNeural", "ar-EG-ShakirNeural"],
    en: ["en-US-AndrewNeural", "en-US-BrianNeural"],
    fr: ["fr-FR-HenriNeural", "fr-FR-AlainNeural"]
  };

  const selectedVoices = voices[lang] || voices.en;
  const chunks = splitText(cleanForBing, 180);
  const audioChunks: Buffer[] = [];

  for (const voice of selectedVoices) {
    try {
      audioChunks.length = 0;
      for (const chunk of chunks) {
        const url = `https://www.bing.com/tfettts?is_print_tts=1&locale=${lang === 'ar' ? 'ar-SA' : lang === 'fr' ? 'fr-FR' : 'en-US'}`;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://www.bing.com/translator"
          },
          body: new URLSearchParams({
            "ssml": `<speak version='1.0' xml:lang='${lang}'><voice name='${voice}'>${chunk}</voice></speak>`
          })
        });

        if (res.ok) {
          const buffer = Buffer.from(await res.arrayBuffer());
          if (buffer.byteLength > 500) {
            audioChunks.push(buffer);
          } else {
            throw new Error("Small buffer");
          }
        } else {
          throw new Error("Bing API error");
        }
      }

      return new Response(Buffer.concat(audioChunks), {
        headers: { "Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=3600" }
      });
    } catch (e) {
      continue;
    }
  }
  return null;
}

function splitText(text: string, maxLength: number): string[] {
  const chunks: string[] = [];
  let current = "";
  const sentences = text.split(/([.!?]+)/);

  for (const part of sentences) {
    if ((current + part).length > maxLength) {
      if (current) chunks.push(current.trim());
      current = part;
    } else {
      current += part;
    }
  }
  if (current) chunks.push(current.trim());
  return chunks;
}

async function tryGoogleTTS(text: string, lang: string) {
  try {
    const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: lang, name: GOOGLE_VOICE },
        audioConfig: { audioEncoding: "MP3" }
      })
    });
    const data = await res.json();
    if (data.audioContent) {
      return new Response(Buffer.from(data.audioContent, "base64"), {
        headers: { "Content-Type": "audio/mpeg" }
      });
    }
  } catch (e) {
    return null;
  }
}

async function tryOpenAITTS(text: string) {
  try {
    const res = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "tts-1",
        voice: OPENAI_VOICE,
        input: text
      })
    });
    if (res.ok) {
      return new Response(await res.arrayBuffer(), {
        headers: { "Content-Type": "audio/mpeg" }
      });
    }
  } catch (e) {
    return null;
  }
}
