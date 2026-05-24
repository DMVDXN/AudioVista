import { NextResponse } from "next/server";
import { fetchLastfmTopTracks, isLastfmConfigured } from "@/lib/lastfm/client";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!isLastfmConfigured) {
    return NextResponse.json(
      { error: "LASTFM_API_KEY is not set on this server" },
      { status: 503 },
    );
  }
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username")?.trim();
  const period = searchParams.get("period") ?? "6month";

  if (!username) {
    return NextResponse.json({ error: "Missing username" }, { status: 400 });
  }

  const tracks = await fetchLastfmTopTracks(
    username,
    period as "7day" | "1month" | "3month" | "6month" | "12month" | "overall",
  );

  if (!tracks.length) {
    return NextResponse.json(
      { error: "No tracks found (check username and period)" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    tracks,
    fileName: `lastfm-${username}-${period}.json`,
  });
}

export async function HEAD() {
  return new Response(null, {
    status: isLastfmConfigured ? 200 : 503,
  });
}
