"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { GenreYearRow } from "@/lib/dataset/trends";

const COLORS = [
  "#E84C88",
  "#8B5CF6",
  "#22D3EE",
  "#F59E0B",
  "#10B981",
  "#5B6378",
];

type Props = {
  data: GenreYearRow[];
  genres: string[];
};

export function GenreStackedArea({ data, genres }: Props) {
  if (!data.length) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-text-muted">
        Need both year and genre columns to chart genre trends.
      </div>
    );
  }
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid stroke="#1F2740" />
          <XAxis
            dataKey="year"
            stroke="#5B6378"
            tick={{ fill: "#8A93AB", fontSize: 11 }}
          />
          <YAxis stroke="#5B6378" tick={{ fill: "#8A93AB", fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              background: "#111726",
              border: "1px solid #1F2740",
              borderRadius: 12,
              color: "#E6E9F2",
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {genres.map((g, i) => (
            <Area
              key={g}
              type="monotone"
              dataKey={g}
              stackId="genres"
              stroke={COLORS[i % COLORS.length]}
              fill={COLORS[i % COLORS.length]}
              fillOpacity={0.55}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
