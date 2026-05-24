"use client";

import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ArtistAggregate } from "@/types/dataset";
import { artistSlug } from "@/lib/dataset/artist";

type Props = { data: ArtistAggregate[] };

export function TopArtistsBar({ data }: Props) {
  const router = useRouter();
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
        >
          <defs>
            <linearGradient id="artistBar" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#E84C88" />
              <stop offset="50%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#22D3EE" />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1F2740" horizontal={false} />
          <XAxis
            type="number"
            stroke="#5B6378"
            tick={{ fill: "#8A93AB", fontSize: 12 }}
          />
          <YAxis
            type="category"
            dataKey="artist"
            stroke="#5B6378"
            tick={{ fill: "#E6E9F2", fontSize: 12 }}
            width={110}
          />
          <Tooltip
            cursor={{ fill: "rgba(139,92,246,0.08)" }}
            contentStyle={{
              background: "#111726",
              border: "1px solid #1F2740",
              borderRadius: 12,
              color: "#E6E9F2",
              fontSize: 12,
            }}
            formatter={(value) => [String(value), "Tracks"]}
          />
          <Bar
            dataKey="playCount"
            fill="url(#artistBar)"
            radius={[0, 8, 8, 0]}
            cursor="pointer"
            onClick={(data) => {
              const payload = (data as { payload?: ArtistAggregate }).payload;
              if (payload?.artist) {
                router.push(`/artists/${artistSlug(payload.artist)}`);
              }
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
