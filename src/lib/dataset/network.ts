import type { Track } from "@/types/dataset";

export type NetworkNode = {
  id: string;
  name: string;
  trackCount: number;
  avgPopularity: number;
  genres: string[];
  hasCollabs: boolean;
};

export type NetworkEdge = {
  source: string;
  target: string;
  weight: number;
};

export type NetworkGraph = {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
};

type BuildOptions = {
  maxNodes?: number;
  minWeight?: number;
  onlyCollaborators?: boolean;
};

export function buildArtistNetwork(
  tracks: Track[],
  options: BuildOptions = {},
): NetworkGraph {
  const {
    maxNodes = 80,
    minWeight = 1,
    onlyCollaborators = false,
  } = options;

  const stats = new Map<
    string,
    { count: number; popSum: number; popN: number; genres: Set<string> }
  >();
  const edgeWeights = new Map<string, number>();
  const hasCollab = new Set<string>();
  const displayName = new Map<string, string>();

  for (const t of tracks) {
    const artists = t.allArtists?.length ? t.allArtists : [t.artist];

    for (const a of artists) {
      const key = a.trim().toLowerCase();
      if (!key) continue;
      if (!displayName.has(key)) displayName.set(key, a.trim());
      const entry =
        stats.get(key) ??
        { count: 0, popSum: 0, popN: 0, genres: new Set<string>() };
      entry.count++;
      if (typeof t.popularity === "number") {
        entry.popSum += t.popularity;
        entry.popN++;
      }
      if (t.genre) entry.genres.add(t.genre);
      stats.set(key, entry);
    }

    if (artists.length > 1) {
      const lower = artists.map((a) => a.trim().toLowerCase()).filter(Boolean);
      const sorted = [...new Set(lower)].sort();
      for (let i = 0; i < sorted.length; i++) hasCollab.add(sorted[i]);
      for (let i = 0; i < sorted.length; i++) {
        for (let j = i + 1; j < sorted.length; j++) {
          const key = `${sorted[i]}|${sorted[j]}`;
          edgeWeights.set(key, (edgeWeights.get(key) ?? 0) + 1);
        }
      }
    }
  }

  let ranked = Array.from(stats.entries())
    .map(([key, v]) => ({
      key,
      count: v.count,
      avgPopularity: v.popN ? Math.round(v.popSum / v.popN) : 0,
      genres: v.genres,
      hasCollabs: hasCollab.has(key),
    }))
    .sort(
      (a, b) =>
        b.avgPopularity - a.avgPopularity || b.count - a.count,
    );

  if (onlyCollaborators) {
    ranked = ranked.filter((r) => r.hasCollabs);
  }
  ranked = ranked.slice(0, maxNodes);

  const includedIds = new Set(ranked.map((r) => r.key));

  const nodes: NetworkNode[] = ranked.map((r) => ({
    id: r.key,
    name: displayName.get(r.key) ?? r.key,
    trackCount: r.count,
    avgPopularity: r.avgPopularity,
    genres: Array.from(r.genres).slice(0, 3),
    hasCollabs: r.hasCollabs,
  }));

  const edges: NetworkEdge[] = [];
  for (const [key, weight] of edgeWeights.entries()) {
    if (weight < minWeight) continue;
    const [a, b] = key.split("|");
    if (includedIds.has(a) && includedIds.has(b)) {
      edges.push({ source: a, target: b, weight });
    }
  }

  return { nodes, edges };
}
