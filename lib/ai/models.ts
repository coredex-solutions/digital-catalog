// Every AI model the app calls, in one place. Providers rename and retire models every few
// months (gemini-2.0-flash was shut down on 2026-06-01, Groq's llama-3.1-8b-instant on
// 2026-08-16), so each one can be swapped in .env.local without a code change.
// Check the providers' deprecation pages before changing a default:
//   https://ai.google.dev/gemini-api/docs/deprecations
//   https://console.groq.com/docs/deprecations
//   https://developers.openai.com/api/docs/deprecations

export const AI_MODELS = {
  /** Reads photographed and PDF menus for import; accuracy matters most here */
  menuReading: process.env.GEMINI_TEXT_MODEL || "gemini-3.8-flash",
  /** AI waiter answers and training questions; fast and inexpensive */
  waiter: process.env.GEMINI_CHAT_MODEL || "gemini-3.5-flash-lite",
  /** "AI photo": enhancing an owner's dish photo or drawing an illustrative one */
  image: process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image",
  /** Groq: writing the About page from the owner's answers */
  writer: process.env.GROQ_TEXT_MODEL || "openai/gpt-oss-20b",
  /** Groq: guests' voice questions to the AI waiter */
  speechToText: process.env.GROQ_STT_MODEL || "whisper-large-v3",
  /** OpenAI: spoken replies when Google Text-to-Speech isn't set up (tts-1 is removed 2027-01-06) */
  textToSpeech: process.env.OPENAI_TTS_MODEL || "tts-1",
} as const;
