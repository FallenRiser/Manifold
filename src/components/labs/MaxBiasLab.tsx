"use client";

import { useCallback, useState } from "react";

// Maximization bias — Sutton & Barto Figure 6.5. A tiny MDP: from A, 'right' ends the
// episode (reward 0); 'left' goes to B, where many actions each end the episode with a
// reward ~ N(-0.1, 1). Going left is worse in expectation (-0.1 < 0), so the optimal
// agent almost never goes left (only ε/2 of the time, by exploration). But Q-learning's
// max over B's noisy estimates is biased HIGH, so it wrongly favours 'left' early on.
// Double Q-learning — two estimates, one to select, one to evaluate — removes the bias.
// Averaged over many runs, this reproduces the classic spike-vs-flat figure.

const ACCENT = "var(--c-rl)";      // double-Q
const QCOL = "#c0392b";            // Q-learning
const NB = 8;                       // actions available in B
const EPS = 0.1, ALPHA = 0.1, EPISODES = 300;
const OPT = (EPS / 2) * 100;        // optimal %-left = ε/2

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// standard normal via Box–Muller
function randn(rng: () => number) {
  let u = 0, v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
function argmaxArr(a: number[]) { let b = 0; for (let i = 1; i < a.length; i++) if (a[i] > a[b]) b = i; return b; }

function experiment(double: boolean, runs: number, seed: number) {
  const rng = mulberry32(seed);
  const left = new Array(EPISODES).fill(0);
  for (let run = 0; run < runs; run++) {
    const QA = [0, 0], QB = new Array(NB).fill(0);
    const QA2 = [0, 0], QB2 = new Array(NB).fill(0);
    for (let ep = 0; ep < EPISODES; ep++) {
      let a: number;
      if (double) a = rng() < EPS ? Math.floor(rng() * 2) : argmaxArr([QA[0] + QA2[0], QA[1] + QA2[1]]);
      else a = rng() < EPS ? Math.floor(rng() * 2) : argmaxArr(QA);
      if (a === 1) left[ep] += 1;
      if (a === 0) {
        if (double) { if (rng() < 0.5) QA[0] += ALPHA * (0 - QA[0]); else QA2[0] += ALPHA * (0 - QA2[0]); }
        else QA[0] += ALPHA * (0 - QA[0]);
      } else {
        let b: number;
        if (double) b = rng() < EPS ? Math.floor(rng() * NB) : argmaxArr(QB.map((q, i) => q + QB2[i]));
        else b = rng() < EPS ? Math.floor(rng() * NB) : argmaxArr(QB);
        const r = -0.1 + randn(rng);
        if (double) {
          if (rng() < 0.5) { QB[b] += ALPHA * (r - QB[b]); QA[1] += ALPHA * (QB2[argmaxArr(QB)] - QA[1]); }
          else { QB2[b] += ALPHA * (r - QB2[b]); QA2[1] += ALPHA * (QB[argmaxArr(QB2)] - QA2[1]); }
        } else {
          QB[b] += ALPHA * (r - QB[b]); QA[1] += ALPHA * (Math.max(...QB) - QA[1]);
        }
      }
    }
  }
  return left.map((c) => (c / runs) * 100);
}

export function MaxBiasLab() {
  const [runs, setRuns] = useState(400);
  const [res, setRes] = useState<null | { q: number[]; d: number[]; runs: number }>(null);
  const [busy, setBusy] = useState(false);

  const run = useCallback(() => {
    setBusy(true);
    // let the button paint "running…" before the (synchronous) compute
    setTimeout(() => {
      const q = experiment(false, runs, 1);
      const d = experiment(true, runs, 1);
      setRes({ q, d, runs });
      setBusy(false);
    }, 20);
  }, [runs]);

  const W = 340, H = 180, pl = 34, pb = 26, pt = 10;
  const plotW = W - pl - 10, plotH = H - pb - pt;
  const yMax = 80;
  const x = (i: number) => pl + plotW * (i / (EPISODES - 1));
  const y = (v: number) => pt + plotH * (1 - Math.min(v, yMax) / yMax);
  const path = (h: number[]) => h.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        <span style={head}>Maximization bias — % of time the agent wrongly goes LEFT from A</span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>{res ? `${res.runs} runs averaged` : "not run"}</span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "min(100%, 380px)", height: "auto", display: "block", margin: "0 auto" }}>
        <line x1={pl} y1={y(0)} x2={W - 10} y2={y(0)} stroke="var(--border)" />
        <line x1={pl} y1={pt} x2={pl} y2={y(0)} stroke="var(--border)" />
        {/* optimal reference */}
        <line x1={pl} y1={y(OPT)} x2={W - 10} y2={y(OPT)} stroke="var(--ink)" strokeDasharray="3 3" strokeWidth={1} opacity={0.5} />
        <text x={W - 12} y={y(OPT) - 3} textAnchor="end" fontSize={9} fill="var(--faint)">optimal 5%</text>
        {res && <path d={path(res.q)} fill="none" stroke={QCOL} strokeWidth={1.8} />}
        {res && <path d={path(res.d)} fill="none" stroke={ACCENT} strokeWidth={1.8} />}
        <text x={pl - 5} y={y(0) + 3} textAnchor="end" fontSize={9} fill="var(--faint)">0</text>
        <text x={pl - 5} y={y(50) + 3} textAnchor="end" fontSize={9} fill="var(--faint)">50</text>
        <text x={W / 2} y={H - 4} textAnchor="middle" fontSize={9.5} fill="var(--faint)">episodes</text>
      </svg>

      {res && (
        <div style={{ display: "flex", gap: 16, justifyContent: "center", fontSize: 12, marginTop: 2 }}>
          <span style={{ color: QCOL }}>■ Q-learning (peaks ~{Math.max(...res.q).toFixed(0)}%)</span>
          <span style={{ color: ACCENT }}>■ Double Q-learning (stays ~{res.d[49].toFixed(0)}%)</span>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12, alignItems: "center", justifyContent: "center" }}>
        <button style={{ ...btn, borderColor: ACCENT, background: `color-mix(in srgb, ${ACCENT} 16%, transparent)` }} onClick={run} disabled={busy}>
          {busy ? "running…" : "Run experiment"}
        </button>
        <button style={btn} onClick={() => setRes(null)} disabled={busy}>Reset</button>
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "var(--muted)", marginTop: 10 }}>
        <span style={{ minWidth: 96 }}>runs: <b style={{ color: "var(--ink)", fontFamily: "ui-monospace, monospace" }}>{runs}</b></span>
        <input type="range" min={100} max={1000} step={100} value={runs}
          onChange={(e) => { setRuns(Number(e.target.value)); setRes(null); }} style={{ flex: 1, accentColor: ACCENT }} aria-label="number of runs to average" />
      </label>

      <div style={caption}>
        Going <em>left</em> from A is worse on average (reward −0.1), so the optimal agent goes left only when it
        explores — about <b>5%</b> of the time (the dashed line). <b style={{ color: QCOL }}>Q-learning</b> takes a{" "}
        <em>max</em> over B&rsquo;s noisy value estimates, which is biased high, so it wrongly loves &ldquo;left&rdquo;
        for a while — a big early spike. <b style={{ color: ACCENT }}>Double Q-learning</b> uses two independent
        estimates (one to pick the best action, one to value it) and the bias vanishes: it tracks the optimal 5% from
        the start. More runs = smoother curves.
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const caption: React.CSSProperties = { fontSize: 12.5, color: "var(--muted)", marginTop: 12, lineHeight: 1.55 };
const btn: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 7, cursor: "pointer", padding: "5px 12px", fontSize: 12.5, color: "var(--ink)", fontFamily: "var(--font-sans, sans-serif)", background: "transparent" };
