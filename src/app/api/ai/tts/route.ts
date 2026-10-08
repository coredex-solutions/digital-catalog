import { NextRequest } from "next/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit/middleware";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

const OPENAI_VOICE = "onyx";
const GOOGLE_VOICE = "ar-XA-Wavenet-B";

const MAX_TEXT_LENGTH = 1000;

async function tryStreamElementsTTS(text: string, lang: string) {
  try {
    const voiceMap: Record<string, string> = {
      ar: "Maged", // Maged is a high-quality Arabic voice
      en: "Brian",
      fr: "Mathieu"
    };
    const voice = voiceMap[lang] || "Brian";
    const url = `https://api.streamelements.com/static/savers/voice?voice=${voice}&text=${encodeURIComponent(text)}`;

    const res = await fetch(url);
    if (res.ok) {
      return new Response(await res.arrayBuffer(), {
        headers: { "Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=3600" }
      });
    }
  } catch (e) {
    console.error("StreamElements TTS Error:", e);
  }
  return null;
}

async function tryGoogleTranslateHack(text: string, lang: string) {
  try {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    if (res.ok) {
      return new Response(await res.arrayBuffer(), {
        headers: { "Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=3600" }
      });
    }
  } catch (e) {
    console.error("GoogleTranslate Hack Error:", e);
  }
  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get("text");
  const lang = searchParams.get("lang") || "en";

  const rateLimit = await checkRateLimit(request, RATE_LIMITS.tts);
  if (!rateLimit.allowed) {
    return new Response("Too many requests", { status: 429 });
  }

  if (!text || text.length > MAX_TEXT_LENGTH) {
    return new Response("Invalid text", { status: 400 });
  }

  const referer = request.headers.get("referer");
  if (process.env.NODE_ENV === "production" && referer && !referer.includes(request.headers.get("host") || "")) {
    return new Response("Forbidden", { status: 403 });
  }

  // Clean text for generic hacks
  const cleanText = text.replace(/[^\w\s\u0600-\u06FF,.!?]/g, "").trim();

  try {
    // 1. Bing Hack (High Quality Neural)
    const bingRes = await tryUnlimitedHack(cleanText, lang);
    if (bingRes) return bingRes;

    // 2. StreamElements (Robust)
    const seRes = await tryStreamElementsTTS(cleanText, lang);
    if (seRes) return seRes;

    // 3. Google Translate Legend (Last Resort Hack)
    const gtRes = await tryGoogleTranslateHack(cleanText, lang);
    if (gtRes) return gtRes;

    // 4. Paid Providers
    if (GOOGLE_API_KEY) {
      const gRes = await tryGoogleTTS(text, lang);
      if (gRes) return gRes;
    }

    if (OPENAI_API_KEY) {
      const oRes = await tryOpenAITTS(text);
      if (oRes) return oRes;
    }

    console.error("All TTS Providers failed for text:", text.substring(0, 50));
    return new Response("TTS Failed", { status: 500 });
  } catch (error) {
    console.error("Global TTS Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

async function tryUnlimitedHack(text: string, lang: string) {
  const voices: Record<string, string[]> = {
    ar: ["ar-SA-HamedNeural", "ar-SA-NaayfNeural", "ar-EG-ShakirNeural"],
    en: ["en-US-AndrewNeural", "en-US-BrianNeural"],
    fr: ["fr-FR-HenriNeural"]
  };

  const selectedVoices = voices[lang] || voices.en;
  const chunks = splitText(text, 150);

  for (const voice of selectedVoices) {
    try {
      const audioChunks: Buffer[] = [];
      for (const chunk of chunks) {
        const url = `https://www.bing.com/tfettts?is_print_tts=1&locale=${lang === 'ar' ? 'ar-SA' : 'en-US'}`;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          },
          body: new URLSearchParams({
            "ssml": `<speak version='1.0' xml:lang='${lang}'><voice name='${voice}'>${chunk}</voice></speak>`
          })
        });

        if (res.ok) {
          const buffer = Buffer.from(await res.arrayBuffer());
          if (buffer.length > 200) audioChunks.push(buffer);
        }
      }
      if (audioChunks.length > 0) {
        return new Response(Buffer.concat(audioChunks), {
          headers: { "Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=3600" }
        });
      }
    } catch (e) { continue; }
  }
  return null;
}

function splitText(text: string, maxLength: number): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = start + maxLength;
    if (end < text.length) {
      const lastSpace = text.lastIndexOf(" ", end);
      if (lastSpace > start) end = lastSpace;
    }
    chunks.push(text.substring(start, end).trim());
    start = end;
  }
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
  } catch (e) { return null; }
}

async function tryOpenAITTS(text: string) {
  try {
    const res = await fetch("https://api.openai.com/v1/audio/speech", {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice: OPENAI_VOICE,
        input: text,
      }),
    });
    if (res.ok) {
      return new Response(await res.arrayBuffer(), {
        headers: { "Content-Type": "audio/mpeg" }
      });
    }
  } catch (e) { return null; }
}
