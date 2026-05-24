"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useDatasetStore } from "@/stores/useDatasetStore";
import type { Track } from "@/types/dataset";

const PERIODS = [
  { value: "7day", label: "Last 7 days" },
  { value: "1month", label: "Last month" },
  { value: "3month", label: "Last 3 months" },
  { value: "6month", label: "Last 6 months" },
  { value: "12month", label: "Last year" },
  { value: "overall", label: "All time" },
];

export default function LastfmPage() {
  const router = useRouter();
  const setUserTracks = useDatasetStore((s) => s.setUserTracks);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [username, setUsername] = useState("");
  const [period, setPeriod] = useState("6month");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/lastfm/sync", { method: "HEAD" })
      .then((r) => setConfigured(r.status !== 503))
      .catch(() => setConfigured(false));
  }, []);

  async function sync() {
    if (!username.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/lastfm/sync?username=${encodeURIComponent(username)}&period=${period}`,
      );
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Sync failed");
      }
      const json = (await res.json()) as { tracks: Track[]; fileName: string };
      setUserTracks(json.tracks, json.fileName);
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl">Connect Last.fm</h1>
        <p className="mt-1 text-sm text-text-muted">
          Pull your top tracks from your Last.fm scrobble history.
        </p>
      </header>

      {configured === false && (
        <div className="card border-brand-magenta/30 bg-brand-magenta/5 text-sm text-brand-magenta">
          Last.fm is not configured. Add{" "}
          <code className="text-text">LASTFM_API_KEY</code> to your{" "}
          <code className="text-text">.env.local</code> — get a free key at{" "}
          <a
            href="https://www.last.fm/api/account/create"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            last.fm/api/account/create
          </a>
          .
        </div>
      )}

      <div className="card max-w-xl">
        <label className="block">
          <span className="block text-xs uppercase tracking-wider text-text-muted">
            Last.fm username
          </span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. rj"
            className="input mt-1.5"
            disabled={!configured}
          />
        </label>

        <label className="mt-4 block">
          <span className="block text-xs uppercase tracking-wider text-text-muted">
            Time period
          </span>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="select mt-1.5"
            disabled={!configured}
          >
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        {error && (
          <p className="mt-3 text-sm text-brand-magenta">{error}</p>
        )}

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={sync}
            disabled={!configured || loading || !username.trim()}
            className="inline-flex items-center gap-2 rounded-full bg-brand-gradient px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-violet/30 disabled:opacity-40"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            Sync from Last.fm
          </button>
        </div>
      </div>

      <p className="text-xs text-text-subtle">
        Note: Last.fm doesn&apos;t expose audio features, so taste-profile charts
        will be empty for synced tracks. Combine with a Kaggle CSV to fill in
        feature data.
      </p>
    </div>
  );
}
