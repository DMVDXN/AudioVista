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

type Props = { data: { range: string; count: number }[] };

export function TempoHistogram({ data }: Props) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <defs>
            <linearGradient id="tempoBar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22D3EE" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1F2740" vertical={false} />
          <XAxis
            dataKey="range"
            stroke="#5B6378"
            tick={{ fill: "#8A93AB", fontSize: 12 }}
          />
          <YAxis stroke="#5B6378" tick={{ fill: "#8A93AB", fontSize: 12 }} />
          <Tooltip
            cursor={{ fill: "rgba(139,92,246,0.08)" }}
            contentStyle={{
              background: "#111726",
              border: "1px solid #1F2740",
              borderRadius: 12,
              color: "#E6E9F2",
              fontSize: 12,
            }}
            formatter={(value) => [String(value), "tracks"]}
            labelFormatter={(label) => `${label} BPM`}
          />
          <Bar dataKey="count" fill="url(#tempoBar)" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
