import "server-only";

const BASE = "https://musicbrainz.org/ws/2";
const UA = "AudioVista/0.1 (https://github.com/your-handle/audiovista)";

export type MBArtistSummary = {
  id: string;
  name: string;
  country?: string;
  type?: string;
  tags: string[];
  beginYear?: number;
  endYear?: number;
};

type SearchResponse = {
  artists?: Array<{
    id: string;
    name: string;
    country?: string;
    type?: string;
    "life-span"?: { begin?: string; end?: string };
    tags?: Array<{ name: string; count: number }>;
  }>;
};

export async function searchArtist(
  name: string,
): Promise<MBArtistSummary | null> {
  const url = `${BASE}/artist/?query=${encodeURIComponent(
    `artist:"${name}"`,
  )}&fmt=json&limit=1`;

  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    next: { revalidate: 60 * 60 * 24 },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as SearchResponse;
  const a = json.artists?.[0];
  if (!a) return null;

  return {
    id: a.id,
    name: a.name,
    country: a.country,
    type: a.type,
    tags:
      a.tags
        ?.sort((x, y) => y.count - x.count)
        .slice(0, 5)
        .map((t) => t.name) ?? [],
    beginYear: yearOf(a["life-span"]?.begin),
    endYear: yearOf(a["life-span"]?.end),
  };
}

function yearOf(date: string | undefined): number | undefined {
  if (!date) return undefined;
  const y = Number(date.slice(0, 4));
  return Number.isFinite(y) ? y : undefined;
}
