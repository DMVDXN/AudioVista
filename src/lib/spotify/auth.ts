import type { NextAuthOptions } from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";

const SCOPES = [
  "user-read-email",
  "user-top-read",
  "user-read-recently-played",
  "user-library-read",
].join(" ");

export const isSpotifyConfigured = Boolean(
  process.env.SPOTIFY_CLIENT_ID &&
    process.env.SPOTIFY_CLIENT_SECRET &&
    process.env.NEXTAUTH_SECRET,
);

async function refresh(token: {
  refreshToken?: string;
}): Promise<{ accessToken?: string; expiresAt?: number; refreshToken?: string }> {
  if (!token.refreshToken) return {};
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
        ).toString("base64"),
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: token.refreshToken,
    }),
  });
  if (!res.ok) return {};
  const json = (await res.json()) as {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
  };
  return {
    accessToken: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
    refreshToken: json.refresh_token ?? token.refreshToken,
  };
}

export const authOptions: NextAuthOptions = {
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID ?? "",
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET ?? "",
      authorization: { params: { scope: SCOPES } },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at ? account.expires_at * 1000 : 0,
        };
      }
      if (
        typeof token.expiresAt === "number" &&
        Date.now() < token.expiresAt - 60_000
      ) {
        return token;
      }
      const refreshed = await refresh({
        refreshToken: token.refreshToken as string | undefined,
      });
      return { ...token, ...refreshed };
    },
    async session({ session, token }) {
      (session as { accessToken?: string }).accessToken = token.accessToken as
        | string
        | undefined;
      return session;
    },
  },
};
