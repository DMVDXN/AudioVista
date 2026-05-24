"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Props = {
  data: { line: number; score: number; text: string }[];
};

export function SentimentArc({ data }: Props) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <defs>
            <linearGradient id="sentArc" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.7} />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1F2740" />
          <XAxis
            dataKey="line"
            stroke="#5B6378"
            tick={{ fill: "#8A93AB", fontSize: 12 }}
          />
          <YAxis stroke="#5B6378" tick={{ fill: "#8A93AB", fontSize: 12 }} />
          <ReferenceLine y={0} stroke="#5B6378" strokeDasharray="3 3" />
          <Tooltip
            contentStyle={{
              background: "#111726",
              border: "1px solid #1F2740",
              borderRadius: 12,
              color: "#E6E9F2",
              fontSize: 12,
            }}
            formatter={(value) => [String(value), "sentiment"]}
            labelFormatter={(line) => `Line ${line}`}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#22D3EE"
            strokeWidth={2}
            fill="url(#sentArc)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
