"use client";

import { useMemo, useState } from "react";

// Design-your-own-MDP sandbox. Paint walls, goals and pits onto a 5×5 grid, drag the
// step cost / slip / discount, and value iteration re-solves the optimal V* and π*
// live on every change. The point readers feel by playing: the optimal policy is a
// PROPERTY OF THE WORLD, not a fixed thing — move the goal and every arrow re-points;
// raise the slip and safe detours appear; cut the discount and the agent turns
// short-sighted. All solving is exact value iteration in the browser.

const ACCENT = "var(--c-rl)";
const N = 5, NS = 25, NA = 4;
const MOVES: [number, number][] = [[-1, 0], [0, 1], [1, 0], [0, -1]]; // up right down left
const ARROWS = ["↑", "→", "↓", "←"];
const PERP: number[][] = [[1, 3], [0, 2], [1, 3], [0, 2]];

// cell kinds
const EMPTY = 0, WALL = 1, GOAL = 2, PIT = 3, START = 4;
type Mode = typeof WALL | typeof GOAL | typeof PIT | typeof START | typeof EMPTY;

function defaultGrid(): number[] {
  const g = new Array(NS).fill(EMPTY);
  g[4] = GOAL;          // top-right
  g[9] = PIT;           // just below the goal
  g[6] = WALL; g[11] = WALL; g[16] = WALL; // a vertical wall
  g[20] = START;        // bottom-left
  return g;
}
const rc = (s: number) => [Math.floor(s / N), s % N] as const;
const move = (s: number, d: number, grid: number[]) => {
  const [r, c] = rc(s);
  const nr = r + MOVES[d][0], nc = c + MOVES[d][1];
  if (nr < 0 || nr >= N || nc < 0 || nc >= N) return s;
  const ns = nr * N + nc;
  return grid[ns] === WALL ? s : ns;
};
const isTerm = (g: number[], s: number) => g[s] === GOAL || g[s] === PIT;

function solve(grid: number[], slip: number, gamma: number, stepCost: number) {
  const V = new Array(NS).fill(0);
  const enterR = (ns: number) => grid[ns] === GOAL ? 1 : grid[ns] === PIT ? -1 : stepCost;
  const qval = (s: number, a: number) => {
    let q = 0;
    const outs: [number, number][] = [[1 - slip, a], [slip / 2, PERP[a][0]], [slip / 2, PERP[a][1]]];
    for (const [p, d] of outs) {
      if (p <= 0) continue;
      const ns = move(s, d, grid);
      q += p * (enterR(ns) + gamma * V[ns]);
    }
    return q;
  };
  for (let it = 0; it < 400; it++) {
    let delta = 0;
    for (let s = 0; s < NS; s++) {
      if (grid[s] === WALL || isTerm(grid, s)) continue;
      let best = -Infinity;
      for (let a = 0; a < NA; a++) best = Math.max(best, qval(s, a));
      delta = Math.max(delta, Math.abs(best - V[s]));
      V[s] = best;
    }
    if (delta < 1e-9) break;
  }
  const pol = new Array(NS).fill(0);
  for (let s = 0; s < NS; s++) {
    if (grid[s] === WALL || isTerm(grid, s)) continue;
    let best = 0, bq = -Infinity;
    for (let a = 0; a < NA; a++) { const q = qval(s, a); if (q > bq + 1e-12) { bq = q; best = a; } }
    pol[s] = best;
  }
  return { V, pol };
}

export function MdpSandboxLab() {
  const [grid, setGrid] = useState<number[]>(defaultGrid);
  const [mode, setMode] = useState<Mode>(WALL);
  const [slip, setSlip] = useState(0);
  const [gamma, setGamma] = useState(0.9);
  const [stepCost, setStepCost] = useState(-0.04);

  const { V, pol } = useMemo(() => solve(grid, slip, gamma, stepCost), [grid, slip, gamma, stepCost]);

  const paint = (s: number) => setGrid((g) => {
    const ng = [...g];
    if (mode === EMPTY) { ng[s] = EMPTY; return ng; }
    if (ng[s] === mode) { ng[s] = EMPTY; return ng; } // click same → erase
    if (mode === START) for (let i = 0; i < NS; i++) if (ng[i] === START) ng[i] = EMPTY; // single start
    ng[s] = mode;
    return ng;
  });

  const cw = 58, WPX = N * cw;
  const cx = (s: number) => (s % N) * cw + cw / 2;
  const cy = (s: number) => Math.floor(s / N) * cw + cw / 2;
  const vmax = Math.max(0.01, ...V.map((v) => Math.abs(v)));
  const fill = (s: number) => {
    if (grid[s] === WALL) return "var(--ink)";
    if (grid[s] === GOAL) return "color-mix(in srgb, var(--good) 55%, var(--canvas))";
    if (grid[s] === PIT) return "color-mix(in srgb, var(--bad) 55%, var(--canvas))";
    const v = V[s], mag = Math.min(1, Math.abs(v) / vmax);
    const base = v >= 0 ? ACCENT : "var(--bad)";
    return `color-mix(in srgb, ${base} ${(mag * 55).toFixed(0)}%, var(--surface))`;
  };

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        <span style={head}>Design an MDP — watch π* re-solve</span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>exact value iteration, live</span>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        <span style={{ fontSize: 11.5, color: "var(--faint)", alignSelf: "center", marginRight: 2 }}>paint:</span>
        <Seg on={mode === WALL} onClick={() => setMode(WALL)}>Wall</Seg>
        <Seg on={mode === GOAL} onClick={() => setMode(GOAL)}>Goal +1</Seg>
        <Seg on={mode === PIT} onClick={() => setMode(PIT)}>Pit −1</Seg>
        <Seg on={mode === START} onClick={() => setMode(START)}>Start</Seg>
        <Seg on={mode === EMPTY} onClick={() => setMode(EMPTY)}>Erase</Seg>
        <button style={btn} onClick={() => setGrid(defaultGrid())}>Reset world</button>
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <svg viewBox={`0 0 ${WPX} ${WPX}`} style={{ width: "min(100%, 320px)", height: "auto", touchAction: "manipulation" }}>
          {Array.from({ length: NS }, (_, s) => {
            const wall = grid[s] === WALL, term = isTerm(grid, s);
            return (
              <g key={s} onClick={() => paint(s)} style={{ cursor: "pointer" }}>
                <rect x={(s % N) * cw + 1} y={Math.floor(s / N) * cw + 1} width={cw - 2} height={cw - 2} rx={5}
                  fill={fill(s)} stroke="var(--border)" strokeWidth={1} />
                {grid[s] === GOAL && <text x={cx(s)} y={cy(s) + 5} textAnchor="middle" fontSize={15} fontWeight={700} fill="var(--ink)">G</text>}
                {grid[s] === PIT && <text x={cx(s)} y={cy(s) + 5} textAnchor="middle" fontSize={15} fontWeight={700} fill="var(--ink)">P</text>}
                {grid[s] === START && <text x={cx(s)} y={cy(s) + 5} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--ink)">S</text>}
                {!wall && !term && (
                  <>
                    <text x={cx(s)} y={cy(s) - 3} textAnchor="middle" fontSize={17}
                      fill="color-mix(in srgb, var(--ink) 62%, transparent)">{ARROWS[pol[s]]}</text>
                    <text x={cx(s)} y={cy(s) + 16} textAnchor="middle" fontSize={9}
                      fill="var(--faint)" fontFamily="ui-monospace, monospace">{V[s].toFixed(2)}</text>
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <label style={sl}>
        <span style={{ minWidth: 108 }}>step cost: <b style={mono}>{stepCost.toFixed(2)}</b></span>
        <input type="range" min={-0.25} max={0} step={0.01} value={stepCost}
          onChange={(e) => setStepCost(Number(e.target.value))} style={rng} aria-label="step cost" />
      </label>
      <label style={sl}>
        <span style={{ minWidth: 108 }}>slip prob: <b style={mono}>{slip.toFixed(2)}</b></span>
        <input type="range" min={0} max={0.4} step={0.02} value={slip}
          onChange={(e) => setSlip(Number(e.target.value))} style={rng} aria-label="slip probability" />
      </label>
      <label style={sl}>
        <span style={{ minWidth: 108 }}>discount γ: <b style={mono}>{gamma.toFixed(2)}</b></span>
        <input type="range" min={0.5} max={0.99} step={0.01} value={gamma}
          onChange={(e) => setGamma(Number(e.target.value))} style={rng} aria-label="discount gamma" />
      </label>

      <div style={caption}>
        Click cells to paint the world; the arrows are the <b>optimal policy π*</b> and the number in each cell its{" "}
        <b>optimal value V*</b>, both recomputed the instant anything changes. Try it: <b>move the goal</b> and watch
        every arrow swing to point at its new location. Raise the <b>slip probability</b> (the world sometimes shoves you
        sideways) and see the policy start routing <em>away</em> from the pit, trading a longer path for safety. Drop the{" "}
        <b>discount γ</b> toward 0.5 and distant cells go dim — a short-sighted agent barely values a goal it can&rsquo;t
        reach soon. The optimal policy was never one fixed thing; it is whatever this particular world rewards.
      </div>
    </div>
  );
}

function Seg({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      border: `1px solid ${on ? ACCENT : "var(--border)"}`, borderRadius: 7, cursor: "pointer",
      padding: "4px 10px", fontSize: 12, fontFamily: "var(--font-sans, sans-serif)",
      color: on ? ACCENT : "var(--muted)", fontWeight: on ? 600 : 400,
      background: on ? `color-mix(in srgb, ${ACCENT} 12%, transparent)` : "transparent",
    }}>{children}</button>
  );
}

const wrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const caption: React.CSSProperties = { fontSize: 12.5, color: "var(--muted)", marginTop: 12, lineHeight: 1.55 };
const btn: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 7, cursor: "pointer", padding: "4px 10px", fontSize: 12, color: "var(--ink)", fontFamily: "var(--font-sans, sans-serif)", background: "transparent" };
const sl: React.CSSProperties = { display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "var(--muted)", marginTop: 9 };
const rng: React.CSSProperties = { flex: 1, accentColor: ACCENT };
const mono: React.CSSProperties = { color: "var(--ink)", fontFamily: "ui-monospace, monospace" };
