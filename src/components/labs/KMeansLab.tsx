"use client";

import { useMemo, useState, useEffect } from "react";

// Interactive Lloyd's algorithm. Points are fixed; you step the two-phase loop
// (assign each point to its nearest centroid, then move each centroid to the mean
// of its points) and watch the clusters snap into place and the inertia fall.

const SEED0 = 7;
const CLUSTER_COLORS = ["var(--c-regression)", "var(--c-classification)", "var(--c-trees)", "var(--c-rl)"];
const BLOBS = [
  { cx: 26, cy: 32 }, { cx: 72, cy: 28 }, { cx: 50, cy: 74 },
];

// deterministic PRNG (pure integer math -> identical on server & client)
function mulberry32(a: number) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Pt = { x: number; y: number };

function genPoints(seed: number): Pt[] {
  const rand = mulberry32(seed);
  const pts: Pt[] = [];
  for (const b of BLOBS) {
    for (let i = 0; i < 18; i++) {
      pts.push({ x: b.cx + (rand() - 0.5) * 30, y: b.cy + (rand() - 0.5) * 30 });
    }
  }
  return pts;
}

function forgy(points: Pt[], k: number, seed: number): Pt[] {
  const rand = mulberry32(seed * 911 + k);
  const idx = new Set<number>();
  while (idx.size < k) idx.add(Math.floor(rand() * points.length));
  return [...idx].map((i) => ({ ...points[i] }));
}

function assign(points: Pt[], centroids: Pt[]): number[] {
  return points.map((p) => {
    let best = 0, bd = Infinity;
    centroids.forEach((c, j) => {
      const d = (p.x - c.x) ** 2 + (p.y - c.y) ** 2;
      if (d < bd) { bd = d; best = j; }
    });
    return best;
  });
}

function update(points: Pt[], labels: number[], k: number, prev: Pt[]): Pt[] {
  return Array.from({ length: k }, (_, j) => {
    const mine = points.filter((_, i) => labels[i] === j);
    if (mine.length === 0) return prev[j];
    return {
      x: mine.reduce((s, p) => s + p.x, 0) / mine.length,
      y: mine.reduce((s, p) => s + p.y, 0) / mine.length,
    };
  });
}

function inertia(points: Pt[], labels: number[], centroids: Pt[]): number {
  return points.reduce((s, p, i) => {
    const c = centroids[labels[i]];
    return s + (p.x - c.x) ** 2 + (p.y - c.y) ** 2;
  }, 0);
}

export function KMeansLab() {
  const [seed, setSeed] = useState(SEED0);
  const [k, setK] = useState(3);
  const [centroids, setCentroids] = useState<Pt[]>(() => forgy(genPoints(SEED0), 3, SEED0));
  const [iter, setIter] = useState(0);
  const [converged, setConverged] = useState(false);
  const [running, setRunning] = useState(false);

  const points = useMemo(() => genPoints(seed), [seed]);
  const labels = useMemo(() => assign(points, centroids), [points, centroids]);
  const wcss = inertia(points, labels, centroids);

  function reset(nextSeed: number, nextK: number) {
    setRunning(false);
    setSeed(nextSeed);
    setK(nextK);
    setCentroids(forgy(genPoints(nextSeed), nextK, nextSeed));
    setIter(0);
    setConverged(false);
  }

  // one assign+update step, reading the current state (no stale closures)
  function step() {
    if (converged) return;
    const lab = assign(points, centroids);
    const next = update(points, lab, k, centroids);
    const moved = Math.max(...next.map((c, j) => Math.abs(c.x - centroids[j].x) + Math.abs(c.y - centroids[j].y)));
    setCentroids(next);
    setIter((n) => n + 1);
    if (moved < 0.05) { setConverged(true); setRunning(false); }
  }

  // drive the loop one step per render while running — each effect run captures fresh state
  useEffect(() => {
    if (!running || converged) return;
    const id = setTimeout(step, 600);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, converged, centroids]);

  function run() {
    if (converged) return;
    setRunning((r) => !r);
  }

  // geometry
  const W = 340, H = 250;
  const sx = (x: number) => Math.round((20 + (x / 100) * (W - 40)) * 100) / 100;
  const sy = (y: number) => Math.round((H - 20 - (y / 100) * (H - 40)) * 100) / 100;

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        <span style={head}>Lloyd&rsquo;s algorithm, step by step</span>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "var(--muted)" }}>k =</span>
          {[2, 3, 4].map((kk) => (
            <button key={kk} onClick={() => reset(seed, kk)} style={chip(k === kk)}>{kk}</button>
          ))}
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        {/* assignment lines */}
        {points.map((p, i) => {
          const c = centroids[labels[i]];
          return <line key={"l" + i} x1={sx(p.x)} y1={sy(p.y)} x2={sx(c.x)} y2={sy(c.y)} stroke={CLUSTER_COLORS[labels[i]]} strokeOpacity={0.18} strokeWidth={1} />;
        })}
        {/* points */}
        {points.map((p, i) => (
          <circle key={"p" + i} cx={sx(p.x)} cy={sy(p.y)} r={3.4} fill={CLUSTER_COLORS[labels[i]]} fillOpacity={0.85} />
        ))}
        {/* centroids */}
        {centroids.map((c, j) => (
          <g key={"c" + j}>
            <circle cx={sx(c.x)} cy={sy(c.y)} r={9} fill={CLUSTER_COLORS[j]} fillOpacity={0.25} />
            <path d={`M ${sx(c.x) - 5} ${sy(c.y)} L ${sx(c.x) + 5} ${sy(c.y)} M ${sx(c.x)} ${sy(c.y) - 5} L ${sx(c.x)} ${sy(c.y) + 5}`}
              stroke={CLUSTER_COLORS[j]} strokeWidth={2.4} strokeLinecap="round" />
            <circle cx={sx(c.x)} cy={sy(c.y)} r={6} fill="none" stroke={CLUSTER_COLORS[j]} strokeWidth={2} />
          </g>
        ))}
      </svg>

      <div style={{ display: "flex", gap: 14, margin: "10px 0 2px" }}>
        <S label="iteration" value={String(iter)} />
        <S label="inertia (WCSS)" value={wcss.toFixed(0)} color={converged ? "var(--good)" : "var(--ink)"} />
        <S label="status" value={converged ? "converged" : iter === 0 ? "initialised" : "running"} color={converged ? "var(--good)" : "var(--muted)"} />
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
        <button onClick={step} disabled={converged || running} style={btn(!converged && !running)}>Assign + update ›</button>
        <button onClick={run} style={btn(true)}>{running ? "Pause" : "Run to convergence"}</button>
        <button onClick={() => reset(seed, k)} style={btnGhost}>Reset centroids</button>
        <button onClick={() => reset(seed + 1, k)} style={btnGhost}>New data</button>
      </div>
      <div style={caption}>
        Each step does two things: recolour every point to its nearest centroid, then slide each
        centroid (the ✛) to the mean of its points. Inertia — the total squared distance to
        centroids — falls every step and never rises. That&rsquo;s why it always stops.
      </div>
    </div>
  );
}

function S({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 16, color: color || "var(--ink)" }}>{value}</div>
    </div>
  );
}

const wrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const caption: React.CSSProperties = { fontSize: 12.5, color: "var(--muted)", marginTop: 14, lineHeight: 1.5 };
function btn(active: boolean): React.CSSProperties {
  return { fontSize: 12.5, padding: "6px 13px", borderRadius: 8, cursor: active ? "pointer" : "not-allowed", border: "1px solid var(--brand)", background: active ? "var(--brand)" : "color-mix(in srgb, var(--brand) 30%, transparent)", color: "white", opacity: active ? 1 : 0.6 };
}
const btnGhost: React.CSSProperties = { fontSize: 12.5, padding: "6px 13px", borderRadius: 8, cursor: "pointer", border: "1px solid var(--border-strong)", background: "transparent", color: "var(--muted)" };
function chip(active: boolean): React.CSSProperties {
  return { fontSize: 12, width: 26, height: 26, borderRadius: 7, cursor: "pointer", border: `1px solid ${active ? "var(--c-clustering)" : "var(--border-strong)"}`, background: active ? "var(--c-clustering)" : "transparent", color: active ? "white" : "var(--muted)" };
}
