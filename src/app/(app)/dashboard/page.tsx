"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { StatTile } from "@/components/dashboard/StatTile";
import { TopArtistsBar } from "@/components/charts/TopArtistsBar";
import { GenreDonut } from "@/components/charts/GenreDonut";
import { useActiveDataset } from "@/hooks/useActiveDataset";
import {
  summaryStats,
  topArtists,
  topGenres,
} from "@/lib/dataset/aggregations";

export default function DashboardPage() {
  const { tracks, source, status, error } = useActiveDataset();

  const { stats, artists, genres } = useMemo(
    () => ({
      stats: summaryStats(tracks),
      artists: topArtists(tracks, 8),
      genres: topGenres(tracks, 6),
    }),
    [tracks],
  );

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl">Listening dashboard</h1>
          <p className="mt-1 text-sm text-text-muted">
            {source === "user"
              ? "Showing your uploaded data."
              : "Showing demo data — upload a CSV to see your own."}
          </p>
        </div>
        {source === "demo" && (
          <Link
            href="/upload"
            className="hidden sm:inline rounded-full border border-border px-4 py-2 text-xs font-medium hover:border-brand-violet/60"
          >
            Upload CSV
          </Link>
        )}
      </header>

      {status === "loading" && <SkeletonGrid />}
      {status === "error" && (
        <div className="card text-sm text-brand-magenta">
          {error ?? "Failed to load dataset"}
        </div>
      )}

      {status === "ready" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              label="Tracks"
              value={stats.trackCount}
              hint={source === "user" ? "Your data" : "Demo dataset"}
            />
            <StatTile label="Unique artists" value={stats.artistCount} />
            <StatTile label="Top genre" value={stats.topGenre} />
            <StatTile
              label="Avg popularity"
              value={stats.avgPopularity}
              hint="0–100 scale"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Top artists" subtitle="Most tracks in the dataset">
              {artists.length ? (
                <TopArtistsBar data={artists} />
              ) : (
                <EmptyChart />
              )}
            </ChartCard>
            <ChartCard title="Genre breakdown" subtitle="Share of total tracks">
              {genres.length ? <GenreDonut data={genres} /> : <EmptyChart />}
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="card h-24 animate-pulse bg-bg-elevated/30"
        />
      ))}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-border text-sm text-text-muted">
      Not enough data for this chart
    </div>
  );
}
