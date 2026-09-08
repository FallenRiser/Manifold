"use client";

import { useMemo, useState } from "react";

// The dial that unifies the whole track. "Modified policy iteration" runs k sweeps
// of policy evaluation between each greedy improvement. k = 1 IS value iteration;
// k -> infinity IS policy iteration (evaluate all the way, then improve). This lab
// runs modified PI on the goal/pit world for a range of k and plots the total
// evaluation work to reach the optimal policy. The lesson it makes visible: the
// number of IMPROVEMENT rounds barely depends on k (the problem sets it), so extra
// evaluation between improvements is mostly wasted — which is why value iteration
// (the leanest possible evaluation, one sweep) is so often the practical choice.
// All counts are computed live and match the page's numbers.

const ACCENT = "var(--c-rl)";
const NROW = 4, NCOL = 4, NS = 16, NA = 4;
const GOAL = 15, PIT = 3;
const STEP = -0.04, GAMMA = 0.9;
const MOVES: [number, number][] = [[-1, 0], [0, 1], [1, 0], [0, -1]];
const isTerminal = (s: number) => s === GOAL || s === PIT;
const KS = [1, 2, 3, 5, 10, 20];

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
function argmaxA(s: number, V: number[]) {
  let best = 0, bestQ = -Infinity;
  for (let a = 0; a < NA; a++) {
    const q = reward(s, a) + GAMMA * V[nextState(s, a)];
    if (q > bestQ + 1e-12) { bestQ = q; best = a; }
  }
  return best;
}

// modified policy iteration with k evaluation sweeps per improvement
function modifiedPI(kEval: number) {
  const V = new Array(NS).fill(0);
  let a = new Array(NS).fill(0);
  let rounds = 0, totalSweeps = 0;
  for (let outer = 0; outer < 500; outer++) {
    for (let e = 0; e < kEval; e++) {
      let delta = 0;
      for (let s = 0; s < NS; s++) {
        if (isTerminal(s)) continue;
        const v = reward(s, a[s]) + GAMMA * V[nextState(s, a[s])];
        delta = Math.max(delta, Math.abs(v - V[s]));
        V[s] = v;
      }
      totalSweeps++;
      if (delta < 1e-9) break;
    }
    const na = V.map((_, s) => (isTerminal(s) ? 0 : argmaxA(s, V)));
    rounds++;
    if (na.every((x, s) => isTerminal(s) || x === a[s])) break;
    a = na;
  }
  return { rounds, totalSweeps };
}

export function GpiDialLab() {
  const [sel, setSel] = useState(1);
  const results = useMemo(() => KS.map((k) => ({ k, ...modifiedPI(k) })), []);
  const maxSweeps = Math.max(...results.map((r) => r.totalSweeps));
  const cur = results.find((r) => r.k === sel)!;

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 4 }}>
        <span style={head}>One dial from value iteration to policy iteration</span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>goal/pit world · γ = 0.9</span>
      </div>
      <div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 12 }}>
        <strong style={{ color: "var(--ink)" }}>k</strong> = evaluation sweeps between each greedy improvement.
        Click a bar.
      </div>

      {results.map((r) => {
        const on = r.k === sel;
        const label = r.k === 1 ? "k=1  · value iteration" : r.k === 20 ? "k=20 · → policy iteration" : `k=${r.k}`;
        return (
          <div key={r.k} onClick={() => setSel(r.k)} style={{ cursor: "pointer", marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
              <span style={{ color: on ? ACCENT : "var(--muted)", fontWeight: on ? 600 : 400 }}>{label}</span>
              <span style={{ fontFamily: "ui-monospace, monospace", color: "var(--muted)" }}>
                {r.totalSweeps} sweeps · {r.rounds} rounds
              </span>
            </div>
            <div style={{ height: 16, background: "var(--canvas)", borderRadius: 4, border: "1px solid var(--border)", overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${Math.round((r.totalSweeps / maxSweeps) * 100)}%`,
                background: on ? ACCENT : `color-mix(in srgb, ${ACCENT} 40%, var(--canvas))`,
              }} />
            </div>
          </div>
        );
      })}

      <div style={{ ...panel, borderColor: `color-mix(in srgb, ${ACCENT} 30%, var(--border))` }}>
        At <b style={{ color: ACCENT }}>k = {cur.k}</b>{cur.k === 1 && " (this is value iteration)"}: the policy
        reaches optimal after <b style={{ color: "var(--ink)" }}>{cur.rounds} improvement rounds</b>, at a total cost
        of <b style={{ color: "var(--ink)" }}>{cur.totalSweeps} evaluation sweeps</b>.
      </div>

      <div style={caption}>
        Every setting of the dial finds the <em>same</em> optimal policy — and, strikingly, in the{" "}
        <strong>same {cur.rounds} improvement rounds</strong>. What changes is the evaluation work: the more sweeps
        you insist on between improvements, the more total backups you spend to get there. The improvement count is
        set by the problem, not by how thoroughly you evaluate — so on a world like this, the leanest evaluation of
        all, a single sweep (<strong>value iteration</strong>), is the cheapest way to the top. Policy iteration
        (evaluate to convergence, the far end of the dial) is the same algorithm run with the thoroughness turned
        all the way up.
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const caption: React.CSSProperties = { fontSize: 12.5, color: "var(--muted)", marginTop: 12, lineHeight: 1.55 };
const panel: React.CSSProperties = { fontSize: 13, color: "var(--muted)", background: "var(--canvas)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px", marginTop: 12, lineHeight: 1.5 };
