"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { ChevronDown, Loader2, LogIn, RefreshCw } from "lucide-react";
import { useDatasetStore } from "@/stores/useDatasetStore";
import type { ArtistMeta, Track } from "@/types/dataset";

type SpotifySyncMode =
  | "short_term"
  | "medium_term"
  | "long_term"
  | "recent"
  | "saved"
  | "all";

type SpotifySyncResponse = {
  tracks: Track[];
  artists?: Record<string, ArtistMeta>;
  fileName: string;
  summary?: {
    trackCount: number;
    artistCount: number;
    sources: string[];
    featuresAttached: number;
  };
};

const MODES: { value: SpotifySyncMode; label: string }[] = [
  { value: "medium_term", label: "Top 6 months" },
  { value: "short_term", label: "Top 4 weeks" },
  { value: "long_term", label: "Top all time" },
  { value: "recent", label: "Recently played" },
  { value: "saved", label: "Saved tracks" },
  { value: "all", label: "Deep sync" },
];

export function SpotifyButton() {
  const { data: session, status } = useSession();
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<SpotifySyncMode>("medium_term");
  const [message, setMessage] = useState<string | null>(null);
  const setUserTracks = useDatasetStore((s) => s.setUserTracks);
  const setUserArtists = useDatasetStore((s) => s.setUserArtists);

  useEffect(() => {
    fetch("/api/spotify/status")
      .then((r) => r.json())
      .then((j) => setConfigured(j.configured))
      .catch(() => setConfigured(false));
  }, []);

  if (configured === false) {
    return (
      <span className="text-xs text-text-subtle">Spotify not configured</span>
    );
  }
  if (configured === null || status === "loading") return null;

  if (!session) {
    return (
      <button
        type="button"
        onClick={() => signIn("spotify")}
        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:border-brand-violet/60"
      >
        <LogIn className="size-3.5" />
        Connect Spotify
      </button>
    );
  }

  async function sync(selectedMode = mode) {
    setSyncing(true);
    setMessage(null);
    setOpen(false);
    try {
      const res = await fetch(`/api/spotify/sync?mode=${selectedMode}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setMessage(json.error ?? "Spotify sync failed");
        return;
      }
      const json = (await res.json()) as SpotifySyncResponse;
      if (json.tracks.length) {
        setUserTracks(json.tracks, json.fileName);
      }
      if (json.artists && Object.keys(json.artists).length) {
        setUserArtists(json.artists, `spotify-artists-${selectedMode}.json`);
      }
      setMessage(
        json.summary
          ? `${json.summary.trackCount} tracks, ${json.summary.artistCount} artists`
          : `${json.tracks.length} tracks synced`,
      );
    } finally {
      setSyncing(false);
    }
  }

  const label = MODES.find((item) => item.value === mode)?.label ?? "Spotify";

  return (
    <div className="relative flex items-center gap-2">
      <div className="flex overflow-hidden rounded-full border border-brand-violet/40 bg-bg-subtle">
        <button
          type="button"
          onClick={() => sync()}
          disabled={syncing}
          className="inline-flex items-center gap-1.5 bg-brand-gradient px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-brand-violet/30 disabled:opacity-60"
        >
          {syncing ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RefreshCw className="size-3.5" />
          )}
          {label}
        </button>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="border-l border-white/10 px-2 text-text-muted hover:text-text"
          aria-label="Spotify sync options"
        >
          <ChevronDown className="size-3.5" />
        </button>
      </div>

      {message && (
        <span className="hidden max-w-40 truncate text-xs text-text-subtle xl:inline">
          {message}
        </span>
      )}

      <button
        type="button"
        onClick={() => signOut()}
        className="text-xs text-text-muted hover:text-text"
      >
        Sign out
      </button>

      {open && (
        <div className="absolute right-14 top-9 z-50 w-56 rounded-xl border border-border bg-bg-elevated p-2 shadow-xl shadow-black/30">
          <div className="px-2 pb-2 text-[11px] uppercase tracking-wider text-text-subtle">
            Spotify sync
          </div>
          {MODES.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => {
                setMode(item.value);
                void sync(item.value);
              }}
              className={`flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-xs hover:bg-bg-subtle ${
                mode === item.value ? "text-brand-cyan" : "text-text-muted"
              }`}
            >
              <span>{item.label}</span>
              {item.value === "all" && (
                <span className="rounded-full border border-brand-cyan/30 px-1.5 py-0.5 text-[10px]">
                  richest
                </span>
              )}
            </button>
          ))}
          <div className="mt-1 border-t border-border px-2 pt-2 text-[11px] leading-relaxed text-text-subtle">
            Deep sync combines top tracks, recent plays, saved tracks, artist
            genres, followers, and available audio features.
          </div>
        </div>
      )}
    </div>
  );
}
