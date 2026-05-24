"use client";

import { useEffect, useState } from "react";
import { useDatasetStore } from "@/stores/useDatasetStore";
import type { Track } from "@/types/dataset";

type Status = "loading" | "ready" | "error";

export function useActiveDataset() {
  const userTracks = useDatasetStore((s) => s.userTracks);
  const [demo, setDemo] = useState<Track[] | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (userTracks) {
      setStatus("ready");
      return;
    }
    fetch("/api/dataset/demo")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load demo data");
        const json = (await res.json()) as { tracks: Track[] };
        if (!cancelled) {
          setDemo(json.tracks);
          setStatus("ready");
        }
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load");
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [userTracks]);

  const tracks = userTracks ?? demo ?? [];
  const source: "user" | "demo" = userTracks ? "user" : "demo";

  return { tracks, source, status, error };
}
