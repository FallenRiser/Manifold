"use client";

import { useCallback, useState } from "react";

// n-step returns as a dial between TD(0) and Monte Carlo — Sutton & Barto's 19-state
// random walk (Example 7.1). For each n the lab runs n-step TD for a few episodes,
// averaged over many runs, and plots the resulting RMS error. The bars form the classic
// U: n=1 (pure TD) and large n (toward MC) are both worse than an intermediate n. The
// minimum's location shifts with the step size α — drag it and watch the sweet spot move.

const ACCENT = "var(--c-rl)";
const N_STATES = 21;                    // 0..20; 0 and 20 terminal, start at 10
const N_VALUES = [1, 2, 3, 5, 8, 16];
const TRUE = Array.from({ length: N_STATES }, (_, i) => (i === 0 || i === 20 ? 0 : -1 + (2 * i) / 20));

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function nstepWalk(n: number, alpha: number, episodes: number, rng: () => number) {
  const V = new Array(N_STATES).fill(0);
  for (let e = 0; e < episodes; e++) {
    let s = 10;
    const S = [s]; const R = [0];
    let T = Infinity, t = 0;
    while (true) {
      if (t < T) {
        const s2 = s + (rng() < 0.5 ? -1 : 1);
        const r = s2 === 20 ? 1 : s2 === 0 ? -1 : 0;
        S.push(s2); R.push(r);
        if (s2 === 0 || s2 === 20) T = t + 1;
        s = s2;
      }
      const tau = t - n + 1;
      if (tau >= 0) {
        let G = 0;
        const end = Math.min(tau + n, T);
        for (let i = tau + 1; i <= end; i++) G += R[i];   // gamma = 1
        if (tau + n < T) G += V[S[tau + n]];
        V[S[tau]] += alpha * (G - V[S[tau]]);
      }
      if (tau === T - 1) break;
      t++;
    }
  }
  let se = 0;
  for (let i = 1; i < 20; i++) se += (V[i] - TRUE[i]) ** 2;
  return Math.sqrt(se / 19);
}

export function NStepDialLab() {
  const [alpha, setAlpha] = useState(0.4);
  const [res, setRes] = useState<number[] | null>(null);
  const [busy, setBusy] = useState(false);

  const run = useCallback(() => {
    setBusy(true);
    setTimeout(() => {
      const runs = 100, episodes = 10;
      const out = N_VALUES.map((n) => {
        const rng = mulberry32(1);
        let sum = 0;
        for (let r = 0; r < runs; r++) sum += nstepWalk(n, alpha, episodes, rng);
        return sum / runs;
      });
      setRes(out);
      setBusy(false);
    }, 20);
  }, [alpha]);

  const maxR = res ? Math.max(...res, 0.5) : 0.5;
  const best = res ? res.indexOf(Math.min(...res)) : -1;
  const W = 340, H = 170, pl = 34, pb = 34, pt = 10;
  const plotW = W - pl - 10, plotH = H - pb - pt;
  const bw = plotW / N_VALUES.length;
  const by = (v: number) => pt + plotH * (1 - v / maxR);

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        <span style={head}>n-step returns — the dial from TD(0) to Monte Carlo</span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>19-state random walk</span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "min(100%, 380px)", height: "auto", display: "block", margin: "0 auto" }}>
        <line x1={pl} y1={by(0)} x2={W - 10} y2={by(0)} stroke="var(--border)" />
        {res && N_VALUES.map((n, i) => {
          const h = by(0) - by(res[i]);
          const isBest = i === best;
          return (
            <g key={n}>
              <rect x={pl + i * bw + bw * 0.15} y={by(res[i])} width={bw * 0.7} height={h} rx={2}
                fill={isBest ? ACCENT : `color-mix(in srgb, ${ACCENT} 34%, var(--canvas))`} />
              <text x={pl + i * bw + bw / 2} y={by(res[i]) - 4} textAnchor="middle" fontSize={9.5} fill="var(--muted)" fontFamily="ui-monospace, monospace">{res[i].toFixed(2)}</text>
              <text x={pl + i * bw + bw / 2} y={H - 18} textAnchor="middle" fontSize={10} fill="var(--ink)" fontFamily="ui-monospace, monospace">{n}</text>
            </g>
          );
        })}
        <text x={pl + plotW / 2} y={H - 4} textAnchor="middle" fontSize={9.5} fill="var(--faint)">n  (1 = TD(0),  large = Monte Carlo)</text>
        <text x={pl - 6} y={pt + 4} textAnchor="end" fontSize={9} fill="var(--faint)">RMS</text>
      </svg>

      {res && best >= 0 && (
        <div style={{ textAlign: "center", fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
          best here: <b style={{ color: ACCENT }}>n = {N_VALUES[best]}</b> — lower error than both pure TD (n=1) and MC-like (n=16)
        </div>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12, alignItems: "center", justifyContent: "center" }}>
        <button style={{ ...btn, borderColor: ACCENT, background: `color-mix(in srgb, ${ACCENT} 16%, transparent)` }} onClick={run} disabled={busy}>{busy ? "running…" : "Run sweep"}</button>
        <button style={btn} onClick={() => setRes(null)} disabled={busy}>Reset</button>
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "var(--muted)", marginTop: 10 }}>
        <span style={{ minWidth: 96 }}>α: <b style={{ color: "var(--ink)", fontFamily: "ui-monospace, monospace" }}>{alpha.toFixed(2)}</b></span>
        <input type="range" min={0.05} max={0.9} step={0.05} value={alpha}
          onChange={(e) => { setAlpha(Number(e.target.value)); setRes(null); }} style={{ flex: 1, accentColor: ACCENT }} aria-label="step size alpha" />
      </label>

      <div style={caption}>
        Each bar is the value-estimation error after 10 episodes for a given <em>n</em> — how many real rewards to
        collect before bootstrapping off the estimate. <b>n = 1</b> is TD(0); a very large <b>n</b> approaches Monte
        Carlo. The best choice is neither extreme but somewhere in the <em>middle</em> — enough real reward to cut the
        bias, not so much that variance takes over. Drag <M>α</M> and the sweet spot shifts: n-step gives you a whole
        dial between the two methods, and the good settings live in between.
      </div>
    </div>
  );
}

function M({ children }: { children: React.ReactNode }) {
  return <em style={{ fontFamily: "ui-monospace, monospace", fontStyle: "normal" }}>{children}</em>;
}

const wrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const caption: React.CSSProperties = { fontSize: 12.5, color: "var(--muted)", marginTop: 12, lineHeight: 1.55 };
const btn: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 7, cursor: "pointer", padding: "5px 12px", fontSize: 12.5, color: "var(--ink)", fontFamily: "var(--font-sans, sans-serif)", background: "transparent" };
