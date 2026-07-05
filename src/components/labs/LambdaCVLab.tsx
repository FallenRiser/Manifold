"use client";

import { useMemo, useState } from "react";

// The bias–variance U-curve, made draggable. We fit a high-degree polynomial with a
// ridge penalty λ. Sweep λ: at the weak end the model overfits (train error ~0,
// validation error high — variance); at the strong end it underfits (both high —
// bias). Validation error dips in the middle, and that minimum is the λ CV picks.

const DEG = 9;                 // polynomial degree — enough to overfit
const NREG = 40;               // λ grid points
const r2 = (v: number) => Math.round(v * 1000) / 1000;

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

// raw polynomial design matrix on x in [0,1]
function polyRaw(xs: number[]) {
  return xs.map((x) => Array.from({ length: DEG + 1 }, (_, d) => Math.pow(x * 2 - 1, d)));
}
// column means/sds from the TRAINING design (skip bias col 0), for uniform penalty scale
function colStats(Phi: number[][]) {
  const p = Phi[0].length, n = Phi.length;
  const mu = Array.from({ length: p }, (_, j) => (j === 0 ? 0 : Phi.reduce((s, r) => s + r[j], 0) / n));
  const sd = Array.from({ length: p }, (_, j) => (j === 0 ? 1 : Math.sqrt(Phi.reduce((s, r) => s + (r[j] - mu[j]) ** 2, 0) / n) || 1));
  return { mu, sd };
}
const applyStats = (Phi: number[][], mu: number[], sd: number[]) => Phi.map((r) => r.map((v, j) => (v - mu[j]) / sd[j]));
function fitRidge(Phi: number[][], y: number[], lam: number) {
  const p = Phi[0].length;
  const G = Array.from({ length: p }, (_, i) => Array.from({ length: p }, (_, j) => Phi.reduce((s, r) => s + r[i] * r[j], 0)));
  const rhs = Array.from({ length: p }, (_, i) => Phi.reduce((s, r, k) => s + r[i] * y[k], 0));
  const A = G.map((row, i) => row.map((v, j) => (i === j && i > 0 ? v + lam : v))); // don't penalize bias
  return solve(A, rhs);
}
const mse = (Phi: number[][], y: number[], w: number[]) =>
  Phi.reduce((s, r, k) => { const p = r.reduce((a, v, j) => a + v * w[j], 0); return s + (p - y[k]) ** 2; }, 0) / y.length;

function makeData() {
  const rand = mulberry32(7);
  const f = (x: number) => Math.sin(x * 5) * 0.6 + x * 0.4;   // truth
  const xs: number[] = [], ys: number[] = [];
  for (let i = 0; i < 32; i++) { const x = rand(); xs.push(x); ys.push(f(x) + (rand() - 0.5) * 0.5); }
  const idx = xs.map((_, i) => i);
  const tr = idx.filter((i) => i % 2 === 0), va = idx.filter((i) => i % 2 === 1);
  return {
    xtr: tr.map((i) => xs[i]), ytr: tr.map((i) => ys[i]),
    xva: va.map((i) => xs[i]), yva: va.map((i) => ys[i]), f,
  };
}

export function LambdaCVLab() {
  const d = useMemo(() => makeData(), []);
  const lambdas = useMemo(() => Array.from({ length: NREG }, (_, i) => 1e-3 * Math.pow(10, (i / (NREG - 1)) * 6)), []);
  const stats = useMemo(() => colStats(polyRaw(d.xtr)), [d]);
  const curves = useMemo(() => {
    const Ptr = applyStats(polyRaw(d.xtr), stats.mu, stats.sd), Pva = applyStats(polyRaw(d.xva), stats.mu, stats.sd);
    return lambdas.map((lam) => { const w = fitRidge(Ptr, d.ytr, lam); return { tr: mse(Ptr, d.ytr, w), va: mse(Pva, d.yva, w), w }; });
  }, [d, lambdas, stats]);
  const optIdx = useMemo(() => curves.reduce((best, c, i) => (c.va < curves[best].va ? i : best), 0), [curves]);
  const [li, setLi] = useState(optIdx);
  const cur = curves[li];

  const maxE = Math.max(...curves.map((c) => Math.max(c.tr, c.va))) * 1.05;
  const W = 340, H = 210, padL = 34, padR = 12, padT = 12, padB = 40;
  const px = (i: number) => r2(padL + (i / (NREG - 1)) * (W - padL - padR));
  const py = (e: number) => r2(padT + (1 - e / maxE) * (H - padT - padB));

  // right-hand fit preview
  const w = cur.w;
  const gx = Array.from({ length: 40 }, (_, i) => i / 39);
  const gp = applyStats(polyRaw(gx), stats.mu, stats.sd).map((r) => r.reduce((a, v, j) => a + v * w[j], 0));
  const FW = 150, FH = 110;
  const fx = (x: number) => r2(6 + x * (FW - 12));
  const yLo = -1.2, yHi = 1.4;
  const fy = (y: number) => r2(6 + (1 - (y - yLo) / (yHi - yLo)) * (FH - 12));

  const regime = li < optIdx - 4 ? "overfitting" : li > optIdx + 4 ? "underfitting" : "well-balanced";

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={head}>Validation-error curve</span>
        <span style={{ fontSize: 11, color: "var(--muted)" }}>degree-{DEG} polynomial · ridge</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 150px", gap: 12, alignItems: "center" }} className="elbow-grid">
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
          <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
          {/* optimal λ marker */}
          <line x1={px(optIdx)} y1={padT} x2={px(optIdx)} y2={H - padB} stroke="var(--good)" strokeWidth={1} strokeDasharray="3 3" opacity={0.7} />
          <text x={px(optIdx)} y={padT + 8} fontSize={7.5} fill="var(--good)" textAnchor="middle">CV min</text>
          {/* train + validation curves */}
          <polyline points={curves.map((c, i) => `${px(i)},${py(c.tr)}`).join(" ")} fill="none" stroke="var(--faint)" strokeWidth={2} />
          <polyline points={curves.map((c, i) => `${px(i)},${py(c.va)}`).join(" ")} fill="none" stroke="var(--c-regression)" strokeWidth={2.6} />
          {/* current λ */}
          <line x1={px(li)} y1={padT} x2={px(li)} y2={H - padB} stroke="var(--ink)" strokeWidth={1} strokeDasharray="2 2" opacity={0.45} />
          <circle cx={px(li)} cy={py(cur.va)} r={3.4} fill="var(--c-regression)" />
          <circle cx={px(li)} cy={py(cur.tr)} r={3} fill="var(--faint)" />
          <text x={W - padR} y={py(curves[NREG - 1].va) - 5} fontSize={8} fill="var(--c-regression)" textAnchor="end">validation</text>
          <text x={W - padR} y={py(curves[NREG - 1].tr) + 11} fontSize={8} fill="var(--muted)" textAnchor="end">training</text>
          <text x={W / 2} y={H - 22} fontSize={9} fill="var(--faint)" textAnchor="middle">← weaker λ (overfit)　　stronger λ (underfit) →</text>
          <text x={11} y={H / 2 - padB / 2} fontSize={9} fill="var(--faint)" textAnchor="middle" transform={`rotate(-90 11 ${H / 2 - padB / 2})`}>MSE</text>
        </svg>

        <div>
          <svg viewBox={`0 0 ${FW} ${FH}`} style={{ width: "100%", height: "auto", display: "block", border: "1px solid var(--border)", borderRadius: 8, background: "var(--canvas)" }}>
            <polyline points={gx.map((x, i) => `${fx(x)},${fy(d.f(x))}`).join(" ")} fill="none" stroke="var(--faint)" strokeWidth={1.4} strokeDasharray="3 2" />
            <polyline points={gx.map((x, i) => `${fx(x)},${fy(Math.max(yLo, Math.min(yHi, gp[i])))}`).join(" ")} fill="none" stroke="var(--c-regression)" strokeWidth={2} />
            {d.xtr.map((x, i) => <circle key={i} cx={fx(x)} cy={fy(d.ytr[i])} r={1.8} fill="var(--ink)" fillOpacity={0.55} />)}
          </svg>
          <div style={{ fontSize: 10, color: "var(--faint)", textAlign: "center", marginTop: 2 }}>fit at this λ</div>
        </div>
      </div>

      <input type="range" min={0} max={NREG - 1} value={li} onChange={(e) => setLi(+e.target.value)} style={{ width: "100%", marginTop: 10, accentColor: "var(--c-regression)" }} />

      <div style={{ display: "flex", gap: 16, margin: "8px 0 2px", flexWrap: "wrap" }}>
        <S label="λ" value={lambdas[li] < 0.01 ? lambdas[li].toExponential(1) : lambdas[li].toFixed(2)} />
        <S label="training MSE" value={cur.tr.toFixed(3)} />
        <S label="validation MSE" value={cur.va.toFixed(3)} color={li === optIdx ? "var(--good)" : "var(--ink)"} />
        <S label="regime" value={regime} color={regime === "well-balanced" ? "var(--good)" : "var(--warn)"} />
      </div>

      <div style={caption}>
        Slide λ and watch the two curves diverge. At the <strong>weak-λ</strong> end the polynomial wiggles through
        every point — training error near zero, validation error high (<em>overfitting</em>). At the{" "}
        <strong>strong-λ</strong> end it flattens toward a line — both errors high (<em>underfitting</em>). The{" "}
        <strong style={{ color: "var(--good)" }}>validation minimum</strong> is the sweet spot cross-validation
        finds automatically — no peeking at the test set required.
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
