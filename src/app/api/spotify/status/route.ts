import { NextResponse } from "next/server";
import { isSpotifyConfigured } from "@/lib/spotify/auth";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ configured: isSpotifyConfigured });
}
