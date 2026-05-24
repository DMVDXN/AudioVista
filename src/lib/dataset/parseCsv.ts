import Papa from "papaparse";
import type { Track } from "@/types/dataset";

export type ParseResult =
  | {
      ok: true;
      tracks: Track[];
      stats: { rowsParsed: number; duplicatesRemoved: number };
    }
  | { ok: false; error: string };

const ALIASES: Record<string, string> = {
  track_id: "id",
  spotify_id: "id",
  spotify_track_id: "id",
  track_uri: "id",
  uri: "id",
  track_name: "name",
  song: "name",
  song_name: "name",
  song_title: "name",
  title: "name",
  track_title: "name",
  artists: "artist",
  artist: "artist",
  artist_name: "artist",
  artist_names: "artist",
  track_artist: "artist",
  performer: "artist",
  performer_name: "artist",
  singer: "artist",
  album_name: "album",
  track_album_name: "album",
  release_year: "year",
  released_year: "year",
  year_released: "year",
  release_date: "year",
  released: "year",
  track_album_release_date: "year",
  date: "year",
  track_popularity: "popularity",
  song_popularity: "popularity",
  popularity_score: "popularity",
  track_genre: "genre",
  playlist_genre: "genre",
  playlist_subgenre: "genre",
  genres: "genre",
  primary_genre: "genre",
  main_genre: "genre",
  genre_name: "genre",
  bpm: "tempo",
};

function normalizeHeader(h: string): string {
  const cleaned = h
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (ALIASES[cleaned]) return ALIASES[cleaned];
  if (cleaned.includes("artist") || cleaned.includes("performer")) return "artist";
  if (cleaned.includes("track") && cleaned.includes("name")) return "name";
  if (cleaned.includes("song") && cleaned.includes("name")) return "name";
  if (cleaned.includes("title")) return "name";
  if (cleaned.includes("album") && cleaned.includes("name")) return "album";
  if (cleaned.includes("release") && cleaned.includes("date")) return "year";
  if (cleaned.includes("genre")) return "genre";
  if (cleaned.includes("popularity")) return "popularity";
  return cleaned;
}

function isFatalParseError(error: Papa.ParseError): boolean {
  return error.type !== "FieldMismatch" && error.code !== "UndetectableDelimiter";
}

function guessDelimiter(csv: string): string | undefined {
  const sample = csv.slice(0, 20000);
  const lines = sample.split(/\r\n|\n|\r/).filter((line) => line.trim()).slice(0, 10);
  const delimiters = [",", "\t", ";", "|"];
  let best: { delimiter: string; score: number } | null = null;

  for (const delimiter of delimiters) {
    const counts = lines.map((line) => line.split(delimiter).length);
    const useful = counts.filter((count) => count > 1);
    if (!useful.length) continue;
    const first = useful[0];
    const consistency = useful.filter((count) => count === first).length;
    const score = first * 10 + consistency;
    if (!best || score > best.score) best = { delimiter, score };
  }

  return best?.delimiter;
}

function parseRows(csv: string): Papa.ParseResult<Record<string, string>> {
  const cleaned = csv.startsWith("\uFEFF") ? csv.slice(1) : csv;
  const delimiter = guessDelimiter(cleaned);
  const parsed = Papa.parse<Record<string, string>>(cleaned, {
    header: true,
    skipEmptyLines: "greedy",
    delimiter,
    transformHeader: normalizeHeader,
  });

  if (parsed.data.length || !delimiter) return parsed;

  return Papa.parse<Record<string, string>>(cleaned, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: normalizeHeader,
  });
}

function num(v: unknown): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : undefined;
}

function year(v: unknown): number | undefined {
  const raw = String(v ?? "").trim();
  if (!raw) return undefined;
  const match = raw.match(/\b(19|20)\d{2}\b/);
  return match ? Number(match[0]) : num(raw);
}

function splitArtists(value: string | undefined): string[] {
  if (!value) return [];
  let raw = value.trim();

  if (
    (raw.startsWith("[") && raw.endsWith("]")) ||
    (raw.startsWith("(") && raw.endsWith(")"))
  ) {
    try {
      const parsed = JSON.parse(raw.replace(/'/g, '"'));
      if (Array.isArray(parsed)) {
        return parsed.map((s) => String(s).trim()).filter(Boolean);
      }
    } catch {
      raw = raw.slice(1, -1);
    }
  }

  return raw
    .split(/[;,]|\s+(?:feat\.?|ft\.?|&|x|with)\s+/i)
    .map((s) => s.trim().replace(/^['"]|['"]$/g, ""))
    .filter(Boolean);
}

export function parseTracksCsv(csv: string): ParseResult {
  if (!csv.trim()) return { ok: false, error: "CSV is empty" };

  const parsed = parseRows(csv);

  if (parsed.errors.length) {
    const fatal = parsed.errors.find(isFatalParseError);
    if (fatal) return { ok: false, error: fatal.message };
  }

  const rows = parsed.data.filter((row) =>
    Object.values(row).some((value) => String(value ?? "").trim()),
  );
  if (!rows.length) {
    return {
      ok: false,
      error:
        "CSV has a header but no readable data rows. Check that the file is not compressed or empty.",
    };
  }

  const headers = Object.keys(rows[0] ?? {});
  if (!headers.includes("name") || !headers.includes("artist")) {
    return {
      ok: false,
      error: `Couldn't find track title and artist columns. Common aliases are supported, including "track_name", "track_artist", "song_title", and "artists". Found: ${headers.join(", ")}`,
    };
  }

  const tracks: Track[] = rows
    .filter((row) => row.name?.trim() && row.artist?.trim())
    .map((row, i) => {
      const all = splitArtists(row.artist);
      return {
        id: row.id?.trim() || `${row.name.trim()}-${row.artist.trim()}-${i + 1}`,
        name: row.name.trim(),
        artist: all[0] ?? row.artist.trim(),
        allArtists: all.length > 1 ? all : undefined,
        album: row.album?.trim() || undefined,
        year: year(row.year),
        popularity: num(row.popularity),
        genre: row.genre?.trim() || undefined,
        lyrics: row.lyrics?.trim() || undefined,
        features: {
          danceability: num(row.danceability) ?? 0,
          energy: num(row.energy) ?? 0,
          valence: num(row.valence) ?? 0,
          tempo: num(row.tempo) ?? 0,
          acousticness: num(row.acousticness) ?? 0,
          instrumentalness: num(row.instrumentalness) ?? 0,
          speechiness: num(row.speechiness) ?? 0,
        },
      };
    });

  if (!tracks.length) {
    return {
      ok: false,
      error:
        "No valid track rows found. The file needs at least one non-empty song title and artist value.",
    };
  }

  const { unique, duplicatesRemoved } = dedupe(tracks);

  return {
    ok: true,
    tracks: unique,
    stats: { rowsParsed: tracks.length, duplicatesRemoved },
  };
}

function dedupe(tracks: Track[]): { unique: Track[]; duplicatesRemoved: number } {
  const seen = new Map<string, Track>();
  const genresPerKey = new Map<string, Set<string>>();
  let removed = 0;

  for (const t of tracks) {
    const idKey = isLikelySpotifyId(t.id) ? `id:${t.id}` : null;
    const fallbackKey = `na:${t.name.toLowerCase()}|${t.artist.toLowerCase()}`;
    const key = idKey ?? fallbackKey;

    const genres = genresPerKey.get(key) ?? new Set<string>();
    if (t.genre) genres.add(t.genre);
    genresPerKey.set(key, genres);

    if (seen.has(key)) {
      removed += 1;
      continue;
    }
    seen.set(key, t);
  }

  const unique = Array.from(seen.entries()).map(([key, t]) => {
    const genres = genresPerKey.get(key);
    if (genres && genres.size > 1) {
      return { ...t, genre: Array.from(genres).slice(0, 3).join(", ") };
    }
    return t;
  });

  return { unique, duplicatesRemoved: removed };
}

function isLikelySpotifyId(id: string): boolean {
  return /^[A-Za-z0-9]{22}$/.test(id);
}
