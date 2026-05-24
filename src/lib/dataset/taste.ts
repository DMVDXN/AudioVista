import type { Track, AudioFeatures } from "@/types/dataset";

const FEATURE_KEYS: (keyof AudioFeatures)[] = [
  "danceability",
  "energy",
  "valence",
  "acousticness",
  "instrumentalness",
  "speechiness",
];

export function avgFeatures(tracks: Track[]): AudioFeatures {
  const totals: AudioFeatures = {
    danceability: 0,
    energy: 0,
    valence: 0,
    tempo: 0,
    acousticness: 0,
    instrumentalness: 0,
    speechiness: 0,
  };
  let count = 0;
  for (const t of tracks) {
    if (!t.features) continue;
    for (const k of FEATURE_KEYS) totals[k] += t.features[k];
    totals.tempo += t.features.tempo;
    count++;
  }
  if (!count) return totals;
  for (const k of FEATURE_KEYS) totals[k] = totals[k] / count;
  totals.tempo = totals.tempo / count;
  return totals;
}

export function featureRadarData(f: AudioFeatures) {
  return FEATURE_KEYS.map((k) => ({
    feature: k,
    value: Number((f[k] ?? 0).toFixed(3)),
  }));
}

export function moodPoints(tracks: Track[], limit = 400) {
  const points = tracks
    .filter((t) => t.features)
    .slice(0, limit)
    .map((t) => ({
      name: t.name,
      artist: t.artist,
      valence: t.features!.valence,
      energy: t.features!.energy,
    }));
  return points;
}

export function tempoHistogram(tracks: Track[]) {
  const bins = [
    { range: "<80", min: 0, max: 80, count: 0 },
    { range: "80–100", min: 80, max: 100, count: 0 },
    { range: "100–120", min: 100, max: 120, count: 0 },
    { range: "120–140", min: 120, max: 140, count: 0 },
    { range: "140–160", min: 140, max: 160, count: 0 },
    { range: "160+", min: 160, max: Infinity, count: 0 },
  ];
  for (const t of tracks) {
    const tempo = t.features?.tempo;
    if (!tempo) continue;
    const bin = bins.find((b) => tempo >= b.min && tempo < b.max);
    if (bin) bin.count++;
  }
  return bins.map(({ range, count }) => ({ range, count }));
}

type Quadrant =
  | "Sun-drenched optimist"
  | "High-octane catharsis"
  | "Late-night introvert"
  | "Cozy comfort";

function quadrant(valence: number, energy: number): Quadrant {
  if (valence >= 0.5 && energy >= 0.5) return "Sun-drenched optimist";
  if (valence < 0.5 && energy >= 0.5) return "High-octane catharsis";
  if (valence < 0.5 && energy < 0.5) return "Late-night introvert";
  return "Cozy comfort";
}

export type Identity = {
  label: string;
  description: string;
  tempo: string;
  popularity: string;
  vibe: Quadrant;
};

export function generateIdentity(tracks: Track[]): Identity {
  const features = avgFeatures(tracks);
  const vibe = quadrant(features.valence, features.energy);

  const avgTempo = features.tempo;
  const tempoLabel =
    avgTempo < 95 ? "chillwave" : avgTempo < 125 ? "midtempo" : "uptempo";

  const popValues = tracks
    .map((t) => t.popularity)
    .filter((p): p is number => typeof p === "number");
  const avgPop = popValues.length
    ? popValues.reduce((a, b) => a + b, 0) / popValues.length
    : 0;
  const popularityLabel =
    avgPop >= 70 ? "mainstream" : avgPop >= 45 ? "balanced" : "underground";

  const dominant =
    features.danceability >= 0.7
      ? "dancefloor"
      : features.acousticness >= 0.6
        ? "acoustic"
        : features.instrumentalness >= 0.4
          ? "instrumental"
          : null;

  const parts = [
    tempoLabel,
    dominant,
    vibe.split(" ")[0].toLowerCase(),
  ].filter(Boolean);

  const label = parts.join(" / ");

  const description = `Your library leans ${vibe.toLowerCase()} — ${tempoLabel} tempo with ${popularityLabel} taste.`;

  return {
    label,
    description,
    tempo: `${Math.round(avgTempo)} BPM avg`,
    popularity: `${Math.round(avgPop)}/100 avg`,
    vibe,
  };
}
