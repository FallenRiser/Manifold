"use client";

import { useMemo, useState } from "react";

// Why ridge tames collinearity — shown as variance, not one lucky fit. Two features
// whose correlation ρ you control both truly drive y with weight 1. We refit on many
// independent noisy samples and plot every estimate in (β₁, β₂) space. As ρ → 1, XᵀX
// becomes near-singular and the OLS cloud stretches into a huge streak along β₁+β₂≈2
// (the twins trade weight almost for free). Ridge's +λ keeps the problem conditioned,
// so its cloud stays a tight blob near the truth. Same expected value, wildly different
// variance — that's the whole point.

const K = 60;        // independent samples
const N = 40;        // rows per sample
const r3 = (v: number) => Math.round(v * 1000) / 1000;
function mulberry32(a: number) {
  return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function solve2(A: number[][], b: number[]): [number, number] {
  const det = A[0][0] * A[1][1] - A[0][1] * A[1][0] || 1e-9;
  return [(b[0] * A[1][1] - b[1] * A[0][1]) / det, (A[0][0] * b[1] - A[1][0] * b[0]) / det];
}
function oneFit(rho: number, lam: number, seed: number): [number, number] {
  const rand = mulberry32(seed);
  let g00 = 0, g01 = 0, g11 = 0, b0 = 0, b1 = 0;
  for (let i = 0; i < N; i++) {
    const x1 = rand() * 2 - 1;
    const x2 = rho * x1 + Math.sqrt(Math.max(0, 1 - rho * rho)) * (rand() * 2 - 1);
    const y = x1 + x2 + (rand() - 0.5) * 1.2;          // true β = (1, 1)
    g00 += x1 * x1; g01 += x1 * x2; g11 += x2 * x2; b0 += x1 * y; b1 += x2 * y;
  }
  return solve2([[g00 + lam, g01], [g01, g11 + lam]], [b0, b1]);
}
const spread = (pts: [number, number][]) => {
  const m0 = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  return Math.sqrt(pts.reduce((s, p) => s + (p[0] - m0) ** 2, 0) / pts.length);
};

export function MulticollinearityRidgeLab() {
  const [rho, setRho] = useState(0.9);
  const { ols, ridge } = useMemo(() => {
    const ols: [number, number][] = [], ridge: [number, number][] = [];
    for (let s = 0; s < K; s++) { ols.push(oneFit(rho, 0, 1000 + s * 7)); ridge.push(oneFit(rho, 12, 1000 + s * 7)); }
    return { ols, ridge };
  }, [rho]);
  const sOls = spread(ols), sRidge = spread(ridge);

  const W = 300, H = 300, lo = -2.2, hi = 4.2;
  const sx = (b: number) => r3(28 + ((b - lo) / (hi - lo)) * (W - 40));
  const sy = (b: number) => r3(H - 24 - ((b - lo) / (hi - lo)) * (H - 40));

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={head}>Collinearity is a variance problem</span>
        <span style={{ fontSize: 11, color: "var(--muted)" }}>{K} refits · true β = (1, 1)</span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 320, height: "auto", display: "block", margin: "0 auto" }}>
        <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        {/* axes */}
        <line x1={sx(0)} y1={16} x2={sx(0)} y2={H - 16} stroke="var(--border-strong)" strokeWidth={0.6} />
        <line x1={20} y1={sy(0)} x2={W - 12} y2={sy(0)} stroke="var(--border-strong)" strokeWidth={0.6} />
        {/* β1+β2 = 2 trade-off line */}
        <line x1={sx(lo)} y1={sy(2 - lo)} x2={sx(hi)} y2={sy(2 - hi)} stroke="var(--faint)" strokeWidth={0.8} strokeDasharray="3 3" opacity={0.6} />
        {/* clouds */}
        {ols.map((p, i) => <circle key={`o${i}`} cx={sx(p[0])} cy={sy(p[1])} r={2.4} fill="var(--bad)" fillOpacity={0.5} />)}
        {ridge.map((p, i) => <circle key={`r${i}`} cx={sx(p[0])} cy={sy(p[1])} r={2.4} fill="var(--c-regression)" fillOpacity={0.6} />)}
        {/* truth */}
        <circle cx={sx(1)} cy={sy(1)} r={4} fill="none" stroke="var(--good)" strokeWidth={1.6} />
        <text x={sx(1) + 6} y={sy(1) - 5} fontSize={8} fill="var(--good)">true (1,1)</text>
        <text x={W - 12} y={sy(0) - 4} fontSize={8} fill="var(--faint)" textAnchor="end">β₁</text>
        <text x={sx(0) + 4} y={20} fontSize={8} fill="var(--faint)">β₂</text>
        <circle cx={30} cy={H - 12} r={3} fill="var(--bad)" fillOpacity={0.6} /><text x={37} y={H - 9} fontSize={8} fill="var(--muted)">OLS</text>
        <circle cx={78} cy={H - 12} r={3} fill="var(--c-regression)" fillOpacity={0.7} /><text x={85} y={H - 9} fontSize={8} fill="var(--muted)">Ridge (λ=12)</text>
      </svg>

      <label style={lbl}>correlation between the two features ρ = <b style={{ color: "var(--ink)" }}>{rho.toFixed(2)}</b></label>
      <input type="range" min={0} max={0.995} step={0.005} value={rho} onChange={(e) => setRho(+e.target.value)} style={slider} />

      <div style={{ display: "flex", gap: 18, margin: "6px 0 2px", flexWrap: "wrap" }}>
        <S label="OLS spread (std β₁)" value={sOls.toFixed(2)} color="var(--bad)" />
        <S label="Ridge spread" value={sRidge.toFixed(2)} color="var(--c-regression)" />
        <S label="ratio" value={`${(sOls / sRidge).toFixed(1)}×`} />
      </div>

      <div style={caption}>
        Each dot is one refit on a fresh noisy sample. At low ρ, both clouds sit tight on the true value. Slide ρ
        toward <strong>1</strong> and the two features become near-duplicates: <code>XᵀX</code> turns nearly
        singular, and the <strong style={{ color: "var(--bad)" }}>OLS estimates smear into a huge streak</strong>{" "}
        along the dashed <M>β₁+β₂≈2</M> line — each fit trades wildly between the twins to chase noise. Ridge&rsquo;s{" "}
        <code>+λ</code> keeps the <strong style={{ color: "var(--c-regression)" }}>estimates a tight blob</strong>,
        shrunk slightly toward zero but <strong>{(sOls / sRidge).toFixed(1)}× less variable</strong> here. Same
        average, far less variance — that stability is why you reach for ridge under multicollinearity.
      </div>
    </div>
  );
}

const M = ({ children }: { children: string }) => <span style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.95em" }}>{children}</span>;
function S({ label, value, color }: { label: string; value: string; color?: string }) {
  return (<div><div style={{ fontSize: 11, color: "var(--muted)" }}>{label}</div><div style={{ fontFamily: "ui-monospace, monospace", fontSize: 15, color: color || "var(--ink)" }}>{value}</div></div>);
}
const wrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const caption: React.CSSProperties = { fontSize: 12.5, color: "var(--muted)", marginTop: 12, lineHeight: 1.55 };
const lbl: React.CSSProperties = { display: "block", fontSize: 11.5, color: "var(--muted)", margin: "8px 0 2px" };
const slider: React.CSSProperties = { width: "100%", accentColor: "var(--c-regression)" };
