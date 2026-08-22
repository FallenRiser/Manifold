"use client";

import { useState } from "react";

// The overfitting hump. Boost depth-1 stumps on a small, noisy 1-D training set
// and track error on both the training set and a large clean test set as trees
// pile up. Train error falls forever; test error dips to a minimum then climbs —
// so the number of trees is a hyperparameter you STOP at, not maximise. The slider
// is the "how many trees" dial; Snap to best jumps to where a validation set would.
//
// The whole train/test error trajectory is precomputed once at module scope from
// deterministic data → identical SSR / client render.

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const g = (x: number) => 0.5 + 0.3 * Math.sin(2 * Math.PI * 0.85 * x) - 0.12 * x;
const MAX = 100;
const LR = 0.3;

const { TRAIN_ERR, TEST_ERR, BEST_K } = (() => {
  const rt = mulberry32(23);
  const TR = Array.from({ length: 26 }, (_, i) => { const x = i / 25; return { x, y: g(x) + (rt() + rt() + rt() - 1.5) * 0.2 }; });
  const rv = mulberry32(77);
  const TE = Array.from({ length: 120 }, () => { const x = rv(); return { x, y: g(x) + (rv() - 0.5) * 0.05 }; });
  const c0 = TR.reduce((s, p) => s + p.y, 0) / TR.length;
  const steps: { thr: number; dl: number; dr: number }[] = [];
  const F = (x: number) => c0 + steps.reduce((a, s) => a + (x <= s.thr ? s.dl : s.dr), 0);
  const xs = [...new Set(TR.map((p) => p.x))].sort((a, b) => a - b);
  const rmse = (S: { x: number; y: number }[]) => Math.sqrt(S.reduce((s, p) => s + (p.y - F(p.x)) ** 2, 0) / S.length);
  const tr: number[] = [], te: number[] = [];
  let bestK = 0, bestTe = Infinity;
  for (let t = 0; t <= MAX; t++) {
    if (t > 0) {
      const res = TR.map((p) => p.y - F(p.x));
      let best = { sse: Infinity, thr: 0.5, dl: 0, dr: 0 };
      for (let i = 0; i < xs.length - 1; i++) {
        const thr = (xs[i] + xs[i + 1]) / 2;
        let ls = 0, ln = 0, rs = 0, rn = 0;
        TR.forEach((p, k) => { if (p.x <= thr) { ls += res[k]; ln++; } else { rs += res[k]; rn++; } });
        if (ln < 1 || rn < 1) continue;
        const lm = ls / ln, rm = rs / rn;
        let sse = 0;
        TR.forEach((p, k) => { const m = p.x <= thr ? lm : rm; sse += (res[k] - m) ** 2; });
        if (sse < best.sse) best = { sse, thr, dl: LR * lm, dr: LR * rm };
      }
      steps.push(best);
    }
    const a = rmse(TR), b = rmse(TE);
    tr.push(a); te.push(b);
    if (b < bestTe) { bestTe = b; bestK = t; }
  }
  return { TRAIN_ERR: tr, TEST_ERR: te, BEST_K: bestK };
})();

const W = 380, H = 240, PL = 40, PR = 14, PT = 16, PB = 30;
const YMAX = 0.3;
const f = (n: number) => Math.round(n * 100) / 100;
const cx = (t: number) => f(PL + (t / MAX) * (W - PL - PR));
const cy = (e: number) => f(PT + (1 - e / YMAX) * (H - PT - PB));
const polyline = (arr: number[]) => arr.map((e, t) => `${cx(t)},${cy(e)}`).join(" ");

export function BoostingEarlyStopLab() {
  const [k, setK] = useState(MAX);

  return (
    <div style={{ background: "var(--canvas)", border: "1px solid var(--border-strong)", borderRadius: 14, padding: "16px 16px 14px" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="train and test error versus number of trees">
        {/* axes */}
        <line x1={PL} y1={H - PB} x2={W - PR} y2={H - PB} stroke="var(--border-strong)" strokeWidth={1} />
        <line x1={PL} y1={PT} x2={PL} y2={H - PB} stroke="var(--border-strong)" strokeWidth={1} />
        <text x={(PL + W - PR) / 2} y={H - 8} textAnchor="middle" fontSize={10} fill="var(--faint)">number of trees →</text>
        <text x={12} y={(PT + H - PB) / 2} textAnchor="middle" fontSize={10} fill="var(--faint)" transform={`rotate(-90 12 ${(PT + H - PB) / 2})`}>error (RMSE)</text>

        {/* best-test marker */}
        <line x1={cx(BEST_K)} y1={PT} x2={cx(BEST_K)} y2={H - PB} stroke="var(--c-trees)" strokeWidth={1} strokeDasharray="3 3" opacity={0.5} />
        <text x={cx(BEST_K)} y={PT - 4} textAnchor="middle" fontSize={9} fill="var(--c-trees)">best test</text>

        {/* curves */}
        <polyline points={polyline(TEST_ERR)} fill="none" stroke="var(--c-classification)" strokeWidth={2} />
        <polyline points={polyline(TRAIN_ERR)} fill="none" stroke="var(--muted)" strokeWidth={1.6} strokeDasharray="4 3" />

        {/* current cursor */}
        <line x1={cx(k)} y1={PT} x2={cx(k)} y2={H - PB} stroke="var(--ink)" strokeWidth={1} opacity={0.35} />
        <circle cx={cx(k)} cy={cy(TRAIN_ERR[k])} r={3.5} fill="var(--muted)" />
        <circle cx={cx(k)} cy={cy(TEST_ERR[k])} r={3.5} fill="var(--c-classification)" />

        {/* legend */}
        <circle cx={W - 96} cy={PT + 6} r={3.5} fill="var(--c-classification)" /><text x={W - 88} y={PT + 9} fontSize={10} fill="var(--muted)">test</text>
        <line x1={W - 60} y1={PT + 6} x2={W - 48} y2={PT + 6} stroke="var(--muted)" strokeWidth={1.6} strokeDasharray="4 3" /><text x={W - 44} y={PT + 9} fontSize={10} fill="var(--muted)">train</text>
      </svg>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center", marginTop: 8 }}>
        <div style={{ flex: "1 1 220px", minWidth: 200 }}>
          <label style={{ fontSize: 12.5, color: "var(--muted)", display: "block", marginBottom: 6 }}>
            Trees: <strong style={{ color: "var(--ink)" }}>{k}</strong>
          </label>
          <input type="range" min={0} max={MAX} step={1} value={k} onChange={(e) => setK(Number(e.target.value))} style={{ width: "100%", accentColor: "var(--c-trees)" }} />
        </div>
        <button
          onClick={() => setK(BEST_K)}
          style={{ fontSize: 12.5, padding: "6px 12px", borderRadius: 8, border: "1px solid var(--c-trees)", background: "color-mix(in srgb, var(--c-trees) 12%, var(--surface))", color: "var(--c-trees)", cursor: "pointer" }}
        >
          Snap to best ({BEST_K})
        </button>
        <div style={{ display: "flex", gap: 16, fontSize: 13 }}>
          <span style={{ color: "var(--muted)" }}>train <strong className="font-display" style={{ color: "var(--ink)" }}>{TRAIN_ERR[k].toFixed(3)}</strong></span>
          <span style={{ color: "var(--muted)" }}>test <strong className="font-display" style={{ color: "var(--c-classification)" }}>{TEST_ERR[k].toFixed(3)}</strong></span>
        </div>
      </div>
      <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.55, marginTop: 12, marginBottom: 0 }}>
        Drag past the <span style={{ color: "var(--c-trees)" }}>best-test</span> line: train error (dashed) keeps
        falling toward zero while test error (solid) turns and climbs — the model is now fitting noise. Early
        stopping simply halts at the dip.
      </p>
    </div>
  );
}
