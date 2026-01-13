import { NextRequest, NextResponse } from "next/server";
import { synthesizeSpeech } from "@/lib/ai-voice";

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const audioBuffer = await synthesizeSpeech(text);

    return new NextResponse(new Uint8Array(audioBuffer), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error("TTS API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to synthesize speech" },
      { status: 500 }
    );
  }
}
