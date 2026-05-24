import type { Track } from "@/types/dataset";

export type PlaylistFilters = {
  genre: string | null;
  yearMin: number | null;
  yearMax: number | null;
  popMin: number;
  popMax: number;
  mood: "any" | "happy" | "intense" | "late-night" | "cozy";
  tempoMin: number;
  tempoMax: number;
};

export const DEFAULT_FILTERS: PlaylistFilters = {
  genre: null,
  yearMin: null,
  yearMax: null,
  popMin: 0,
  popMax: 100,
  mood: "any",
  tempoMin: 0,
  tempoMax: 300,
};

function matchesMood(t: Track, mood: PlaylistFilters["mood"]) {
  if (mood === "any" || !t.features) return true;
  const { valence, energy } = t.features;
  if (mood === "happy") return valence >= 0.5 && energy >= 0.5;
  if (mood === "intense") return valence < 0.5 && energy >= 0.5;
  if (mood === "late-night") return valence < 0.5 && energy < 0.5;
  return valence >= 0.5 && energy < 0.5;
}

export function applyFilters(
  tracks: Track[],
  f: PlaylistFilters,
): Track[] {
  return tracks.filter((t) => {
    if (f.genre && t.genre?.toLowerCase() !== f.genre.toLowerCase()) return false;
    if (f.yearMin && (t.year ?? 0) < f.yearMin) return false;
    if (f.yearMax && (t.year ?? Infinity) > f.yearMax) return false;
    const pop = t.popularity ?? 0;
    if (pop < f.popMin || pop > f.popMax) return false;
    const tempo = t.features?.tempo ?? 0;
    if (tempo && (tempo < f.tempoMin || tempo > f.tempoMax)) return false;
    if (!matchesMood(t, f.mood)) return false;
    return true;
  });
}

export function uniqueGenres(tracks: Track[]): string[] {
  const set = new Set<string>();
  for (const t of tracks) if (t.genre) set.add(t.genre);
  return Array.from(set).sort();
}

export function yearRange(tracks: Track[]): [number, number] {
  let min = Infinity;
  let max = -Infinity;
  for (const t of tracks) {
    if (typeof t.year === "number") {
      if (t.year < min) min = t.year;
      if (t.year > max) max = t.year;
    }
  }
  if (min === Infinity) return [2000, new Date().getFullYear()];
  return [min, max];
}
