import { NextRequest } from "next/server";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get("text");
  const lang = searchParams.get("lang") || "ar";

  if (!text) {
    return new Response("Text parameter is required", { status: 400 });
  }

  if (!GOOGLE_API_KEY) {
    // Fallback to unofficial if no key (though key exists in .env)
    return fetch(`https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(text)}`);
  }

  // Define male voices for each language
  const voiceMapping: Record<string, { name: string; langCode: string }> = {
    ar: { name: "ar-XA-Wavenet-B", langCode: "ar-XA" }, // Natural Male Arabic
    en: { name: "en-US-Wavenet-D", langCode: "en-US" }, // Natural Male English
    fr: { name: "fr-FR-Wavenet-B", langCode: "fr-FR" }, // Natural Male French
  };

  const selected = voiceMapping[lang] || voiceMapping.en;

  try {
    const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode: selected.langCode,
          name: selected.name,
          ssmlGender: "MALE"
        },
        audioConfig: {
          audioEncoding: "MP3",
          speakingRate: 1.0,
          pitch: -2.0 // Slightly deeper for a more "waiter" feel
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Google TTS API Error:", error);
      // Fallback to translate TTS if API fails/not enabled
      return fetch(`https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(text)}`);
    }

    const data = await response.json();
    const audioBuffer = Buffer.from(data.audioContent, 'base64');

    return new Response(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("TTS Proxy Error:", error);
    return new Response("Failed to fetch TTS", { status: 500 });
  }
}
