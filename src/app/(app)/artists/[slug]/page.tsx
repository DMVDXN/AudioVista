"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { StatTile } from "@/components/dashboard/StatTile";
import { AudioFeatureRadar } from "@/components/charts/AudioFeatureRadar";
import { useActiveDataset } from "@/hooks/useActiveDataset";
import { findArtist, artistSlug } from "@/lib/dataset/artist";
import { featureRadarData } from "@/lib/dataset/taste";
import { useDatasetStore } from "@/stores/useDatasetStore";
import type { MBArtistSummary } from "@/lib/musicbrainz/client";

export default function ArtistDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { tracks, status } = useActiveDataset();
  const userArtists = useDatasetStore((s) => s.userArtists);

  const artist = useMemo(() => findArtist(tracks, slug), [tracks, slug]);
  const artistMeta = useMemo(() => {
    if (!artist || !userArtists) return null;
    return userArtists[artist.name.toLowerCase()] ?? null;
  }, [artist, userArtists]);

  const radar = useMemo(
    () => (artist ? featureRadarData(artist.features) : []),
    [artist],
  );

  const [meta, setMeta] = useState<MBArtistSummary | null>(null);
  const [metaLoading, setMetaLoading] = useState(false);

  useEffect(() => {
    if (!artist) return;
    setMeta(null);
    setMetaLoading(true);
    fetch(`/api/musicbrainz/artist?name=${encodeURIComponent(artist.name)}`)
      .then(async (r) => (r.ok ? ((await r.json()) as MBArtistSummary) : null))
      .then(setMeta)
      .finally(() => setMetaLoading(false));
  }, [artist]);

  if (status === "loading") {
    return (
      <div className="space-y-4">
        <div className="card h-40 animate-pulse bg-bg-elevated/30" />
        <div className="card h-72 animate-pulse bg-bg-elevated/30" />
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="space-y-4">
        <Link
          href="/artists"
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text"
        >
          <ArrowLeft className="size-4" /> Back to artists
        </Link>
        <div className="card text-sm text-text-muted">
          No artist found in this dataset matching &quot;{decodeURIComponent(slug)}&quot;.
        </div>
      </div>
    );
  }

  const primaryGenre = artistMeta?.mainGenre ?? artist.topGenre;
  const extraGenres = (artistMeta?.genres ?? [])
    .filter((genre) => genre !== primaryGenre)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/artists"
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text"
        >
          <ArrowLeft className="size-3.5" /> All artists
        </Link>
      </div>

      <header className="relative overflow-hidden rounded-2xl border border-brand-violet/30 bg-bg-elevated p-8">
        <div className="absolute inset-0 -z-0 opacity-40 bg-gradient-to-br from-brand-magenta/30 via-brand-violet/20 to-brand-cyan/20" />
        <div className="absolute -right-12 -top-12 -z-0 size-64 rounded-full bg-brand-violet/30 blur-3xl" />
        <div className="relative">
          <p className="text-xs uppercase tracking-[0.25em] text-text-muted">
            Artist
          </p>
          <h1 className="mt-3 font-serif text-4xl sm:text-5xl heading-gradient">
            {artist.name}
          </h1>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {primaryGenre && <Pill>{primaryGenre}</Pill>}
            {extraGenres.map((genre) => (
              <Pill key={genre}>{genre}</Pill>
            ))}
            {(artist.firstYear || artist.lastYear) && (
              <Pill>
                {artist.firstYear ?? "?"} - {artist.lastYear ?? "present"}
              </Pill>
            )}
            <Pill>{artist.trackCount} tracks - {artist.albumCount} albums</Pill>
          </div>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Tracks" value={artist.trackCount} />
        <StatTile label="Albums" value={artist.albumCount} />
        <StatTile
          label="Followers"
          value={
            typeof artistMeta?.followers === "number"
              ? formatCompact(artistMeta.followers)
              : "N/A"
          }
          hint={artistMeta ? "from artists.csv" : "Upload artists.csv"}
        />
        <StatTile
          label="Artist popularity"
          value={artistMeta?.popularity ?? artist.avgPopularity}
          hint={artistMeta ? "from artists.csv" : "track average"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <ChartCard title="Audio fingerprint" subtitle="Average across their tracks">
          <AudioFeatureRadar data={radar} />
        </ChartCard>
        <div className="card">
          <h2 className="text-base font-semibold">MusicBrainz</h2>
          {metaLoading && (
            <p className="mt-2 text-sm text-text-muted">Loading...</p>
          )}
          {!metaLoading && !meta && (
            <p className="mt-2 text-sm text-text-muted">
              No metadata found.
            </p>
          )}
          {meta && (
            <div className="mt-3 space-y-2 text-sm">
              {meta.type && <Row label="Type" value={meta.type} />}
              {meta.country && <Row label="Country" value={meta.country} />}
              {(meta.beginYear || meta.endYear) && (
                <Row
                  label="Active"
                  value={`${meta.beginYear ?? "?"} - ${meta.endYear ?? "present"}`}
                />
              )}
              {meta.tags.length > 0 && (
                <div>
                  <div className="text-xs uppercase tracking-wider text-text-muted">
                    Tags
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {meta.tags.map((t) => (
                      <Pill key={t}>{t}</Pill>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="card">
          <h2 className="text-base font-semibold">All tracks</h2>
          <p className="mt-0.5 text-sm text-text-muted">
            Sorted by popularity. {artist.tracks.length} total.
          </p>
          <div className="mt-4 max-h-[28rem] overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-bg-elevated text-xs uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="px-2 py-2">#</th>
                  <th className="px-2 py-2">Track</th>
                  <th className="px-2 py-2">Album</th>
                  <th className="px-2 py-2 text-right">Year</th>
                  <th className="px-2 py-2 text-right">Popularity</th>
                </tr>
              </thead>
              <tbody>
                {artist.tracks.map((t, i) => (
                  <tr key={t.id} className="border-t border-border/60">
                    <td className="px-2 py-2 text-text-subtle">{i + 1}</td>
                    <td className="px-2 py-2">{t.name}</td>
                    <td className="px-2 py-2 text-text-muted">
                      {t.album ?? "-"}
                    </td>
                    <td className="px-2 py-2 text-right text-text-muted">
                      {t.year ?? "-"}
                    </td>
                    <td className="px-2 py-2 text-right">
                      {typeof t.popularity === "number" ? t.popularity : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card">
            <h2 className="text-base font-semibold">Albums</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {artist.albums.slice(0, 8).map((a) => (
                <li
                  key={a.name}
                  className="flex items-baseline justify-between gap-2"
                >
                  <span className="truncate">{a.name}</span>
                  <span className="shrink-0 text-xs text-text-muted">
                    {a.year ?? "-"} - {a.tracks} tracks
                  </span>
                </li>
              ))}
            </ul>
            {artist.albums.length > 8 && (
              <p className="mt-2 text-xs text-text-subtle">
                + {artist.albums.length - 8} more
              </p>
            )}
          </div>

          {artist.genres.length > 1 && (
            <div className="card">
              <h2 className="text-base font-semibold">Genres</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {artist.genres.map((g) => (
                  <Pill key={g.name}>
                    {g.name} - {g.count}
                  </Pill>
                ))}
              </div>
            </div>
          )}

          {artist.collaborators.length > 0 && (
            <div className="card">
              <h2 className="text-base font-semibold">Frequent collaborators</h2>
              <ul className="mt-3 space-y-1.5 text-sm">
                {artist.collaborators.map((c) => (
                  <li
                    key={c.name}
                    className="flex items-baseline justify-between gap-2"
                  >
                    <Link
                      href={`/artists/${artistSlug(c.name)}`}
                      className="truncate hover:text-brand-cyan"
                    >
                      {c.name}
                    </Link>
                    <span className="shrink-0 text-xs text-text-muted">
                      {c.collabs} collabs
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatCompact(value: number): string {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-border bg-bg-subtle px-2.5 py-0.5 text-xs text-text-muted">
      {children}
    </span>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="w-20 text-xs uppercase tracking-wider text-text-muted">
        {label}
      </span>
      <span className="text-sm">{value}</span>
    </div>
  );
}
