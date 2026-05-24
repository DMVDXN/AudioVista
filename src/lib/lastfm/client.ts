import "server-only";
import type { Track } from "@/types/dataset";

const BASE = "https://ws.audioscrobbler.com/2.0/";

type LfmTopTracksResponse = {
  toptracks?: {
    track: {
      name: string;
      playcount: string;
      artist: { name: string };
    }[];
  };
};

type LfmTopArtistsResponse = {
  topartists?: {
    artist: { name: string; playcount: string }[];
  };
};

async function api<T>(params: Record<string, string>): Promise<T | null> {
  const key = process.env.LASTFM_API_KEY;
  if (!key) return null;
  const search = new URLSearchParams({
    api_key: key,
    format: "json",
    ...params,
  });
  const res = await fetch(`${BASE}?${search}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 300 },
  });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

export async function fetchLastfmTopTracks(
  username: string,
  period: "7day" | "1month" | "3month" | "6month" | "12month" | "overall" = "6month",
): Promise<Track[]> {
  const [topTracks, topArtists] = await Promise.all([
    api<LfmTopTracksResponse>({
      method: "user.gettoptracks",
      user: username,
      period,
      limit: "50",
    }),
    api<LfmTopArtistsResponse>({
      method: "user.gettopartists",
      user: username,
      period,
      limit: "50",
    }),
  ]);

  if (!topTracks?.toptracks?.track) return [];

  const artistPlaycount = new Map<string, number>();
  for (const a of topArtists?.topartists?.artist ?? []) {
    artistPlaycount.set(a.name, Number(a.playcount));
  }

  return topTracks.toptracks.track.map((t, i) => ({
    id: String(i + 1),
    name: t.name,
    artist: t.artist.name,
    popularity: Math.min(
      100,
      Math.round((Number(t.playcount) / Math.max(1, artistPlaycount.get(t.artist.name) ?? 1)) * 100),
    ),
  }));
}

export const isLastfmConfigured = Boolean(process.env.LASTFM_API_KEY);
