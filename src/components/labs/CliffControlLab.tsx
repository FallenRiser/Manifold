"use client";

import { useCallback, useState } from "react";

// SARSA vs Q-learning on Cliff Walking (Sutton & Barto Example 6.6) — the flagship
// on-policy/off-policy demonstration. Both learn from the SAME episode stream. After
// training, the reader sees the two GREEDY paths drawn on the grid: Q-learning hugs
// the cliff edge (the optimal path, return -13) while SARSA detours to the safe top
// (return ~-17). The online-return curves tell the twist: Q-learning behaves WORSE
// while learning (ε-exploration keeps knocking it off the edge). Reproduces the page:
// greedy returns -13 vs -17; online (last 100) roughly Q -47, SARSA -28.

const ACCENT = "var(--c-rl)";
const QCOL = "#2d6a9f";        // Q-learning
const CLIFF = "#c0392b";
const NROW = 4, NCOL = 12, NS = 48, NA = 4;
const START = 36, GOAL = 47;
const CLIFF_CELLS = new Set([37, 38, 39, 40, 41, 42, 43, 44, 45, 46]);
const MOVES: [number, number][] = [[-1, 0], [0, 1], [1, 0], [0, -1]];
const ARROWS = ["↑", "→", "↓", "←"];

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// one environment step: returns [nextState, reward, done]
function step(s: number, a: number): [number, number, boolean] {
  const r = Math.floor(s / NCOL), c = s % NCOL;
  let nr = r + MOVES[a][0], nc = c + MOVES[a][1];
  if (nr < 0 || nr >= NROW || nc < 0 || nc >= NCOL) { nr = r; nc = c; }
  const ns = nr * NCOL + nc;
  if (CLIFF_CELLS.has(ns)) return [START, -100, false];   // fall: back to start
  return [ns, -1, ns === GOAL];
}

const zeros = () => Array.from({ length: NS }, () => [0, 0, 0, 0]);

function epsGreedy(Q: number[][], s: number, eps: number, rng: () => number) {
  if (rng() < eps) return Math.floor(rng() * NA);
  const row = Q[s];
  let best = 0;
  for (let a = 1; a < NA; a++) if (row[a] > row[best]) best = a;
  return best;
}
const argmax = (row: number[]) => {
  let best = 0;
  for (let a = 1; a < NA; a++) if (row[a] > row[best]) best = a;
  return best;
};

// deterministic greedy rollout from START; returns [visited set, arrows map, return]
function greedyPath(Q: number[][]) {
  const visited = new Set<number>();
  const arrows: Record<number, number> = {};
  let s = START, ret = 0, k = 0;
  visited.add(s);
  while (s !== GOAL && k < 60) {
    const a = argmax(Q[s]);
    arrows[s] = a;
    const [ns, r] = step(s, a);
    ret += r; s = ns; visited.add(s); k++;
  }
  return { visited, arrows, ret, reached: s === GOAL };
}

function train(method: "sarsa" | "q", episodes: number, eps: number, alpha: number, seed: number) {
  const rng = mulberry32(seed);
  const Q = zeros();
  const online: number[] = [];
  for (let e = 0; e < episodes; e++) {
    let s = START, G = 0, k = 0;
    let a = epsGreedy(Q, s, eps, rng);
    while (s !== GOAL && k < 500) {
      const [ns, r, done] = step(s, a);
      G += r;
      if (method === "sarsa") {
        const a2 = epsGreedy(Q, ns, eps, rng);
        const target = r + (done ? 0 : Q[ns][a2]);
        Q[s][a] += alpha * (target - Q[s][a]);
        s = ns; a = a2;
      } else {
        const target = r + (done ? 0 : Math.max(...Q[ns]));
        Q[s][a] += alpha * (target - Q[s][a]);
        s = ns; a = epsGreedy(Q, s, eps, rng);
      }
      if (done) break;
      k++;
    }
    online.push(G);
  }
  return { Q, online };
}

function Grid({ label, color, Q }: { label: string; color: string; Q: number[][] }) {
  const { visited, arrows, ret, reached } = greedyPath(Q);
  const cw = 22, gap = 0, W = NCOL * cw, H = NROW * cw;
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 12, color, fontFamily: "var(--font-display)", marginBottom: 4 }}>
        {label} — greedy path return {reached ? ret : "—"}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "min(100%, 300px)", height: "auto" }}>
        {Array.from({ length: NS }, (_, s) => {
          const r = Math.floor(s / NCOL), c = s % NCOL;
          const isCliff = CLIFF_CELLS.has(s);
          const onPath = visited.has(s);
          const fill = isCliff ? `color-mix(in srgb, ${CLIFF} 60%, var(--canvas))`
            : s === GOAL ? "color-mix(in srgb, var(--good) 40%, var(--canvas))"
            : s === START ? "color-mix(in srgb, var(--ink) 12%, var(--canvas))"
            : onPath ? `color-mix(in srgb, ${color} 34%, var(--canvas))`
            : "var(--surface)";
          return (
            <g key={s}>
              <rect x={c * cw + gap} y={r * cw + gap} width={cw - gap} height={cw - gap} fill={fill} stroke="var(--border)" strokeWidth={0.5} />
              {s === START && <text x={c * cw + cw / 2} y={r * cw + cw / 2 + 3} textAnchor="middle" fontSize={9} fill="var(--ink)">S</text>}
              {s === GOAL && <text x={c * cw + cw / 2} y={r * cw + cw / 2 + 3} textAnchor="middle" fontSize={9} fill="var(--ink)">G</text>}
              {onPath && s !== START && s !== GOAL && arrows[s] !== undefined && (
                <text x={c * cw + cw / 2} y={r * cw + cw / 2 + 4} textAnchor="middle" fontSize={11} fill={color}>{ARROWS[arrows[s]]}</text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function CliffControlLab() {
  const [eps, setEps] = useState(0.1);
  const [res, setRes] = useState<null | {
    sarsa: { Q: number[][]; online: number[] };
    q: { Q: number[][]; online: number[] };
    episodes: number;
  }>(null);

  const run = useCallback((episodes: number) => {
    const sarsa = train("sarsa", episodes, eps, 0.5, 7);
    const q = train("q", episodes, eps, 0.5, 7);
    setRes({ sarsa, q, episodes });
  }, [eps]);

  const reset = useCallback(() => setRes(null), []);

  // online-return chart (smoothed)
  const smooth = (a: number[], w = 10) =>
    a.map((_, i) => {
      const lo = Math.max(0, i - w + 1);
      let sum = 0; for (let j = lo; j <= i; j++) sum += a[j];
      return sum / (i - lo + 1);
    });

  const LW = 320, LH = 120, pl = 34, pb = 20, pt = 8;
  const plotW = LW - pl - 8, plotH = LH - pb - pt;
  const yLo = -100, yHi = 0;
  const ly = (v: number) => pt + plotH * (1 - (Math.max(yLo, Math.min(yHi, v)) - yLo) / (yHi - yLo));
  const lastMean = (a: number[]) => a.slice(-100).reduce((s, v) => s + v, 0) / Math.min(100, a.length);

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        <span style={head}>SARSA vs Q-learning — Cliff Walking</span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>{res ? `${res.episodes} episodes` : "not trained"}</span>
      </div>

      {res ? (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
            <Grid label="SARSA (on-policy)" color={ACCENT} Q={res.sarsa.Q} />
            <Grid label="Q-learning (off-policy)" color={QCOL} Q={res.q.Q} />
          </div>

          <div style={{ marginTop: 10, textAlign: "center" }}>
            <div style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 2 }}>online return per episode (10-ep moving average)</div>
            <svg viewBox={`0 0 ${LW} ${LH}`} style={{ width: "min(100%, 340px)", height: "auto" }}>
              <line x1={pl} y1={ly(0)} x2={LW - 8} y2={ly(0)} stroke="var(--border)" />
              <line x1={pl} y1={ly(-100)} x2={LW - 8} y2={ly(-100)} stroke="var(--border)" strokeDasharray="2 3" />
              {(["q", "sarsa"] as const).map((m) => {
                const col = m === "q" ? QCOL : ACCENT;
                const data = smooth(res[m].online);
                const d = data.map((v, i) => `${i === 0 ? "M" : "L"}${(pl + plotW * (i / Math.max(1, data.length - 1))).toFixed(1)},${ly(v).toFixed(1)}`).join(" ");
                return <path key={m} d={d} fill="none" stroke={col} strokeWidth={1.5} opacity={0.9} />;
              })}
              <text x={pl - 4} y={ly(0) + 3} textAnchor="end" fontSize={9} fill="var(--faint)">0</text>
              <text x={pl - 4} y={ly(-100) + 3} textAnchor="end" fontSize={9} fill="var(--faint)">-100</text>
            </svg>
            <div style={{ display: "flex", gap: 16, justifyContent: "center", fontSize: 12, marginTop: 2 }}>
              <span style={{ color: ACCENT }}>■ SARSA online {lastMean(res.sarsa.online).toFixed(0)}</span>
              <span style={{ color: QCOL }}>■ Q-learning online {lastMean(res.q.online).toFixed(0)}</span>
            </div>
          </div>
        </>
      ) : (
        <div style={{ fontSize: 13, color: "var(--muted)", textAlign: "center", padding: "24px 8px" }}>
          Press <strong>Train</strong> to run both algorithms on the same episodes and compare their greedy paths.
        </div>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12, alignItems: "center", justifyContent: "center" }}>
        <button style={{ ...btn, borderColor: ACCENT, background: `color-mix(in srgb, ${ACCENT} 16%, transparent)` }} onClick={() => run(500)}>Train (500 episodes)</button>
        <button style={btn} onClick={() => run(2000)}>Train (2000)</button>
        <button style={btn} onClick={reset}>Reset</button>
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "var(--muted)", marginTop: 10 }}>
        <span style={{ minWidth: 96 }}>ε: <b style={{ color: "var(--ink)", fontFamily: "ui-monospace, monospace" }}>{eps.toFixed(2)}</b></span>
        <input type="range" min={0} max={0.3} step={0.01} value={eps}
          onChange={(e) => { setEps(Number(e.target.value)); setRes(null); }} style={{ flex: 1, accentColor: ACCENT }} aria-label="exploration epsilon" />
      </label>

      <div style={caption}>
        <span style={{ color: CLIFF }}>Red</span> is the cliff: step in and you get <b>−100</b> and snap back to{" "}
        <b>S</b>. Every other step costs −1, so the shortest route (13 steps) hugs the edge. Train and compare:{" "}
        <b style={{ color: QCOL }}>Q-learning</b> learns that optimal edge path (return −13) because it bootstraps off
        the <em>greedy</em> next value; <b style={{ color: ACCENT }}>SARSA</b> detours to the safe top row (≈−17)
        because it bootstraps off its own <em>ε-greedy</em> action and so counts the risk of exploring off the edge.
        Yet the online curves flip it: SARSA collects <em>more</em> reward <em>while learning</em>, because
        Q-learning keeps falling. Drag ε to 0 and the two policies converge — the difference is entirely about
        exploration.
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const caption: React.CSSProperties = { fontSize: 12.5, color: "var(--muted)", marginTop: 12, lineHeight: 1.55 };
const btn: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 7, cursor: "pointer", padding: "5px 12px", fontSize: 12.5, color: "var(--ink)", fontFamily: "var(--font-sans, sans-serif)", background: "transparent" };
