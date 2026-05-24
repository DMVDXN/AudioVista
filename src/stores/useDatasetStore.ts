"use client";

import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import { get as idbGet, set as idbSet, del as idbDel } from "idb-keyval";
import type { ArtistMeta, Track } from "@/types/dataset";

const idbStorage: StateStorage = {
  getItem: async (name) => (await idbGet<string>(name)) ?? null,
  setItem: async (name, value) => {
    await idbSet(name, value);
  },
  removeItem: async (name) => {
    await idbDel(name);
  },
};

type DatasetState = {
  userTracks: Track[] | null;
  userArtists: Record<string, ArtistMeta> | null;
  fileName: string | null;
  artistFileName: string | null;
  uploadedAt: string | null;
  artistsUploadedAt: string | null;
  setUserTracks: (tracks: Track[], fileName: string) => void;
  setUserArtists: (artists: Record<string, ArtistMeta>, fileName: string) => void;
  clearUserTracks: () => void;
  clearUserArtists: () => void;
};

export const useDatasetStore = create<DatasetState>()(
  persist(
    (set) => ({
      userTracks: null,
      userArtists: null,
      fileName: null,
      artistFileName: null,
      uploadedAt: null,
      artistsUploadedAt: null,
      setUserTracks: (tracks, fileName) =>
        set({
          userTracks: tracks,
          fileName,
          uploadedAt: new Date().toISOString(),
        }),
      setUserArtists: (artists, fileName) =>
        set({
          userArtists: artists,
          artistFileName: fileName,
          artistsUploadedAt: new Date().toISOString(),
        }),
      clearUserTracks: () =>
        set({
          userTracks: null,
          userArtists: null,
          fileName: null,
          artistFileName: null,
          uploadedAt: null,
          artistsUploadedAt: null,
        }),
      clearUserArtists: () =>
        set({
          userArtists: null,
          artistFileName: null,
          artistsUploadedAt: null,
        }),
    }),
    {
      name: "audiovista:dataset",
      storage: createJSONStorage(() => idbStorage),
    },
  ),
);
