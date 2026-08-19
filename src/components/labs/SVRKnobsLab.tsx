"use client";

import { useEffect, useMemo, useState } from "react";

// A REAL epsilon-SVR fit, solved in the browser, that responds to all three
// knobs at once. We solve the box-constrained dual by coordinate descent on
// beta_i = alpha_i - alpha_i* in [-C, C], using a bias-absorbing kernel
// k~(x,z) = exp(-gamma (x-z)^2) + 1 (the +1 removes the equality constraint):
//
//     max_beta  -1/2 beta^T K beta + y^T beta - eps * sum|beta_i|,   |beta_i| <= C
//
// Coordinate update is a soft-threshold then a clip to the box. Points end up:
//   |beta_i| ~ 0        -> inside the tube, ignored (free)
//   0 < |beta_i| < C    -> ON the tube edge (a free support vector)
//   |beta_i| = C        -> OUTSIDE the tube, influence CAPPED (bounded SV)
// That cap is SVR's robustness, visible directly. The fit curve is mount-gated
// so SSR and first client render agree (see KernelRidgeLab for the pattern).

const ACCENT = "var(--c-regression)";

function mulberry32(a: number) {
  return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// deterministic nonlinear data: a smooth wave + noise + one outlier
const DATA = (() => {
  const rand = mulberry32(7);
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < 22; i++) {
    const x = (i + 0.5) / 22;
    pts.push({ x, y: 0.5 + 0.28 * Math.sin(6.2 * x) + (rand() - 0.5) * 0.16 });
  }
  pts.push({ x: 0.5, y: 0.94 });   // one gross outlier — watch C cap its pull
  return pts;
})();

const CS = [1, 10, 100];
const GAMMAS = [4, 12, 30, 80];

type Fit = { beta: number[]; sv: number[]; predict: (x: number) => number };

function fitSVR(C: number, eps: number, gamma: number): Fit {
  const n = DATA.length;
  const xs = DATA.map((p) => p.x), ys = DATA.map((p) => p.y);
  // bias-absorbing RBF gram matrix
  const K: number[][] = [];
  for (let i = 0; i < n; i++) {
    K[i] = [];
    for (let j = 0; j < n; j++) {
      const d = xs[i] - xs[j];
      K[i][j] = Math.exp(-gamma * d * d) + 1;
    }
  }
  const beta = new Array(n).fill(0);
  const soft = (z: number, t: number) => (z > t ? z - t : z < -t ? z + t : 0);
  // coordinate ascent — fixed sweep count keeps it deterministic
  for (let sweep = 0; sweep < 220; sweep++) {
    for (let i = 0; i < n; i++) {
      let Kb = 0;
      for (let j = 0; j < n; j++) Kb += K[i][j] * beta[j];
      const rest = Kb - K[i][i] * beta[i] - ys[i];   // gradient minus own term
      let bi = -soft(rest, eps) / K[i][i];
      if (bi > C) bi = C; else if (bi < -C) bi = -C;
      beta[i] = bi;
    }
  }
  const predict = (x: number) => {
    let s = 0;
    for (let j = 0; j < n; j++) { const d = x - xs[j]; s += beta[j] * (Math.exp(-gamma * d * d) + 1); }
    return s;
  };
  // support-vector class: 0 = free (inside tube), 1 = edge, 2 = bounded (capped)
  const sv = beta.map((b) => { const a = Math.abs(b); return a < 1e-4 ? 0 : a > C - 1e-4 ? 2 : 1; });
  return { beta, sv, predict };
}

export function SVRKnobsLab() {
  const [C, setC] = useState(10);
  const [eps, setEps] = useState(0.08);
  const [gamma, setGamma] = useState(12);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  const fit = useMemo(() => fitSVR(C, eps, gamma), [C, eps, gamma]);

  const W = 380, H = 250, pad = 26;
  const px = (x: number) => (pad + x * (W - 2 * pad)).toFixed(2);
  const py = (y: number) => (H - pad - y * (H - 2 * pad)).toFixed(2);

  const curve = useMemo(() => {
    const pts: string[] = [];
    for (let k = 0; k <= 80; k++) { const x = k / 80; pts.push(`${px(x)},${py(fit.predict(x))}`); }
    return pts.join(" ");
  }, [fit]);

  const nFree = fit.sv.filter((s) => s === 1).length;
  const nCap = fit.sv.filter((s) => s === 2).length;
  const nIgnored = fit.sv.filter((s) => s === 0).length;

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        <span style={head}>ε-SVR with three knobs</span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>solved live in your browser</span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        {ready && (
          <>
            {/* tube band around the fitted curve */}
            <polygon
              points={
                Array.from({ length: 81 }, (_, k) => { const x = k / 80; return `${px(x)},${py(fit.predict(x) + eps)}`; }).join(" ") + " " +
                Array.from({ length: 81 }, (_, k) => { const x = (80 - k) / 80; return `${px(x)},${py(fit.predict(x) - eps)}`; }).join(" ")
              }
              fill="color-mix(in srgb, var(--c-regression) 11%, transparent)" stroke="none"
            />
            <polyline points={curve} fill="none" stroke={ACCENT} strokeWidth={2.4} />
          </>
        )}
        {/* points, coloured by support-vector class once solved */}
        {DATA.map((p, i) => {
          const cls = ready ? fit.sv[i] : 0;
          const fill = cls === 2 ? "var(--c-classification)" : cls === 1 ? ACCENT : "none";
          return (
            <circle key={i} cx={px(p.x)} cy={py(p.y)} r={cls ? 4.3 : 3.4}
              fill={fill} stroke={cls ? "var(--ink)" : "var(--muted)"} strokeWidth={cls ? 1 : 1.4} />
          );
        })}
      </svg>

      <div style={{ display: "flex", gap: 20, marginTop: 10, flexWrap: "wrap" }}>
        <Stat label="edge SVs (on tube)" value={nFree} color={ACCENT} />
        <Stat label="capped SVs (outside)" value={nCap} color="var(--c-classification)" />
        <Stat label="ignored (inside)" value={nIgnored} color="var(--ink)" />
      </div>

      <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
        <ChipRow label="C" hint="regularisation / cap" values={CS} value={C} onPick={setC} fmt={(v) => String(v)} />
        <ChipRow label="γ" hint="kernel reach" values={GAMMAS} value={gamma} onPick={setGamma} fmt={(v) => String(v)} />
        <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "var(--muted)" }}>
          <span style={{ minWidth: 128 }}>ε (tube half-width): <b style={{ color: "var(--ink)", fontFamily: "ui-monospace, monospace" }}>{eps.toFixed(2)}</b></span>
          <input type="range" min={0.0} max={0.24} step={0.01} value={eps} onChange={(e) => setEps(Number(e.target.value))} style={{ flex: 1, accentColor: ACCENT }} aria-label="epsilon tube half-width" />
        </label>
      </div>

      <div style={caption}>
        <strong>C</strong> caps each point&rsquo;s pull: at low C the outlier can&rsquo;t drag the curve (robust, flatter);
        at high C the fit chases it. <strong>γ</strong> sets how local the RBF is — small γ is nearly a straight line,
        large γ grows wiggly bumps. <strong>ε</strong> is the free-error zone — widen it and edge support vectors fall
        <em> inside</em> the tube and are dropped, sparsifying the model. Watch the counts change with every move.
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div><div style={{ fontSize: 11, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 16, color }}>{value}</div></div>
  );
}

function ChipRow<T extends number>({ label, hint, values, value, onPick, fmt }: { label: string; hint: string; values: T[]; value: T; onPick: (v: T) => void; fmt: (v: T) => string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <span style={{ minWidth: 128, fontSize: 12.5, color: "var(--muted)" }}>{label} <span style={{ color: "var(--faint)" }}>· {hint}</span></span>
      <div style={{ display: "flex", gap: 6 }}>
        {values.map((v) => (
          <button key={v} onClick={() => onPick(v)} style={{
            fontFamily: "ui-monospace, monospace", fontSize: 12.5, padding: "3px 10px", borderRadius: 7, cursor: "pointer",
            border: `1px solid ${v === value ? ACCENT : "var(--border-strong)"}`,
            background: v === value ? "color-mix(in srgb, var(--c-regression) 16%, transparent)" : "transparent",
            color: v === value ? "var(--ink)" : "var(--muted)",
          }}>{fmt(v)}</button>
        ))}
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const caption: React.CSSProperties = { fontSize: 12.5, color: "var(--muted)", marginTop: 12, lineHeight: 1.55 };
