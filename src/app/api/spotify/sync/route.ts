import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isSpotifyConfigured } from "@/lib/spotify/auth";
import { fetchSpotifyLibrary, type SpotifySyncMode } from "@/lib/spotify/sync";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!isSpotifyConfigured) {
    return NextResponse.json(
      { error: "Spotify is not configured on this server" },
      { status: 503 },
    );
  }

  const session = await getServerSession(authOptions);
  const accessToken = (session as { accessToken?: string } | null)?.accessToken;
  if (!accessToken) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const mode = (searchParams.get("mode") ??
    searchParams.get("range") ??
    "medium_term") as SpotifySyncMode;

  const result = await fetchSpotifyLibrary(accessToken, mode);
  return NextResponse.json(result);
}
