import { NextResponse } from "next/server";
import { analyzeLyrics } from "@/lib/nlp/analyze";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text : "";

  if (!text.trim()) {
    return NextResponse.json(
      { error: "No lyrics provided" },
      { status: 400 },
    );
  }
  if (text.length > 20_000) {
    return NextResponse.json(
      { error: "Lyrics too long (max 20,000 chars)" },
      { status: 413 },
    );
  }

  const result = analyzeLyrics(text);
  return NextResponse.json(result);
}
