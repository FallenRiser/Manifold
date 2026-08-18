"use client";

import { useEffect, useMemo, useState } from "react";

// Real kernel ridge regression, computed live. We fit alpha = (K + lambda*I)^-1 y
// with an RBF kernel k(x,z) = exp(-gamma * (x-z)^2), then predict on a dense grid.
// Slide lambda (smoothness) and gamma (wiggliness) and watch the fit change.
// The exp-based fit curve is rendered only after mount (the data points are
// deterministic integer-RNG samples), so SSR and client never disagree.

const ACCENT = "var(--c-regression)";
const N = 18;

function mulberry32(a: number) {
  return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const truth = (x: number) => 0.5 + 0.3 * Math.sin(2 * Math.PI * x * 1.25) - 0.13 * Math.cos(2 * Math.PI * x * 2.3);

// Solve (A) x = b by Gaussian elimination with partial pivoting.
function solve(A: number[][], b: number[]): number[] {
  const n = b.length; const M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let piv = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
    [M[c], M[piv]] = [M[piv], M[c]]; const d = M[c][c] || 1e-12;
    for (let r = 0; r < n; r++) { if (r === c) continue; const f = M[r][c] / d; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
  }
  return M.map((row, i) => row[n] / (M[i][i] || 1e-12));
}

const LAMBDAS = [0.001, 0.01, 0.1, 1];
const GAMMAS = [5, 20, 60, 150];

export function KernelRidgeLab() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [li, setLi] = useState(1);   // lambda index
  const [gi, setGi] = useState(1);   // gamma index
  const lambda = LAMBDAS[li];
  const gamma = GAMMAS[gi];

  const data = useMemo(() => {
    const rand = mulberry32(7);
    const xs = Array.from({ length: N }, (_, i) => (i + 0.5) / N);
    const ys = xs.map((x) => truth(x) + (rand() - 0.5) * 0.22);
    return { xs, ys };
  }, []);

  // fit alpha = (K + lambda I)^-1 y, then predict on a dense grid
  const curve = useMemo(() => {
    const { xs, ys } = data;
    const K = xs.map((xi) => xs.map((xj) => Math.exp(-gamma * (xi - xj) ** 2)));
    for (let i = 0; i < N; i++) K[i][i] += lambda;
    const alpha = solve(K, ys);
    const grid = Array.from({ length: 121 }, (_, i) => i / 120);
    const pred = grid.map((g) => xs.reduce((s, xi, i) => s + alpha[i] * Math.exp(-gamma * (g - xi) ** 2), 0));
    return { grid, pred };
  }, [data, lambda, gamma]);

  const W = 360, H = 220, pad = 26;
  const px = (x: number) => (pad + x * (W - 2 * pad)).toFixed(2);
  const py = (v: number) => (H - pad - v * (H - 2 * pad)).toFixed(2);
  const fit = curve.grid.map((g, i) => `${px(g)},${py(curve.pred[i])}`).join(" ");

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        <span style={head}>RBF kernel ridge fit</span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>dots: data · line: fit</span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        {ready && <polyline points={fit} fill="none" stroke={ACCENT} strokeWidth={2.6} />}
        {data.xs.map((x, i) => (
          <circle key={i} cx={px(x)} cy={py(data.ys[i])} r={3.4} fill="var(--c-classification)" fillOpacity={0.7} />
        ))}
      </svg>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: 12 }}>
        <div style={{ flex: "1 1 150px" }}>
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
            λ (smoothness): <b style={{ color: "var(--ink)", fontFamily: "ui-monospace, monospace" }}>{lambda}</b>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {LAMBDAS.map((v, i) => <button key={v} onClick={() => setLi(i)} style={chip(li === i)}>{v}</button>)}
          </div>
        </div>
        <div style={{ flex: "1 1 150px" }}>
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
            γ (kernel width): <b style={{ color: "var(--ink)", fontFamily: "ui-monospace, monospace" }}>{gamma}</b>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {GAMMAS.map((v, i) => <button key={v} onClick={() => setGi(i)} style={chip(gi === i)}>{v}</button>)}
          </div>
        </div>
      </div>

      <div style={caption}>
        <strong>λ</strong> controls smoothness: small λ lets the fit interpolate every point (wiggly, low bias,
        high variance); large λ pulls it flat toward the mean. <strong>γ</strong> sets how far each point&rsquo;s
        influence reaches: small γ = wide, gentle bumps; large γ = narrow spikes that can overfit. The best fit
        needs <em>both</em> tuned together — the sweet spot is a moderate λ with a γ matched to how fast the
        function really wiggles.
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const caption: React.CSSProperties = { fontSize: 12.5, color: "var(--muted)", marginTop: 12, lineHeight: 1.55 };
function chip(active: boolean): React.CSSProperties {
  return { fontSize: 11.5, minWidth: 34, height: 25, padding: "0 6px", borderRadius: 6, cursor: "pointer", border: `1px solid ${active ? ACCENT : "var(--border-strong)"}`, background: active ? ACCENT : "transparent", color: active ? "white" : "var(--muted)" };
}
