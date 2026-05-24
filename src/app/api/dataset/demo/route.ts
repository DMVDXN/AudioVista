import { NextResponse } from "next/server";
import { loadDemoTracks } from "@/lib/dataset/loader";

export const runtime = "nodejs";

export async function GET() {
  const tracks = await loadDemoTracks();
  return NextResponse.json({ tracks });
}
