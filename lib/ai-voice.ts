/**
 * AI Voice Utility functions for Speech-to-Text and Text-to-Speech
 */

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Transcribes audio using Groq Whisper-Large-v3
 */
export async function transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<string> {
  if (!GROQ_API_KEY) throw new Error("Groq API key not configured");

  const formData = new FormData();
  const blob = new Blob([new Uint8Array(audioBuffer)], { type: mimeType });
  formData.append("file", blob, "audio.wav");
  formData.append("model", "whisper-large-v3");
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

/**
 * Converts text to speech using OpenAI TTS-1
 */
export async function synthesizeSpeech(text: string): Promise<Buffer> {
  if (!OPENAI_API_KEY) throw new Error("OpenAI API key not configured");

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "tts-1",
      voice: "alloy", // alloy, echo, fable, onyx, nova, shimmer
      input: text,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("OpenAI TTS Error:", error);
    throw new Error("Text to speech failed");
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
