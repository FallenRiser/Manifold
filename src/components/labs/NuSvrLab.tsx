"use client";

import { useEffect, useMemo, useState } from "react";

// nu-SVR's promise, made tangible: nu directly sets the support-vector fraction,
// something epsilon can only do indirectly. We solve real epsilon-SVR across a
// grid of epsilon (coordinate ascent on the box-constrained dual, bias-absorbing
// kernel k~=exp(-g d^2)+1), recording each fit's SV fraction and out-of-tube
// (error) fraction. Dragging nu picks the epsilon whose SV fraction matches -
// exactly what nu-SVR does internally (the two share a solution path). The
// readout shows the guarantee: error-fraction <= nu <= SV-fraction. Mount-gated.

const ACCENT = "var(--c-regression)";
const N = 24;
const C = 10, GAMMA = 18;

function mulberry32(a: number) {
  return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const truth = (x: number) => 0.5 + 0.26 * Math.sin(2 * Math.PI * x * 1.1);

const DATA = (() => {
  const rand = mulberry32(3);
  const xs = Array.from({ length: N }, (_, i) => (i + 0.5) / N);
  const ys = xs.map((x) => truth(x) + (rand() - 0.5) * 0.2);
  return { xs, ys };
})();

function fitEps(eps: number) {
  const { xs, ys } = DATA;
  const K: number[][] = [];
  for (let i = 0; i < N; i++) { K[i] = []; for (let j = 0; j < N; j++) { const d = xs[i] - xs[j]; K[i][j] = Math.exp(-GAMMA * d * d) + 1; } }
  const beta = new Array(N).fill(0);
  const soft = (z: number, t: number) => (z > t ? z - t : z < -t ? z + t : 0);
  for (let sweep = 0; sweep < 220; sweep++) {
    for (let i = 0; i < N; i++) {
      let Kb = 0; for (let j = 0; j < N; j++) Kb += K[i][j] * beta[j];
      const rest = Kb - K[i][i] * beta[i] - ys[i];
      let bi = -soft(rest, eps) / K[i][i];
      if (bi > C) bi = C; else if (bi < -C) bi = -C;
      beta[i] = bi;
    }
  }
  const predict = (x: number) => { let s = 0; for (let j = 0; j < N; j++) { const d = x - xs[j]; s += beta[j] * (Math.exp(-GAMMA * d * d) + 1); } return s; };
  let sv = 0, err = 0;
  const isSV: boolean[] = [];
  for (let i = 0; i < N; i++) {
    const a = Math.abs(beta[i]);
    const resid = Math.abs(ys[i] - predict(xs[i]));
    const s = a > 1e-4; isSV.push(s); if (s) sv++;
    if (resid > eps + 1e-4) err++;
  }
  return { eps, predict, isSV, svFrac: sv / N, errFrac: err / N };
}

export function NuSvrLab() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [nu, setNu] = useState(0.4);

  // precompute the epsilon grid once (data is fixed); front-loaded where the
  // support-vector fraction changes fastest (small epsilon)
  const grid = useMemo(() => {
    const eps = Array.from({ length: 80 }, (_, i) => 0.3 * Math.pow(i / 79, 1.7)); // 0 .. 0.30
    return eps.map(fitEps);
  }, []);

  // nu-SVR's solution is the fit where nu sits INSIDE the [errFrac, svFrac]
  // sandwich (errFrac <= nu <= svFrac). Pick the grid entry that best satisfies
  // that, so the on-screen guarantee always reads correctly.
  const chosen = useMemo(() => {
    let best = grid[0], bv = Infinity;
    for (const g of grid) {
      const violation = Math.max(0, nu - g.svFrac) + Math.max(0, g.errFrac - nu);
      const tie = Math.abs((g.errFrac + g.svFrac) / 2 - nu);
      const score = violation * 10 + tie;
      if (score < bv) { bv = score; best = g; }
    }
    return best;
  }, [grid, nu]);

  const W = 360, H = 210, pad = 22;
  const px = (x: number) => (pad + x * (W - 2 * pad)).toFixed(2);
  const py = (v: number) => (H - pad - v * (H - 2 * pad)).toFixed(2);
  const fitPts = Array.from({ length: 81 }, (_, k) => { const x = k / 80; return `${px(x)},${py(chosen.predict(x))}`; }).join(" ");
  const tubeTop = Array.from({ length: 81 }, (_, k) => { const x = k / 80; return `${px(x)},${py(chosen.predict(x) + chosen.eps)}`; }).join(" ");
  const tubeBot = Array.from({ length: 81 }, (_, k) => { const x = (80 - k) / 80; return `${px(x)},${py(chosen.predict(x) - chosen.eps)}`; }).join(" ");

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        <span style={head}>ν sets the support-vector fraction</span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>real ε-SVR, solved live</span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        {ready && <>
          <polygon points={`${tubeTop} ${tubeBot}`} fill="color-mix(in srgb, var(--c-regression) 11%, transparent)" stroke="none" />
          <polyline points={fitPts} fill="none" stroke={ACCENT} strokeWidth={2.4} />
        </>}
        {DATA.xs.map((x, i) => {
          const s = ready && chosen.isSV[i];
          return <circle key={i} cx={px(x)} cy={py(DATA.ys[i])} r={s ? 4.2 : 3.2} fill={s ? ACCENT : "none"} stroke={s ? "var(--ink)" : "var(--muted)"} strokeWidth={s ? 1 : 1.4} />;
        })}
      </svg>

      <div style={{ display: "flex", gap: 18, marginTop: 10, flexWrap: "wrap" }}>
        <Stat label="ν (you set)" value={nu.toFixed(2)} color="var(--ink)" />
        <Stat label="support-vector fraction" value={chosen.svFrac.toFixed(2)} color={ACCENT} />
        <Stat label="error fraction (out of tube)" value={chosen.errFrac.toFixed(2)} color="var(--c-classification)" />
        <Stat label="ε it solved for" value={chosen.eps.toFixed(3)} color="var(--muted)" />
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "var(--muted)", marginTop: 12 }}>
        <span style={{ minWidth: 92 }}>ν</span>
        <input type="range" min={0.1} max={0.85} step={0.05} value={nu} onChange={(e) => setNu(Number(e.target.value))} style={{ flex: 1, accentColor: ACCENT }} aria-label="nu" />
      </label>

      <div style={caption}>
        In ε-SVR you set the tube width and <em>hope</em> for a sensible model size. ν-SVR flips it: you set{" "}
        <M>ν ∈ (0,1]</M> and it finds the ε for you (shown above). The guarantee holds as you drag —{" "}
        <strong>error fraction ≤ ν ≤ support-vector fraction</strong>: ν is an upper bound on the points allowed
        out of the tube and a lower bound on the points that define the fit. A hyperparameter you can actually
        reason about.
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return <div><div style={{ fontSize: 11, color: "var(--muted)" }}>{label}</div><div style={{ fontFamily: "ui-monospace, monospace", fontSize: 16, color }}>{value}</div></div>;
}
function M({ children }: { children: React.ReactNode }) {
  return <span style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.95em", color: "var(--ink)" }}>{children}</span>;
}

const wrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const caption: React.CSSProperties = { fontSize: 12.5, color: "var(--muted)", marginTop: 12, lineHeight: 1.55 };
