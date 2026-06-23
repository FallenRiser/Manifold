"use client";

import { useMemo, useState } from "react";

// The choose-k story as two curves. We split a 2-class dataset into train and
// validation, then sweep k and plot TRAIN accuracy (memorisation) against
// VALIDATION accuracy (generalisation). Train is perfect at k=1 and decays;
// validation is the U-shape (here inverted — a hump) that peaks at the best k.

const CLASSES = ["var(--c-classification)", "var(--c-regression)"];
const KS = [1, 3, 5, 7, 9, 11, 15, 19, 25, 31, 41];

function mulberry32(a: number) {
  return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const r2 = (v: number) => Math.round(v * 100) / 100;

type Pt = { x: number; y: number; c: number };

function gen(seed: number, n: number): Pt[] {
  const rand = mulberry32(seed);
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const c = rand() < 0.5 ? 0 : 1;
    // two overlapping gaussians + label noise so the best k is interior
    const cx = c === 0 ? 40 : 60, cy = 50;
    let x = cx + (rand() - 0.5) * 46, y = cy + (rand() - 0.5) * 60;
    let label = c;
    if (rand() < 0.15) label = 1 - label;      // 15% label noise
    pts.push({ x: r2(x), y: r2(y), c: label });
  }
  return pts;
}

function predict(train: Pt[], qx: number, qy: number, k: number): number {
  const d = train.map((p, i) => ({ i, d: (p.x - qx) ** 2 + (p.y - qy) ** 2 }));
  d.sort((a, b) => a.d - b.d);
  let v0 = 0, v1 = 0;
  for (let j = 0; j < k; j++) (train[d[j].i].c === 0 ? v0++ : v1++);
  return v0 >= v1 ? 0 : 1;
}

export function KNNChooseKLab() {
  const train = useMemo(() => gen(7, 80), []);
  const val = useMemo(() => gen(99, 60), []);

  const curves = useMemo(() => {
    return KS.map((k) => {
      // train accuracy: classify each train point using the train set (self included)
      let tOk = 0;
      train.forEach((p) => { if (predict(train, p.x, p.y, k) === p.c) tOk++; });
      // validation accuracy: classify held-out points against the train set
      let vOk = 0;
      val.forEach((p) => { if (predict(train, p.x, p.y, k) === p.c) vOk++; });
      return { k, train: tOk / train.length, val: vOk / val.length };
    });
  }, [train, val]);

  const bestIdx = curves.reduce((bi, c, i, arr) => (c.val > arr[bi].val ? i : bi), 0);
  const bestK = curves[bestIdx].k;
  const [sel, setSel] = useState(bestIdx);
  const cur = curves[sel];

  const W = 340, H = 200, padL = 34, padB = 28, padT = 12;
  const lo = 0.45;
  const px = (i: number) => r2(padL + (i / (KS.length - 1)) * (W - padL - 12));
  const py = (a: number) => r2(padT + (1 - (a - lo) / (1 - lo)) * (H - padT - padB));

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        <span style={head}>Train vs. validation accuracy across k</span>
        <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: "var(--muted)" }}>k =</span>
          {KS.map((kk, i) => <button key={kk} onClick={() => setSel(i)} style={chip(sel === i, kk === bestK)}>{kk}</button>)}
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        {/* train curve */}
        <polyline points={curves.map((c, i) => `${px(i)},${py(c.train)}`).join(" ")} fill="none" stroke="var(--faint)" strokeWidth={2} strokeDasharray="4 3" />
        {/* validation curve */}
        <polyline points={curves.map((c, i) => `${px(i)},${py(c.val)}`).join(" ")} fill="none" stroke="var(--c-classification)" strokeWidth={2.4} />
        {curves.map((c, i) => <circle key={i} cx={px(i)} cy={py(c.val)} r={i === sel ? 5 : 3} fill={c.k === bestK ? "var(--good)" : "var(--c-classification)"} stroke={i === sel ? "var(--ink)" : "none"} strokeWidth={1.4} />)}
        {/* best-k marker */}
        <line x1={px(bestIdx)} y1={padT} x2={px(bestIdx)} y2={H - padB} stroke="var(--good)" strokeWidth={1} strokeDasharray="2 3" opacity={0.6} />
        <text x={px(bestIdx)} y={padT + 8} fontSize={9} fill="var(--good)" textAnchor="middle">best k={bestK}</text>
        <text x={W - 12} y={py(curves[curves.length - 1].train) - 4} fontSize={8.5} fill="var(--faint)" textAnchor="end">train</text>
        <text x={W - 12} y={py(curves[curves.length - 1].val) + 11} fontSize={8.5} fill="var(--c-classification)" textAnchor="end">validation</text>
        <text x={W / 2} y={H - 4} fontSize={9} fill="var(--faint)" textAnchor="middle">k (small → large) · overfit ← → underfit</text>
      </svg>

      <div style={{ display: "flex", gap: 16, margin: "10px 0 2px" }}>
        <S label="k" value={String(cur.k)} color={cur.k === bestK ? "var(--good)" : "var(--ink)"} />
        <S label="train acc" value={`${(cur.train * 100).toFixed(0)}%`} />
        <S label="validation acc" value={`${(cur.val * 100).toFixed(0)}%`} color={cur.k === bestK ? "var(--good)" : "var(--ink)"} />
      </div>

      <div style={caption}>
        The dashed line is <strong>training</strong> accuracy — perfect at k = 1 (every point is its own
        neighbour) and falling as k grows. The solid line is <strong>validation</strong> accuracy on
        held-out data — low at k = 1 (overfitting the noise), rising to a peak at{" "}
        <strong>k = {bestK}</strong>, then falling again as large k over-smooths (underfitting). You pick k
        by the <em>validation</em> peak, never the training curve. With ~{train.length} training points,
        note the peak sits near √n ≈ {Math.round(Math.sqrt(train.length))}.
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
function chip(active: boolean, isBest: boolean): React.CSSProperties {
  return { fontSize: 11.5, minWidth: 24, height: 24, padding: "0 5px", borderRadius: 6, cursor: "pointer", border: `1px solid ${active ? "var(--c-classification)" : isBest ? "var(--good)" : "var(--border-strong)"}`, background: active ? "var(--c-classification)" : "transparent", color: active ? "white" : isBest ? "var(--good)" : "var(--muted)" };
}
