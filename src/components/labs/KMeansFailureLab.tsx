"use client";

import { useMemo, useState } from "react";

// Show k-means breaking on shapes it can't represent. The TRUE structure is drawn
// with outline color; k-means' actual labels fill the dots. Because its only
// boundaries are straight perpendicular bisectors, it slices rings, moons, and
// elongated blobs the wrong way — visibly.

const KM_COLORS = ["var(--c-regression)", "var(--c-classification)", "var(--c-trees)"];

function mulberry32(a: number) {
  return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const r2 = (v: number) => Math.round(v * 100) / 100;

type Pt = { x: number; y: number; truth: number };

type Shape = "rings" | "moons" | "aniso";
const SHAPES: { id: Shape; label: string; k: number }[] = [
  { id: "rings", label: "Concentric rings", k: 2 },
  { id: "moons", label: "Two moons", k: 2 },
  { id: "aniso", label: "Elongated blobs", k: 3 },
];

function genPoints(shape: Shape): Pt[] {
  const rand = mulberry32(9);
  const pts: Pt[] = [];
  if (shape === "rings") {
    for (let g = 0; g < 2; g++) {
      const R = g === 0 ? 14 : 38;
      for (let i = 0; i < 40; i++) {
        const a = rand() * Math.PI * 2;
        pts.push({ x: r2(50 + Math.cos(a) * R + (rand() - 0.5) * 5), y: r2(50 + Math.sin(a) * R + (rand() - 0.5) * 5), truth: g });
      }
    }
  } else if (shape === "moons") {
    for (let g = 0; g < 2; g++) {
      for (let i = 0; i < 40; i++) {
        const a = rand() * Math.PI;
        if (g === 0) pts.push({ x: r2(34 + Math.cos(a) * 26 + (rand() - 0.5) * 5), y: r2(40 + Math.sin(a) * 26 + (rand() - 0.5) * 5), truth: 0 });
        else pts.push({ x: r2(52 + Math.cos(a) * 26 + (rand() - 0.5) * 5), y: r2(60 - Math.sin(a) * 26 + (rand() - 0.5) * 5), truth: 1 });
      }
    }
  } else {
    // three elongated, sheared blobs
    const centers = [{ x: 32, y: 35 }, { x: 50, y: 50 }, { x: 68, y: 65 }];
    centers.forEach((c, g) => {
      for (let i = 0; i < 34; i++) {
        const t = (rand() - 0.5) * 40;
        pts.push({ x: r2(c.x + t * 0.7 + (rand() - 0.5) * 6), y: r2(c.y + t * 0.7 + (rand() - 0.5) * 6), truth: g });
      }
    });
  }
  return pts;
}

function kmeans(pts: Pt[], k: number, seed: number): number[] {
  const rand = mulberry32(seed);
  let C = Array.from({ length: k }, () => { const p = pts[Math.floor(rand() * pts.length)]; return { x: p.x, y: p.y }; });
  let lab = pts.map(() => 0);
  for (let it = 0; it < 50; it++) {
    const nl = pts.map((p) => {
      let best = 0, bd = Infinity;
      C.forEach((c, j) => { const d = (p.x - c.x) ** 2 + (p.y - c.y) ** 2; if (d < bd) { bd = d; best = j; } });
      return best;
    });
    const nc = C.map((c, j) => {
      const mine = pts.filter((_, i) => nl[i] === j);
      if (!mine.length) return c;
      return { x: mine.reduce((s, p) => s + p.x, 0) / mine.length, y: mine.reduce((s, p) => s + p.y, 0) / mine.length };
    });
    C = nc;
    if (it > 0 && nl.every((v, i) => v === lab[i])) { lab = nl; break; }
    lab = nl;
  }
  return lab;
}

export function KMeansFailureLab() {
  const [shape, setShape] = useState<Shape>("rings");
  const cfg = SHAPES.find((s) => s.id === shape)!;
  const points = useMemo(() => genPoints(shape), [shape]);
  const lab = useMemo(() => kmeans(points, cfg.k, 21), [points, cfg.k]);

  // how well k-means recovered the truth (best label matching, 2 clusters only)
  const acc = useMemo(() => {
    if (cfg.k !== 2) return null;
    const same = points.filter((p, i) => lab[i] === p.truth).length;
    return Math.max(same, points.length - same) / points.length;
  }, [points, lab, cfg.k]);

  const W = 320, H = 240;
  const sx = (x: number) => r2(20 + (x / 100) * (W - 40));
  const sy = (y: number) => r2(H - 20 - (y / 100) * (H - 40));

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        <span style={head}>k-means on shapes it can&rsquo;t handle</span>
        <div style={{ display: "flex", gap: 5 }}>
          {SHAPES.map((s) => (
            <button key={s.id} onClick={() => setShape(s.id)} style={tab(shape === s.id)}>{s.label}</button>
          ))}
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        {points.map((p, i) => (
          <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={3.4}
            fill={KM_COLORS[lab[i] % KM_COLORS.length]} fillOpacity={0.85}
            stroke={p.truth === 0 ? "none" : "var(--ink)"} strokeWidth={p.truth === 0 ? 0 : 1} strokeOpacity={0.5} />
        ))}
      </svg>

      <div style={{ display: "flex", gap: 16, margin: "10px 0 2px" }}>
        <S label="true groups" value={String(new Set(points.map((p) => p.truth)).size)} />
        {acc !== null && <S label="recovered correctly" value={`${(acc * 100).toFixed(0)}%`} color={acc > 0.85 ? "var(--good)" : "var(--bad, #d9534f)"} />}
      </div>

      <div style={caption}>
        Fill colour = the cluster k-means assigned. <strong>Outlined</strong> dots belong to true group 2,
        plain dots to true group 1.{" "}
        {shape === "rings" && "The rings share a center, so no straight line separates them — k-means cuts the doughnut in half instead of inner-vs-outer."}
        {shape === "moons" && "The interlocking crescents can only be split by a curve. k-means draws a straight line and mixes both moons together."}
        {shape === "aniso" && "The blobs are long and diagonal. k-means prefers round, equal cells, so it carves across the true elongated groups."}
        {" "}Its only tool is a straight perpendicular bisector — fine for round blobs, wrong for everything here.
      </div>
    </div>
  );
}

function S({ label, value, color }: { label: string; value: string; color?: string }) {
  return (<div><div style={{ fontSize: 11, color: "var(--muted)" }}>{label}</div><div style={{ fontFamily: "ui-monospace, monospace", fontSize: 16, color: color || "var(--ink)" }}>{value}</div></div>);
}
const wrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const caption: React.CSSProperties = { fontSize: 12.5, color: "var(--muted)", marginTop: 14, lineHeight: 1.55 };
function tab(active: boolean): React.CSSProperties {
  return { fontSize: 11.5, padding: "5px 10px", borderRadius: 8, cursor: "pointer", border: `1px solid ${active ? "var(--c-clustering)" : "var(--border-strong)"}`, background: active ? "var(--c-clustering)" : "transparent", color: active ? "white" : "var(--muted)" };
}
