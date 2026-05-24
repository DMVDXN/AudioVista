"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useActiveDataset } from "@/hooks/useActiveDataset";
import { listArtists } from "@/lib/dataset/artist";

type SortKey = "tracks" | "popularity" | "name";

export default function ArtistsPage() {
  const { tracks, status } = useActiveDataset();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("tracks");

  const all = useMemo(() => listArtists(tracks), [tracks]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? all.filter((a) => a.name.toLowerCase().includes(q))
      : all;
    const sorted = [...list].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "popularity") return b.avgPopularity - a.avgPopularity;
      return b.trackCount - a.trackCount;
    });
    return sorted;
  }, [all, search, sortBy]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">Artists</h1>
          <p className="mt-1 text-sm text-text-muted">
            {all.length} artists in your dataset · click any to drill down
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <SortButton active={sortBy === "tracks"} onClick={() => setSortBy("tracks")}>
            Most tracks
          </SortButton>
          <SortButton active={sortBy === "popularity"} onClick={() => setSortBy("popularity")}>
            Most popular
          </SortButton>
          <SortButton active={sortBy === "name"} onClick={() => setSortBy("name")}>
            A–Z
          </SortButton>
        </div>
      </header>

      <div className="card relative">
        <Search className="pointer-events-none absolute left-7 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search artists…"
          className="input pl-9"
        />
      </div>

      {status === "loading" && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card h-24 animate-pulse bg-bg-elevated/30" />
          ))}
        </div>
      )}

      {status === "ready" && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.slice(0, 90).map((a) => (
            <Link
              key={a.slug}
              href={`/artists/${a.slug}`}
              className="card transition-colors hover:border-brand-violet/50"
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="truncate text-base font-semibold">{a.name}</h3>
                <span className="text-xs text-text-subtle">
                  {a.firstYear ?? "—"}{a.firstYear !== a.lastYear ? `–${a.lastYear ?? ""}` : ""}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-text-muted">
                <Pill>{a.trackCount} tracks</Pill>
                <Pill>{a.albumCount} albums</Pill>
                {a.topGenre && <Pill>{a.topGenre}</Pill>}
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-bg-subtle">
                <div
                  className="h-full rounded-full bg-brand-gradient"
                  style={{ width: `${a.avgPopularity}%` }}
                />
              </div>
              <div className="mt-1 text-xs text-text-subtle">
                popularity {a.avgPopularity}/100
              </div>
            </Link>
          ))}
          {filtered.length === 0 && (
            <div className="card text-sm text-text-muted">
              No artists match “{search}”.
            </div>
          )}
        </div>
      )}

      {filtered.length > 90 && (
        <p className="text-xs text-text-subtle">
          Showing first 90 of {filtered.length}. Refine your search to narrow.
        </p>
      )}
    </div>
  );
}

function SortButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 transition-colors ${
        active
          ? "border-brand-violet/60 bg-brand-violet/15 text-white"
          : "border-border text-text-muted hover:border-brand-violet/40"
      }`}
    >
      {children}
    </button>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-border bg-bg-subtle px-2.5 py-0.5">
      {children}
    </span>
  );
}
