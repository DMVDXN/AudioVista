import type { Track } from "@/types/dataset";

export type ReleasePoint = {
  year: number;
  count: number;
  avgPopularity: number;
};

export type GenreYearRow = {
  year: number;
  total: number;
  [genre: string]: number;
};

export type TopTrackRow = {
  id: string;
  name: string;
  artist: string;
  popularity: number;
};

export function releasesByYear(tracks: Track[]): ReleasePoint[] {
  const map = new Map<number, { count: number; popSum: number }>();
  for (const t of tracks) {
    if (typeof t.year !== "number") continue;
    const entry = map.get(t.year) ?? { count: 0, popSum: 0 };
    entry.count++;
    entry.popSum += t.popularity ?? 0;
    map.set(t.year, entry);
  }
  return Array.from(map.entries())
    .map(([year, { count, popSum }]) => ({
      year,
      count,
      avgPopularity: count ? Math.round(popSum / count) : 0,
    }))
    .sort((a, b) => a.year - b.year);
}

export function genreShareOverTime(
  tracks: Track[],
  topN = 5,
): { rows: GenreYearRow[]; genres: string[] } {
  const genreCounts = new Map<string, number>();
  for (const t of tracks) {
    if (!t.genre) continue;
    genreCounts.set(t.genre, (genreCounts.get(t.genre) ?? 0) + 1);
  }
  const topGenres = Array.from(genreCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([g]) => g);

  const yearMap = new Map<number, GenreYearRow>();
  for (const t of tracks) {
    if (typeof t.year !== "number" || !t.genre) continue;
    const row =
      yearMap.get(t.year) ??
      ({ year: t.year, total: 0 } as GenreYearRow);
    const bucket = topGenres.includes(t.genre) ? t.genre : "other";
    row[bucket] = ((row[bucket] as number) ?? 0) + 1;
    row.total += 1;
    yearMap.set(t.year, row);
  }
  return {
    rows: Array.from(yearMap.values()).sort((a, b) => a.year - b.year),
    genres: [...topGenres, "other"],
  };
}

export function topTracks(tracks: Track[], limit = 15): TopTrackRow[] {
  return tracks
    .filter((t) => typeof t.popularity === "number")
    .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
    .slice(0, limit)
    .map((t) => ({
      id: t.id,
      name: t.name,
      artist: t.artist,
      popularity: t.popularity ?? 0,
    }));
}

export function featureComparison(tracks: Track[], ids: string[]) {
  const byId = new Map(tracks.map((t) => [t.id, t]));
  const selected = ids
    .map((id) => byId.get(id))
    .filter((t): t is Track => Boolean(t?.features));

  const features = [
    "danceability",
    "energy",
    "valence",
    "acousticness",
    "instrumentalness",
    "speechiness",
  ] as const;

  return features.map((feature) => {
    const row: Record<string, string | number> = { feature };
    for (const t of selected) {
      row[t.name] = Number((t.features![feature] ?? 0).toFixed(3));
    }
    return row;
  });
}
