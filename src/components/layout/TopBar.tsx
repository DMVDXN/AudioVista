"use client";

import Link from "next/link";
import { useDatasetStore } from "@/stores/useDatasetStore";
import { SpotifyButton } from "@/components/auth/SpotifyButton";

export function TopBar() {
  const userTracks = useDatasetStore((s) => s.userTracks);
  const userArtists = useDatasetStore((s) => s.userArtists);
  const fileName = useDatasetStore((s) => s.fileName);
  const artistFileName = useDatasetStore((s) => s.artistFileName);
  const clear = useDatasetStore((s) => s.clearUserTracks);

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-bg-elevated/40 px-6">
      <div className="flex items-center gap-3 text-sm">
        <span className="text-text-muted">Dataset:</span>
        {userTracks ? (
          <>
            <span className="rounded-full border border-brand-violet/40 bg-brand-violet/10 px-2.5 py-0.5 text-xs font-medium text-white">
              Your data
            </span>
            <span className="text-text">
              {fileName ?? "uploaded.csv"} - {userTracks.length} tracks
              {userArtists
                ? ` + ${artistFileName ?? "artists.csv"} - ${
                    Object.keys(userArtists).length
                  } artists`
                : ""}
            </span>
            <button
              type="button"
              onClick={clear}
              className="ml-2 text-xs text-text-muted hover:text-text"
            >
              Clear
            </button>
          </>
        ) : (
          <>
            <span className="rounded-full border border-border bg-bg-subtle px-2.5 py-0.5 text-xs font-medium text-text-muted">
              {userArtists ? "Metadata only" : "Demo"}
            </span>
            <span className="text-text">
              {userArtists
                ? `${artistFileName ?? "artists.csv"} - ${
                    Object.keys(userArtists).length
                  } artists`
                : "Spotify sample - 55 tracks"}
            </span>
            <Link
              href="/upload"
              className="ml-2 text-xs text-brand-cyan hover:opacity-80"
            >
              {userArtists ? "Upload songs" : "Upload yours"}
            </Link>
          </>
        )}
      </div>
      <SpotifyButton />
    </header>
  );
}
