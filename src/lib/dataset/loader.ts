import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import Papa from "papaparse";
import type { Track } from "@/types/dataset";

type RawRow = {
  id: string;
  name: string;
  artist: string;
  album?: string;
  year?: string;
  popularity?: string;
  danceability?: string;
  energy?: string;
  valence?: string;
  tempo?: string;
  acousticness?: string;
  instrumentalness?: string;
  speechiness?: string;
  genre?: string;
};

let cache: Track[] | null = null;

export async function loadDemoTracks(): Promise<Track[]> {
  if (cache) return cache;
  const filePath = path.join(process.cwd(), "public", "data", "tracks.csv");
  const csv = await readFile(filePath, "utf-8");
  const parsed = Papa.parse<RawRow>(csv, {
    header: true,
    skipEmptyLines: true,
  });

  const tracks: Track[] = parsed.data.map((row) => ({
    id: row.id,
    name: row.name,
    artist: row.artist,
    album: row.album,
    year: row.year ? Number(row.year) : undefined,
    popularity: row.popularity ? Number(row.popularity) : undefined,
    genre: row.genre,
    features: {
      danceability: Number(row.danceability ?? 0),
      energy: Number(row.energy ?? 0),
      valence: Number(row.valence ?? 0),
      tempo: Number(row.tempo ?? 0),
      acousticness: Number(row.acousticness ?? 0),
      instrumentalness: Number(row.instrumentalness ?? 0),
      speechiness: Number(row.speechiness ?? 0),
    },
  }));

  cache = tracks;
  return tracks;
}
