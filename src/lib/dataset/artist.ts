import type { Track, AudioFeatures } from "@/types/dataset";
import { avgFeatures } from "@/lib/dataset/taste";

export type ArtistSummary = {
  name: string;
  slug: string;
  trackCount: number;
  albumCount: number;
  avgPopularity: number;
  topGenre: string | null;
  firstYear?: number;
  lastYear?: number;
};

export type ArtistDetail = ArtistSummary & {
  tracks: Track[];
  albums: { name: string; year?: number; tracks: number; avgPopularity: number }[];
  genres: { name: string; count: number }[];
  features: AudioFeatures;
  topTrack: Track | null;
  collaborators: { name: string; collabs: number }[];
};

export function artistSlug(name: string): string {
  return encodeURIComponent(name.trim().toLowerCase().replace(/\s+/g, "-"));
}

function deslug(slug: string): string {
  return decodeURIComponent(slug).replace(/-/g, " ").trim();
}

function tracksByArtist(tracks: Track[], name: string): Track[] {
  const needle = name.toLowerCase();
  return tracks.filter(
    (t) =>
      t.artist.toLowerCase() === needle ||
      t.allArtists?.some((a) => a.toLowerCase() === needle),
  );
}

export function listArtists(tracks: Track[]): ArtistSummary[] {
  const map = new Map<string, Track[]>();
  for (const t of tracks) {
    const artists = t.allArtists?.length ? t.allArtists : [t.artist];
    for (const a of artists) {
      const key = a.trim().toLowerCase();
      if (!key) continue;
      const list = map.get(key) ?? [];
      list.push(t);
      map.set(key, list);
    }
  }

  return Array.from(map.entries())
    .map(([key, list]): ArtistSummary => summarize(list, key))
    .sort((a, b) => b.trackCount - a.trackCount || b.avgPopularity - a.avgPopularity);
}

function canonicalName(list: Track[], key: string): string {
  for (const t of list) {
    const candidates = [t.artist, ...(t.allArtists ?? [])];
    const match = candidates.find((a) => a.trim().toLowerCase() === key);
    if (match) return match.trim();
  }
  return key;
}

function summarize(list: Track[], key: string): ArtistSummary {
  const name = canonicalName(list, key);
  const albums = new Set(list.map((t) => t.album).filter(Boolean));
  const popValues = list
    .map((t) => t.popularity)
    .filter((p): p is number => typeof p === "number");
  const years = list
    .map((t) => t.year)
    .filter((y): y is number => typeof y === "number");
  const genreCounts = new Map<string, number>();
  for (const t of list) {
    if (t.genre) genreCounts.set(t.genre, (genreCounts.get(t.genre) ?? 0) + 1);
  }
  const topGenre =
    [...genreCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return {
    name,
    slug: artistSlug(name),
    trackCount: list.length,
    albumCount: albums.size,
    avgPopularity: popValues.length
      ? Math.round(popValues.reduce((a, b) => a + b, 0) / popValues.length)
      : 0,
    topGenre,
    firstYear: years.length ? Math.min(...years) : undefined,
    lastYear: years.length ? Math.max(...years) : undefined,
  };
}

export function findArtist(
  tracks: Track[],
  slugOrName: string,
): ArtistDetail | null {
  const name = deslug(slugOrName);
  const key = name.toLowerCase();
  const list = tracksByArtist(tracks, name);
  if (!list.length) return null;

  const summary = summarize(list, key);

  const albumMap = new Map<
    string,
    { name: string; year?: number; tracks: number; popSum: number }
  >();
  for (const t of list) {
    const key = t.album ?? "Unknown";
    const entry =
      albumMap.get(key) ??
      ({ name: key, year: t.year, tracks: 0, popSum: 0 } as {
        name: string;
        year?: number;
        tracks: number;
        popSum: number;
      });
    entry.tracks += 1;
    entry.popSum += t.popularity ?? 0;
    if (!entry.year && t.year) entry.year = t.year;
    albumMap.set(key, entry);
  }

  const albums = Array.from(albumMap.values())
    .map((a) => ({
      name: a.name,
      year: a.year,
      tracks: a.tracks,
      avgPopularity: a.tracks ? Math.round(a.popSum / a.tracks) : 0,
    }))
    .sort((a, b) => (b.year ?? 0) - (a.year ?? 0));

  const genreMap = new Map<string, number>();
  for (const t of list) {
    if (t.genre) genreMap.set(t.genre, (genreMap.get(t.genre) ?? 0) + 1);
  }
  const genres = Array.from(genreMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const collabMap = new Map<string, number>();
  for (const t of list) {
    if (!t.allArtists || t.allArtists.length < 2) continue;
    for (const a of t.allArtists) {
      if (a.toLowerCase() === summary.name.toLowerCase()) continue;
      collabMap.set(a, (collabMap.get(a) ?? 0) + 1);
    }
  }
  const collaborators = Array.from(collabMap.entries())
    .map(([name, collabs]) => ({ name, collabs }))
    .sort((a, b) => b.collabs - a.collabs)
    .slice(0, 8);

  const topTrack = [...list]
    .filter((t) => typeof t.popularity === "number")
    .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))[0] ?? list[0];

  const tracks_sorted = [...list].sort(
    (a, b) => (b.popularity ?? 0) - (a.popularity ?? 0),
  );

  return {
    ...summary,
    tracks: tracks_sorted,
    albums,
    genres,
    features: avgFeatures(list),
    topTrack: topTrack ?? null,
    collaborators,
  };
}
