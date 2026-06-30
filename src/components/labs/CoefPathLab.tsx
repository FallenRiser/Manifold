"use client";

import { useMemo, useState } from "react";

// Coefficient paths: how each fitted coefficient changes as the penalty λ sweeps
// from strong (left) to weak (right). Ridge paths glide toward zero but never reach
// it; Lasso paths hit EXACTLY zero one by one — that's feature selection, made
// visible. One fixed dataset, two penalties, toggle between them.

const P = 6;
const NREG = 28; // number of λ values along the path
const COLORS = ["var(--c-regression)", "var(--c-classification)", "var(--c-trees)", "var(--c-rl)", "var(--c-clustering)", "var(--c-metrics)"];

function mulberry32(a: number) {
  return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const r2 = (v: number) => Math.round(v * 100) / 100;

// deterministic dataset: 6 features (2 correlated pairs), sparse-ish true coefficients
function makeData() {
  const rand = mulberry32(31);
  const n = 40;
  const X: number[][] = [];
  const yRaw: number[] = [];
  const betaTrue = [2.4, -1.8, 0, 0, 1.0, 0];
  for (let i = 0; i < n; i++) {
    const base = Array.from({ length: P }, () => rand() * 2 - 1);
    base[1] = 0.85 * base[0] + 0.3 * base[1];      // feature 1 correlated with 0
    base[3] = 0.8 * base[2] + 0.3 * base[3];        // feature 3 correlated with 2
    X.push(base);
    yRaw.push(base.reduce((s, v, j) => s + v * betaTrue[j], 0) + (rand() - 0.5) * 0.7);
  }
  return { X, y: yRaw, n };
}

// standardize columns to mean 0 / unit variance; center y
function standardize(X: number[][], y: number[]) {
  const n = X.length;
  const mean = Array.from({ length: P }, (_, j) => X.reduce((s, r) => s + r[j], 0) / n);
  const sd = Array.from({ length: P }, (_, j) => Math.sqrt(X.reduce((s, r) => s + (r[j] - mean[j]) ** 2, 0) / n) || 1);
  const Z = X.map((r) => r.map((v, j) => (v - mean[j]) / sd[j]));
  const ym = y.reduce((s, v) => s + v, 0) / n;
  return { Z, yc: y.map((v) => v - ym) };
}

function solve(A: number[][], rhs: number[]): number[] {
  const n = rhs.length;
  const M = A.map((r, i) => [...r, rhs[i]]);
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r;
    [M[col], M[piv]] = [M[piv], M[col]];
    const d = M[col][col] || 1e-12;
    for (let r = 0; r < n; r++) { if (r === col) continue; const f = M[r][col] / d; for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c]; }
  }
  return M.map((row, i) => row[n] / (M[i][i] || 1e-12));
}

function ridgePath(Z: number[][], yc: number[], lambdas: number[]): number[][] {
  const G = Array.from({ length: P }, (_, i) => Array.from({ length: P }, (_, j) => Z.reduce((s, r) => s + r[i] * r[j], 0)));
  const Zy = Array.from({ length: P }, (_, i) => Z.reduce((s, r, k) => s + r[i] * yc[k], 0));
  return lambdas.map((lam) => {
    const A = G.map((row, i) => row.map((v, j) => (i === j ? v + lam : v)));
    return solve(A, Zy);
  });
}

function lassoPath(Z: number[][], yc: number[], lambdas: number[]): number[][] {
  const n = Z.length;
  const col2 = Array.from({ length: P }, (_, j) => Z.reduce((s, r) => s + r[j] * r[j], 0));
  const soft = (a: number, l: number) => Math.sign(a) * Math.max(Math.abs(a) - l, 0);
  let beta = new Array(P).fill(0);
  return lambdas.map((lam) => {
    // warm-started coordinate descent
    for (let sweep = 0; sweep < 60; sweep++) {
      for (let j = 0; j < P; j++) {
        let rho = 0;
        for (let i = 0; i < n; i++) {
          let pred = 0;
          for (let k = 0; k < P; k++) if (k !== j) pred += Z[i][k] * beta[k];
          rho += Z[i][j] * (yc[i] - pred);
        }
        beta[j] = soft(rho, lam * n) / col2[j];
      }
    }
    return [...beta];
  });
}

export function CoefPathLab() {
  const { X, y } = useMemo(() => makeData(), []);
  const { Z, yc } = useMemo(() => standardize(X, y), [X, y]);
  // λ grid (log-spaced, strong → weak as index grows)
  const lambdas = useMemo(() => Array.from({ length: NREG }, (_, i) => 3.0 * Math.pow(0.74, i)), []);
  const ridge = useMemo(() => ridgePath(Z, yc, lambdas), [Z, yc, lambdas]);
  const lasso = useMemo(() => lassoPath(Z, yc, lambdas), [Z, yc, lambdas]);

  const [mode, setMode] = useState<"ridge" | "lasso">("ridge");
  const [li, setLi] = useState(NREG - 8);
  const paths = mode === "ridge" ? ridge : lasso;
  const cur = paths[li];
  const nonzero = cur.filter((b) => Math.abs(b) > 1e-4).length;

  const maxAbs = Math.max(0.5, ...paths.flat().map((v) => Math.abs(v)));
  const W = 340, H = 220, padL = 30, padR = 56, padT = 12, padB = 26;
  const px = (i: number) => r2(padL + (i / (NREG - 1)) * (W - padL - padR));
  const py = (v: number) => r2(padT + (1 - (v + maxAbs) / (2 * maxAbs)) * (H - padT - padB));

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        <span style={head}>Coefficient paths</span>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setMode("ridge")} style={tab(mode === "ridge")}>Ridge (L2)</button>
          <button onClick={() => setMode("lasso")} style={tab(mode === "lasso")}>Lasso (L1)</button>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        <line x1={padL} y1={py(0)} x2={W - padR} y2={py(0)} stroke="var(--border-strong)" strokeWidth={0.8} strokeDasharray="2 2" />
        {Array.from({ length: P }, (_, j) => (
          <g key={j}>
            <polyline points={paths.map((b, i) => `${px(i)},${py(b[j])}`).join(" ")} fill="none" stroke={COLORS[j]} strokeWidth={2} strokeOpacity={0.9} />
            <text x={W - padR + 4} y={py(paths[NREG - 1][j]) + 3} fontSize={8} fill={COLORS[j]}>β{j + 1}</text>
          </g>
        ))}
        {/* current λ marker */}
        <line x1={px(li)} y1={padT} x2={px(li)} y2={H - padB} stroke="var(--ink)" strokeWidth={1} strokeDasharray="3 2" opacity={0.5} />
        <text x={W / 2} y={H - 4} fontSize={9} fill="var(--faint)" textAnchor="middle">← stronger λ (more shrinkage)　　weaker λ →</text>
      </svg>

      <input type="range" min={0} max={NREG - 1} value={li} onChange={(e) => setLi(+e.target.value)} style={{ width: "100%", marginTop: 8, accentColor: "var(--c-regression)" }} />

      <div style={{ display: "flex", gap: 16, margin: "8px 0 2px" }}>
        <S label="λ" value={lambdas[li].toFixed(3)} />
        <S label="nonzero coefficients" value={`${nonzero} / ${P}`} color={mode === "lasso" && nonzero < P ? "var(--good)" : "var(--ink)"} />
      </div>

      <div style={caption}>
        Each line is one coefficient as λ slides from strong (left) to weak (right). With{" "}
        <strong>Ridge</strong> every path glides smoothly toward zero but stays nonzero — all six features
        survive, just shrunken. Switch to <strong>Lasso</strong> and the paths hit <strong>exactly
        zero</strong> and stick, one feature dropping out at a time. At this λ, Lasso keeps{" "}
        {mode === "lasso" ? nonzero : "all 6"} of 6 features. That&rsquo;s automatic feature selection — the
        corner geometry from the previous page, in motion.
      </div>
    </div>
  );
}

function S({ label, value, color }: { label: string; value: string; color?: string }) {
  return (<div><div style={{ fontSize: 11, color: "var(--muted)" }}>{label}</div><div style={{ fontFamily: "ui-monospace, monospace", fontSize: 16, color: color || "var(--ink)" }}>{value}</div></div>);
}
const wrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const caption: React.CSSProperties = { fontSize: 12.5, color: "var(--muted)", marginTop: 12, lineHeight: 1.55 };
function tab(active: boolean): React.CSSProperties {
  return { fontSize: 12, padding: "5px 12px", borderRadius: 8, cursor: "pointer", border: `1px solid ${active ? "var(--c-regression)" : "var(--border-strong)"}`, background: active ? "var(--c-regression)" : "transparent", color: active ? "white" : "var(--muted)" };
}
