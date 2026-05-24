"use client";

import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#E84C88", "#8B5CF6", "#22D3EE", "#F59E0B", "#10B981"];

type Props = {
  data: Record<string, string | number>[];
  trackNames: string[];
};

export function MultiFeatureRadar({ data, trackNames }: Props) {
  if (!trackNames.length) {
    return (
      <div className="flex h-80 items-center justify-center text-sm text-text-muted">
        Pick 2–5 tracks to compare.
      </div>
    );
  }
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="70%">
          <PolarGrid stroke="#1F2740" />
          <PolarAngleAxis
            dataKey="feature"
            tick={{ fill: "#E6E9F2", fontSize: 11 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 1]}
            tick={{ fill: "#5B6378", fontSize: 10 }}
            axisLine={false}
          />
          {trackNames.map((name, i) => (
            <Radar
              key={name}
              name={name}
              dataKey={name}
              stroke={COLORS[i % COLORS.length]}
              fill={COLORS[i % COLORS.length]}
              fillOpacity={0.25}
            />
          ))}
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
