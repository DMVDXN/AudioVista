"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

type Props = { data: { name: string; value: number }[] };

export function EmotionRadar({ data }: Props) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="75%">
          <PolarGrid stroke="#1F2740" />
          <PolarAngleAxis
            dataKey="name"
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
            stroke="#E84C88"
            fill="#E84C88"
            fillOpacity={0.4}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
