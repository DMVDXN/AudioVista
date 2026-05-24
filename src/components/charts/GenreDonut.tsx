"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { GenreAggregate } from "@/types/dataset";

const COLORS = ["#E84C88", "#8B5CF6", "#22D3EE", "#F59E0B", "#10B981", "#F472B6"];

type Props = { data: GenreAggregate[] };

export function GenreDonut({ data }: Props) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="h-56 w-full sm:w-1/2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="genre"
              innerRadius={50}
              outerRadius={88}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "#111726",
                border: "1px solid #1F2740",
                borderRadius: 12,
                color: "#E6E9F2",
                fontSize: 12,
              }}
              formatter={(value, name) => [`${value} tracks`, String(name)]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex-1 space-y-2 text-sm sm:max-w-[18rem]">
        {data.map((g, i) => (
          <li
            key={g.genre}
            className="flex items-center justify-between gap-3"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: COLORS[i % COLORS.length] }}
              />
              <span className="truncate capitalize text-text">{g.genre}</span>
            </div>
            <div className="flex items-baseline gap-2 text-xs">
              <span className="text-text-muted">{g.count}</span>
              <span className="w-9 text-right font-medium text-text-muted">
                {(g.share * 100).toFixed(0)}%
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
