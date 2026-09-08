"use client";

import { useCallback, useMemo, useState } from "react";

// Policy iteration, made watchable. The reader drives the two levers by hand on a
// goal-and-pit gridworld: "Evaluate" runs one sweep of policy evaluation (value
// seeps through the current policy), "Improve" makes the policy greedy w.r.t. the
// current values (arrows swing). Alternating the two is policy iteration; watching
// the arrows lock onto the goal — and refuse to walk into the pit — is the whole
// idea. "Run to optimal" alternates automatically until the policy stops changing.
// All values are solved live; the optimal policy and values match the page's code.

const ACCENT = "var(--c-rl)";
const NROW = 4, NCOL = 4, NS = 16, NA = 4;
const GOAL = 15, PIT = 3;
const STEP = -0.04, GAMMA = 0.9;
const ARROWS = ["↑", "→", "↓", "←"];
const MOVES: [number, number][] = [[-1, 0], [0, 1], [1, 0], [0, -1]];
const isTerminal = (s: number) => s === GOAL || s === PIT;

function nextState(s: number, a: number) {
  const r = Math.floor(s / NCOL), c = s % NCOL;
  const nr = r + MOVES[a][0], nc = c + MOVES[a][1];
  if (nr < 0 || nr >= NROW || nc < 0 || nc >= NCOL) return s;
  return nr * NCOL + nc;
}
// reward for taking action a in s: paid on ENTERING the special cells
function reward(s: number, a: number) {
  if (isTerminal(s)) return 0;
  const ns = nextState(s, a);
  if (ns === GOAL) return 1.0;
  if (ns === PIT) return -1.0;
  return STEP;
}
const qval = (s: number, a: number, V: number[]) => reward(s, a) + GAMMA * V[nextState(s, a)];

const initPolicy = () => new Array(NS).fill(0); // everyone points "up" to start

export function PolicyIterationLab() {
  const [V, setV] = useState<number[]>(() => new Array(NS).fill(0));
  const [pol, setPol] = useState<number[]>(initPolicy);
  const [evals, setEvals] = useState(0);
  const [improves, setImproves] = useState(0);
  const [stable, setStable] = useState(false);
  const [lastDelta, setLastDelta] = useState<number | null>(null);

  const evaluateOnce = useCallback(() => {
    setV((prev) => {
      const nV = prev.slice();
      let delta = 0;
      for (let s = 0; s < NS; s++) {
        if (isTerminal(s)) continue;
        const v = qval(s, pol[s], prev);
        delta = Math.max(delta, Math.abs(v - prev[s]));
        nV[s] = v;
      }
      setLastDelta(Math.round(delta * 1000) / 1000);
      return nV;
    });
    setEvals((n) => n + 1);
  }, [pol]);

  const improve = useCallback(() => {
    setPol((prev) => {
      const nP = prev.slice();
      let changed = false;
      for (let s = 0; s < NS; s++) {
        if (isTerminal(s)) continue;
        let best = 0, bestQ = -Infinity;
        for (let a = 0; a < NA; a++) {
          const q = qval(s, a, V);
          if (q > bestQ + 1e-12) { bestQ = q; best = a; }
        }
        if (best !== prev[s]) changed = true;
        nP[s] = best;
      }
      setStable(!changed);
      return nP;
    });
    setImproves((n) => n + 1);
  }, [V]);

  const runToOptimal = useCallback(() => {
    let v = V.slice(), p = pol.slice(), ev = evals, im = improves;
    for (let round = 0; round < 60; round++) {
      // evaluate to (near) convergence
      for (let sweep = 0; sweep < 400; sweep++) {
        let delta = 0;
        for (let s = 0; s < NS; s++) {
          if (isTerminal(s)) continue;
          const nv = qval(s, p[s], v);
          delta = Math.max(delta, Math.abs(nv - v[s]));
          v[s] = nv;
        }
        ev++;
        if (delta < 1e-9) break;
      }
      // improve
      let changed = false;
      const np = p.slice();
      for (let s = 0; s < NS; s++) {
        if (isTerminal(s)) continue;
        let best = 0, bestQ = -Infinity;
        for (let a = 0; a < NA; a++) {
          const q = qval(s, a, v);
          if (q > bestQ + 1e-12) { bestQ = q; best = a; }
        }
        if (best !== p[s]) changed = true;
        np[s] = best;
      }
      p = np; im++;
      if (!changed) { setStable(true); break; }
    }
    setV(v); setPol(p); setEvals(ev); setImproves(im); setLastDelta(0);
  }, [V, pol, evals, improves]);

  const reset = useCallback(() => {
    setV(new Array(NS).fill(0)); setPol(initPolicy());
    setEvals(0); setImproves(0); setStable(false); setLastDelta(null);
  }, []);

  const lo = Math.min(...V), hi = Math.max(...V);
  const norm = (v: number) => (hi - lo < 1e-9 ? 0.5 : (v - lo) / (hi - lo));
  const S = 300, cell = S / 4;

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        <span style={head}>Policy iteration — you drive the two levers</span>
        <span style={{ fontSize: 11.5, color: stable ? "var(--good)" : "var(--faint)" }}>
          {stable ? "✓ policy stable — optimal" : `${evals} eval · ${improves} improve`}
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
                  {ARROWS[pol[s]]}
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
        <button style={btn} onClick={evaluateOnce}>Evaluate ×1{lastDelta !== null && <span style={{ color: "var(--faint)" }}>  Δ={lastDelta}</span>}</button>
        <button style={btn} onClick={improve}>Improve (greedy)</button>
        <button style={{ ...btn, borderColor: ACCENT, background: `color-mix(in srgb, ${ACCENT} 16%, transparent)` }} onClick={runToOptimal}>Run to optimal</button>
        <button style={btn} onClick={reset}>Reset</button>
      </div>

      <div style={caption}>
        Two levers, alternated. <strong>Evaluate</strong> runs one sweep of the Bellman expectation backup for the
        current policy — value seeps through the arrows you have now (watch Δ, the largest change, shrink toward 0).
        <strong> Improve</strong> makes every arrow greedy with respect to the current values. Alternate them and
        the policy climbs to optimal; the arrows lock onto the shortest safe path to the <span style={{ color: "var(--good)" }}>goal</span>{" "}
        and never point into the <span style={{ color: "var(--bad, #c0392b)" }}>pit</span>. Try a few
        Evaluate/Improve rounds by hand, then hit <strong>Run to optimal</strong> to finish — it takes remarkably
        few improvement steps.
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const caption: React.CSSProperties = { fontSize: 12.5, color: "var(--muted)", marginTop: 12, lineHeight: 1.55 };
const btn: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 7, cursor: "pointer", padding: "5px 12px", fontSize: 12.5, color: "var(--ink)", fontFamily: "var(--font-sans, sans-serif)", background: "transparent" };
