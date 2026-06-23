"use client";

import { useMemo, useState } from "react";

// Two features on wildly different scales: "income" (0–100k, large numbers) and
// "age" (0–60, small numbers). The TRUE groups are separated by age. Without
// scaling, the income axis dominates Euclidean distance, so k-means slices along
// income — the wrong answer. Standardize, and the real age-based groups appear.

const CLUSTER_COLORS = ["var(--c-regression)", "var(--c-classification)"];
const TRUE_COLORS = ["var(--good)", "var(--c-clustering)"];

function mulberry32(a: number) {
  return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

type Pt = { income: number; age: number; truth: number };

// two real groups: young (age ~28) and older (age ~48); income spreads widely in both
function genPoints(): Pt[] {
  const rand = mulberry32(5);
  const pts: Pt[] = [];
  for (let g = 0; g < 2; g++) {
    const ageC = g === 0 ? 28 : 48;
    for (let i = 0; i < 24; i++) {
      pts.push({
        income: 15 + rand() * 85,                 // 15k–100k, both groups
        age: ageC + (rand() - 0.5) * 12,           // tight around the group age
        truth: g,
      });
    }
  }
  return pts;
}

function kmeans2(vals: { x: number; y: number }[], seed: number): number[] {
  const rand = mulberry32(seed);
  let C = [vals[Math.floor(rand() * vals.length)], vals[Math.floor(rand() * vals.length)]].map((c) => ({ ...c }));
  let lab = vals.map(() => 0);
  for (let it = 0; it < 40; it++) {
    const nl = vals.map((p) => {
      const d0 = (p.x - C[0].x) ** 2 + (p.y - C[0].y) ** 2;
      const d1 = (p.x - C[1].x) ** 2 + (p.y - C[1].y) ** 2;
      return d0 <= d1 ? 0 : 1;
    });
    const nc = [0, 1].map((j) => {
      const mine = vals.filter((_, i) => nl[i] === j);
      if (!mine.length) return C[j];
      return { x: mine.reduce((s, p) => s + p.x, 0) / mine.length, y: mine.reduce((s, p) => s + p.y, 0) / mine.length };
    });
    C = nc;
    if (nl.every((v, i) => v === lab[i]) && it > 0) { lab = nl; break; }
    lab = nl;
  }
  return lab;
}

export function ScalingLab() {
  const points = useMemo(() => genPoints(), []);
  const [scaled, setScaled] = useState(false);

  // standardize each feature to zero mean, unit std
  const stats = useMemo(() => {
    const inc = points.map((p) => p.income), age = points.map((p) => p.age);
    const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
    const std = (a: number[], m: number) => Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / a.length);
    const mi = mean(inc), ma = mean(age);
    return { mi, si: std(inc, mi), ma, sa: std(age, ma) };
  }, [points]);

  const lab = useMemo(() => {
    const vals = points.map((p) =>
      scaled
        ? { x: (p.income - stats.mi) / stats.si, y: (p.age - stats.ma) / stats.sa }
        : { x: p.income, y: p.age }
    );
    return kmeans2(vals, 42);
  }, [points, scaled, stats]);

  // accuracy vs truth (label-invariant: try both matchings)
  const acc = useMemo(() => {
    const same = points.filter((p, i) => lab[i] === p.truth).length;
    return Math.max(same, points.length - same) / points.length;
  }, [points, lab]);

  // display always uses raw axes so the geometry is honest; income x, age y
  const W = 340, H = 230;
  const sx = (income: number) => Math.round((30 + (income / 100) * (W - 45)) * 100) / 100;
  const sy = (age: number) => Math.round((H - 24 - (age / 65) * (H - 40)) * 100) / 100;

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        <span style={head}>Distance is dominated by the bigger scale</span>
        <button onClick={() => setScaled((s) => !s)} style={toggle(scaled)}>
          {scaled ? "✓ Standardized features" : "Raw features"}
        </button>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        {points.map((p, i) => (
          <circle key={i} cx={sx(p.income)} cy={sy(p.age)} r={4} fill={CLUSTER_COLORS[lab[i]]} fillOpacity={0.85}
            stroke={p.truth === 0 ? "none" : "var(--ink)"} strokeWidth={0.6} strokeOpacity={0.3} />
        ))}
        <text x={W / 2} y={H - 5} fontSize={10} fill="var(--faint)" textAnchor="middle">income (0–100k) — the large-scale axis →</text>
        <text x={12} y={H / 2} fontSize={10} fill="var(--faint)" textAnchor="middle" transform={`rotate(-90 12 ${H / 2})`}>age →</text>
      </svg>

      <div style={{ display: "flex", gap: 16, margin: "10px 0 2px" }}>
        <S label="splits along" value={scaled ? "age (correct)" : "income (wrong)"} color={scaled ? "var(--good)" : "var(--bad, #d9534f)"} />
        <S label="recovers true groups" value={`${(acc * 100).toFixed(0)}%`} color={acc > 0.9 ? "var(--good)" : "var(--bad, #d9534f)"} />
      </div>

      <div style={caption}>
        The real groups differ in <strong>age</strong> (young vs. older), at every income. On{" "}
        <strong>raw</strong> features, income spans 0–100k while age spans only ~20 units — so squared
        distance is almost entirely income, and k-means slices the plot vertically, ignoring the real
        structure. Hit <strong>Standardize</strong> and both features get equal say: the age-based
        groups snap into place. Scaling isn&rsquo;t cosmetic here — it changes the answer.
      </div>
    </div>
  );
}

function S({ label, value, color }: { label: string; value: string; color?: string }) {
  return (<div><div style={{ fontSize: 11, color: "var(--muted)" }}>{label}</div><div style={{ fontFamily: "ui-monospace, monospace", fontSize: 15, color: color || "var(--ink)" }}>{value}</div></div>);
}
const wrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const caption: React.CSSProperties = { fontSize: 12.5, color: "var(--muted)", marginTop: 14, lineHeight: 1.55 };
function toggle(on: boolean): React.CSSProperties {
  return { fontSize: 12.5, padding: "6px 13px", borderRadius: 8, cursor: "pointer", border: `1px solid ${on ? "var(--c-clustering)" : "var(--border-strong)"}`, background: on ? "var(--c-clustering)" : "transparent", color: on ? "white" : "var(--muted)" };
}
