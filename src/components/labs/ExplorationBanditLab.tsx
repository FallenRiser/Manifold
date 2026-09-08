"use client";

import { useCallback, useEffect, useState } from "react";

// The exploration-vs-exploitation trade, made measurable. Sutton's 10-armed testbed:
// each run draws 10 true action-values q*(a) ~ N(0,1); a reward is q*(a) + N(0,1).
// Four classic strategies compete on the SAME draws, and we plot CUMULATIVE REGRET
// (how much reward you left on the table vs always pulling the best arm). Lower is
// better. The lesson the curves make vivid: ε-greedy never stops exploring, so its
// regret keeps climbing (linear tail); strategies that TAPER exploration —
// optimistic init, UCB, softmax — bend toward flat. Averaged over 200 runs.
// Verified final regret ≈ optimistic 135 < UCB 150 ≈ softmax 151 < ε-greedy 231.

const ACCENT = "var(--c-rl)";
const K = 10, STEPS = 1000, RUNS = 200;

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function randn(rng: () => number) {
  let u = 0, v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

type Strat = { key: string; label: string; color: string };
const STRATS: Strat[] = [
  { key: "eps", label: "ε-greedy (ε=0.1)", color: "#c0392b" },
  { key: "opt", label: "optimistic (Q₀=5)", color: "#2d6a9f" },
  { key: "ucb", label: "UCB (c=2)", color: ACCENT },
  { key: "soft", label: "softmax (τ=0.2)", color: "#7d5ba6" },
];

function runAll(eps: number, tau: number, ucbC: number, optQ: number, seed: number) {
  const rng = mulberry32(seed);
  const reg: Record<string, number[]> = { eps: new Array(STEPS).fill(0), opt: new Array(STEPS).fill(0), ucb: new Array(STEPS).fill(0), soft: new Array(STEPS).fill(0) };
  for (let run = 0; run < RUNS; run++) {
    const qstar = Array.from({ length: K }, () => randn(rng));
    const best = Math.max(...qstar);
    const state: Record<string, { Q: number[]; N: number[]; cum: number }> = {
      eps: { Q: new Array(K).fill(0), N: new Array(K).fill(0), cum: 0 },
      opt: { Q: new Array(K).fill(optQ), N: new Array(K).fill(0), cum: 0 },
      ucb: { Q: new Array(K).fill(0), N: new Array(K).fill(0), cum: 0 },
      soft: { Q: new Array(K).fill(0), N: new Array(K).fill(0), cum: 0 },
    };
    for (let t = 0; t < STEPS; t++) {
      for (const s of STRATS) {
        const st = state[s.key]; let a = 0;
        if (s.key === "eps") {
          if (rng() < eps) a = Math.floor(rng() * K);
          else { a = 0; for (let x = 1; x < K; x++) if (st.Q[x] > st.Q[a]) a = x; }
        } else if (s.key === "opt") {
          a = 0; for (let x = 1; x < K; x++) if (st.Q[x] > st.Q[a]) a = x;
        } else if (s.key === "ucb") {
          let bv = -Infinity;
          for (let x = 0; x < K; x++) {
            const bonus = st.N[x] === 0 ? 1e6 : ucbC * Math.sqrt(Math.log(t + 1) / st.N[x]);
            const v = st.Q[x] + bonus; if (v > bv) { bv = v; a = x; }
          }
        } else {
          const mx = Math.max(...st.Q);
          const w = st.Q.map((q) => Math.exp((q - mx) / tau));
          const sum = w.reduce((p, q) => p + q, 0);
          let r = rng() * sum, acc = 0; a = K - 1;
          for (let x = 0; x < K; x++) { acc += w[x]; if (r <= acc) { a = x; break; } }
        }
        const reward = qstar[a] + randn(rng);
        st.N[a] += 1; st.Q[a] += (reward - st.Q[a]) / st.N[a];
        st.cum += best - qstar[a];
        reg[s.key][t] += st.cum;
      }
    }
  }
  for (const k of Object.keys(reg)) reg[k] = reg[k].map((v) => v / RUNS);
  return reg;
}

export function ExplorationBanditLab() {
  const [eps, setEps] = useState(0.1);
  const [tau, setTau] = useState(0.2);
  const [data, setData] = useState<Record<string, number[]> | null>(null);
  const [busy, setBusy] = useState(false);

  const run = useCallback(() => {
    setBusy(true);
    setTimeout(() => { setData(runAll(eps, tau, 2, 5, 42)); setBusy(false); }, 20);
  }, [eps, tau]);

  useEffect(() => { run(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const W = 360, H = 190, pl = 34, pb = 26, pt = 10, pr = 8;
  const plotW = W - pl - pr, plotH = H - pb - pt;
  const yHi = data ? Math.max(60, ...STRATS.map((s) => data[s.key][STEPS - 1])) * 1.05 : 250;
  const px = (i: number) => pl + plotW * (i / (STEPS - 1));
  const py = (v: number) => pt + plotH * (1 - v / yHi);
  const pathFor = (arr: number[]) => {
    let d = ""; const stepEvery = 8;
    for (let i = 0; i < STEPS; i += stepEvery) d += `${d ? "L" : "M"}${px(i).toFixed(1)},${py(arr[i]).toFixed(1)} `;
    d += `L${px(STEPS - 1).toFixed(1)},${py(arr[STEPS - 1]).toFixed(1)}`;
    return d;
  };
  const winner = data ? STRATS.slice().sort((a, b) => data[a.key][STEPS - 1] - data[b.key][STEPS - 1])[0] : null;

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        <span style={head}>Four ways to explore — 10-armed bandit</span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>{busy ? "running…" : "cumulative regret · 200 runs"}</span>
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "min(100%, 380px)", height: "auto" }}>
          <line x1={pl} y1={py(0)} x2={W - pr} y2={py(0)} stroke="var(--border)" />
          <line x1={pl} y1={pt} x2={pl} y2={py(0)} stroke="var(--border)" />
          <text x={pl - 5} y={pt + 4} textAnchor="end" fontSize={9} fill="var(--faint)">{yHi.toFixed(0)}</text>
          <text x={pl - 5} y={py(0)} textAnchor="end" fontSize={9} fill="var(--faint)">0</text>
          <text x={pl + plotW / 2} y={H - 4} textAnchor="middle" fontSize={9.5} fill="var(--faint)">steps → {STEPS}</text>
          <text x={12} y={pt + plotH / 2} fontSize={9.5} fill="var(--faint)" transform={`rotate(-90 12 ${pt + plotH / 2})`} textAnchor="middle">regret</text>
          {data && STRATS.map((s) => (
            <path key={s.key} d={pathFor(data[s.key])} fill="none" stroke={s.color} strokeWidth={1.8} opacity={0.92} />
          ))}
        </svg>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 14px", marginTop: 4, fontSize: 12 }}>
        {STRATS.map((s) => (
          <span key={s.key} style={{ color: s.color }}>
            ■ <span style={{ color: "var(--muted)" }}>{s.label}</span>
            {data && <b style={{ color: "var(--ink)", fontFamily: "ui-monospace, monospace" }}> {data[s.key][STEPS - 1].toFixed(0)}</b>}
          </span>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12, alignItems: "center", justifyContent: "center" }}>
        <button style={{ ...btn, borderColor: ACCENT, background: `color-mix(in srgb, ${ACCENT} 16%, transparent)` }} onClick={run} disabled={busy}>Run</button>
      </div>
      <label style={sl}>
        <span style={{ minWidth: 116 }}>ε-greedy ε: <b style={mono}>{eps.toFixed(2)}</b></span>
        <input type="range" min={0} max={0.4} step={0.02} value={eps} onChange={(e) => setEps(Number(e.target.value))} style={rngS} aria-label="epsilon" />
      </label>
      <label style={sl}>
        <span style={{ minWidth: 116 }}>softmax τ: <b style={mono}>{tau.toFixed(2)}</b></span>
        <input type="range" min={0.05} max={1} step={0.05} value={tau} onChange={(e) => setTau(Number(e.target.value))} style={rngS} aria-label="temperature" />
      </label>

      <div style={caption}>
        Regret is the reward you forfeit by not always pulling the best arm — so a flat curve is the goal. Watch the
        shapes: <b style={{ color: "#c0392b" }}>ε-greedy</b> keeps a fixed 10% chance of a random pull <em>forever</em>,
        so its regret rises in a straight line that never levels off. <b style={{ color: "#2d6a9f" }}>Optimistic
        initialisation</b> and <b style={{ color: ACCENT }}>UCB</b> front-load their exploration — UCB even aims it at
        the arms it is least sure about — then taper, so their curves bend toward flat.{winner && <> Here the winner is{" "}
        <b style={{ color: winner.color }}>{winner.label}</b>.</>} Nudge ε up and its line steepens; the trade never
        goes away, it only gets scheduled more or less wisely.
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const caption: React.CSSProperties = { fontSize: 12.5, color: "var(--muted)", marginTop: 12, lineHeight: 1.55 };
const btn: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 7, cursor: "pointer", padding: "5px 16px", fontSize: 12.5, color: "var(--ink)", fontFamily: "var(--font-sans, sans-serif)", background: "transparent" };
const sl: React.CSSProperties = { display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "var(--muted)", marginTop: 9 };
const rngS: React.CSSProperties = { flex: 1, accentColor: ACCENT };
const mono: React.CSSProperties = { color: "var(--ink)", fontFamily: "ui-monospace, monospace" };
