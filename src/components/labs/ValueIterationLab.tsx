"use client";

import { useCallback, useState } from "react";

// Value iteration, sweep by sweep. One button applies the Bellman OPTIMALITY backup
// (max over actions, not an average) to every state at once. The panel tracks Δ, the
// largest value change this sweep, and — the teaching point — the sweep at which the
// greedy policy STOPPED changing, which is almost always well before the values
// themselves settle. Drag γ to feel how the discount sets the convergence speed. The
// goal/pit world and γ = 0.9 reproduce the page's printed value function.

const ACCENT = "var(--c-rl)";
const NROW = 4, NCOL = 4, NS = 16, NA = 4;
const GOAL = 15, PIT = 3;
const STEP = -0.04;
const ARROWS = ["↑", "→", "↓", "←"];
const MOVES: [number, number][] = [[-1, 0], [0, 1], [1, 0], [0, -1]];
const isTerminal = (s: number) => s === GOAL || s === PIT;

function nextState(s: number, a: number) {
  const r = Math.floor(s / NCOL), c = s % NCOL;
  const nr = r + MOVES[a][0], nc = c + MOVES[a][1];
  if (nr < 0 || nr >= NROW || nc < 0 || nc >= NCOL) return s;
  return nr * NCOL + nc;
}
function reward(s: number, a: number) {
  if (isTerminal(s)) return 0;
  const ns = nextState(s, a);
  if (ns === GOAL) return 1.0;
  if (ns === PIT) return -1.0;
  return STEP;
}

function greedyArgmax(s: number, V: number[], gamma: number) {
  let best = 0, bestQ = -Infinity;
  for (let a = 0; a < NA; a++) {
    const q = reward(s, a) + gamma * V[nextState(s, a)];
    if (q > bestQ + 1e-12) { bestQ = q; best = a; }
  }
  return best;
}

export function ValueIterationLab() {
  const [gamma, setGamma] = useState(0.9);
  const [V, setV] = useState<number[]>(() => new Array(NS).fill(0));
  const [sweeps, setSweeps] = useState(0);
  const [delta, setDelta] = useState<number | null>(null);
  const [prevPolicy, setPrevPolicy] = useState<number[] | null>(null);
  const [policyFrozenAt, setPolicyFrozenAt] = useState<number | null>(null);
  const [converged, setConverged] = useState(false);

  const policy = V.map((_, s) => (isTerminal(s) ? -1 : greedyArgmax(s, V, gamma)));

  const sweep = useCallback(() => {
    setV((prev) => {
      const nV = prev.slice();
      let d = 0;
      for (let s = 0; s < NS; s++) {
        if (isTerminal(s)) continue;
        let bestQ = -Infinity;
        for (let a = 0; a < NA; a++) bestQ = Math.max(bestQ, reward(s, a) + gamma * prev[nextState(s, a)]);
        d = Math.max(d, Math.abs(bestQ - prev[s]));
        nV[s] = bestQ;
      }
      const newPol = nV.map((_, s) => (isTerminal(s) ? -1 : greedyArgmax(s, nV, gamma)));
      setSweeps((n) => {
        const step = n + 1;
        if (prevPolicy && policyFrozenAt === null &&
            newPol.every((a, s) => isTerminal(s) || a === prevPolicy[s])) {
          setPolicyFrozenAt(step);
        }
        return step;
      });
      setPrevPolicy(newPol);
      setDelta(Math.round(d * 10000) / 10000);
      if (d < 1e-6) setConverged(true);
      return nV;
    });
  }, [gamma, prevPolicy, policyFrozenAt]);

  const run = useCallback(() => {
    let v = V.slice(), n = sweeps, frozen = policyFrozenAt, prev = prevPolicy, d = 0;
    for (let i = 0; i < 500; i++) {
      const nv = v.slice(); d = 0;
      for (let s = 0; s < NS; s++) {
        if (isTerminal(s)) continue;
        let bestQ = -Infinity;
        for (let a = 0; a < NA; a++) bestQ = Math.max(bestQ, reward(s, a) + gamma * v[nextState(s, a)]);
        d = Math.max(d, Math.abs(bestQ - v[s]));
        nv[s] = bestQ;
      }
      const pol = nv.map((_, s) => (isTerminal(s) ? -1 : greedyArgmax(s, nv, gamma)));
      n++;
      if (prev && frozen === null && pol.every((a, s) => isTerminal(s) || a === prev![s])) frozen = n;
      prev = pol; v = nv;
      if (d < 1e-9) break;
    }
    setV(v); setSweeps(n); setPolicyFrozenAt(frozen); setPrevPolicy(prev);
    setDelta(Math.round(d * 10000) / 10000); setConverged(true);
  }, [V, sweeps, gamma, policyFrozenAt, prevPolicy]);

  const reset = useCallback(() => {
    setV(new Array(NS).fill(0)); setSweeps(0); setDelta(null);
    setPrevPolicy(null); setPolicyFrozenAt(null); setConverged(false);
  }, []);

  const lo = Math.min(...V), hi = Math.max(...V);
  const norm = (v: number) => (hi - lo < 1e-9 ? 0.5 : (v - lo) / (hi - lo));
  const S = 300, cell = S / 4;

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        <span style={head}>Value iteration — the optimality backup, sweep by sweep</span>
        <span style={{ fontSize: 11.5, color: converged ? "var(--good)" : "var(--faint)" }}>
          sweep {sweeps}{delta !== null && ` · Δ=${delta}`}{converged && " · ✓ converged"}
        </span>
      </div>

      <svg viewBox={`0 0 ${S} ${S}`} style={{ width: "min(100%, 320px)", height: "auto", display: "block", margin: "0 auto" }}>
        {Array.from({ length: NS }, (_, s) => {
          const r = Math.floor(s / NCOL), c = s % NCOL;
          const goal = s === GOAL, pit = s === PIT;
          const t = norm(V[s]);
          return (
            <g key={s}>
              <rect x={c * cell + 1} y={r * cell + 1} width={cell - 2} height={cell - 2} rx={4}
                fill={goal ? "color-mix(in srgb, var(--good) 30%, var(--canvas))"
                  : pit ? "color-mix(in srgb, var(--bad, #c0392b) 26%, var(--canvas))"
                  : `color-mix(in srgb, ${ACCENT} ${Math.round(6 + t * 60)}%, var(--canvas))`}
                stroke="var(--border-strong)" strokeWidth={1} />
              <text x={c * cell + cell / 2} y={r * cell + cell / 2 - 3} textAnchor="middle" fontSize={13}
                fill="var(--ink)" fontFamily="ui-monospace, monospace">
                {goal ? "+1" : pit ? "−1" : V[s].toFixed(2)}
              </text>
              {!goal && !pit && (
                <text x={c * cell + cell / 2} y={r * cell + cell / 2 + 16} textAnchor="middle" fontSize={15} fill={ACCENT}>
                  {ARROWS[policy[s]]}
                </text>
              )}
              {(goal || pit) && (
                <text x={c * cell + cell / 2} y={r * cell + cell / 2 + 15} textAnchor="middle" fontSize={9}
                  fill={goal ? "var(--good)" : "var(--bad, #c0392b)"}>{goal ? "goal" : "pit"}</text>
              )}
            </g>
          );
        })}
      </svg>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12, alignItems: "center", justifyContent: "center" }}>
        <button style={{ ...btn, borderColor: ACCENT, background: `color-mix(in srgb, ${ACCENT} 16%, transparent)` }} onClick={sweep}>Sweep ×1</button>
        <button style={btn} onClick={run}>Run to convergence</button>
        <button style={btn} onClick={reset}>Reset</button>
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "var(--muted)", marginTop: 10 }}>
        <span style={{ minWidth: 96 }}>γ: <b style={{ color: "var(--ink)", fontFamily: "ui-monospace, monospace" }}>{gamma.toFixed(2)}</b></span>
        <input type="range" min={0.5} max={0.99} step={0.01} value={gamma}
          onChange={(e) => { setGamma(Number(e.target.value)); reset(); }} style={{ flex: 1, accentColor: ACCENT }} aria-label="discount factor" />
      </label>

      <div style={caption}>
        Each sweep replaces every value with the best one-step lookahead — the Bellman <em>optimality</em> backup,
        a <M>max</M> over actions. Value floods out from the <span style={{ color: "var(--good)" }}>goal</span>, and
        Δ (the largest change) shrinks by a factor of about γ each sweep.{" "}
        {policyFrozenAt !== null
          ? <>Notice the arrows stopped changing at <strong>sweep {policyFrozenAt}</strong>
            {converged && sweeps > policyFrozenAt ? <> — but the values kept moving until sweep {sweeps}.</> : "."}{" "}
            The <strong>policy converges before the values do</strong>, which is why you rarely need to run value
            iteration all the way to numerical convergence.</>
          : <>Keep sweeping and watch when the arrows stop changing — it happens well before Δ reaches 0.</>}
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
