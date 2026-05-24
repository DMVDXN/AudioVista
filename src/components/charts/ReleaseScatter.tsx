"use client";

import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import type { ReleasePoint } from "@/lib/dataset/trends";

type Props = { data: ReleasePoint[] };

export function ReleaseScatter({ data }: Props) {
  if (!data.length) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-text-muted">
        No release years found in this dataset.
      </div>
    );
  }
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 16, bottom: 8, left: 8 }}>
          <CartesianGrid stroke="#1F2740" />
          <XAxis
            type="number"
            dataKey="year"
            domain={["dataMin", "dataMax"]}
            stroke="#5B6378"
            tick={{ fill: "#8A93AB", fontSize: 11 }}
            allowDecimals={false}
          />
          <YAxis
            type="number"
            dataKey="avgPopularity"
            domain={[0, 100]}
            stroke="#5B6378"
            tick={{ fill: "#8A93AB", fontSize: 11 }}
            label={{
              value: "avg popularity",
              angle: -90,
              position: "insideLeft",
              fill: "#8A93AB",
              fontSize: 11,
            }}
          />
          <ZAxis type="number" dataKey="count" range={[40, 600]} />
          <Tooltip
            cursor={{ stroke: "#8B5CF6", strokeDasharray: "3 3" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as ReleasePoint;
              return (
                <div className="rounded-xl border border-border bg-bg-elevated px-3 py-2 text-xs">
                  <div className="font-medium text-text">{p.year}</div>
                  <div className="text-text-muted">
                    {p.count} releases · avg popularity {p.avgPopularity}
                  </div>
                </div>
              );
            }}
          />
          <Scatter data={data} fill="#22D3EE" fillOpacity={0.7} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
