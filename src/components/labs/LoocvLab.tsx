"use client";

import { useEffect, useMemo, useState } from "react";

// Kernel ridge's signature trick, made visible. For a grid of lambda we compute
// the EXACT closed-form leave-one-out CV error from the hat matrix:
//     H(lambda) = K (K + lambda I)^-1,   r_i^LOO = (y_i - (Hy)_i) / (1 - H_ii)
// No refitting. Drag lambda to move along the fit AND along the LOOCV curve; the
// marked minimum is the lambda closed-form LOOCV would pick — the whole curve for
// the price of the solves. Exp-based curves are mount-gated so SSR/client agree.

const ACCENT = "var(--c-regression)";
const N = 16;

function mulberry32(a: number) {
  return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const truth = (x: number) => 0.5 + 0.3 * Math.sin(2 * Math.PI * x * 1.2);

// Solve A x = b by Gaussian elimination with partial pivoting.
function solve(A: number[][], b: number[]): number[] {
  const n = b.length; const M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let piv = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
    [M[c], M[piv]] = [M[piv], M[c]]; const d = M[c][c] || 1e-12;
    for (let r = 0; r < n; r++) { if (r === c) continue; const f = M[r][c] / d; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
  }
  return M.map((row, i) => row[n] / (M[i][i] || 1e-12));
}
// invert by solving against each identity column
function invert(A: number[][]): number[][] {
  const n = A.length;
  const cols = Array.from({ length: n }, (_, k) => solve(A, Array.from({ length: n }, (_, i) => (i === k ? 1 : 0))));
  return Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => cols[j][i]));
}

const GAMMAS = [6, 20, 60];
const LAM = Array.from({ length: 41 }, (_, i) => Math.pow(10, -4 + (5 * i) / 40)); // 1e-4 .. 1e1

export function LoocvLab() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [gi, setGi] = useState(1);
  const [li, setLi] = useState(20);
  const gamma = GAMMAS[gi];
  const lambda = LAM[li];

  const data = useMemo(() => {
    const rand = mulberry32(5);
    const xs = Array.from({ length: N }, (_, i) => (i + 0.5) / N);
    const ys = xs.map((x) => truth(x) + (rand() - 0.5) * 0.24);
    return { xs, ys };
  }, []);

  // base kernel (no lambda) for this gamma
  const K = useMemo(() => data.xs.map((xi) => data.xs.map((xj) => Math.exp(-gamma * (xi - xj) ** 2))), [data, gamma]);

  // closed-form LOOCV over the whole lambda grid
  const loocv = useMemo(() => {
    const { ys } = data;
    return LAM.map((lam) => {
      const A = K.map((row, i) => row.map((v, j) => (i === j ? v + lam : v)));
      const Minv = invert(A);
      // yhat = K (Minv y); Hdiag_i = sum_j K_ij Minv_ji
      const My = ys.map((_, i) => Minv[i].reduce((s, v, j) => s + v * ys[j], 0));
      let mse = 0;
      for (let i = 0; i < N; i++) {
        const yhat = K[i].reduce((s, v, j) => s + v * My[j], 0);
        const hii = K[i].reduce((s, v, j) => s + v * Minv[j][i], 0);
        const r = (ys[i] - yhat) / (1 - hii || 1e-9);
        mse += r * r;
      }
      return mse / N;
    });
  }, [data, K]);

  const bestLi = useMemo(() => loocv.reduce((b, v, i) => (v < loocv[b] ? i : b), 0), [loocv]);

  // fit at the current lambda
  const fit = useMemo(() => {
    const A = K.map((row, i) => row.map((v, j) => (i === j ? v + lambda : v)));
    const alpha = solve(A, data.ys);
    const grid = Array.from({ length: 101 }, (_, i) => i / 100);
    const pred = grid.map((g) => data.xs.reduce((s, xi, i) => s + alpha[i] * Math.exp(-gamma * (g - xi) ** 2), 0));
    return { grid, pred };
  }, [K, data, gamma, lambda]);

  // --- fit panel geometry ---
  const W = 360, Hf = 170, pad = 22;
  const fx = (x: number) => (pad + x * (W - 2 * pad)).toFixed(2);
  const fy = (v: number) => (Hf - pad - v * (Hf - 2 * pad)).toFixed(2);
  const fitPts = fit.grid.map((g, i) => `${fx(g)},${fy(fit.pred[i])}`).join(" ");

  // --- loocv panel geometry (x = log10 lambda) ---
  const Hc = 150, padL = 34, padB = 26, padT = 14;
  const lx = (i: number) => (padL + (i / (LAM.length - 1)) * (W - padL - 12)).toFixed(2);
  const lmax = Math.max(...loocv), lmin = Math.min(...loocv);
  const ly = (v: number) => (Hc - padB - ((v - lmin) / (lmax - lmin || 1)) * (Hc - padB - padT)).toFixed(2);
  const loocvPts = loocv.map((v, i) => `${lx(i)},${ly(v)}`).join(" ");

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        <span style={head}>Closed-form LOOCV explorer</span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>no refitting — one solve per λ</span>
      </div>

      {/* fit panel */}
      <svg viewBox={`0 0 ${W} ${Hf}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x={0} y={0} width={W} height={Hf} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        {ready && <polyline points={fitPts} fill="none" stroke={ACCENT} strokeWidth={2.4} />}
        {data.xs.map((x, i) => <circle key={i} cx={fx(x)} cy={fy(data.ys[i])} r={3.2} fill="var(--c-classification)" fillOpacity={0.7} />)}
        <text x={W - 10} y={16} fontSize={9.5} fill="var(--faint)" textAnchor="end">fit at current λ</text>
      </svg>

      {/* loocv curve panel */}
      <svg viewBox={`0 0 ${W} ${Hc}`} style={{ width: "100%", height: "auto", display: "block", marginTop: 8 }}>
        <rect x={0} y={0} width={W} height={Hc} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        {/* current-lambda marker */}
        <line x1={lx(li)} y1={padT} x2={lx(li)} y2={Hc - padB} stroke="var(--muted)" strokeWidth={1} strokeDasharray="3 3" />
        {ready && <>
          <polyline points={loocvPts} fill="none" stroke={ACCENT} strokeWidth={2.2} />
          <circle cx={lx(bestLi)} cy={ly(loocv[bestLi])} r={4.5} fill="none" stroke="var(--ink)" strokeWidth={1.6} />
          <circle cx={lx(li)} cy={ly(loocv[li])} r={3.6} fill={ACCENT} />
        </>}
        <text x={padL} y={Hc - 9} fontSize={9} fill="var(--faint)">λ = 1e−4</text>
        <text x={W - 12} y={Hc - 9} fontSize={9} fill="var(--faint)" textAnchor="end">1e+1</text>
        <text x={W - 12} y={16} fontSize={9.5} fill="var(--faint)" textAnchor="end">LOOCV error vs λ</text>
      </svg>

      <div style={{ display: "flex", gap: 20, marginTop: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div><div style={{ fontSize: 11, color: "var(--muted)" }}>your λ</div><div style={{ fontFamily: "ui-monospace, monospace", fontSize: 15, color: ACCENT }}>{lambda.toExponential(1)}</div></div>
        <div><div style={{ fontSize: 11, color: "var(--muted)" }}>closed-form best λ</div><div style={{ fontFamily: "ui-monospace, monospace", fontSize: 15, color: "var(--ink)" }}>{LAM[bestLi].toExponential(1)}</div></div>
        <button onClick={() => setLi(bestLi)} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 7, cursor: "pointer", border: `1px solid ${ACCENT}`, background: "transparent", color: "var(--ink)" }}>
          jump to best λ
        </button>
      </div>

      <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "var(--muted)" }}>
          <span style={{ minWidth: 96 }}>λ (drag)</span>
          <input type="range" min={0} max={LAM.length - 1} step={1} value={li} onChange={(e) => setLi(Number(e.target.value))} style={{ flex: 1, accentColor: ACCENT }} aria-label="lambda" />
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ minWidth: 96, fontSize: 12.5, color: "var(--muted)" }}>γ · kernel reach</span>
          <div style={{ display: "flex", gap: 6 }}>
            {GAMMAS.map((v, i) => (
              <button key={v} onClick={() => setGi(i)} style={{ fontFamily: "ui-monospace, monospace", fontSize: 12.5, padding: "3px 10px", borderRadius: 7, cursor: "pointer", border: `1px solid ${gi === i ? ACCENT : "var(--border-strong)"}`, background: gi === i ? "color-mix(in srgb, var(--c-regression) 16%, transparent)" : "transparent", color: gi === i ? "var(--ink)" : "var(--muted)" }}>{v}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={caption}>
        The lower curve is the <strong>entire leave-one-out error</strong> across λ — computed in closed form from
        the hat-matrix diagonal, <em>without refitting once</em>. Drag λ: the marker rides the curve while the fit
        above responds. The ○ is the minimum — the λ this shortcut would choose. Change γ and the whole curve
        recomputes. This is the trick that makes tuning λ nearly free.
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const caption: React.CSSProperties = { fontSize: 12.5, color: "var(--muted)", marginTop: 12, lineHeight: 1.55 };
