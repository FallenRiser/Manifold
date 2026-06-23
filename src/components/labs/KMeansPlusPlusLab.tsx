"use client";

import { useMemo, useState } from "react";

// Compare seeding strategies. In k-means++ mode, every not-yet-chosen point is
// drawn proportional to D² — its squared distance to the nearest centroid picked
// so far. We size each point by that probability so you can *see* the far points
// become likely. Random mode ignores all that and picks uniformly.

const CLUSTER = "var(--c-clustering)";
const BLOBS = [
  { cx: 24, cy: 30 }, { cx: 76, cy: 26 }, { cx: 30, cy: 76 }, { cx: 78, cy: 74 },
];

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
    for (let i = 0; i < 12; i++) {
      pts.push({ x: b.cx + (rand() - 0.5) * 22, y: b.cy + (rand() - 0.5) * 22 });
    }
  }
  return pts;
}

// squared distance from each point to its nearest chosen centroid
function d2ToNearest(points: Pt[], chosen: number[]): number[] {
  if (chosen.length === 0) return points.map(() => 1);
  return points.map((p) => {
    let best = Infinity;
    for (const ci of chosen) {
      const c = points[ci];
      const d = (p.x - c.x) ** 2 + (p.y - c.y) ** 2;
      if (d < best) best = d;
    }
    return best;
  });
}

const K = 4;

export function KMeansPlusPlusLab() {
  const [seed, setSeed] = useState(3);
  const [mode, setMode] = useState<"++" | "random">("++");
  const [chosen, setChosen] = useState<number[]>([]);
  const [pick, setPick] = useState(0); // bumps to advance the deterministic draw

  const points = useMemo(() => genPoints(seed), [seed]);
  const d2 = useMemo(() => d2ToNearest(points, chosen), [points, chosen]);
  const totalD2 = d2.reduce((s, v, i) => (chosen.includes(i) ? s : s + v), 0);

  // spread = smallest pairwise gap between chosen centroids (bigger = better spread)
  const spread = useMemo(() => {
    if (chosen.length < 2) return null;
    let m = Infinity;
    for (let a = 0; a < chosen.length; a++)
      for (let b = a + 1; b < chosen.length; b++) {
        const p = points[chosen[a]], q = points[chosen[b]];
        m = Math.min(m, Math.sqrt((p.x - q.x) ** 2 + (p.y - q.y) ** 2));
      }
    return m;
  }, [chosen, points]);

  function addCentroid() {
    if (chosen.length >= K) return;
    const rand = mulberry32(seed * 7919 + chosen.length * 31 + pick);
    let next: number;
    if (chosen.length === 0 || mode === "random") {
      // uniform over not-yet-chosen
      const pool = points.map((_, i) => i).filter((i) => !chosen.includes(i));
      next = pool[Math.floor(rand() * pool.length)];
    } else {
      // sample proportional to D²
      const weights = d2.map((v, i) => (chosen.includes(i) ? 0 : v));
      const total = weights.reduce((s, v) => s + v, 0);
      let r = rand() * total;
      next = weights.length - 1;
      for (let i = 0; i < weights.length; i++) {
        r -= weights[i];
        if (r <= 0) { next = i; break; }
      }
    }
    setChosen((c) => [...c, next]);
    setPick((p) => p + 1);
  }

  function reset(nextSeed = seed) {
    setChosen([]);
    setSeed(nextSeed);
    setPick((p) => p + 1);
  }

  const W = 340, H = 250;
  const sx = (x: number) => Math.round((20 + (x / 100) * (W - 40)) * 100) / 100;
  const sy = (y: number) => Math.round((H - 20 - (y / 100) * (H - 40)) * 100) / 100;
  const maxD2 = Math.max(1, ...d2.map((v, i) => (chosen.includes(i) ? 0 : v)));
  const showWeights = mode === "++" && chosen.length > 0 && chosen.length < K;

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        <span style={head}>Seeding: k-means++ vs random</span>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => { setMode("++"); reset(); }} style={tab(mode === "++")}>k-means++</button>
          <button onClick={() => { setMode("random"); reset(); }} style={tab(mode === "random")}>random</button>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        {points.map((p, i) => {
          const isCentroid = chosen.includes(i);
          // in ++ mode, size by selection probability (D² / maxD²)
          const r = showWeights ? 2 + (d2[i] / maxD2) * 5 : 3.2;
          if (isCentroid) return null;
          return <circle key={"p" + i} cx={sx(p.x)} cy={sy(p.y)} r={r} fill={CLUSTER} fillOpacity={showWeights ? 0.2 + (d2[i] / maxD2) * 0.6 : 0.45} />;
        })}
        {chosen.map((ci, j) => {
          const c = points[ci];
          return (
            <g key={"c" + j}>
              <circle cx={sx(c.x)} cy={sy(c.y)} r={9} fill={CLUSTER} fillOpacity={0.25} />
              <path d={`M ${sx(c.x) - 5} ${sy(c.y)} L ${sx(c.x) + 5} ${sy(c.y)} M ${sx(c.x)} ${sy(c.y) - 5} L ${sx(c.x)} ${sy(c.y) + 5}`} stroke={CLUSTER} strokeWidth={2.6} strokeLinecap="round" />
              <text x={sx(c.x) + 8} y={sy(c.y) - 7} fontSize={10} fill={CLUSTER}>{j + 1}</text>
            </g>
          );
        })}
      </svg>

      <div style={{ display: "flex", gap: 16, margin: "10px 0 2px" }}>
        <S label="centroids placed" value={`${chosen.length} / ${K}`} />
        <S label="min spread" value={spread === null ? "—" : spread.toFixed(1)} color={spread !== null && spread > 30 ? "var(--good)" : "var(--ink)"} />
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
        <button onClick={addCentroid} disabled={chosen.length >= K} style={btn(chosen.length < K)}>
          {chosen.length === 0 ? "Place first centroid ›" : chosen.length >= K ? "All placed" : "Place next centroid ›"}
        </button>
        <button onClick={() => reset()} style={btnGhost}>Reset</button>
        <button onClick={() => reset(seed + 1)} style={btnGhost}>New data</button>
      </div>

      <div style={caption}>
        {showWeights
          ? "Each point is now sized and shaded by its D² — the squared distance to the nearest centroid already placed. That's its probability of being picked next. Far-flung points dominate, so the next centroid lands in an unclaimed region."
          : mode === "++"
          ? "k-means++ places the first centroid at random, then biases every later pick toward points far from the ones already chosen. Place a centroid to see the D² weighting light up."
          : "Random seeding picks all four uniformly — nothing stops two from landing in the same blob, the classic bad start. Place a few and compare the spread to k-means++."}
        {chosen.length >= K && <> &nbsp;Total remaining D² is {totalD2.toFixed(0)}.</>}
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
const caption: React.CSSProperties = { fontSize: 12.5, color: "var(--muted)", marginTop: 14, lineHeight: 1.55 };
function btn(active: boolean): React.CSSProperties {
  return { fontSize: 12.5, padding: "6px 13px", borderRadius: 8, cursor: active ? "pointer" : "not-allowed", border: "1px solid var(--brand)", background: active ? "var(--brand)" : "color-mix(in srgb, var(--brand) 30%, transparent)", color: "white", opacity: active ? 1 : 0.6 };
}
const btnGhost: React.CSSProperties = { fontSize: 12.5, padding: "6px 13px", borderRadius: 8, cursor: "pointer", border: "1px solid var(--border-strong)", background: "transparent", color: "var(--muted)" };
function tab(active: boolean): React.CSSProperties {
  return { fontSize: 12, padding: "5px 12px", borderRadius: 8, cursor: "pointer", border: `1px solid ${active ? "var(--c-clustering)" : "var(--border-strong)"}`, background: active ? "var(--c-clustering)" : "transparent", color: active ? "white" : "var(--muted)" };
}
