import "server-only";
import type { ArtistMeta, AudioFeatures, Track } from "@/types/dataset";

export type SpotifySyncMode =
  | "short_term"
  | "medium_term"
  | "long_term"
  | "recent"
  | "saved"
  | "all";

type SpotifyImage = { url: string; width?: number; height?: number };

type SpotifyArtistRef = {
  id: string;
  name: string;
  external_urls?: { spotify?: string };
};

type SpotifyTrack = {
  id: string;
  name: string;
  popularity?: number;
  album: {
    name: string;
    release_date?: string;
    images?: SpotifyImage[];
  };
  artists: SpotifyArtistRef[];
};

type SpotifyArtist = {
  id: string;
  name: string;
  genres: string[];
  popularity?: number;
  followers?: { total?: number };
};

type SpotifyAudioFeatures = {
  id: string;
  danceability: number;
  energy: number;
  valence: number;
  tempo: number;
  acousticness: number;
  instrumentalness: number;
  speechiness: number;
};

type TopTracksResponse = { items: SpotifyTrack[] };
type TopArtistsResponse = { items: SpotifyArtist[] };
type SavedTracksResponse = { items: { track: SpotifyTrack; added_at: string }[] };
type RecentTracksResponse = { items: { track: SpotifyTrack; played_at: string }[] };
type AudioFeaturesResponse = { audio_features: (SpotifyAudioFeatures | null)[] };

export type SpotifySyncResult = {
  tracks: Track[];
  artists: Record<string, ArtistMeta>;
  fileName: string;
  summary: {
    mode: SpotifySyncMode;
    trackCount: number;
    artistCount: number;
    sources: string[];
    featuresAttached: number;
  };
};

async function api<T>(path: string, accessToken: string): Promise<T | null> {
  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

export async function fetchSpotifyLibrary(
  accessToken: string,
  mode: SpotifySyncMode = "medium_term",
): Promise<SpotifySyncResult> {
  const sources: string[] = [];
  const trackBuckets: SpotifyTrack[][] = [];

  if (mode === "all") {
    const [shortTracks, mediumTracks, longTracks, recentTracks, savedTracks] =
      await Promise.all([
        fetchTopTracks(accessToken, "short_term"),
        fetchTopTracks(accessToken, "medium_term"),
        fetchTopTracks(accessToken, "long_term"),
        fetchRecentTracks(accessToken),
        fetchSavedTracks(accessToken),
      ]);
    addBucket(trackBuckets, sources, shortTracks, "top tracks: 4 weeks");
    addBucket(trackBuckets, sources, mediumTracks, "top tracks: 6 months");
    addBucket(trackBuckets, sources, longTracks, "top tracks: all time");
    addBucket(trackBuckets, sources, recentTracks, "recently played");
    addBucket(trackBuckets, sources, savedTracks, "saved tracks");
  } else if (mode === "recent") {
    addBucket(trackBuckets, sources, await fetchRecentTracks(accessToken), "recently played");
  } else if (mode === "saved") {
    addBucket(trackBuckets, sources, await fetchSavedTracks(accessToken), "saved tracks");
  } else {
    addBucket(
      trackBuckets,
      sources,
      await fetchTopTracks(accessToken, mode),
      `top tracks: ${labelRange(mode)}`,
    );
  }

  const spotifyTracks = dedupeSpotifyTracks(trackBuckets.flat());
  const artistIds = unique(
    spotifyTracks.flatMap((track) => track.artists.map((artist) => artist.id)),
  );
  const artistMeta = await fetchArtists(accessToken, artistIds);
  const features = await fetchAudioFeatures(accessToken, spotifyTracks.map((t) => t.id));

  const tracks = spotifyTracks.map((track, index) =>
    toTrack(track, index, artistMeta, features.get(track.id)),
  );
  const artists = toArtistMetadata(artistMeta);

  return {
    tracks,
    artists,
    fileName: `spotify-${mode}.json`,
    summary: {
      mode,
      trackCount: tracks.length,
      artistCount: Object.keys(artists).length,
      sources,
      featuresAttached: tracks.filter((track) => track.features).length,
    },
  };
}

export async function fetchTopAsTracks(
  accessToken: string,
  timeRange: "short_term" | "medium_term" | "long_term" = "medium_term",
): Promise<Track[]> {
  return (await fetchSpotifyLibrary(accessToken, timeRange)).tracks;
}

async function fetchTopTracks(
  accessToken: string,
  timeRange: "short_term" | "medium_term" | "long_term",
): Promise<SpotifyTrack[]> {
  const data = await api<TopTracksResponse>(
    `/me/top/tracks?time_range=${timeRange}&limit=50`,
    accessToken,
  );
  return data?.items ?? [];
}

async function fetchRecentTracks(accessToken: string): Promise<SpotifyTrack[]> {
  const data = await api<RecentTracksResponse>(
    "/me/player/recently-played?limit=50",
    accessToken,
  );
  return data?.items.map((item) => item.track).filter(Boolean) ?? [];
}

async function fetchSavedTracks(accessToken: string): Promise<SpotifyTrack[]> {
  const data = await api<SavedTracksResponse>("/me/tracks?limit=50", accessToken);
  return data?.items.map((item) => item.track).filter(Boolean) ?? [];
}

async function fetchArtists(
  accessToken: string,
  artistIds: string[],
): Promise<Map<string, SpotifyArtist>> {
  const map = new Map<string, SpotifyArtist>();
  for (const ids of chunks(artistIds, 50)) {
    const data = await api<{ artists: SpotifyArtist[] }>(
      `/artists?ids=${ids.join(",")}`,
      accessToken,
    );
    for (const artist of data?.artists ?? []) {
      map.set(artist.id, artist);
    }
  }

  const topArtists = await Promise.all([
    api<TopArtistsResponse>("/me/top/artists?time_range=short_term&limit=50", accessToken),
    api<TopArtistsResponse>("/me/top/artists?time_range=medium_term&limit=50", accessToken),
    api<TopArtistsResponse>("/me/top/artists?time_range=long_term&limit=50", accessToken),
  ]);

  for (const response of topArtists) {
    for (const artist of response?.items ?? []) {
      map.set(artist.id, artist);
    }
  }

  return map;
}

async function fetchAudioFeatures(
  accessToken: string,
  trackIds: string[],
): Promise<Map<string, AudioFeatures>> {
  const map = new Map<string, AudioFeatures>();
  for (const ids of chunks(unique(trackIds), 100)) {
    const data = await api<AudioFeaturesResponse>(
      `/audio-features?ids=${ids.join(",")}`,
      accessToken,
    );
    for (const feature of data?.audio_features ?? []) {
      if (!feature) continue;
      map.set(feature.id, {
        danceability: feature.danceability,
        energy: feature.energy,
        valence: feature.valence,
        tempo: feature.tempo,
        acousticness: feature.acousticness,
        instrumentalness: feature.instrumentalness,
        speechiness: feature.speechiness,
      });
    }
  }
  return map;
}

function toTrack(
  track: SpotifyTrack,
  index: number,
  artists: Map<string, SpotifyArtist>,
  features?: AudioFeatures,
): Track {
  const all = track.artists.map((artist) => artist.name);
  const primaryArtist = track.artists[0];
  const primaryMeta = primaryArtist ? artists.get(primaryArtist.id) : undefined;

  return {
    id: track.id || `${track.name}-${all[0] ?? "unknown"}-${index + 1}`,
    name: track.name,
    artist: all[0] ?? "Unknown artist",
    allArtists: all.length > 1 ? all : undefined,
    album: track.album.name,
    year: track.album.release_date
      ? Number(track.album.release_date.slice(0, 4))
      : undefined,
    popularity: track.popularity,
    genre: primaryMeta?.genres[0],
    features,
  };
}

function toArtistMetadata(
  artists: Map<string, SpotifyArtist>,
): Record<string, ArtistMeta> {
  const result: Record<string, ArtistMeta> = {};
  for (const artist of artists.values()) {
    result[artist.name.toLowerCase()] = {
      id: artist.id,
      name: artist.name,
      followers: artist.followers?.total,
      popularity: artist.popularity,
      genres: artist.genres,
      mainGenre: artist.genres[0],
    };
  }
  return result;
}

function addBucket(
  buckets: SpotifyTrack[][],
  sources: string[],
  tracks: SpotifyTrack[],
  label: string,
) {
  if (!tracks.length) return;
  buckets.push(tracks);
  sources.push(label);
}

function dedupeSpotifyTracks(tracks: SpotifyTrack[]): SpotifyTrack[] {
  const seen = new Map<string, SpotifyTrack>();
  for (const track of tracks) {
    const key = track.id || `${track.name}|${track.artists.map((a) => a.name).join(",")}`;
    if (!seen.has(key)) seen.set(key, track);
  }
  return Array.from(seen.values());
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function chunks<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}

function labelRange(range: "short_term" | "medium_term" | "long_term"): string {
  if (range === "short_term") return "4 weeks";
  if (range === "medium_term") return "6 months";
  return "all time";
}
