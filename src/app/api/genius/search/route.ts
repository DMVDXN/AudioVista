import { NextResponse } from "next/server";
import { isGeniusConfigured, searchGeniusSongs } from "@/lib/genius/client";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!isGeniusConfigured) {
    return NextResponse.json(
      { error: "GENIUS_ACCESS_TOKEN is not set on this server" },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(req.url);
  const artist = searchParams.get("artist")?.trim();
  const track = searchParams.get("track")?.trim();
  const q = searchParams.get("q")?.trim();
  const query = q || [artist, track].filter(Boolean).join(" ");

  if (!query) {
    return NextResponse.json(
      { error: "Missing search query" },
      { status: 400 },
    );
  }

  try {
    const songs = await searchGeniusSongs(query);
    return NextResponse.json({ songs });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Genius search failed",
      },
      { status: 502 },
    );
  }
}

export async function HEAD() {
  return new Response(null, {
    status: isGeniusConfigured ? 200 : 503,
  });
}
