"use client";

import { useMemo, useState } from "react";

// The canonical regularization demo. We fit a degree-9 polynomial to noisy samples
// of a smooth curve using RIDGE regression, and vary λ. λ≈0 overfits (wild wiggles,
// zero train error, high test error); large λ underfits (too flat). A middle λ wins.
// All arithmetic is rational (no sin/exp), so SSR and client agree exactly.

const DEG = 9;
const N = 12;
const LAMBDAS = [
  { v: 1e-6, label: "10⁻⁶" },
  { v: 1e-4, label: "10⁻⁴" },
  { v: 1e-3, label: "10⁻³" },
  { v: 1e-2, label: "10⁻²" },
  { v: 1e-1, label: "10⁻¹" },
  { v: 1, label: "1" },
  { v: 10, label: "10" },
];

function mulberry32(a: number) {
  return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const r2 = (v: number) => Math.round(v * 100) / 100;

// smooth target on t∈[0,1] — a cubic (rational, deterministic)
const ftrue = (t: number) => 0.5 + 6 * (t - 0.15) * (t - 0.5) * (t - 0.85);

function makeData(seed: number, ts: number[]): { t: number; y: number }[] {
  const rand = mulberry32(seed);
  return ts.map((t) => ({ t, y: ftrue(t) + (rand() - 0.5) * 0.16 }));
}

// design row in scaled coord x = 2t-1
function basis(t: number): number[] {
  const x = 2 * t - 1;
  const row = [1];
  for (let j = 1; j <= DEG; j++) row.push(row[j - 1] * x);
  return row;
}

// solve A b = rhs by Gaussian elimination with partial pivoting
function solve(A: number[][], rhs: number[]): number[] {
  const n = rhs.length;
  const M = A.map((r, i) => [...r, rhs[i]]);
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r;
    [M[col], M[piv]] = [M[piv], M[col]];
    const d = M[col][col] || 1e-12;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = M[r][col] / d;
      for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c];
    }
  }
  return M.map((row, i) => row[n] / (M[i][i] || 1e-12));
}

function ridgeFit(data: { t: number; y: number }[], lambda: number) {
  const Phi = data.map((d) => basis(d.t));
  const p = DEG + 1;
  // normalize columns (≈ standardizing features) for conditioning
  const colNorm = Array.from({ length: p }, (_, j) =>
    Math.sqrt(Phi.reduce((s, row) => s + row[j] * row[j], 0)) || 1,
  );
  const Z = Phi.map((row) => row.map((v, j) => v / colNorm[j]));
  // A = ZᵀZ + λI (don't penalize intercept j=0), rhs = Zᵀy
  const A = Array.from({ length: p }, (_, i) =>
    Array.from({ length: p }, (_, j) => {
      let s = 0;
      for (let r = 0; r < Z.length; r++) s += Z[r][i] * Z[r][j];
      if (i === j && i > 0) s += lambda;
      return s;
    }),
  );
  const rhs = Array.from({ length: p }, (_, i) => data.reduce((s, d, r) => s + Z[r][i] * d.y, 0));
  const beta = solve(A, rhs);
  return (t: number) => basis(t).reduce((s, v, j) => s + (v / colNorm[j]) * beta[j], 0);
}

function mse(data: { t: number; y: number }[], predict: (t: number) => number) {
  return data.reduce((s, d) => s + (predict(d.t) - d.y) ** 2, 0) / data.length;
}

export function RidgePolyLab() {
  const train = useMemo(() => makeData(7, Array.from({ length: N }, (_, i) => i / (N - 1))), []);
  const test = useMemo(() => makeData(42, Array.from({ length: N - 1 }, (_, i) => (i + 0.5) / (N - 1))), []);
  const [li, setLi] = useState(3);
  const lambda = LAMBDAS[li].v;

  const predict = useMemo(() => ridgeFit(train, lambda), [train, lambda]);
  const trainErr = mse(train, predict);
  const testErr = mse(test, predict);
  // which λ gives the lowest test error (for highlighting)
  const bestLi = useMemo(() => {
    let bi = 0, bv = Infinity;
    LAMBDAS.forEach((l, i) => { const e = mse(test, ridgeFit(train, l.v)); if (e < bv) { bv = e; bi = i; } });
    return bi;
  }, [train, test]);

  const W = 340, H = 250, padL = 16, padR = 12, padT = 12, padB = 18;
  const X0 = -0.05, X1 = 1.05, Y0 = -0.05, Y1 = 1.05;
  const sx = (t: number) => r2(padL + ((t - X0) / (X1 - X0)) * (W - padL - padR));
  const sy = (y: number) => r2(H - padB - ((y - Y0) / (Y1 - Y0)) * (H - padT - padB));

  const grid = Array.from({ length: 80 }, (_, i) => i / 79);
  const fitPath = grid.map((t) => `${sx(t)},${sy(predict(t))}`).join(" ");
  const truePath = grid.map((t) => `${sx(t)},${sy(ftrue(t))}`).join(" ");

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        <span style={head}>Degree-9 fit · ridge penalty λ</span>
        <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: "var(--muted)" }}>λ =</span>
          {LAMBDAS.map((l, i) => <button key={l.label} onClick={() => setLi(i)} style={chip(li === i, i === bestLi)}>{l.label}</button>)}
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        <polyline points={truePath} fill="none" stroke="var(--faint)" strokeWidth={2} strokeDasharray="5 4" />
        <polyline points={fitPath} fill="none" stroke="var(--c-regression)" strokeWidth={2.6} />
        {train.map((d, i) => <circle key={"tr" + i} cx={sx(d.t)} cy={sy(d.y)} r={3.6} fill="var(--c-regression)" fillOpacity={0.9} />)}
        {test.map((d, i) => <circle key={"te" + i} cx={sx(d.t)} cy={sy(d.y)} r={3.2} fill="none" stroke="var(--muted)" strokeWidth={1.3} />)}
        <text x={W - 14} y={18} fontSize={9} fill="var(--faint)" textAnchor="end">– – true curve</text>
      </svg>

      <div style={{ display: "flex", gap: 16, margin: "10px 0 2px" }}>
        <S label="λ" value={LAMBDAS[li].label} color={li === bestLi ? "var(--good)" : "var(--ink)"} />
        <S label="train MSE" value={trainErr.toFixed(4)} color={li <= 1 ? "var(--good)" : "var(--ink)"} />
        <S label="test MSE" value={testErr.toFixed(4)} color={li === bestLi ? "var(--good)" : "var(--ink)"} />
      </div>

      <div style={caption}>
        Filled dots are training data, hollow dots are held-out test data, the dashed line is the true
        curve. At <strong>λ = 10⁻⁶</strong> the degree-9 polynomial nearly interpolates the training points
        — tiny train MSE, but it wiggles wildly and test MSE is awful (overfitting). Raise λ and the fit
        smooths toward the true curve; push it too far and it flattens, missing the real shape
        (underfitting). The penalty shrinks the coefficients, trading a little training fit for far better
        generalization — lowest test MSE is at <strong>λ = {LAMBDAS[bestLi].label}</strong>.
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
function chip(active: boolean, isBest: boolean): React.CSSProperties {
  return { fontSize: 11.5, minWidth: 30, height: 24, padding: "0 6px", borderRadius: 6, cursor: "pointer", border: `1px solid ${active ? "var(--c-regression)" : isBest ? "var(--good)" : "var(--border-strong)"}`, background: active ? "var(--c-regression)" : "transparent", color: active ? "white" : isBest ? "var(--good)" : "var(--muted)" };
}
