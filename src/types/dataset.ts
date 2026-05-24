export type Track = {
  id: string;
  name: string;
  artist: string;
  allArtists?: string[];
  album?: string;
  year?: number;
  popularity?: number;
  genre?: string;
  lyrics?: string;
  features?: AudioFeatures;
};

export type AudioFeatures = {
  danceability: number;
  energy: number;
  valence: number;
  tempo: number;
  acousticness: number;
  instrumentalness: number;
  speechiness: number;
};

export type Artist = {
  id: string;
  name: string;
  genres?: string[];
  popularity?: number;
};

export type Listen = {
  trackId: string;
  playedAt: string;
};

export type ArtistMeta = {
  id?: string;
  name: string;
  followers?: number;
  popularity?: number;
  genres?: string[];
  mainGenre?: string;
};

export type ArtistAggregate = {
  artist: string;
  playCount: number;
  avgPopularity: number;
};

export type GenreAggregate = {
  genre: string;
  share: number;
  count: number;
};
