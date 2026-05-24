"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TopTrackRow } from "@/lib/dataset/trends";

type Props = { data: TopTrackRow[] };

export function PopularityLadder({ data }: Props) {
  if (!data.length) {
    return (
      <div className="flex h-80 items-center justify-center text-sm text-text-muted">
        No popularity data in this dataset.
      </div>
    );
  }
  return (
    <div className="h-[28rem]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 24, bottom: 8, left: 8 }}
        >
          <defs>
            <linearGradient id="popBar" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#22D3EE" />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1F2740" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            stroke="#5B6378"
            tick={{ fill: "#8A93AB", fontSize: 11 }}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke="#5B6378"
            tick={{ fill: "#E6E9F2", fontSize: 11 }}
            width={160}
          />
          <Tooltip
            cursor={{ fill: "rgba(139,92,246,0.08)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as TopTrackRow;
              return (
                <div className="rounded-xl border border-border bg-bg-elevated px-3 py-2 text-xs">
                  <div className="font-medium text-text">{p.name}</div>
                  <div className="text-text-muted">{p.artist}</div>
                  <div className="mt-1 text-text-subtle">
                    popularity {p.popularity}
                  </div>
                </div>
              );
            }}
          />
          <Bar dataKey="popularity" fill="url(#popBar)" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
