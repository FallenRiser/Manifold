"use client";

import { useMemo, useState } from "react";

// A regression tree on 1-D data. Same greedy splitting as a classification tree,
// but the "impurity" is variance and each leaf predicts the MEAN of its points —
// so the fit is a staircase of flat steps. Drag the depth: one step becomes two,
// four, eight… tracking the curve ever more closely, until the steps start
// chasing individual noisy points. Shows why a tree's regression fit is blocky,
// and why depth is again the overfitting knob.
//
// Deterministic data (mulberry32) computed once at module scope; every emitted
// coordinate is rounded → identical SSR and client render.

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type P = { x: number; y: number };

const DATA: P[] = (() => {
  const r = mulberry32(23);
  const pts: P[] = [];
  for (let i = 0; i < 44; i++) {
    const x = i / 43;
    const noise = (r() + r() + r() - 1.5) * 0.14; // ~gaussian, mean 0
    const y = 0.5 + 0.3 * Math.sin(2 * Math.PI * 0.9 * x) + noise;
    pts.push({ x, y });
  }
  return pts;
})();

type Seg = { x0: number; x1: number; mean: number };

function sse(pts: P[]): number {
  if (!pts.length) return 0;
  const m = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  return pts.reduce((s, p) => s + (p.y - m) * (p.y - m), 0);
}

function build(pts: P[], depth: number, maxDepth: number, x0: number, x1: number, out: Seg[]) {
  const mean = pts.length ? pts.reduce((s, p) => s + p.y, 0) / pts.length : 0.5;
  if (depth >= maxDepth || pts.length < 4) {
    out.push({ x0, x1, mean });
    return;
  }
  const xs = [...new Set(pts.map((p) => p.x))].sort((a, b) => a - b);
  let bestThr: number | null = null;
  let bestScore = sse(pts);
  for (let i = 0; i < xs.length - 1; i++) {
    const thr = (xs[i] + xs[i + 1]) / 2;
    const L = pts.filter((p) => p.x <= thr);
    const R = pts.filter((p) => p.x > thr);
    if (L.length < 2 || R.length < 2) continue;
    const score = sse(L) + sse(R);
    if (score < bestScore - 1e-9) {
      bestScore = score;
      bestThr = thr;
    }
  }
  if (bestThr == null) {
    out.push({ x0, x1, mean });
    return;
  }
  const L = pts.filter((p) => p.x <= bestThr!);
  const R = pts.filter((p) => p.x > bestThr!);
  build(L, depth + 1, maxDepth, x0, bestThr, out);
  build(R, depth + 1, maxDepth, bestThr, x1, out);
}

const W = 380;
const H = 260;
const PAD = 22;
const f = (n: number) => Math.round(n * 100) / 100;
const px = (x: number) => f(PAD + x * (W - 2 * PAD));
const py = (y: number) => f(H - PAD - y * (H - 2 * PAD));

export function RegressionTreeLab() {
  const [depth, setDepth] = useState(2);

  const { segs, rmse } = useMemo(() => {
    const segs: Seg[] = [];
    build(DATA, 0, depth, 0, 1, segs);
    const predict = (x: number) => {
      for (const s of segs) if (x >= s.x0 && x <= s.x1) return s.mean;
      return segs[segs.length - 1].mean;
    };
    const mse = DATA.reduce((s, p) => s + (p.y - predict(p.x)) ** 2, 0) / DATA.length;
    return { segs, rmse: Math.sqrt(mse) };
  }, [depth]);

  return (
    <div style={{ background: "var(--canvas)", border: "1px solid var(--border-strong)", borderRadius: 14, padding: "16px 16px 14px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 18, alignItems: "flex-start" }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 400, flex: "1 1 300px", display: "block" }} role="img" aria-label="A regression tree fitting 1-D data as a staircase of flat steps">
          {/* axes */}
          <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="var(--border-strong)" strokeWidth={1} />
          <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="var(--border-strong)" strokeWidth={1} />
          {/* data */}
          {DATA.map((p, i) => (
            <circle key={i} cx={px(p.x)} cy={py(p.y)} r={3.2} fill="var(--muted)" opacity={0.75} />
          ))}
          {/* staircase fit */}
          {segs.map((s, i) => (
            <line key={i} x1={px(s.x0)} y1={py(s.mean)} x2={px(s.x1)} y2={py(s.mean)} stroke="var(--c-trees)" strokeWidth={2.5} strokeLinecap="round" />
          ))}
          {/* risers between steps */}
          {segs.slice(1).map((s, i) => (
            <line key={`r${i}`} x1={px(s.x0)} y1={py(segs[i].mean)} x2={px(s.x0)} y2={py(s.mean)} stroke="var(--c-trees)" strokeWidth={1} strokeDasharray="2 2" opacity={0.5} />
          ))}
          <text x={W - PAD} y={H - 6} fontSize={10} textAnchor="end" fill="var(--faint)">feature x</text>
        </svg>

        <div style={{ flex: "1 1 190px", minWidth: 180 }}>
          <label style={{ fontSize: 12.5, color: "var(--muted)", display: "block", marginBottom: 6 }}>
            Max depth: <strong style={{ color: "var(--ink)" }}>{depth}</strong>
          </label>
          <input type="range" min={1} max={6} step={1} value={depth} onChange={(e) => setDepth(Number(e.target.value))} style={{ width: "100%", accentColor: "var(--c-trees)" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 13, marginTop: 16 }}>
            <span style={{ color: "var(--muted)" }}>Steps (leaves)</span>
            <span className="font-display" style={{ fontWeight: 600, color: "var(--ink)" }}>{segs.length}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 13, marginTop: 8 }}>
            <span style={{ color: "var(--muted)" }}>Train RMSE</span>
            <span className="font-display" style={{ fontWeight: 600, color: "var(--ink)" }}>{rmse.toFixed(3)}</span>
          </div>
          <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.55, marginTop: 14 }}>
            Each step is a leaf; its height is the mean <em>y</em> of the points beneath it. More depth → more,
            shorter steps.
          </p>
        </div>
      </div>
    </div>
  );
}
