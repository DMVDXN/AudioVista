"use client";

import { useMemo } from "react";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { StatTile } from "@/components/dashboard/StatTile";
import { IdentityCard } from "@/components/dashboard/IdentityCard";
import { ShareIdentity } from "@/components/dashboard/ShareIdentityButton";
import { AudioFeatureRadar } from "@/components/charts/AudioFeatureRadar";
import { MoodScatter } from "@/components/charts/MoodScatter";
import { TempoHistogram } from "@/components/charts/TempoHistogram";
import { useActiveDataset } from "@/hooks/useActiveDataset";
import {
  avgFeatures,
  featureRadarData,
  generateIdentity,
  moodPoints,
  tempoHistogram,
} from "@/lib/dataset/taste";

export default function TastePage() {
  const { tracks, source, status, error } = useActiveDataset();

  const data = useMemo(() => {
    const features = avgFeatures(tracks);
    return {
      identity: generateIdentity(tracks),
      radar: featureRadarData(features),
      mood: moodPoints(tracks, 500),
      tempo: tempoHistogram(tracks),
      features,
    };
  }, [tracks]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl">Music taste profile</h1>
        <p className="mt-1 text-sm text-text-muted">
          {source === "user"
            ? "Your audio-feature fingerprint."
            : "Showing demo profile — upload a CSV for your own."}
        </p>
      </header>

      {status === "loading" && <SkeletonGrid />}
      {status === "error" && (
        <div className="card text-sm text-brand-magenta">
          {error ?? "Failed to load dataset"}
        </div>
      )}

      {status === "ready" && tracks.length > 0 && (
        <>
          <ShareIdentity fileName="audiovista-identity">
            <IdentityCard identity={data.identity} />
          </ShareIdentity>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              label="Danceability"
              value={data.features.danceability.toFixed(2)}
              hint="0–1 scale"
            />
            <StatTile
              label="Energy"
              value={data.features.energy.toFixed(2)}
            />
            <StatTile
              label="Valence"
              value={data.features.valence.toFixed(2)}
              hint="happy ↔ sad"
            />
            <StatTile
              label="Acousticness"
              value={data.features.acousticness.toFixed(2)}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard
              title="Audio features"
              subtitle="Average across your library"
            >
              <AudioFeatureRadar data={data.radar} />
            </ChartCard>
            <ChartCard
              title="Mood map"
              subtitle={`Valence × energy · ${data.mood.length} tracks`}
            >
              <MoodScatter data={data.mood} />
            </ChartCard>
            <ChartCard
              title="Tempo distribution"
              subtitle="BPM histogram"
              className="lg:col-span-2"
            >
              <TempoHistogram data={data.tempo} />
            </ChartCard>
          </div>
        </>
      )}

      {status === "ready" && tracks.length === 0 && (
        <div className="card text-sm text-text-muted">
          No tracks loaded yet.
        </div>
      )}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="space-y-4">
      <div className="card h-40 animate-pulse bg-bg-elevated/30" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="card h-24 animate-pulse bg-bg-elevated/30"
          />
        ))}
      </div>
    </div>
  );
}
