/**
 * Speech-to-text for guests' voice questions to the AI waiter
 */

import { AI_MODELS } from "@/lib/ai/models";

const GROQ_API_KEY = process.env.GROQ_API_KEY;

/**
 * Transcribes audio with Groq (AI_MODELS.speechToText)
 */
export async function transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<string> {
  if (!GROQ_API_KEY) throw new Error("Groq API key not configured");

  const formData = new FormData();
  const blob = new Blob([new Uint8Array(audioBuffer)], { type: mimeType });
  formData.append("file", blob, "audio.wav");
  formData.append("model", AI_MODELS.speechToText);
  formData.append("response_format", "json");

  const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Groq Transcribe Error:", error);
    throw new Error("Speech to text failed");
  }

  const data = await response.json();
  return data.text;
}
