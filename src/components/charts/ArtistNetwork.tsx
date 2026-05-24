"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import { select } from "d3-selection";
import { zoom, zoomIdentity, type ZoomTransform } from "d3-zoom";
import type { NetworkGraph, NetworkNode } from "@/lib/dataset/network";

type SimNode = NetworkNode & SimulationNodeDatum;
type SimLink = SimulationLinkDatum<SimNode> & { weight: number };

type Props = {
  graph: NetworkGraph;
  onSelect?: (node: NetworkNode) => void;
};

const WIDTH = 900;
const HEIGHT = 560;

export function ArtistNetwork({ graph, onSelect }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const simRef = useRef<Simulation<SimNode, SimLink> | null>(null);
  const draggedRef = useRef<SimNode | null>(null);
  const transformRef = useRef<ZoomTransform>(zoomIdentity);

  const [, force] = useState(0);
  const rerender = () => force((t) => t + 1);

  const [hovered, setHovered] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [transform, setTransform] = useState<ZoomTransform>(zoomIdentity);

  const { nodes, links, neighbors } = useMemo(() => {
    const ns: SimNode[] = graph.nodes.map((n) => ({ ...n }));
    const ls: SimLink[] = graph.edges.map((e) => ({
      source: e.source,
      target: e.target,
      weight: e.weight,
    }));
    const map: Record<string, Set<string>> = {};
    for (const e of graph.edges) {
      (map[e.source] ??= new Set()).add(e.target);
      (map[e.target] ??= new Set()).add(e.source);
    }
    return { nodes: ns, links: ls, neighbors: map };
  }, [graph]);

  useEffect(() => {
    if (!nodes.length) return;

    const sim = forceSimulation<SimNode>(nodes)
      .force(
        "link",
        forceLink<SimNode, SimLink>(links)
          .id((d) => d.id)
          .distance((l) => 60 + 30 / Math.max(1, l.weight))
          .strength(0.7),
      )
      .force("charge", forceManyBody().strength(-180))
      .force("center", forceCenter(WIDTH / 2, HEIGHT / 2))
      .force("x", forceX(WIDTH / 2).strength(0.04))
      .force("y", forceY(HEIGHT / 2).strength(0.04))
      .force(
        "collide",
        forceCollide<SimNode>().radius((d) => nodeRadius(d) + 6),
      )
      .on("tick", rerender);

    simRef.current = sim;

    return () => {
      sim.stop();
    };
  }, [nodes, links]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.35, 6])
      .translateExtent([
        [-WIDTH * 2, -HEIGHT * 2],
        [WIDTH * 3, HEIGHT * 3],
      ])
      .on("zoom", (event) => {
        transformRef.current = event.transform;
        setTransform(event.transform);
      });

    select(svg).call(zoomBehavior);

    return () => {
      select(svg).on(".zoom", null);
    };
  }, []);

  function svgPoint(clientX: number, clientY: number) {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const local = pt.matrixTransform(ctm.inverse());
    const current = transformRef.current;
    return {
      x: (local.x - current.x) / current.k,
      y: (local.y - current.y) / current.k,
    };
  }

  function startDrag(e: React.PointerEvent<SVGGElement>, node: SimNode) {
    e.stopPropagation();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    draggedRef.current = node;
    if (simRef.current) simRef.current.alphaTarget(0.3).restart();
    node.fx = node.x ?? 0;
    node.fy = node.y ?? 0;
  }

  function moveDrag(e: React.PointerEvent<SVGGElement>) {
    const node = draggedRef.current;
    if (!node) return;
    const { x, y } = svgPoint(e.clientX, e.clientY);
    node.fx = x;
    node.fy = y;
  }

  function endDrag(e: React.PointerEvent<SVGGElement>) {
    const node = draggedRef.current;
    if (!node) return;
    (e.currentTarget as Element).releasePointerCapture(e.pointerId);
    draggedRef.current = null;
    if (simRef.current) simRef.current.alphaTarget(0);
    node.fx = null;
    node.fy = null;
  }

  const activeId = hovered ?? selectedId;
  const activeSet = activeId
    ? new Set([activeId, ...Array.from(neighbors[activeId] ?? [])])
    : null;

  if (!graph.nodes.length) {
    return (
      <div className="flex h-[560px] items-center justify-center text-sm text-text-muted">
        No artists to graph yet.
      </div>
    );
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="h-[560px] w-full rounded-xl bg-bg/40 touch-none"
    >
      <defs>
        <radialGradient id="nodeMagenta" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F472B6" />
          <stop offset="100%" stopColor="#E84C88" />
        </radialGradient>
        <radialGradient id="nodeViolet" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </radialGradient>
        <radialGradient id="nodeCyan" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#67E8F9" />
          <stop offset="100%" stopColor="#22D3EE" />
        </radialGradient>
      </defs>
      <g transform={transform.toString()}>
        <g>
          {links.map((l, i) => {
            const s = l.source as SimNode;
            const t = l.target as SimNode;
            const linkActive =
              !activeSet || (activeSet.has(s.id) && activeSet.has(t.id));
            return (
              <line
                key={i}
                x1={s.x}
                y1={s.y}
                x2={t.x}
                y2={t.y}
                stroke="#22D3EE"
                strokeOpacity={linkActive ? 0.55 : 0.08}
                strokeWidth={Math.min(4, 1 + Math.sqrt(l.weight))}
              />
            );
          })}
        </g>
        <g>
          {nodes.map((n) => {
            const r = nodeRadius(n);
            const isActive = !activeSet || activeSet.has(n.id);
            const isHovered = hovered === n.id;
            const fill = nodeFill(n);
            return (
              <g
                key={n.id}
                transform={`translate(${n.x ?? 0},${n.y ?? 0})`}
                onMouseEnter={() => setHovered(n.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => {
                  setSelectedId(n.id);
                  onSelect?.(n);
                }}
                onPointerDown={(e) => startDrag(e, n)}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                className="cursor-grab active:cursor-grabbing"
                style={{ opacity: isActive ? 1 : 0.18 }}
              >
                <circle
                  r={r}
                  fill={fill}
                  stroke={isHovered ? "#E6E9F2" : "#0B0F1A"}
                  strokeWidth={isHovered ? 2.5 : 2}
                />
                <text
                  y={-r - 6}
                  textAnchor="middle"
                  fill="#E6E9F2"
                  fontSize={12}
                  fontWeight={isHovered ? 600 : 400}
                  stroke="#0B0F1A"
                  strokeWidth={3}
                  paintOrder="stroke"
                  style={{ pointerEvents: "none" }}
                >
                  {n.name}
                </text>
              </g>
            );
          })}
        </g>
      </g>
    </svg>
  );
}

function nodeRadius(n: NetworkNode): number {
  const popBase = n.avgPopularity > 0 ? n.avgPopularity / 10 : 0;
  const countBase = Math.sqrt(n.trackCount) * 1.5;
  return Math.min(32, 8 + Math.max(popBase, countBase));
}

function nodeFill(n: NetworkNode): string {
  if (n.avgPopularity >= 70) return "url(#nodeMagenta)";
  if (n.avgPopularity >= 45) return "url(#nodeViolet)";
  return "url(#nodeCyan)";
}
