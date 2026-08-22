"use client";

import { useMemo, useState } from "react";

// Gradient boosting on 1-D data, built one stump at a time. Start at the mean,
// then each round fits a depth-1 step to the *residuals* and adds a shrunk copy.
// Drag the number of trees to watch the staircase close on the signal and the
// residual bars shrink; drag the learning rate to feel the shrinkage trade-off —
// small steps need many trees, a large rate overshoots into the noise.
//
// A real squared-error boosting run, recomputed in-browser. Deterministic
// (mulberry32) with every emitted coordinate rounded → identical SSR / client.

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type P = { x: number; y: number };
const g = (x: number) => 0.5 + 0.3 * Math.sin(2 * Math.PI * 0.85 * x) - 0.12 * x; // noiseless signal
const DATA: P[] = (() => {
  const r = mulberry32(23);
  const pts: P[] = [];
  for (let i = 0; i < 30; i++) {
    const x = i / 29;
    const noise = (r() + r() + r() - 1.5) * 0.16;
    pts.push({ x, y: g(x) + noise });
  }
  return pts;
})();

type Step = { thr: number; dl: number; dr: number };
const MAX_TREES = 40;

// Build the full boosting sequence for a given learning rate (depth-1 stumps).
function buildSequence(lr: number): { c0: number; steps: Step[] } {
  const c0 = DATA.reduce((s, p) => s + p.y, 0) / DATA.length;
  const steps: Step[] = [];
  const evalF = (x: number) => c0 + steps.reduce((a, s) => a + (x <= s.thr ? s.dl : s.dr), 0);
  const xs = [...new Set(DATA.map((p) => p.x))].sort((a, b) => a - b);
  for (let t = 0; t < MAX_TREES; t++) {
    const res = DATA.map((p) => p.y - evalF(p.x));
    let best = { sse: Infinity, thr: 0.5, dl: 0, dr: 0 };
    for (let i = 0; i < xs.length - 1; i++) {
      const thr = (xs[i] + xs[i + 1]) / 2;
      let ls = 0, ln = 0, rs = 0, rn = 0;
      DATA.forEach((p, k) => { if (p.x <= thr) { ls += res[k]; ln++; } else { rs += res[k]; rn++; } });
      if (ln < 1 || rn < 1) continue;
      const lm = ls / ln, rm = rs / rn;
      let sse = 0;
      DATA.forEach((p, k) => { const m = p.x <= thr ? lm : rm; sse += (res[k] - m) ** 2; });
      if (sse < best.sse) best = { sse, thr, dl: lr * lm, dr: lr * rm };
    }
    steps.push({ thr: best.thr, dl: best.dl, dr: best.dr });
  }
  return { c0, steps };
}

const W = 380, H = 260, PAD = 24;
const f = (n: number) => Math.round(n * 100) / 100;
const px = (x: number) => f(PAD + x * (W - 2 * PAD));
const py = (y: number) => f(H - PAD - ((y + 0.1) / 1.2) * (H - 2 * PAD));

export function GradientBoostingLab() {
  const [nTrees, setNTrees] = useState(0);
  const [lrPct, setLrPct] = useState(30); // learning rate * 100

  const seq = useMemo(() => buildSequence(lrPct / 100), [lrPct]);

  const { fitLine, rmse, r2 } = useMemo(() => {
    const evalF = (x: number) => seq.c0 + seq.steps.slice(0, nTrees).reduce((a, s) => a + (x <= s.thr ? s.dl : s.dr), 0);
    const grid = Array.from({ length: 121 }, (_, i) => i / 120);
    const fitLine = grid.map((x) => `${px(x)},${py(evalF(x))}`).join(" ");
    const mse = DATA.reduce((s, p) => s + (p.y - evalF(p.x)) ** 2, 0) / DATA.length;
    const yb = seq.c0;
    const sst = DATA.reduce((s, p) => s + (p.y - yb) ** 2, 0);
    const ssr = DATA.reduce((s, p) => s + (p.y - evalF(p.x)) ** 2, 0);
    return { fitLine, rmse: Math.sqrt(mse), r2: 1 - ssr / sst };
  }, [seq, nTrees]);

  const evalNow = (x: number) => seq.c0 + seq.steps.slice(0, nTrees).reduce((a, s) => a + (x <= s.thr ? s.dl : s.dr), 0);

  return (
    <div style={{ background: "var(--canvas)", border: "1px solid var(--border-strong)", borderRadius: 14, padding: "16px 16px 14px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 18, alignItems: "flex-start" }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 400, flex: "1 1 300px", display: "block" }} role="img" aria-label="gradient boosting fitting 1-D data one stump at a time">
          <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="var(--border-strong)" strokeWidth={1} />
          <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="var(--border-strong)" strokeWidth={1} />
          {/* true noiseless signal */}
          <polyline points={Array.from({ length: 121 }, (_, i) => i / 120).map((x) => `${px(x)},${py(g(x))}`).join(" ")} fill="none" stroke="var(--muted)" strokeWidth={1.2} strokeDasharray="4 3" opacity={0.6} />
          {/* residual bars */}
          {DATA.map((p, i) => (
            <line key={i} x1={px(p.x)} y1={py(p.y)} x2={px(p.x)} y2={py(evalNow(p.x))} stroke="var(--faint)" strokeWidth={1} />
          ))}
          {/* the additive fit */}
          <polyline points={fitLine} fill="none" stroke="var(--c-trees)" strokeWidth={2.4} strokeLinejoin="round" />
          {/* data */}
          {DATA.map((p, i) => (
            <circle key={i} cx={px(p.x)} cy={py(p.y)} r={3} fill="var(--c-regression)" stroke="var(--surface)" strokeWidth={0.6} />
          ))}
          <text x={W - PAD} y={H - 6} fontSize={10} textAnchor="end" fill="var(--faint)">feature x</text>
          <text x={PAD + 4} y={PAD + 2} fontSize={9.5} fill="var(--faint)">- - true signal</text>
        </svg>

        <div style={{ flex: "1 1 200px", minWidth: 190 }}>
          <label style={{ fontSize: 12.5, color: "var(--muted)", display: "block", marginBottom: 6 }}>
            Trees added: <strong style={{ color: "var(--ink)" }}>{nTrees}</strong>
          </label>
          <input type="range" min={0} max={MAX_TREES} step={1} value={nTrees} onChange={(e) => setNTrees(Number(e.target.value))} style={{ width: "100%", accentColor: "var(--c-trees)" }} />

          <label style={{ fontSize: 12.5, color: "var(--muted)", display: "block", margin: "16px 0 6px" }}>
            Learning rate ν: <strong style={{ color: "var(--ink)" }}>{(lrPct / 100).toFixed(2)}</strong>
          </label>
          <input type="range" min={5} max={100} step={5} value={lrPct} onChange={(e) => setLrPct(Number(e.target.value))} style={{ width: "100%", accentColor: "var(--c-trees)" }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 13, marginTop: 16 }}>
            <span style={{ color: "var(--muted)" }}>Train RMSE</span>
            <span className="font-display" style={{ fontWeight: 600, color: "var(--ink)" }}>{rmse.toFixed(3)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 13, marginTop: 8 }}>
            <span style={{ color: "var(--muted)" }}>Train R²</span>
            <span className="font-display" style={{ fontWeight: 600, color: "var(--ink)" }}>{r2.toFixed(3)}</span>
          </div>
          <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.55, marginTop: 14 }}>
            At 0 trees the fit is the flat mean. Each tree fits the leftover{" "}
            <span style={{ color: "var(--muted)" }}>residuals</span> (the grey bars) and adds a shrunk step.
            Small ν needs many trees; large ν closes fast but chases noise past the{" "}
            <span style={{ borderBottom: "1px dashed var(--muted)" }}>true signal</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
