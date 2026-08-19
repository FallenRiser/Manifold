"use client";

import { useEffect, useMemo, useState } from "react";

// The (lambda, gamma) tuning landscape, made a map. We compute the closed-form
// leave-one-out CV error for every cell of a lambda x gamma grid and paint it as
// a heatmap: brighter = lower error = better. Click any cell to see that fit.
// The point the page makes visually — the good region is a DIAGONAL BASIN, so
// lambda and gamma must be tuned together, not one at a time. All heavy compute
// is memoised once (data is fixed); exp-based fit curve is mount-gated.

const ACCENT = "var(--c-regression)";
const N = 15;

function mulberry32(a: number) {
  return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const truth = (x: number) => 0.5 + 0.3 * Math.sin(2 * Math.PI * x * 1.2);

function solve(A: number[][], b: number[]): number[] {
  const n = b.length; const M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let piv = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
    [M[c], M[piv]] = [M[piv], M[c]]; const d = M[c][c] || 1e-12;
    for (let r = 0; r < n; r++) { if (r === c) continue; const f = M[r][c] / d; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
  }
  return M.map((row, i) => row[n] / (M[i][i] || 1e-12));
}
function invert(A: number[][]): number[][] {
  const n = A.length;
  const cols = Array.from({ length: n }, (_, k) => solve(A, Array.from({ length: n }, (_, i) => (i === k ? 1 : 0))));
  return Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => cols[j][i]));
}

const LAM = Array.from({ length: 12 }, (_, i) => Math.pow(10, -4 + (5 * i) / 11));  // 1e-4 .. 1e1
const GAM = Array.from({ length: 8 }, (_, i) => Math.pow(10, 0.3 + (2.0 * i) / 7));  // ~2 .. 200

export function KrrTuningLab() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  const data = useMemo(() => {
    const rand = mulberry32(9);
    const xs = Array.from({ length: N }, (_, i) => (i + 0.5) / N);
    const ys = xs.map((x) => truth(x) + (rand() - 0.5) * 0.22);
    return { xs, ys };
  }, []);

  // closed-form LOOCV over the full (gamma, lambda) grid — computed once
  const { grid, best } = useMemo(() => {
    const { xs, ys } = data;
    const g: number[][] = [];
    let bi = 0, bj = 0, bv = Infinity;
    for (let gi = 0; gi < GAM.length; gi++) {
      const gamma = GAM[gi];
      const K = xs.map((xi) => xs.map((xj) => Math.exp(-gamma * (xi - xj) ** 2)));
      g[gi] = [];
      for (let li = 0; li < LAM.length; li++) {
        const A = K.map((row, i) => row.map((v, j) => (i === j ? v + LAM[li] : v)));
        const Minv = invert(A);
        const My = ys.map((_, i) => Minv[i].reduce((s, v, j) => s + v * ys[j], 0));
        let mse = 0;
        for (let i = 0; i < N; i++) {
          const yhat = K[i].reduce((s, v, j) => s + v * My[j], 0);
          const hii = K[i].reduce((s, v, j) => s + v * Minv[j][i], 0);
          const r = (ys[i] - yhat) / (1 - hii || 1e-9);
          mse += r * r;
        }
        const v = mse / N;
        g[gi][li] = v;
        if (v < bv) { bv = v; bi = gi; bj = li; }
      }
    }
    return { grid: g, best: { gi: bi, li: bj } };
  }, [data]);

  const [sel, setSel] = useState<{ gi: number; li: number }>(best);

  const flat = grid.flat();
  const lo = Math.min(...flat), hi = Math.max(...flat);
  // log-normalise so the basin reads clearly, then map to accent intensity
  const norm = (v: number) => {
    const t = (Math.log(v) - Math.log(lo)) / (Math.log(hi) - Math.log(lo) || 1);
    return 1 - t; // 1 = best (bright), 0 = worst
  };

  // fit for the selected cell
  const fit = useMemo(() => {
    const { xs, ys } = data;
    const gamma = GAM[sel.gi], lambda = LAM[sel.li];
    const K = xs.map((xi) => xs.map((xj) => Math.exp(-gamma * (xi - xj) ** 2)));
    const A = K.map((row, i) => row.map((v, j) => (i === j ? v + lambda : v)));
    const alpha = solve(A, ys);
    const gx = Array.from({ length: 81 }, (_, i) => i / 80);
    const gy = gx.map((g) => xs.reduce((s, xi, i) => s + alpha[i] * Math.exp(-gamma * (g - xi) ** 2), 0));
    return { gx, gy };
  }, [data, sel]);

  // heatmap geometry
  const cell = 26, gx0 = 44, gy0 = 14;
  const HW = gx0 + LAM.length * cell + 10, HH = gy0 + GAM.length * cell + 26;
  // fit panel geometry
  const FW = 360, FH = 150, pad = 20;
  const fx = (x: number) => (pad + x * (FW - 2 * pad)).toFixed(2);
  const fy = (v: number) => (FH - pad - v * (FH - 2 * pad)).toFixed(2);
  const fitPts = fit.gx.map((g, i) => `${fx(g)},${fy(fit.gy[i])}`).join(" ");

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        <span style={head}>The (λ, γ) tuning landscape</span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>brighter = lower LOOCV error</span>
      </div>

      <svg viewBox={`0 0 ${HW} ${HH}`} style={{ width: "100%", height: "auto", display: "block", maxWidth: 460 }}>
        {ready && grid.map((row, gi) =>
          row.map((v, li) => {
            const isSel = sel.gi === gi && sel.li === li;
            const isBest = best.gi === gi && best.li === li;
            return (
              <rect key={`${gi}-${li}`} x={gx0 + li * cell} y={gy0 + gi * cell} width={cell - 1.5} height={cell - 1.5} rx={2}
                fill={`color-mix(in srgb, var(--c-regression) ${(8 + norm(v) * 82).toFixed(0)}%, var(--canvas))`}
                stroke={isSel ? "var(--ink)" : isBest ? "var(--c-regression)" : "transparent"} strokeWidth={isSel ? 2 : isBest ? 1.5 : 0}
                style={{ cursor: "pointer" }} onClick={() => setSel({ gi, li })} />
            );
          })
        )}
        {/* axis labels */}
        <text x={gx0 + (LAM.length * cell) / 2} y={HH - 8} fontSize={10} fill="var(--muted)" textAnchor="middle">λ (regularisation) →</text>
        <text x={12} y={gy0 + (GAM.length * cell) / 2} fontSize={10} fill="var(--muted)" textAnchor="middle" transform={`rotate(-90 12 ${gy0 + (GAM.length * cell) / 2})`}>γ (kernel reach) →</text>
        <text x={gx0} y={gy0 - 3} fontSize={8.5} fill="var(--faint)">1e−4</text>
        <text x={gx0 + LAM.length * cell - 4} y={gy0 - 3} fontSize={8.5} fill="var(--faint)" textAnchor="end">1e+1</text>
      </svg>

      <div style={{ fontSize: 12, color: "var(--muted)", margin: "6px 0 2px" }}>
        selected: <b style={{ color: "var(--ink)", fontFamily: "ui-monospace, monospace" }}>λ={LAM[sel.li].toExponential(1)}, γ={GAM[sel.gi].toFixed(0)}</b>
        {sel.gi === best.gi && sel.li === best.li && <span style={{ color: ACCENT }}> · best cell</span>}
        <button onClick={() => setSel(best)} style={{ marginLeft: 10, fontSize: 11.5, padding: "3px 10px", borderRadius: 6, cursor: "pointer", border: `1px solid ${ACCENT}`, background: "transparent", color: "var(--ink)" }}>jump to best</button>
      </div>

      {/* fit for the selected cell */}
      <svg viewBox={`0 0 ${FW} ${FH}`} style={{ width: "100%", height: "auto", display: "block", marginTop: 6 }}>
        <rect x={0} y={0} width={FW} height={FH} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        {ready && <polyline points={fitPts} fill="none" stroke={ACCENT} strokeWidth={2.4} />}
        {data.xs.map((x, i) => <circle key={i} cx={fx(x)} cy={fy(data.ys[i])} r={3.2} fill="var(--c-classification)" fillOpacity={0.7} />)}
        <text x={FW - 10} y={16} fontSize={9.5} fill="var(--faint)" textAnchor="end">fit at selected (λ, γ)</text>
      </svg>

      <div style={caption}>
        Each cell is one <M>(λ, γ)</M> pair, coloured by its leave-one-out error. The bright region isn&rsquo;t a
        single spot — it&rsquo;s a <strong>diagonal basin</strong>: a wider kernel (small γ) wants less smoothing
        (small λ), a spikier kernel (large γ) needs more. That tilt is exactly why you <strong>cannot tune them one
        at a time</strong>. Click across the map — top-left and bottom-right both underfit or overfit; the good fits
        live along the ridge between.
      </div>
    </div>
  );
}

function M({ children }: { children: React.ReactNode }) {
  return <span style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.95em", color: "var(--ink)" }}>{children}</span>;
}

const wrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const caption: React.CSSProperties = { fontSize: 12.5, color: "var(--muted)", marginTop: 12, lineHeight: 1.55 };
