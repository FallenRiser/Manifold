"use client";

import { useMemo, useState } from "react";

// The big idea, made visible: a curvy fit is just a *weighted sum of simple building
// blocks* — and the weights are found by ordinary least squares. Pick the blocks
// (smooth RBF bumps or polynomial powers), choose how many, and watch the bold fit
// assemble itself from the faint pieces below it. More blocks = more flexibility,
// eventually overfitting the noise.

const N = 24;          // data points
const r2 = (v: number) => Math.round(v * 100) / 100;
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

const truth = (x: number) => Math.sin(x * 2 * Math.PI * 0.9) * 0.55 + 0.15;

// one basis function value: φ_j(x)
function phi(kind: "rbf" | "poly", j: number, K: number, x: number) {
  if (kind === "poly") return Math.pow(x, j);
  const c = K === 1 ? 0.5 : j / (K - 1);            // RBF center
  const w = 1.1 / Math.max(1, K - 1);               // width scales with spacing
  return Math.exp(-((x - c) ** 2) / (2 * w * w));
}

const COLORS = ["var(--c-regression)", "var(--c-classification)", "var(--c-trees)", "var(--c-rl)", "var(--c-clustering)", "var(--c-dimred)", "var(--c-neural)", "var(--c-fundamentals)"];

export function BasisFunctionLab() {
  const data = useMemo(() => {
    const rand = mulberry32(3);
    const xs = Array.from({ length: N }, (_, i) => (i + 0.5) / N);
    const ys = xs.map((x) => truth(x) + (rand() - 0.5) * 0.28);
    return { xs, ys };
  }, []);

  const [kind, setKind] = useState<"rbf" | "poly">("rbf");
  const [K, setK] = useState(5);

  const { w, rmse, fitAt, bases } = useMemo(() => {
    const Phi = data.xs.map((x) => Array.from({ length: K }, (_, j) => phi(kind, j, K, x)));
    const G = Array.from({ length: K }, (_, a) => Array.from({ length: K }, (_, b) => Phi.reduce((s, r) => s + r[a] * r[b], 0) + (a === b ? 1e-6 : 0)));
    const rhs = Array.from({ length: K }, (_, a) => Phi.reduce((s, r, i) => s + r[a] * data.ys[i], 0));
    const w = solve(G, rhs);
    const fitAt = (x: number) => Array.from({ length: K }, (_, j) => w[j] * phi(kind, j, K, x)).reduce((s, v) => s + v, 0);
    const err = Math.sqrt(data.xs.reduce((s, x, i) => s + (fitAt(x) - data.ys[i]) ** 2, 0) / N);
    // per-basis weighted curves for the "pieces" panel
    const grid = Array.from({ length: 60 }, (_, i) => i / 59);
    const bases = Array.from({ length: K }, (_, j) => grid.map((x) => w[j] * phi(kind, j, K, x)));
    return { w, rmse: err, fitAt, bases };
  }, [data, kind, K]);

  const grid = Array.from({ length: 60 }, (_, i) => i / 59);
  const W = 340, H = 200, padL = 22, padR = 10, padT = 12, padB = 20;
  const yLo = -1.1, yHi = 1.1;
  const px = (x: number) => r2(padL + x * (W - padL - padR));
  const py = (y: number) => r2(padT + (1 - (y - yLo) / (yHi - yLo)) * (H - padT - padB));

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        <span style={head}>Build a curve from building blocks</span>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setKind("rbf")} style={tab(kind === "rbf")}>RBF bumps</button>
          <button onClick={() => setKind("poly")} style={tab(kind === "poly")}>Polynomials</button>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        <line x1={padL} y1={py(0)} x2={W - padR} y2={py(0)} stroke="var(--border-strong)" strokeWidth={0.6} strokeDasharray="2 2" />
        {/* individual weighted basis pieces (faint) */}
        {bases.map((b, j) => (
          <polyline key={j} points={grid.map((x, i) => `${px(x)},${py(Math.max(yLo, Math.min(yHi, b[i])))}`).join(" ")} fill="none" stroke={COLORS[j % COLORS.length]} strokeWidth={1} strokeOpacity={0.4} />
        ))}
        {/* true curve */}
        <polyline points={grid.map((x) => `${px(x)},${py(truth(x))}`).join(" ")} fill="none" stroke="var(--faint)" strokeWidth={1.4} strokeDasharray="3 2" />
        {/* the fit = sum of pieces */}
        <polyline points={grid.map((x) => `${px(x)},${py(Math.max(yLo, Math.min(yHi, fitAt(x))))}`).join(" ")} fill="none" stroke="var(--ink)" strokeWidth={2.6} />
        {/* data */}
        {data.xs.map((x, i) => <circle key={i} cx={px(x)} cy={py(data.ys[i])} r={2.3} fill="var(--c-regression)" fillOpacity={0.7} />)}
        <text x={W - padR} y={py(truth(0.98)) - 4} fontSize={8} fill="var(--faint)" textAnchor="end">truth</text>
      </svg>

      <label style={lbl}>{kind === "rbf" ? "number of bumps" : "polynomial degree"} K = <b style={{ color: "var(--ink)" }}>{K}</b></label>
      <input type="range" min={1} max={12} value={K} onChange={(e) => setK(+e.target.value)} style={slider} />

      <div style={{ display: "flex", gap: 20, margin: "6px 0 2px" }}>
        <S label="basis functions" value={`${K}`} />
        <S label="parameters fit by OLS" value={`${K}`} />
        <S label="training RMSE" value={rmse.toFixed(3)} color={K >= 10 ? "var(--warn)" : "var(--ink)"} />
      </div>

      <div style={caption}>
        The <strong style={{ color: "var(--ink)" }}>bold black curve</strong> is the fit; the faint colored curves
        are the <strong>individual basis functions, each scaled by its own weight</strong> — add them up and you get
        the fit. Those weights are found by the <em>exact same least-squares solve</em> as straight-line regression;
        only the features changed. Slide K up: few blocks underfit the wave, more blocks trace it, and past ~10 the
        curve starts <strong style={{ color: "var(--warn)" }}>chasing the noise</strong>. RBF bumps stay local and
        smooth; high-degree polynomials get wild near the edges — the subject of the next pages.
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
function tab(active: boolean): React.CSSProperties {
  return { fontSize: 12, padding: "5px 12px", borderRadius: 8, cursor: "pointer", border: `1px solid ${active ? "var(--c-regression)" : "var(--border-strong)"}`, background: active ? "var(--c-regression)" : "transparent", color: active ? "white" : "var(--muted)" };
}
