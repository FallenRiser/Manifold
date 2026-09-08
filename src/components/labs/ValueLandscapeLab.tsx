"use client";

import { useMemo, useState } from "react";

// The value function as a landscape. It solves the 4x4 gridworld live (iterative
// policy evaluation for the random policy; value iteration for the optimal one),
// paints each cell by its value, and overlays the greedy action(s) implied by that
// value function as arrows. Toggle between the random and optimal policy and drag
// gamma to watch the landscape tilt toward the goal. All computation is real — the
// random-policy landscape at gamma = 1 reproduces the textbook gridworld values.

const ACCENT = "var(--c-rl)";
const NROW = 4, NCOL = 4, NS = 16, NA = 4;
const TERMINALS = [0, 15];
const ARROWS = ["↑", "→", "↓", "←"];
const MOVES: [number, number][] = [[-1, 0], [0, 1], [1, 0], [0, -1]];

function nextState(s: number, a: number) {
  const r = Math.floor(s / NCOL), c = s % NCOL;
  const nr = r + MOVES[a][0], nc = c + MOVES[a][1];
  if (nr < 0 || nr >= NROW || nc < 0 || nc >= NCOL) return s;
  return nr * NCOL + nc;
}
const reward = (s: number) => (TERMINALS.includes(s) ? 0 : -1);

function evalRandom(gamma: number) {
  const V = new Array(NS).fill(0);
  for (let it = 0; it < 5000; it++) {
    let delta = 0;
    for (let s = 0; s < NS; s++) {
      if (TERMINALS.includes(s)) continue;
      let v = 0;
      for (let a = 0; a < NA; a++) v += 0.25 * (reward(s) + gamma * V[nextState(s, a)]);
      delta = Math.max(delta, Math.abs(v - V[s]));
      V[s] = v;
    }
    if (delta < 1e-6) break;
  }
  return V;
}

function valueIteration(gamma: number) {
  const V = new Array(NS).fill(0);
  for (let it = 0; it < 5000; it++) {
    let delta = 0;
    for (let s = 0; s < NS; s++) {
      if (TERMINALS.includes(s)) continue;
      let best = -Infinity;
      for (let a = 0; a < NA; a++) best = Math.max(best, reward(s) + gamma * V[nextState(s, a)]);
      delta = Math.max(delta, Math.abs(best - V[s]));
      V[s] = best;
    }
    if (delta < 1e-6) break;
  }
  return V;
}

function greedy(V: number[], gamma: number, s: number) {
  let best = -Infinity;
  const q = MOVES.map((_, a) => reward(s) + gamma * V[nextState(s, a)]);
  for (const v of q) best = Math.max(best, v);
  return q.map((v) => Math.abs(v - best) < 1e-6);
}

export function ValueLandscapeLab() {
  const [optimal, setOptimal] = useState(false);
  const [gamma, setGamma] = useState(1);

  const V = useMemo(() => (optimal ? valueIteration(gamma) : evalRandom(gamma)), [optimal, gamma]);
  const lo = Math.min(...V), hi = Math.max(...V);
  const norm = (v: number) => (hi - lo < 1e-9 ? 0 : (v - lo) / (hi - lo));

  const S = 300, cell = S / 4;

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        <span style={head}>{optimal ? "Optimal value V*  (+ greedy policy)" : "Value of the random policy Vπ"}</span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>value + implied greedy move</span>
      </div>

      <svg viewBox={`0 0 ${S} ${S}`} style={{ width: "min(100%, 320px)", height: "auto", display: "block", margin: "0 auto" }}>
        {Array.from({ length: NS }, (_, s) => {
          const r = Math.floor(s / NCOL), c = s % NCOL;
          const term = TERMINALS.includes(s);
          const t = norm(V[s]);
          const arrows = term ? [] : greedy(V, gamma, s);
          return (
            <g key={s}>
              <rect x={c * cell + 1} y={r * cell + 1} width={cell - 2} height={cell - 2} rx={4}
                fill={term ? "color-mix(in srgb, var(--good) 22%, var(--canvas))" : `color-mix(in srgb, ${ACCENT} ${Math.round(8 + t * 62)}%, var(--canvas))`}
                stroke="var(--border-strong)" strokeWidth={1} />
              <text x={c * cell + cell / 2} y={r * cell + cell / 2 - 4} textAnchor="middle" fontSize={13}
                fill="var(--ink)" fontFamily="ui-monospace, monospace">{term ? "0" : V[s].toFixed(1)}</text>
              {!term && (
                <text x={c * cell + cell / 2} y={r * cell + cell / 2 + 16} textAnchor="middle" fontSize={13} fill={ACCENT}>
                  {arrows.map((on, a) => (on ? ARROWS[a] : "")).join("")}
                </text>
              )}
              {term && <text x={c * cell + cell / 2} y={r * cell + cell / 2 + 15} textAnchor="middle" fontSize={9} fill="var(--good)">goal</text>}
            </g>
          );
        })}
      </svg>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12, alignItems: "center" }}>
        <button style={{ ...btn, background: !optimal ? `color-mix(in srgb, ${ACCENT} 18%, transparent)` : "transparent", borderColor: !optimal ? ACCENT : "var(--border)" }} onClick={() => setOptimal(false)}>Random policy</button>
        <button style={{ ...btn, background: optimal ? `color-mix(in srgb, ${ACCENT} 18%, transparent)` : "transparent", borderColor: optimal ? ACCENT : "var(--border)" }} onClick={() => setOptimal(true)}>Optimal policy</button>
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "var(--muted)", marginTop: 10 }}>
        <span style={{ minWidth: 96 }}>γ: <b style={{ color: "var(--ink)", fontFamily: "ui-monospace, monospace" }}>{gamma.toFixed(2)}</b></span>
        <input type="range" min={0.5} max={1} step={0.01} value={gamma} onChange={(e) => setGamma(Number(e.target.value))} style={{ flex: 1, accentColor: ACCENT }} aria-label="discount factor" />
      </label>

      <div style={caption}>
        Every cell shows its value — how much total reward you expect starting there — and the arrow(s) point to
        the move that value recommends (ties shown together). Under the <strong>random policy</strong> the
        landscape is a gentle bowl: cells far from a corner are deeply negative because a coin-flip walk takes
        ages to escape. Switch to the <strong>optimal policy</strong> and the same states become far less costly,
        and every arrow points decisively toward the nearest goal. The values <em>are</em> the map; the policy is
        just &ldquo;walk uphill.&rdquo;
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const caption: React.CSSProperties = { fontSize: 12.5, color: "var(--muted)", marginTop: 12, lineHeight: 1.55 };
const btn: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 7, cursor: "pointer", padding: "5px 12px", fontSize: 12.5, color: "var(--ink)", fontFamily: "var(--font-sans, sans-serif)" };
