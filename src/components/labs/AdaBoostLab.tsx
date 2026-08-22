"use client";

import { useState } from "react";

// AdaBoost with axis-aligned decision stumps on a wavy 2-D boundary. Step through
// the rounds: each stump is the best single threshold on the *weighted* data, then
// the misclassified points swell (their weight grows) so the next stump is forced
// to attend to them. Watch the ensemble accuracy climb as weak stumps accumulate.
//
// All rounds are precomputed once at module scope from deterministic data, so the
// slider just indexes a fixed sequence — identical SSR / client, no hydration risk.

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Pt = { x: number; y: number; c: -1 | 1 };
const DATA: Pt[] = (() => {
  const r = mulberry32(41);
  const pts: Pt[] = [];
  for (let i = 0; i < 60; i++) {
    const x = r(), y = r();
    const boundary = 0.5 + 0.28 * Math.sin(2 * Math.PI * 1.05 * x);
    const noisy = r() < 0.08; // 8% label noise
    let c: -1 | 1 = y > boundary ? 1 : -1;
    if (noisy) c = (c === 1 ? -1 : 1);
    pts.push({ x, y, c });
  }
  return pts;
})();

type Stump = { axis: 0 | 1; thr: number; pol: 1 | -1; alpha: number; err: number };
type Round = { stump: Stump; weights: number[]; acc: number };

// value of a stump on a point: +1 if (axis-value <= thr) matches polarity else -1
function stumpPredict(s: Stump, p: Pt): -1 | 1 {
  const v = s.axis === 0 ? p.x : p.y;
  return ((v <= s.thr ? 1 : -1) * s.pol) as -1 | 1;
}

const ROUNDS: Round[] = (() => {
  const n = DATA.length;
  let w = new Array(n).fill(1 / n);
  const cands: { axis: 0 | 1; thr: number }[] = [];
  for (const axis of [0, 1] as const) {
    const vals = [...new Set(DATA.map((p) => (axis === 0 ? p.x : p.y)))].sort((a, b) => a - b);
    for (let i = 0; i < vals.length - 1; i++) cands.push({ axis, thr: (vals[i] + vals[i + 1]) / 2 });
  }
  const out: Round[] = [];
  const F = new Array(n).fill(0); // ensemble score
  for (let round = 0; round < 14; round++) {
    // best weighted stump
    let best: Stump | null = null;
    let bestErr = Infinity;
    for (const cand of cands) {
      for (const pol of [1, -1] as const) {
        const s: Stump = { axis: cand.axis, thr: cand.thr, pol, alpha: 0, err: 0 };
        let err = 0;
        for (let i = 0; i < n; i++) if (stumpPredict(s, DATA[i]) !== DATA[i].c) err += w[i];
        if (err < bestErr) { bestErr = err; best = s; }
      }
    }
    const s = best!;
    s.err = Math.max(1e-6, Math.min(1 - 1e-6, bestErr));
    s.alpha = 0.5 * Math.log((1 - s.err) / s.err);
    // update ensemble score + accuracy
    for (let i = 0; i < n; i++) F[i] += s.alpha * stumpPredict(s, DATA[i]);
    let correct = 0;
    for (let i = 0; i < n; i++) if (Math.sign(F[i]) === DATA[i].c) correct++;
    // snapshot the weights that PRODUCED this stump (before reweighting)
    out.push({ stump: s, weights: [...w], acc: correct / n });
    // reweight for next round
    const nw = w.map((wi, i) => wi * Math.exp(-s.alpha * DATA[i].c * stumpPredict(s, DATA[i])));
    const Z = nw.reduce((a, b) => a + b, 0);
    w = nw.map((x) => x / Z);
  }
  return out;
})();

const S = 260, PAD = 16;
const f = (n: number) => Math.round(n * 100) / 100;
const sx = (x: number) => f(PAD + x * (S - 2 * PAD));
const sy = (y: number) => f(S - PAD - y * (S - 2 * PAD));
const COL = { "-1": "var(--c-regression)", "1": "var(--c-classification)" } as const;

export function AdaBoostLab() {
  const [round, setRound] = useState(0);
  const R = ROUNDS[round];
  const wMax = Math.max(...R.weights);

  return (
    <div style={{ background: "var(--canvas)", border: "1px solid var(--border-strong)", borderRadius: 14, padding: "16px 16px 14px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 18, alignItems: "flex-start" }}>
        <svg viewBox={`0 0 ${S} ${S}`} width="100%" style={{ maxWidth: 300, flex: "1 1 260px", display: "block" }} role="img" aria-label="AdaBoost stumps reweighting points">
          <rect x={PAD} y={PAD} width={S - 2 * PAD} height={S - 2 * PAD} fill="none" stroke="var(--border-strong)" strokeWidth={1} />
          {/* current stump split line */}
          {R.stump.axis === 0 ? (
            <line x1={sx(R.stump.thr)} y1={sy(0)} x2={sx(R.stump.thr)} y2={sy(1)} stroke="var(--c-trees)" strokeWidth={2} strokeDasharray="5 3" />
          ) : (
            <line x1={sx(0)} y1={sy(R.stump.thr)} x2={sx(1)} y2={sy(R.stump.thr)} stroke="var(--c-trees)" strokeWidth={2} strokeDasharray="5 3" />
          )}
          {/* points sized by current weight; ring = misclassified by this stump */}
          {DATA.map((p, i) => {
            const wrong = stumpPredict(R.stump, p) !== p.c;
            const r = 2.4 + 7 * (R.weights[i] / wMax);
            return (
              <g key={i}>
                <circle cx={sx(p.x)} cy={sy(p.y)} r={f(r)} fill={COL[String(p.c) as "-1" | "1"]} opacity={0.8} />
                {wrong && <circle cx={sx(p.x)} cy={sy(p.y)} r={f(r + 1.8)} fill="none" stroke="var(--ink)" strokeWidth={1} />}
              </g>
            );
          })}
        </svg>

        <div style={{ flex: "1 1 200px", minWidth: 190 }}>
          <label style={{ fontSize: 12.5, color: "var(--muted)", display: "block", marginBottom: 6 }}>
            After stump: <strong style={{ color: "var(--ink)" }}>{round + 1}</strong> of {ROUNDS.length}
          </label>
          <input type="range" min={0} max={ROUNDS.length - 1} step={1} value={round} onChange={(e) => setRound(Number(e.target.value))} style={{ width: "100%", accentColor: "var(--c-trees)" }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 13, marginTop: 16 }}>
            <span style={{ color: "var(--muted)" }}>This stump&rsquo;s weighted error ε</span>
            <span className="font-display" style={{ fontWeight: 600, color: "var(--ink)" }}>{R.stump.err.toFixed(3)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 13, marginTop: 8 }}>
            <span style={{ color: "var(--muted)" }}>Its vote α</span>
            <span className="font-display" style={{ fontWeight: 600, color: "var(--ink)" }}>{R.stump.alpha.toFixed(3)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 13, marginTop: 8 }}>
            <span style={{ color: "var(--muted)" }}>Ensemble train accuracy</span>
            <span className="font-display" style={{ fontWeight: 600, color: "var(--c-trees)" }}>{(R.acc * 100).toFixed(1)}%</span>
          </div>
          <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.55, marginTop: 14 }}>
            Dot <strong>size</strong> = current weight; <span style={{ borderBottom: "1px solid var(--ink)" }}>ringed</span>{" "}
            dots are the ones this stump gets wrong — they swell next round. One stump is barely better than
            chance, but the <em>weighted vote</em> of many climbs well past any single one.
          </p>
        </div>
      </div>
    </div>
  );
}
