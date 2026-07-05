"use client";

import { useMemo, useState } from "react";

// Ridge in one gesture: turn up λ and watch every coefficient shrink toward zero —
// smoothly, proportionally, but never *reaching* zero (that's the Lasso's job).
// The overall coefficient size ‖β‖ collapses while training error creeps up: the
// bias-for-variance trade the penalty buys.

const P = 6;
const r3 = (v: number) => Math.round(v * 1000) / 1000;
function mulberry32(a: number) {
  return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function solve(A: number[][], rhs: number[]): number[] {
  const n = rhs.length; const M = A.map((r, i) => [...r, rhs[i]]);
  for (let c = 0; c < n; c++) {
    let piv = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
    [M[c], M[piv]] = [M[piv], M[c]]; const d = M[c][c] || 1e-12;
    for (let r = 0; r < n; r++) { if (r === c) continue; const f = M[r][c] / d; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
  }
  return M.map((row, i) => row[n] / (M[i][i] || 1e-12));
}

function makeData() {
  const rand = mulberry32(19); const n = 45;
  const betaTrue = [2.2, -1.6, 1.1, 0.5, -0.9, 0.3];
  const X: number[][] = [], y: number[] = [];
  for (let i = 0; i < n; i++) {
    const row = Array.from({ length: P }, () => rand() * 2 - 1);
    X.push(row); y.push(row.reduce((s, v, j) => s + v * betaTrue[j], 0) + (rand() - 0.5) * 0.6);
  }
  // standardize
  const mean = Array.from({ length: P }, (_, j) => X.reduce((s, r) => s + r[j], 0) / n);
  const sd = Array.from({ length: P }, (_, j) => Math.sqrt(X.reduce((s, r) => s + (r[j] - mean[j]) ** 2, 0) / n) || 1);
  const Z = X.map((r) => r.map((v, j) => (v - mean[j]) / sd[j]));
  const ym = y.reduce((s, v) => s + v, 0) / n;
  return { Z, yc: y.map((v) => v - ym), n };
}

export function RidgeShrinkageLab() {
  const { Z, yc, n } = useMemo(() => makeData(), []);
  const G = useMemo(() => Array.from({ length: P }, (_, i) => Array.from({ length: P }, (_, j) => Z.reduce((s, r) => s + r[i] * r[j], 0))), [Z]);
  const Zy = useMemo(() => Array.from({ length: P }, (_, i) => Z.reduce((s, r, k) => s + r[i] * yc[k], 0)), [Z, yc]);
  const ols = useMemo(() => solve(G, Zy), [G, Zy]);

  const [logLam, setLogLam] = useState(0.95);
  const lam = Math.pow(10, logLam);
  const beta = useMemo(() => solve(G.map((row, i) => row.map((v, j) => (i === j ? v + lam : v))), Zy), [G, Zy, lam]);

  const norm = Math.sqrt(beta.reduce((s, b) => s + b * b, 0));
  const olsNorm = Math.sqrt(ols.reduce((s, b) => s + b * b, 0));
  const trainMSE = Z.reduce((s, r, k) => { const p = r.reduce((a, v, j) => a + v * beta[j], 0); return s + (p - yc[k]) ** 2; }, 0) / n;

  const maxB = Math.max(...ols.map((b) => Math.abs(b)), 0.5);
  const W = 320, H = 150, padT = 12, padB = 20, mid = (H - padB + padT) / 2, bw = (W - 24) / P;
  const bh = (b: number) => r3((b / maxB) * ((H - padT - padB) / 2));

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={head}>Shrinkage in action</span>
        <span style={{ fontSize: 11, color: "var(--muted)" }}>6 standardized features</span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        <line x1={0} y1={mid} x2={W} y2={mid} stroke="var(--border-strong)" strokeWidth={0.8} />
        {ols.map((b, j) => {
          const x = 12 + j * bw;
          return (
            <g key={j}>
              {/* ghost OLS bar */}
              <rect x={x + bw * 0.16} y={b >= 0 ? mid - bh(b) : mid} width={bw * 0.68} height={Math.abs(bh(b))} fill="var(--faint)" fillOpacity={0.25} rx={1.5} />
              {/* ridge bar */}
              <rect x={x + bw * 0.16} y={beta[j] >= 0 ? mid - bh(beta[j]) : mid} width={bw * 0.68} height={Math.abs(bh(beta[j]))} fill="var(--c-regression)" fillOpacity={0.85} rx={1.5} />
              <text x={x + bw / 2} y={H - 6} fontSize={8} fill="var(--muted)" textAnchor="middle">β{j + 1}</text>
            </g>
          );
        })}
        <text x={W - 6} y={padT + 2} fontSize={7.5} fill="var(--faint)" textAnchor="end">ghost = OLS (λ=0)</text>
      </svg>

      <label style={lbl}>penalty λ = <b style={{ color: "var(--ink)" }}>{lam < 1 ? lam.toFixed(2) : lam.toFixed(1)}</b></label>
      <input type="range" min={-2} max={2.6} step={0.02} value={logLam} onChange={(e) => setLogLam(+e.target.value)} style={slider} />

      <div style={{ display: "flex", gap: 18, margin: "6px 0 2px", flexWrap: "wrap" }}>
        <S label="‖β‖ (ridge)" value={norm.toFixed(2)} color="var(--c-regression)" />
        <S label="‖β‖ (OLS)" value={olsNorm.toFixed(2)} />
        <S label="shrunk to" value={`${Math.round((norm / olsNorm) * 100)}%`} />
        <S label="training MSE" value={trainMSE.toFixed(3)} color="var(--warn)" />
      </div>

      <div style={caption}>
        The faint bars are the OLS coefficients; the solid blue bars are ridge&rsquo;s. Turn up <strong>λ</strong> and
        every coefficient is pulled toward the center line together — the whole vector shrinks to{" "}
        <strong>{Math.round((norm / olsNorm) * 100)}%</strong> of its OLS size here. Notice none of them ever hit{" "}
        <em>exactly</em> zero: ridge <strong>shrinks, it doesn&rsquo;t select</strong>. And training error rises as λ
        grows — that&rsquo;s the bias you accept in exchange for lower variance on new data.
      </div>
    </div>
  );
}

function S({ label, value, color }: { label: string; value: string; color?: string }) {
  return (<div><div style={{ fontSize: 11, color: "var(--muted)" }}>{label}</div><div style={{ fontFamily: "ui-monospace, monospace", fontSize: 15, color: color || "var(--ink)" }}>{value}</div></div>);
}
const wrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const caption: React.CSSProperties = { fontSize: 12.5, color: "var(--muted)", marginTop: 12, lineHeight: 1.55 };
const lbl: React.CSSProperties = { display: "block", fontSize: 11.5, color: "var(--muted)", margin: "8px 0 2px" };
const slider: React.CSSProperties = { width: "100%", accentColor: "var(--c-regression)" };
