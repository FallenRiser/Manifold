"use client";

import { useMemo, useState } from "react";

// The k-NN decision boundary, rendered directly. We classify a fine grid of points
// with k-NN and tint each cell by the predicted class — so the coloured regions ARE
// the decision regions. Raise k and watch the jagged, island-pocked boundary at k=1
// melt into a smooth one.

const CLASSES = ["var(--c-classification)", "var(--c-regression)"];

function mulberry32(a: number) {
  return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const r2 = (v: number) => Math.round(v * 100) / 100;

type Pt = { x: number; y: number; c: number };

function genPoints(noisy: boolean): Pt[] {
  const rand = mulberry32(23);
  const pts: Pt[] = [];
  const blobs = [
    { cx: 30, cy: 36, c: 0 }, { cx: 28, cy: 64, c: 0 }, { cx: 46, cy: 50, c: 0 },
    { cx: 70, cy: 64, c: 1 }, { cx: 72, cy: 36, c: 1 }, { cx: 54, cy: 50, c: 1 },
  ];
  for (const b of blobs) for (let i = 0; i < 9; i++) {
    pts.push({ x: r2(b.cx + (rand() - 0.5) * 26), y: r2(b.cy + (rand() - 0.5) * 26), c: b.c });
  }
  if (noisy) {
    pts.push({ x: 34, y: 50, c: 1 });   // blue point inside pink
    pts.push({ x: 66, y: 48, c: 0 });   // pink point inside blue
  }
  return pts;
}

function classify(pts: Pt[], qx: number, qy: number, k: number): number {
  const d = pts.map((p, i) => ({ i, d: (p.x - qx) ** 2 + (p.y - qy) ** 2 }));
  d.sort((a, b) => a.d - b.d);
  let v0 = 0, v1 = 0;
  for (let j = 0; j < k; j++) (pts[d[j].i].c === 0 ? v0++ : v1++);
  return v0 >= v1 ? 0 : 1;
}

const W = 320, H = 250, STEP = 2.5;

export function KNNBoundaryLab() {
  const [k, setK] = useState(1);
  const [noisy, setNoisy] = useState(true);
  const points = useMemo(() => genPoints(noisy), [noisy]);

  const cells = useMemo(() => {
    const out: { gx: number; gy: number; c: number }[] = [];
    for (let gx = 0; gx <= 100; gx += STEP) for (let gy = 0; gy <= 100; gy += STEP) {
      out.push({ gx, gy, c: classify(points, gx, gy, k) });
    }
    return out;
  }, [points, k]);

  // training accuracy (how many training points the rule gets right)
  const trainAcc = useMemo(() => {
    let ok = 0;
    points.forEach((p) => { if (classify(points, p.x, p.y, k) === p.c) ok++; });
    return ok / points.length;
  }, [points, k]);

  const sx = (x: number) => r2(14 + (x / 100) * (W - 28));
  const sy = (y: number) => r2(H - 14 - (y / 100) * (H - 28));
  const cw = (STEP / 100) * (W - 28), ch = (STEP / 100) * (H - 28);

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        <span style={head}>The decision boundary as k grows</span>
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "var(--muted)" }}>k =</span>
          {[1, 3, 7, 15, 31].map((kk) => <button key={kk} onClick={() => setK(kk)} style={chip(k === kk)}>{kk}</button>)}
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        {cells.map((c, i) => (
          <rect key={i} x={sx(c.gx) - cw / 2} y={sy(c.gy) - ch / 2} width={cw} height={ch} fill={CLASSES[c.c]} fillOpacity={0.15} />
        ))}
        {points.map((p, i) => (
          <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={4} fill={CLASSES[p.c]} stroke="var(--canvas)" strokeWidth={1} />
        ))}
      </svg>

      <div style={{ display: "flex", gap: 16, margin: "10px 0 2px", alignItems: "center" }}>
        <S label="k" value={String(k)} />
        <S label="training accuracy" value={`${(trainAcc * 100).toFixed(0)}%`} color={k === 1 ? "var(--good)" : "var(--ink)"} />
        <label style={{ fontSize: 12, color: "var(--muted)", display: "flex", gap: 5, alignItems: "center", cursor: "pointer", marginLeft: "auto" }}>
          <input type="checkbox" checked={noisy} onChange={(e) => setNoisy(e.target.checked)} /> noisy points
        </label>
      </div>

      <div style={caption}>
        Tinted regions are the actual decision regions. At <strong>k = 1</strong> the boundary is jagged
        and the two noisy points carve out little islands — training accuracy is a perfect (and misleading)
        100%. Raise <strong>k</strong> and the boundary smooths, the islands vanish, and training accuracy
        drops <em>because the model stopped memorising noise</em>. Push k too far and it over-smooths,
        ignoring real structure. The best k is somewhere in between — the next chapter finds it.
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
function chip(active: boolean): React.CSSProperties {
  return { fontSize: 12, minWidth: 26, height: 26, padding: "0 6px", borderRadius: 6, cursor: "pointer", border: `1px solid ${active ? "var(--c-classification)" : "var(--border-strong)"}`, background: active ? "var(--c-classification)" : "transparent", color: active ? "white" : "var(--muted)" };
}
