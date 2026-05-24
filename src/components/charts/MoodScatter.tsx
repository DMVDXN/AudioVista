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

type Point = {
  name: string;
  artist: string;
  valence: number;
  energy: number;
};

type Props = { data: Point[] };

export function MoodScatter({ data }: Props) {
  return (
    <div className="relative h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 16, bottom: 24, left: 8 }}>
          <CartesianGrid stroke="#1F2740" />
          <XAxis
            type="number"
            dataKey="valence"
            domain={[0, 1]}
            stroke="#5B6378"
            tick={{ fill: "#8A93AB", fontSize: 11 }}
            label={{
              value: "valence (sad → happy)",
              position: "insideBottom",
              offset: -10,
              fill: "#8A93AB",
              fontSize: 11,
            }}
          />
          <YAxis
            type="number"
            dataKey="energy"
            domain={[0, 1]}
            stroke="#5B6378"
            tick={{ fill: "#8A93AB", fontSize: 11 }}
            label={{
              value: "energy",
              angle: -90,
              position: "insideLeft",
              fill: "#8A93AB",
              fontSize: 11,
            }}
          />
          <ZAxis range={[40, 40]} />
          <Tooltip
            cursor={{ stroke: "#8B5CF6", strokeDasharray: "3 3" }}
            contentStyle={{
              background: "#111726",
              border: "1px solid #1F2740",
              borderRadius: 12,
              color: "#E6E9F2",
              fontSize: 12,
            }}
            formatter={(value, name) => [String(value), String(name)]}
            labelFormatter={() => ""}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as Point;
              return (
                <div className="rounded-xl border border-border bg-bg-elevated px-3 py-2 text-xs">
                  <div className="font-medium text-text">{p.name}</div>
                  <div className="text-text-muted">{p.artist}</div>
                  <div className="mt-1 text-text-subtle">
                    valence {p.valence.toFixed(2)} · energy{" "}
                    {p.energy.toFixed(2)}
                  </div>
                </div>
              );
            }}
          />
          <Scatter data={data} fill="#8B5CF6" fillOpacity={0.55} />
        </ScatterChart>
      </ResponsiveContainer>
      <QuadrantLabels />
    </div>
  );
}

function QuadrantLabels() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <span className="absolute right-3 top-2 text-[10px] uppercase tracking-wider text-text-subtle">
        happy · energetic
      </span>
      <span className="absolute left-12 top-2 text-[10px] uppercase tracking-wider text-text-subtle">
        intense · dark
      </span>
      <span className="absolute right-3 bottom-8 text-[10px] uppercase tracking-wider text-text-subtle">
        cozy · upbeat
      </span>
      <span className="absolute left-12 bottom-8 text-[10px] uppercase tracking-wider text-text-subtle">
        late-night · sad
      </span>
    </div>
  );
}
