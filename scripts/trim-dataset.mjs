#!/usr/bin/env node
/**
 * Trim a large Spotify-style CSV down to the top-N tracks by popularity.
 *
 * Usage:
 *   node scripts/trim-dataset.mjs <input.csv> [--top 50000] [--out tracks.csv] [--drop-lyrics]
 *
 * Example:
 *   node scripts/trim-dataset.mjs ./songs.csv --top 50000 --out public/data/tracks.csv
 *
 * Defaults: top=50000, out=trimmed.csv. The script streams the file so it
 * works on 400MB inputs without exhausting memory.
 */
import { createReadStream } from "node:fs";
import { writeFile } from "node:fs/promises";
import { createInterface } from "node:readline";
import { argv, exit } from "node:process";

function parseArgs() {
  const args = argv.slice(2);
  if (!args.length || args.includes("--help") || args.includes("-h")) {
    console.log(
      "Usage: node scripts/trim-dataset.mjs <input.csv> [--top N] [--out path] [--drop-lyrics]",
    );
    exit(0);
  }
  const positional = args.filter((a) => !a.startsWith("--"));
  const input = positional[0];
  const top = Number(getFlag(args, "--top") ?? 50000);
  const out = getFlag(args, "--out") ?? "trimmed.csv";
  const dropLyrics = args.includes("--drop-lyrics");
  return { input, top, out, dropLyrics };
}

function getFlag(args, name) {
  const i = args.indexOf(name);
  if (i === -1) return null;
  return args[i + 1];
}

// RFC4180-ish CSV line parser (handles quoted fields with commas)
function parseCsvLine(line) {
  const result = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      result.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
}

function escapeCsv(value) {
  const s = String(value ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

async function main() {
  const { input, top, out, dropLyrics } = parseArgs();
  if (!input) {
    console.error("Missing input file. Run with --help for usage.");
    exit(1);
  }

  const stream = createReadStream(input, { encoding: "utf-8" });
  const rl = createInterface({ input: stream, crlfDelay: Infinity });

  let header = null;
  let popIdx = -1;
  let lyricsIdx = -1;
  let rowCount = 0;
  const heap = []; // simple array; we'll sort at the end

  for await (const line of rl) {
    if (!header) {
      header = parseCsvLine(line).map((h) => h.trim());
      popIdx = header.findIndex(
        (h) => h.toLowerCase() === "popularity",
      );
      lyricsIdx = header.findIndex((h) => h.toLowerCase() === "lyrics");
      if (popIdx === -1) {
        console.warn(
          "No 'popularity' column — keeping first N rows instead of sorting.",
        );
      }
      continue;
    }
    const fields = parseCsvLine(line);
    if (fields.length < header.length / 2) continue; // skip junk rows
    const pop = popIdx >= 0 ? Number(fields[popIdx]) || 0 : 0;
    heap.push({ pop, fields });
    rowCount++;
    if (rowCount % 50000 === 0) {
      process.stdout.write(`\rRead ${rowCount.toLocaleString()} rows…`);
    }
  }
  process.stdout.write(
    `\rRead ${rowCount.toLocaleString()} rows total.       \n`,
  );

  if (popIdx >= 0) {
    heap.sort((a, b) => b.pop - a.pop);
  }
  const kept = heap.slice(0, top);
  console.log(`Keeping top ${kept.length.toLocaleString()} by popularity.`);

  const outHeader = dropLyrics && lyricsIdx >= 0
    ? header.filter((_, i) => i !== lyricsIdx)
    : header;

  const lines = [outHeader.map(escapeCsv).join(",")];
  for (const { fields } of kept) {
    const row =
      dropLyrics && lyricsIdx >= 0
        ? fields.filter((_, i) => i !== lyricsIdx)
        : fields;
    lines.push(row.map(escapeCsv).join(","));
  }

  await writeFile(out, lines.join("\n"), "utf-8");
  console.log(`Wrote ${out} (${(lines.length - 1).toLocaleString()} rows).`);
}

main().catch((e) => {
  console.error(e);
  exit(1);
});
