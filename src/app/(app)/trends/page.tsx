"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { ReleaseScatter } from "@/components/charts/ReleaseScatter";
import { GenreStackedArea } from "@/components/charts/GenreStackedArea";
import { PopularityLadder } from "@/components/charts/PopularityLadder";
import { MultiFeatureRadar } from "@/components/charts/MultiFeatureRadar";
import { useActiveDataset } from "@/hooks/useActiveDataset";
import {
  featureComparison,
  genreShareOverTime,
  releasesByYear,
  topTracks,
} from "@/lib/dataset/trends";

const MAX_SELECTION = 5;

export default function TrendsPage() {
  const { tracks, status } = useActiveDataset();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  const releases = useMemo(() => releasesByYear(tracks), [tracks]);
  const { rows: genreRows, genres } = useMemo(
    () => genreShareOverTime(tracks, 5),
    [tracks],
  );
  const popLadder = useMemo(() => topTracks(tracks, 15), [tracks]);

  const tracksWithFeatures = useMemo(
    () => tracks.filter((t) => t.features),
    [tracks],
  );

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tracksWithFeatures.slice(0, 8);
    return tracksWithFeatures
      .filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.artist.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [tracksWithFeatures, search]);

  const comparisonData = useMemo(
    () => featureComparison(tracks, selectedIds),
    [tracks, selectedIds],
  );

  const selectedTracks = useMemo(
    () =>
      selectedIds
        .map((id) => tracks.find((t) => t.id === id))
        .filter((t): t is NonNullable<typeof t> => Boolean(t)),
    [tracks, selectedIds],
  );

  function toggle(id: string) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_SELECTION) return prev;
      return [...prev, id];
    });
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl">Trends</h1>
        <p className="mt-1 text-sm text-text-muted">
          Releases over time, genre shifts, top tracks, and a head-to-head
          feature comparator.
        </p>
      </header>

      {status === "loading" && (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="card h-72 animate-pulse bg-bg-elevated/30"
            />
          ))}
        </div>
      )}

      {status === "ready" && (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard
              title="Releases over time"
              subtitle="Bubble size = number of releases that year"
            >
              <ReleaseScatter data={releases} />
            </ChartCard>
            <ChartCard
              title="Genre share over time"
              subtitle="Top 5 genres stacked by year"
            >
              <GenreStackedArea data={genreRows} genres={genres} />
            </ChartCard>
          </div>

          <ChartCard
            title="Popularity ladder"
            subtitle="Top 15 tracks by popularity"
          >
            <PopularityLadder data={popLadder} />
          </ChartCard>

          <div className="card">
            <header className="mb-4">
              <h2 className="text-base font-semibold">Compare tracks</h2>
              <p className="mt-0.5 text-sm text-text-muted">
                Pick up to {MAX_SELECTION} tracks to overlay their audio
                features.
              </p>
            </header>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by track or artist…"
              className="input"
            />

            <div className="mt-3 flex flex-wrap gap-2">
              {searchResults.map((t) => {
                const active = selectedIds.includes(t.id);
                const disabled =
                  !active && selectedIds.length >= MAX_SELECTION;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggle(t.id)}
                    disabled={disabled}
                    className={`rounded-full px-3 py-1 text-xs transition-colors ${
                      active
                        ? "border border-brand-violet/60 bg-brand-violet/15 text-white"
                        : "border border-border bg-bg-subtle text-text-muted hover:border-brand-violet/40"
                    } ${disabled ? "opacity-40" : ""}`}
                  >
                    {t.name} <span className="text-text-subtle">· {t.artist}</span>
                  </button>
                );
              })}
              {searchResults.length === 0 && (
                <span className="text-xs text-text-muted">No matches.</span>
              )}
            </div>

            {selectedTracks.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedTracks.map((t) => (
                  <span
                    key={t.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-brand-violet/50 bg-brand-violet/10 px-3 py-1 text-xs text-white"
                  >
                    {t.name}
                    <button
                      type="button"
                      onClick={() => toggle(t.id)}
                      aria-label={`Remove ${t.name}`}
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="mt-6">
              <MultiFeatureRadar
                data={comparisonData}
                trackNames={selectedTracks.map((t) => t.name)}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
