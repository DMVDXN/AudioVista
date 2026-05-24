import type {
  ArtistAggregate,
  GenreAggregate,
  Track,
} from "@/types/dataset";

export function topArtists(tracks: Track[], limit = 10): ArtistAggregate[] {
  const map = new Map<string, { count: number; popSum: number }>();
  for (const t of tracks) {
    const entry = map.get(t.artist) ?? { count: 0, popSum: 0 };
    entry.count += 1;
    entry.popSum += t.popularity ?? 0;
    map.set(t.artist, entry);
  }
  return Array.from(map.entries())
    .map(([artist, { count, popSum }]) => ({
      artist,
      playCount: count,
      avgPopularity: Math.round(popSum / count),
    }))
    .sort((a, b) => b.playCount - a.playCount || b.avgPopularity - a.avgPopularity)
    .slice(0, limit);
}

export function topGenres(tracks: Track[], limit = 6): GenreAggregate[] {
  const map = new Map<string, number>();
  let total = 0;
  for (const t of tracks) {
    if (!t.genre) continue;
    map.set(t.genre, (map.get(t.genre) ?? 0) + 1);
    total += 1;
  }
  return Array.from(map.entries())
    .map(([genre, count]) => ({
      genre,
      count,
      share: total ? count / total : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function summaryStats(tracks: Track[]) {
  const artists = new Set(tracks.map((t) => t.artist)).size;
  const genres = topGenres(tracks, 1);
  const totalPopularity = tracks.reduce(
    (sum, t) => sum + (t.popularity ?? 0),
    0,
  );
  return {
    trackCount: tracks.length,
    artistCount: artists,
    topGenre: genres[0]?.genre ?? "—",
    avgPopularity: tracks.length
      ? Math.round(totalPopularity / tracks.length)
      : 0,
  };
}
