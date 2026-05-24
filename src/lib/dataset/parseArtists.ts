import Papa from "papaparse";
import type { ArtistMeta } from "@/types/dataset";

export type ArtistsParseResult =
  | { ok: true; artists: Record<string, ArtistMeta>; count: number }
  | { ok: false; error: string };

const ALIASES: Record<string, string> = {
  artist_id: "id",
  spotify_id: "id",
  spotify_artist_id: "id",
  artist_name: "name",
  name: "name",
  followers_total: "followers",
  total_followers: "followers",
  follower_count: "followers",
  followers_count: "followers",
  artist_followers: "followers",
  artist_popularity: "popularity",
  popularity_score: "popularity",
  main_genre: "mainGenre",
  primary_genre: "mainGenre",
  genre: "mainGenre",
  genre_1: "mainGenre",
  genres: "genres",
};

function normalizeHeader(h: string): string {
  const cleaned = h
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (ALIASES[cleaned]) return ALIASES[cleaned];
  if (cleaned.includes("artist") && cleaned.includes("name")) return "name";
  if (cleaned.includes("follower")) return "followers";
  if (cleaned.includes("popularity")) return "popularity";
  if (cleaned.includes("genre")) return "genres";
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

function parseGenres(value: string | undefined): string[] | undefined {
  if (!value) return undefined;
  const raw = value.trim();
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
      /* fall through */
    }
  }
  return raw
    .split(/[;,|]/)
    .map((s) => s.trim().replace(/^['"]|['"]$/g, ""))
    .filter(Boolean);
}

export function isArtistsCsv(headers: string[]): boolean {
  const normalized = headers.map(normalizeHeader);
  const set = new Set(normalized);
  const hasArtistMetadata =
    set.has("followers") || set.has("mainGenre") || set.has("genres");
  const hasTrackColumns = set.has("artist") || set.has("track_name");
  return set.has("name") && hasArtistMetadata && !hasTrackColumns;
}

export function parseArtistsCsv(csv: string): ArtistsParseResult {
  if (!csv.trim()) return { ok: false, error: "Artists CSV is empty" };

  const parsed = parseRows(csv);

  if (parsed.errors.length) {
    const fatal = parsed.errors.find(isFatalParseError);
    if (fatal) return { ok: false, error: fatal.message };
  }

  const rows = parsed.data.filter((row) =>
    Object.values(row).some((value) => String(value ?? "").trim()),
  );
  if (!rows.length) {
    return { ok: false, error: "Artists CSV has no readable data rows" };
  }

  if (!Object.keys(rows[0]).includes("name")) {
    return { ok: false, error: "Artists CSV missing an artist name column" };
  }

  const artists: Record<string, ArtistMeta> = {};
  let count = 0;
  for (const row of rows) {
    if (!row.name?.trim()) continue;
    const name = row.name.trim();
    const key = name.toLowerCase();
    artists[key] = {
      id: row.id?.trim() || undefined,
      name,
      followers: num(row.followers),
      popularity: num(row.popularity),
      genres: parseGenres(row.genres),
      mainGenre: row.mainGenre?.trim() || undefined,
    };
    count++;
  }

  return { ok: true, artists, count };
}
