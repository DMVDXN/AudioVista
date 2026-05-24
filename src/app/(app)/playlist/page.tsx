"use client";

import { useMemo, useState } from "react";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { StatTile } from "@/components/dashboard/StatTile";
import { AudioFeatureRadar } from "@/components/charts/AudioFeatureRadar";
import { TopArtistsBar } from "@/components/charts/TopArtistsBar";
import { useActiveDataset } from "@/hooks/useActiveDataset";
import {
  applyFilters,
  DEFAULT_FILTERS,
  uniqueGenres,
  yearRange,
  type PlaylistFilters,
} from "@/lib/dataset/filters";
import {
  topArtists,
  summaryStats,
} from "@/lib/dataset/aggregations";
import {
  avgFeatures,
  featureRadarData,
  generateIdentity,
} from "@/lib/dataset/taste";

const MOODS: PlaylistFilters["mood"][] = [
  "any",
  "happy",
  "intense",
  "late-night",
  "cozy",
];

export default function PlaylistPage() {
  const { tracks } = useActiveDataset();
  const [filters, setFilters] = useState<PlaylistFilters>(DEFAULT_FILTERS);

  const genres = useMemo(() => uniqueGenres(tracks), [tracks]);
  const [yMin, yMax] = useMemo(() => yearRange(tracks), [tracks]);

  const subset = useMemo(() => applyFilters(tracks, filters), [tracks, filters]);
  const profile = useMemo(() => {
    const features = avgFeatures(subset);
    return {
      stats: summaryStats(subset),
      identity: subset.length ? generateIdentity(subset) : null,
      radar: featureRadarData(features),
      artists: topArtists(subset, 8),
    };
  }, [subset]);

  function update<K extends keyof PlaylistFilters>(
    key: K,
    value: PlaylistFilters[K],
  ) {
    setFilters((f) => ({ ...f, [key]: value }));
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl">Playlist analyzer</h1>
        <p className="mt-1 text-sm text-text-muted">
          Filter your dataset into a virtual playlist and see its profile.
        </p>
      </header>

      <div className="card grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Genre">
          <select
            value={filters.genre ?? ""}
            onChange={(e) => update("genre", e.target.value || null)}
            className="select"
          >
            <option value="">All genres</option>
            {genres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Mood">
          <select
            value={filters.mood}
            onChange={(e) =>
              update("mood", e.target.value as PlaylistFilters["mood"])
            }
            className="select"
          >
            {MOODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Field>
        <Field label={`Year (${yMin}–${yMax})`}>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder={String(yMin)}
              value={filters.yearMin ?? ""}
              onChange={(e) =>
                update("yearMin", e.target.value ? Number(e.target.value) : null)
              }
              className="input"
            />
            <span className="text-text-subtle">–</span>
            <input
              type="number"
              placeholder={String(yMax)}
              value={filters.yearMax ?? ""}
              onChange={(e) =>
                update("yearMax", e.target.value ? Number(e.target.value) : null)
              }
              className="input"
            />
          </div>
        </Field>
        <Field label={`Popularity ${filters.popMin}–${filters.popMax}`}>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={100}
              value={filters.popMin}
              onChange={(e) => update("popMin", Number(e.target.value))}
              className="w-full"
              aria-label="Min popularity"
            />
            <input
              type="range"
              min={0}
              max={100}
              value={filters.popMax}
              onChange={(e) => update("popMax", Number(e.target.value))}
              className="w-full"
              aria-label="Max popularity"
            />
          </div>
        </Field>
        <Field label={`Tempo ${filters.tempoMin}–${filters.tempoMax} BPM`}>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={250}
              value={filters.tempoMin}
              onChange={(e) => update("tempoMin", Number(e.target.value))}
              className="w-full"
              aria-label="Min tempo"
            />
            <input
              type="range"
              min={0}
              max={250}
              value={filters.tempoMax}
              onChange={(e) => update("tempoMax", Number(e.target.value))}
              className="w-full"
              aria-label="Max tempo"
            />
          </div>
        </Field>
        <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
          <button
            type="button"
            onClick={() => setFilters(DEFAULT_FILTERS)}
            className="text-xs text-text-muted hover:text-text"
          >
            Reset filters
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Tracks in playlist" value={profile.stats.trackCount} />
        <StatTile label="Unique artists" value={profile.stats.artistCount} />
        <StatTile label="Top genre" value={profile.stats.topGenre} />
        <StatTile
          label="Avg popularity"
          value={profile.stats.avgPopularity}
        />
      </div>

      {subset.length === 0 && (
        <div className="card text-sm text-text-muted">
          No tracks match these filters.
        </div>
      )}

      {profile.identity && (
        <div className="card bg-gradient-to-br from-brand-violet/10 to-brand-cyan/10">
          <div className="text-xs uppercase tracking-[0.2em] text-text-muted">
            Playlist identity
          </div>
          <p className="mt-2 font-serif text-2xl heading-gradient capitalize">
            {profile.identity.label}
          </p>
          <p className="mt-1 text-sm text-text-muted">
            {profile.identity.description}
          </p>
        </div>
      )}

      {subset.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Audio features" subtitle="Average of this playlist">
            <AudioFeatureRadar data={profile.radar} />
          </ChartCard>
          <ChartCard title="Top artists" subtitle="In this playlist">
            <TopArtistsBar data={profile.artists} />
          </ChartCard>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wider text-text-muted">
        {label}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
