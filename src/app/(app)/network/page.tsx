"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Info } from "lucide-react";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { ArtistNetwork } from "@/components/charts/ArtistNetwork";
import { useActiveDataset } from "@/hooks/useActiveDataset";
import { buildArtistNetwork, type NetworkNode } from "@/lib/dataset/network";
import { artistSlug } from "@/lib/dataset/artist";
import type { MBArtistSummary } from "@/lib/musicbrainz/client";

export default function NetworkPage() {
  const { tracks, status } = useActiveDataset();
  const [onlyCollabs, setOnlyCollabs] = useState(true);
  const [maxNodes, setMaxNodes] = useState(80);

  const graph = useMemo(
    () =>
      buildArtistNetwork(tracks, {
        maxNodes,
        onlyCollaborators: onlyCollabs,
      }),
    [tracks, maxNodes, onlyCollabs],
  );

  const [selected, setSelected] = useState<NetworkNode | null>(null);
  const [meta, setMeta] = useState<MBArtistSummary | null>(null);
  const [metaLoading, setMetaLoading] = useState(false);

  async function pick(node: NetworkNode) {
    setSelected(node);
    setMeta(null);
    setMetaLoading(true);
    try {
      const res = await fetch(
        `/api/musicbrainz/artist?name=${encodeURIComponent(node.name)}`,
      );
      if (res.ok) setMeta(await res.json());
    } finally {
      setMetaLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">Artist network</h1>
          <p className="mt-1 text-sm text-text-muted">
            {graph.nodes.length} artists · {graph.edges.length} collaborations
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <label className="flex cursor-pointer items-center gap-2 text-text-muted">
            <input
              type="checkbox"
              checked={onlyCollabs}
              onChange={(e) => setOnlyCollabs(e.target.checked)}
              className="accent-brand-violet"
            />
            Only artists with collaborations
          </label>
          <div className="flex items-center gap-2 text-text-muted">
            <span>Show top</span>
            <select
              value={maxNodes}
              onChange={(e) => setMaxNodes(Number(e.target.value))}
              className="select w-20"
              aria-label="Maximum number of nodes"
            >
              <option value={40}>40</option>
              <option value={80}>80</option>
              <option value={150}>150</option>
              <option value={250}>250</option>
            </select>
          </div>
        </div>
      </header>

      {status === "loading" && (
        <div className="card h-[560px] animate-pulse bg-bg-elevated/30" />
      )}

      {status === "ready" && (
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <ChartCard
            title="Collaboration graph"
            subtitle="Drag nodes, scroll to zoom, click for details"
          >
            <ArtistNetwork graph={graph} onSelect={pick} />
            <Legend />
          </ChartCard>

          <div className="card">
            <h2 className="text-base font-semibold">
              {selected?.name ?? "Select an artist"}
            </h2>
            {!selected && (
              <p className="mt-2 text-sm text-text-muted">
                Click a node to see metadata.
              </p>
            )}
            {selected && (
              <>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <Pill>{selected.trackCount} tracks</Pill>
                  <Pill>popularity {selected.avgPopularity}</Pill>
                  {selected.genres.map((g) => (
                    <Pill key={g}>{g}</Pill>
                  ))}
                </div>
                <Link
                  href={`/artists/${artistSlug(selected.name)}`}
                  className="mt-3 inline-flex items-center gap-1 text-xs text-brand-cyan hover:opacity-80"
                >
                  Full artist profile <ArrowRight className="size-3" />
                </Link>

                <div className="mt-4 border-t border-border pt-4 text-sm">
                  <div className="text-xs uppercase tracking-wider text-text-muted">
                    MusicBrainz
                  </div>
                  {metaLoading && (
                    <p className="mt-2 text-sm text-text-muted">Loading…</p>
                  )}
                  {!metaLoading && !meta && (
                    <p className="mt-2 text-sm text-text-muted">
                      No metadata found.
                    </p>
                  )}
                  {meta && (
                    <div className="mt-2 space-y-1.5 text-sm">
                      {meta.type && <Row label="Type" value={meta.type} />}
                      {meta.country && (
                        <Row label="Country" value={meta.country} />
                      )}
                      {(meta.beginYear || meta.endYear) && (
                        <Row
                          label="Active"
                          value={`${meta.beginYear ?? "?"} – ${meta.endYear ?? "present"}`}
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
              </>
            )}
          </div>
        </div>
      )}

      {status === "ready" && graph.nodes.length === 0 && (
        <div className="card flex items-start gap-2 text-sm text-text-muted">
          <Info className="size-4 shrink-0 text-brand-cyan" />
          <span>
            No artists with collaborations in this dataset. Turn off the
            &ldquo;Only artists with collaborations&rdquo; toggle to show all
            artists, or upload a richer dataset like the Kaggle 114k.
          </span>
        </div>
      )}
    </div>
  );
}

function Legend() {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-text-muted">
      <span className="flex items-center gap-1.5">
        <span className="size-3 rounded-full bg-gradient-to-br from-pink-300 to-brand-magenta" />
        mainstream (70+)
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-3 rounded-full bg-gradient-to-br from-purple-300 to-brand-violet" />
        balanced (45–69)
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-3 rounded-full bg-gradient-to-br from-cyan-200 to-brand-cyan" />
        underground (&lt;45)
      </span>
      <span className="ml-auto text-text-subtle">node size = popularity</span>
    </div>
  );
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
