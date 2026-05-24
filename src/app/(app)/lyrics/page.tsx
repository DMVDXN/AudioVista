"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ExternalLink, Loader2, Search } from "lucide-react";
import { SentimentArc } from "@/components/charts/SentimentArc";
import { EmotionRadar } from "@/components/charts/EmotionRadar";
import { WordCloudList } from "@/components/lyrics/WordCloudList";
import type { LyricAnalysis } from "@/lib/nlp/analyze";

type GeniusSong = {
  id: number;
  title: string;
  fullTitle: string;
  artist: string;
  url: string;
  imageUrl?: string;
};

const SAMPLE = `I see the light in your eyes when you look at me
Every word that you say is a melody
I was lost in the dark but you found me
Now we dance in the rain and we're finally free`;

export default function LyricsPage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LyricAnalysis | null>(null);

  const [geniusConfigured, setGeniusConfigured] = useState<boolean | null>(null);
  const [track, setTrack] = useState("");
  const [artist, setArtist] = useState("");
  const [geniusLoading, setGeniusLoading] = useState(false);
  const [geniusError, setGeniusError] = useState<string | null>(null);
  const [songs, setSongs] = useState<GeniusSong[]>([]);

  useEffect(() => {
    fetch("/api/genius/search", { method: "HEAD" })
      .then((res) => setGeniusConfigured(res.ok))
      .catch(() => setGeniusConfigured(false));
  }, []);

  async function analyze() {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/lyrics/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "Failed" }));
        throw new Error(error ?? "Failed");
      }
      setResult((await res.json()) as LyricAnalysis);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function searchGenius() {
    const query = [artist, track].filter((part) => part.trim()).join(" ");
    if (!query) return;
    setGeniusLoading(true);
    setGeniusError(null);
    setSongs([]);

    try {
      const params = new URLSearchParams();
      if (artist.trim()) params.set("artist", artist.trim());
      if (track.trim()) params.set("track", track.trim());
      const res = await fetch(`/api/genius/search?${params.toString()}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Genius search failed");
      setSongs((json.songs ?? []) as GeniusSong[]);
    } catch (e) {
      setGeniusError(e instanceof Error ? e.message : "Genius search failed");
    } finally {
      setGeniusLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl">Lyric emotion visualizer</h1>
        <p className="mt-1 text-sm text-text-muted">
          Find official Genius song pages, then paste lyrics to analyze sentiment,
          emotions, and keywords.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <div className="card">
          <div className="flex items-center gap-2">
            <Search className="size-4 text-brand-cyan" />
            <h2 className="text-base font-semibold">Genius search</h2>
          </div>
          <p className="mt-1 text-sm text-text-muted">
            Search the official Genius API for matching song pages.
          </p>

          {geniusConfigured === false && (
            <div className="mt-4 rounded-xl border border-brand-magenta/30 bg-brand-magenta/5 p-3 text-xs text-brand-magenta">
              Add <code className="text-text">GENIUS_ACCESS_TOKEN</code> to{" "}
              <code className="text-text">.env.local</code>, then restart the
              dev server.
            </div>
          )}

          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="block text-xs uppercase tracking-wider text-text-muted">
                Track
              </span>
              <input
                value={track}
                onChange={(e) => setTrack(e.target.value)}
                placeholder="e.g. Bad Guy"
                className="input mt-1.5"
                disabled={geniusConfigured === false}
              />
            </label>
            <label className="block">
              <span className="block text-xs uppercase tracking-wider text-text-muted">
                Artist
              </span>
              <input
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="e.g. Billie Eilish"
                className="input mt-1.5"
                disabled={geniusConfigured === false}
              />
            </label>
          </div>

          <button
            type="button"
            onClick={searchGenius}
            disabled={
              geniusLoading ||
              geniusConfigured === false ||
              (!track.trim() && !artist.trim())
            }
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-gradient px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-violet/30 disabled:opacity-40"
          >
            {geniusLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Search className="size-4" />
            )}
            Search Genius
          </button>

          {geniusError && (
            <p className="mt-3 text-sm text-brand-magenta">{geniusError}</p>
          )}
        </div>

        <div className="card">
          <h2 className="text-base font-semibold">Matches</h2>
          <p className="mt-1 text-sm text-text-muted">
            Open the matching Genius page, then paste the lyrics below for
            analysis.
          </p>

          {!songs.length && !geniusLoading && (
            <div className="mt-5 rounded-xl border border-border bg-bg/40 p-5 text-sm text-text-muted">
              Search by track and artist to see Genius results.
            </div>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {songs.map((song) => (
              <a
                key={song.id}
                href={song.url}
                target="_blank"
                rel="noreferrer"
                className="group flex gap-3 rounded-xl border border-border bg-bg/40 p-3 transition-colors hover:border-brand-cyan/50"
              >
                {song.imageUrl && (
                  <Image
                    src={song.imageUrl}
                    alt=""
                    width={56}
                    height={56}
                    className="size-14 rounded-lg object-cover"
                    unoptimized
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium group-hover:text-brand-cyan">
                    {song.title}
                  </div>
                  <div className="truncate text-xs text-text-muted">
                    {song.artist}
                  </div>
                  <div className="mt-2 inline-flex items-center gap-1 text-xs text-brand-cyan">
                    Open on Genius <ExternalLink className="size-3" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium" htmlFor="lyrics">
            Lyrics
          </label>
          <button
            type="button"
            onClick={() => setText(SAMPLE)}
            className="text-xs text-text-muted hover:text-text"
          >
            Try sample
          </button>
        </div>
        <textarea
          id="lyrics"
          rows={10}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste lyrics here..."
          className="mt-2 w-full resize-y rounded-xl border border-border bg-bg/60 px-4 py-3 text-sm placeholder:text-text-subtle focus:border-brand-violet/60 focus:outline-none"
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-text-subtle">
            {text.trim() ? `${text.trim().split(/\s+/).length} words` : "-"}
          </span>
          <button
            type="button"
            onClick={analyze}
            disabled={loading || !text.trim()}
            className="rounded-full bg-brand-gradient px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-violet/30 transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {loading ? "Analyzing..." : "Analyze"}
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-brand-magenta">{error}</p>}
      </div>

      {result && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card flex flex-wrap items-center gap-6 lg:col-span-2">
            <div>
              <p className="text-xs uppercase tracking-wider text-text-muted">
                Overall sentiment
              </p>
              <p className="mt-1 font-serif text-3xl capitalize">
                {result.overall.label}
              </p>
              <p className="text-xs text-text-subtle">
                score {result.overall.score} - comparative{" "}
                {result.overall.comparative}
              </p>
            </div>
            <div className="ml-auto flex gap-6 text-sm text-text-muted">
              <div>
                <div className="text-xs uppercase tracking-wider">Lines</div>
                <div className="text-text">{result.meta.lineCount}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider">Words</div>
                <div className="text-text">{result.meta.wordCount}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-base font-semibold">Sentiment arc</h2>
            <p className="mt-0.5 text-sm text-text-muted">
              How emotion shifts through the song.
            </p>
            <div className="mt-4">
              <SentimentArc data={result.arc} />
            </div>
          </div>
          <div className="card">
            <h2 className="text-base font-semibold">Emotions</h2>
            <p className="mt-0.5 text-sm text-text-muted">
              Detected emotional themes.
            </p>
            <div className="mt-4">
              <EmotionRadar data={result.emotions} />
            </div>
          </div>
          <div className="card lg:col-span-2">
            <h2 className="text-base font-semibold">Keyword cloud</h2>
            <p className="mt-0.5 text-sm text-text-muted">
              Most frequent meaningful words.
            </p>
            <WordCloudList words={result.words} />
          </div>
        </div>
      )}
    </div>
  );
}
