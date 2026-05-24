"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { CheckCircle2, FileText, Loader2, UploadCloud } from "lucide-react";
import { parseTracksCsv } from "@/lib/dataset/parseCsv";
import { isArtistsCsv, parseArtistsCsv } from "@/lib/dataset/parseArtists";
import { useDatasetStore } from "@/stores/useDatasetStore";
import type { ArtistMeta, Track } from "@/types/dataset";

type TrackPreview = {
  fileName: string;
  tracks: Track[];
  stats: { rowsParsed: number; duplicatesRemoved: number };
};

type ArtistPreview = {
  fileName: string;
  artists: Record<string, ArtistMeta>;
  count: number;
};

type UploadPreview = {
  tracks?: TrackPreview;
  artists?: ArtistPreview;
};

export default function UploadPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [parsing, setParsing] = useState<{ label: string; size: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<UploadPreview | null>(null);

  const setUserTracks = useDatasetStore((s) => s.setUserTracks);
  const setUserArtists = useDatasetStore((s) => s.setUserArtists);
  const userTracks = useDatasetStore((s) => s.userTracks);
  const userArtists = useDatasetStore((s) => s.userArtists);
  const storedFileName = useDatasetStore((s) => s.fileName);
  const artistFileName = useDatasetStore((s) => s.artistFileName);
  const clear = useDatasetStore((s) => s.clearUserTracks);
  const clearArtists = useDatasetStore((s) => s.clearUserArtists);

  function headerNames(csv: string): string[] {
    const newlineIndex = csv.indexOf("\n");
    const firstLine = csv.slice(0, newlineIndex === -1 ? undefined : newlineIndex);
    return firstLine.split(/,|\t|;|\|/).map((h) => h.trim().replace(/^"|"$/g, ""));
  }

  async function parseFile(file: File): Promise<UploadPreview> {
    const text = await file.text();
    await new Promise((r) => setTimeout(r, 0));

    if (isArtistsCsv(headerNames(text))) {
      const result = parseArtistsCsv(text);
      if (!result.ok) throw new Error(`${file.name}: ${result.error}`);
      return {
        artists: {
          fileName: file.name,
          artists: result.artists,
          count: result.count,
        },
      };
    }

    const result = parseTracksCsv(text);
    if (!result.ok) throw new Error(`${file.name}: ${result.error}`);
    return {
      tracks: {
        fileName: file.name,
        tracks: result.tracks,
        stats: result.stats,
      },
    };
  }

  async function handleFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).filter(Boolean);
    setError(null);
    setPreview(null);

    if (!files.length) return;
    const csvFiles = files.filter((file) => file.name.toLowerCase().endsWith(".csv"));
    if (csvFiles.length !== files.length) {
      setError("Please upload only .csv files");
      return;
    }

    const tooLarge = csvFiles.find((file) => file.size > 1024 * 1024 * 1024);
    if (tooLarge) {
      setError(`${tooLarge.name} is too large (max 1GB).`);
      return;
    }

    const largeFiles = csvFiles.filter((file) => file.size > 300 * 1024 * 1024);
    if (largeFiles.length) {
      const totalSize = largeFiles.reduce((sum, file) => sum + file.size, 0);
      const proceed = window.confirm(
        `${largeFiles.length} selected file(s) total ${(totalSize / 1024 / 1024).toFixed(0)} MB. ` +
          "Browsers may run out of memory above ~300 MB per file. Continue anyway?",
      );
      if (!proceed) return;
    }

    setParsing({
      label:
        csvFiles.length === 1
          ? csvFiles[0].name
          : `${csvFiles.length} CSV files`,
      size: csvFiles.reduce((sum, file) => sum + file.size, 0),
    });

    try {
      const nextPreview: UploadPreview = {};
      for (const file of csvFiles) {
        const parsed = await parseFile(file);
        if (parsed.tracks) nextPreview.tracks = parsed.tracks;
        if (parsed.artists) nextPreview.artists = parsed.artists;
      }

      if (!nextPreview.tracks && !nextPreview.artists) {
        setError("No usable CSV data found.");
        return;
      }

      setPreview(nextPreview);
    } catch (e) {
      setError(
        e instanceof Error
          ? `Parse failed: ${e.message}`
          : "Parse failed - the file may be too large for your browser.",
      );
    } finally {
      setParsing(null);
    }
  }

  function confirm() {
    if (!preview) return;
    if (preview.tracks) {
      setUserTracks(preview.tracks.tracks, preview.tracks.fileName);
    }
    if (preview.artists) {
      setUserArtists(preview.artists.artists, preview.artists.fileName);
    }
    setPreview(null);
  }

  const hasBothPreview = Boolean(preview?.tracks && preview?.artists);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl">Upload data</h1>
        <p className="mt-1 text-sm text-text-muted">
          Bring your own tracks and artist metadata from Kaggle CSV files.
        </p>
      </header>

      {userTracks && !preview && (
        <div className="card flex items-center gap-3 border-brand-violet/30 bg-brand-violet/5">
          <CheckCircle2 className="size-5 text-brand-cyan" />
          <div className="flex-1">
            <p className="text-sm font-medium">
              Using <span className="text-white">{storedFileName}</span> -{" "}
              {userTracks.length} tracks
              {userArtists && (
                <>
                  {" "}
                  + <span className="text-white">{artistFileName}</span> -{" "}
                  {Object.keys(userArtists).length} artists
                </>
              )}
            </p>
            <p className="text-xs text-text-muted">
              The dashboard is now showing this data.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="rounded-full bg-brand-gradient px-4 py-1.5 text-xs font-semibold text-white"
          >
            Open dashboard
          </Link>
          <button
            type="button"
            onClick={clear}
            className="text-xs text-text-muted hover:text-text"
          >
            Remove
          </button>
        </div>
      )}

      {userArtists && !preview && !userTracks && (
        <div className="card flex items-center gap-3 border-brand-cyan/30 bg-brand-cyan/5">
          <CheckCircle2 className="size-5 text-brand-cyan" />
          <div className="flex-1">
            <p className="text-sm font-medium">
              Artist metadata loaded from{" "}
              <span className="text-white">{artistFileName}</span> -{" "}
              {Object.keys(userArtists).length} artists
            </p>
            <p className="text-xs text-text-muted">
              Upload songs.csv next to power the charts and artist pages.
            </p>
          </div>
          <button
            type="button"
            onClick={clearArtists}
            className="text-xs text-text-muted hover:text-text"
          >
            Remove
          </button>
        </div>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void handleFiles(e.dataTransfer.files);
        }}
        className={`card flex flex-col items-center justify-center gap-3 border-2 border-dashed py-16 text-center transition-colors ${
          dragOver
            ? "border-brand-violet bg-brand-violet/10"
            : "border-border hover:border-brand-violet/50"
        }`}
      >
        <UploadCloud className="size-10 text-brand-cyan" />
        <div>
          <p className="text-base font-medium">Drop CSV files here</p>
          <p className="mt-1 text-sm text-text-muted">
            Upload songs.csv and artists.csv together or one at a time - max 1GB each
          </p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-2 rounded-full bg-brand-gradient px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-violet/30"
        >
          Choose files
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          multiple
          aria-label="Upload CSV files"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) void handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {parsing && (
        <div className="card flex items-center gap-3 border-brand-cyan/30 bg-brand-cyan/5">
          <Loader2 className="size-5 animate-spin text-brand-cyan" />
          <div className="flex-1">
            <p className="text-sm font-medium">Parsing {parsing.label}...</p>
            <p className="text-xs text-text-muted">
              {(parsing.size / 1024 / 1024).toFixed(0)} MB total - this may take 30s-2min for large files
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="card border-brand-magenta/40 bg-brand-magenta/5 text-sm text-brand-magenta">
          {error}
        </div>
      )}

      {preview && (
        <div className="space-y-4">
          {preview.tracks && <TrackPreviewCard preview={preview.tracks} />}
          {preview.artists && <ArtistPreviewCard preview={preview.artists} />}
          <div className="card flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:border-text-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirm}
              className="rounded-full bg-brand-gradient px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-violet/30"
            >
              {hasBothPreview
                ? "Use both files"
                : preview.tracks
                  ? "Use track dataset"
                  : "Use artist metadata"}
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="text-base font-semibold">Expected format</h2>
        <p className="mt-1 text-sm text-text-muted">
          Tracks need a header row with these columns. Only{" "}
          <code className="text-text">name</code> and{" "}
          <code className="text-text">artist</code> are required.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-xl border border-border bg-bg/60 p-4 text-xs leading-relaxed text-text-muted">
{`id,name,artist,album,year,popularity,genre,
danceability,energy,valence,tempo,
acousticness,instrumentalness,speechiness`}
        </pre>
        <p className="mt-3 text-xs text-text-subtle">
          Artist metadata can use columns like{" "}
          <code>id,name,followers,popularity,genre,genre_1</code>. Upload both
          files together or one at a time.
        </p>
        <p className="mt-2 text-xs text-text-subtle">
          Tip: download <code>tracks.csv</code> from{" "}
          <a
            href="/data/tracks.csv"
            className="text-brand-cyan hover:underline"
            download
          >
            the demo dataset
          </a>{" "}
          as a starting template.
        </p>
      </div>
    </div>
  );
}

function TrackPreviewCard({ preview }: { preview: TrackPreview }) {
  return (
    <div className="card">
      <div className="flex flex-wrap items-center gap-2">
        <FileText className="size-4 text-brand-cyan" />
        <span className="text-sm font-medium">{preview.fileName}</span>
        <span className="text-xs text-text-muted">
          - {preview.tracks.length} unique tracks
        </span>
        {preview.stats.duplicatesRemoved > 0 && (
          <span className="rounded-full border border-brand-cyan/40 bg-brand-cyan/10 px-2 py-0.5 text-[11px] text-brand-cyan">
            {preview.stats.duplicatesRemoved.toLocaleString()} duplicates merged
          </span>
        )}
      </div>
      <div className="mt-4 overflow-hidden rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-bg-subtle text-xs uppercase tracking-wider text-text-muted">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Artist</th>
              <th className="px-3 py-2">Genre</th>
              <th className="px-3 py-2 text-right">Popularity</th>
            </tr>
          </thead>
          <tbody>
            {preview.tracks.slice(0, 8).map((t) => (
              <tr key={t.id} className="border-t border-border">
                <td className="px-3 py-2">{t.name}</td>
                <td className="px-3 py-2 text-text-muted">{t.artist}</td>
                <td className="px-3 py-2 text-text-muted">{t.genre ?? "-"}</td>
                <td className="px-3 py-2 text-right text-text-muted">
                  {t.popularity ?? "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {preview.tracks.length > 8 && (
          <div className="bg-bg-subtle px-3 py-2 text-xs text-text-muted">
            + {preview.tracks.length - 8} more rows...
          </div>
        )}
      </div>
    </div>
  );
}

function ArtistPreviewCard({ preview }: { preview: ArtistPreview }) {
  return (
    <div className="card">
      <div className="flex flex-wrap items-center gap-2">
        <FileText className="size-4 text-brand-cyan" />
        <span className="text-sm font-medium">{preview.fileName}</span>
        <span className="text-xs text-text-muted">
          - {preview.count.toLocaleString()} artists
        </span>
      </div>
      <div className="mt-4 overflow-hidden rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-bg-subtle text-xs uppercase tracking-wider text-text-muted">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Followers</th>
              <th className="px-3 py-2">Genre</th>
              <th className="px-3 py-2 text-right">Popularity</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(preview.artists)
              .slice(0, 8)
              .map((artist) => (
                <tr key={artist.id ?? artist.name} className="border-t border-border">
                  <td className="px-3 py-2">{artist.name}</td>
                  <td className="px-3 py-2 text-text-muted">
                    {typeof artist.followers === "number"
                      ? artist.followers.toLocaleString()
                      : "-"}
                  </td>
                  <td className="px-3 py-2 text-text-muted">
                    {artist.mainGenre ?? artist.genres?.[0] ?? "-"}
                  </td>
                  <td className="px-3 py-2 text-right text-text-muted">
                    {artist.popularity ?? "-"}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        {preview.count > 8 && (
          <div className="bg-bg-subtle px-3 py-2 text-xs text-text-muted">
            + {preview.count - 8} more artists...
          </div>
        )}
      </div>
    </div>
  );
}
