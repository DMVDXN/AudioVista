"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

type Props = { data: { feature: string; value: number }[] };

export function AudioFeatureRadar({ data }: Props) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="75%">
          <defs>
            <linearGradient id="radarFill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#E84C88" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#22D3EE" stopOpacity={0.4} />
            </linearGradient>
          </defs>
          <PolarGrid stroke="#1F2740" />
          <PolarAngleAxis
            dataKey="feature"
            tick={{ fill: "#E6E9F2", fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 1]}
            tick={{ fill: "#5B6378", fontSize: 10 }}
            axisLine={false}
          />
          <Radar
            dataKey="value"
            stroke="#8B5CF6"
            strokeWidth={2}
            fill="url(#radarFill)"
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
