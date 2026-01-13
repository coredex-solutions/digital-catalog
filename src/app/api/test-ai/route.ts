import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
  
  if (!GOOGLE_API_KEY) {
    return NextResponse.json({ error: "No API key" });
  }

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${GOOGLE_API_KEY}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}
