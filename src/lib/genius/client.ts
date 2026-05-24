export type GeniusSongResult = {
  id: number;
  title: string;
  fullTitle: string;
  artist: string;
  url: string;
  imageUrl?: string;
};

type GeniusHit = {
  type: string;
  result: {
    id: number;
    title: string;
    full_title: string;
    url: string;
    song_art_image_thumbnail_url?: string;
    song_art_image_url?: string;
    primary_artist?: {
      name: string;
    };
  };
};

type GeniusSearchResponse = {
  response?: {
    hits?: GeniusHit[];
  };
  meta?: {
    status?: number;
    message?: string;
  };
};

export const isGeniusConfigured = Boolean(process.env.GENIUS_ACCESS_TOKEN);

export async function searchGeniusSongs(query: string): Promise<GeniusSongResult[]> {
  const token = process.env.GENIUS_ACCESS_TOKEN;
  if (!token) throw new Error("GENIUS_ACCESS_TOKEN is not set");

  const res = await fetch(
    `https://api.genius.com/search?q=${encodeURIComponent(query)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      next: { revalidate: 60 * 60 * 24 },
    },
  );

  if (!res.ok) {
    throw new Error(`Genius search failed with HTTP ${res.status}`);
  }

  const json = (await res.json()) as GeniusSearchResponse;
  const hits = json.response?.hits ?? [];

  return hits
    .filter((hit) => hit.type === "song")
    .slice(0, 8)
    .map((hit) => ({
      id: hit.result.id,
      title: hit.result.title,
      fullTitle: hit.result.full_title,
      artist: hit.result.primary_artist?.name ?? "Unknown artist",
      url: hit.result.url,
      imageUrl:
        hit.result.song_art_image_thumbnail_url ??
        hit.result.song_art_image_url,
    }));
}
