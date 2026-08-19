"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FAMILIES, FOUNDATIONS, type Group } from "@/lib/siteMap";

// A connected map at the FAMILY level: ten nodes (seven algorithm families,
// three foundations), and only the arcs that carry a real throughline — a
// linear model becoming logistic regression, the perceptron stacking into a
// net, distance ideas crossing from k-NN into k-Means, optimisation feeding
// everything trainable. The 47 individual tracks live in the browsable cards
// below; this is the story of how the families connect, not a full index.
//
// HTML cards (real type + rounded surfaces) layered over one SVG arc canvas.
// Both the cards (positioned in %) and the SVG (a fixed viewBox) scale with the
// container, so everything stays aligned at any width. Geometry is a set of
// fixed constants — no RNG, no Date — so server and client render identically.

const VW = 1000;
const VH = 520;

// node centres in the SVG coordinate space, keyed by group name
const POS: Record<string, { x: number; y: number }> = {
  // supervised — a spine down the left, Trees branching right
  Regression: { x: 150, y: 92 },
  Classification: { x: 390, y: 92 },
  "Trees & ensembles": { x: 630, y: 92 },
  "Reinforcement learning": { x: 862, y: 92 },
  "Neural networks": { x: 390, y: 250 },
  // unsupervised — the right side
  Clustering: { x: 630, y: 250 },
  "Dimensionality reduction": { x: 862, y: 250 },
  // foundations — the base band
  Optimization: { x: 150, y: 428 },
  "Math foundations": { x: 390, y: 428 },
  "Learning theory": { x: 630, y: 428 },
};

// meaningful family-to-family throughlines
const ARCS: [string, string][] = [
  ["Regression", "Classification"], // a linear model becomes logistic regression
  ["Classification", "Trees & ensembles"], // another way to carve the input space
  ["Classification", "Neural networks"], // the perceptron stacks into a net
  ["Classification", "Clustering"], // distance ideas cross from k-NN to k-Means
  ["Clustering", "Dimensionality reduction"], // the label-free pair
  ["Optimization", "Regression"], // gradient descent trains it
  ["Optimization", "Neural networks"], // …and backprop is the same engine
];

type Node = { name: string; color: string; x: number; y: number; href?: string; live: number; total: number };

function firstHref(g: Group) {
  return g.tracks.find((t) => t.href)?.href;
}

export function CurriculumAtlas() {
  const [hover, setHover] = useState<string | null>(null);

  const { nodes, byName } = useMemo(() => {
    const nodes: Node[] = [];
    for (const g of [...FAMILIES, ...FOUNDATIONS]) {
      const p = POS[g.name];
      if (!p) continue;
      nodes.push({
        name: g.name,
        color: g.color,
        x: p.x,
        y: p.y,
        href: firstHref(g),
        live: g.tracks.filter((t) => t.href).length,
        total: g.tracks.length,
      });
    }
    const byName: Record<string, Node> = {};
    for (const n of nodes) byName[n.name] = n;
    return { nodes, byName };
  }, []);

  const edges = useMemo(
    () => ARCS.filter(([a, b]) => byName[a] && byName[b]).map(([a, b]) => ({ a: byName[a], b: byName[b] })),
    [byName],
  );

  // hovering a node lights it + its direct neighbours
  const active = useMemo(() => {
    if (!hover) return null;
    const s = new Set<string>([hover]);
    for (const e of edges) {
      if (e.a.name === hover) s.add(e.b.name);
      if (e.b.name === hover) s.add(e.a.name);
    }
    return s;
  }, [hover, edges]);

  const pct = (v: number, d: number) => `${(v / d) * 100}%`;

  return (
    <figure style={{ margin: "1.75rem 0 0" }}>
      <div style={{ overflowX: "auto", overflowY: "hidden" }}>
        <div style={{ position: "relative", width: "100%", minWidth: 760, maxWidth: VW, margin: "0 auto", aspectRatio: `${VW} / ${VH}` }}>
          {/* arc canvas — sits behind the cards */}
          <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" height="100%" preserveAspectRatio="none"
            style={{ position: "absolute", inset: 0, display: "block", pointerEvents: "none" }} aria-hidden="true">
            {/* divider between families and foundations */}
            <line x1={14} y1={366} x2={VW - 14} y2={366} stroke="var(--border)" strokeWidth={1} strokeDasharray="2 5" />
            {edges.map((e, i) => {
              const lit = active ? active.has(e.a.name) && active.has(e.b.name) : false;
              const dim = active ? !lit : false;
              return (
                <path key={i} d={arcPath(e.a, e.b)} fill="none" stroke={e.a.color} strokeLinecap="round"
                  strokeWidth={lit ? 2.6 : 1.6} opacity={dim ? 0.08 : lit ? 0.9 : 0.32}
                  style={{ transition: "opacity .18s, stroke-width .18s" }} />
              );
            })}
          </svg>

          {/* section labels */}
          <div style={{ ...labelStyle, left: pct(14, VW), top: pct(8, VH) }}>Algorithm families</div>
          <div style={{ ...labelStyle, left: pct(14, VW), top: pct(374, VH) }}>Foundations</div>

          {/* family cards */}
          {nodes.map((n) => {
            const dim = active ? !active.has(n.name) : false;
            const lit = active ? active.has(n.name) : false;
            return (
              <FamilyCard key={n.name} n={n} left={pct(n.x, VW)} top={pct(n.y, VH)} dim={dim} lit={lit}
                onEnter={() => setHover(n.name)} onLeave={() => setHover(null)} />
            );
          })}
        </div>
      </div>

      <figcaption style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 14, lineHeight: 1.6, textAlign: "center", maxWidth: 620, marginInline: "auto" }}>
        Ten worlds, and the paths between them — a linear model becomes logistic regression, the
        perceptron stacks into a network, the same optimiser trains nearly all of it. Arcs mark where one
        family&rsquo;s ideas lead into another, not a fixed order. Hover to trace a family&rsquo;s links; the full
        track index is below.
      </figcaption>
    </figure>
  );
}

function FamilyCard({ n, left, top, dim, lit, onEnter, onLeave }: {
  n: Node; left: string; top: string; dim: boolean; lit: boolean; onEnter: () => void; onLeave: () => void;
}) {
  const isLive = n.live > 0;
  const sub = n.live === n.total ? `${n.total} chapters · all live` : n.live > 0 ? `${n.total} chapters · ${n.live} live` : `${n.total} chapters · soon`;

  const inner = (
    <div
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{
        width: 186,
        boxSizing: "border-box",
        padding: "11px 14px",
        borderRadius: 12,
        background: isLive ? "color-mix(in srgb, var(--accent) 9%, var(--surface))" : "var(--surface)",
        border: `1px solid ${isLive ? "color-mix(in srgb, var(--accent) 42%, var(--border))" : "var(--border)"}`,
        boxShadow: lit ? "0 6px 20px -8px color-mix(in srgb, var(--accent) 55%, transparent)" : isLive ? "0 1px 2px rgba(0,0,0,0.04)" : "none",
        opacity: dim ? 0.32 : 1,
        transform: lit ? "translateY(-2px)" : "none",
        transition: "opacity .18s, transform .18s, box-shadow .18s",
        cursor: isLive ? "pointer" : "default",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: 3, background: "var(--accent)", flexShrink: 0, opacity: isLive ? 1 : 0.55 }} />
        <span className="font-display" style={{ fontSize: 13.5, fontWeight: 550, lineHeight: 1.2, color: isLive ? "var(--accent)" : "var(--muted)" }}>
          {n.name}
        </span>
      </div>
      <div style={{ fontSize: 10.5, color: "var(--faint)", marginTop: 5, letterSpacing: "0.01em" }}>{sub}</div>
    </div>
  );

  const wrap: React.CSSProperties = {
    position: "absolute",
    left,
    top,
    transform: "translate(-50%, -50%)",
    ["--accent" as string]: n.color,
    textDecoration: "none",
  };

  return n.href ? (
    <Link href={n.href} style={wrap}>{inner}</Link>
  ) : (
    <div style={wrap}>{inner}</div>
  );
}

// smooth cubic between two node centres; curves along the dominant axis so
// horizontal arcs bow sideways and vertical arcs bow up/down
function arcPath(a: Node, b: Node) {
  const { x: x1, y: y1 } = a;
  const { x: x2, y: y2 } = b;
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (Math.abs(dx) >= Math.abs(dy)) {
    const c = Math.abs(dx) * 0.42;
    return `M ${x1} ${y1} C ${x1 + Math.sign(dx) * c} ${y1}, ${x2 - Math.sign(dx) * c} ${y2}, ${x2} ${y2}`;
  }
  const c = Math.abs(dy) * 0.42;
  return `M ${x1} ${y1} C ${x1} ${y1 + Math.sign(dy) * c}, ${x2} ${y2 - Math.sign(dy) * c}, ${x2} ${y2}`;
}

const labelStyle: React.CSSProperties = {
  position: "absolute",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.09em",
  textTransform: "uppercase",
  color: "var(--muted)",
};
