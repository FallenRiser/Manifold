"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Watch a Q-learning agent actually LEARN, step by step. The single most "RL-native"
// interaction on the site: an ε-greedy agent moves one cell per tick on the goal/pit
// world, its Q-update fires live, and the value heatmap + greedy arrows fill in as
// experience accumulates. Exploring starts (each episode begins somewhere random) so
// the whole grid gets learned, not just one corridor. Deterministic world, so α can
// be 0.5 without instability; the point here is temporal — you see values propagate
// BACKWARD from the goal, one visit at a time. Reproduces the page's Q* policy.

const ACCENT = "var(--c-rl)";
const NROW = 4, NCOL = 4, NS = 16, NA = 4;
const GOAL = 15, PIT = 3, STEP = -0.04, GAMMA = 0.9, ALPHA = 0.5;
const MOVES: [number, number][] = [[-1, 0], [0, 1], [1, 0], [0, -1]];
const ARROWS = ["↑", "→", "↓", "←"];
const isTerm = (s: number) => s === GOAL || s === PIT;

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function nextState(s: number, a: number) {
  const r = Math.floor(s / NCOL), c = s % NCOL;
  const nr = r + MOVES[a][0], nc = c + MOVES[a][1];
  if (nr < 0 || nr >= NROW || nc < 0 || nc >= NCOL) return s;
  return nr * NCOL + nc;
}
function reward(ns: number) {
  if (ns === GOAL) return 1.0;
  if (ns === PIT) return -1.0;
  return STEP;
}
const argmax = (row: number[]) => {
  let b = 0; for (let a = 1; a < NA; a++) if (row[a] > row[b]) b = a; return b;
};

type World = {
  Q: number[][]; N: number[]; rng: () => number;
  s: number; steps: number; episode: number;
};
function freshWorld(seed: number): World {
  const rng = mulberry32(seed);
  const start = Math.floor(rng() * NS);
  return {
    Q: Array.from({ length: NS }, () => [0, 0, 0, 0]),
    N: new Array(NS).fill(0),
    rng, s: isTerm(start) ? 12 : start, steps: 0, episode: 0,
  };
}

export function AnimatedRolloutLab() {
  const w = useRef<World>(freshWorld(1));
  const [, setTick] = useState(0);
  const [running, setRunning] = useState(false);
  const [eps, setEps] = useState(0.2);
  const [speed, setSpeed] = useState(6);
  const epsRef = useRef(eps); epsRef.current = eps;

  // advance exactly one environment step + one Q-learning update
  const stepOnce = useCallback(() => {
    const W = w.current;
    let s = W.s;
    if (isTerm(s)) { // start a new episode from a random non-terminal cell
      let ns = Math.floor(W.rng() * NS);
      while (isTerm(ns)) ns = Math.floor(W.rng() * NS);
      W.s = ns; W.steps = 0; W.episode += 1;
      setTick((t) => t + 1);
      return;
    }
    // ε-greedy action
    let a: number;
    if (W.rng() < epsRef.current) a = Math.floor(W.rng() * NA);
    else a = argmax(W.Q[s]);
    const ns = nextState(s, a);
    const r = reward(ns);
    const done = isTerm(ns);
    const target = r + (done ? 0 : GAMMA * Math.max(...W.Q[ns]));
    W.Q[s][a] += ALPHA * (target - W.Q[s][a]);
    W.N[s] += 1;
    W.s = ns; W.steps += 1;
    if (W.steps > 60) { W.s = GOAL; } // safety: end runaway episodes
    setTick((t) => t + 1);
  }, []);

  // fast-forward many whole episodes with no animation
  const fastForward = useCallback((episodes: number) => {
    const W = w.current;
    for (let e = 0; e < episodes; e++) {
      let s = Math.floor(W.rng() * NS);
      while (isTerm(s)) s = Math.floor(W.rng() * NS);
      let k = 0;
      while (!isTerm(s) && k < 200) {
        let a: number;
        if (W.rng() < epsRef.current) a = Math.floor(W.rng() * NA);
        else a = argmax(W.Q[s]);
        const ns = nextState(s, a), r = reward(ns), done = isTerm(ns);
        const target = r + (done ? 0 : GAMMA * Math.max(...W.Q[ns]));
        W.Q[s][a] += ALPHA * (target - W.Q[s][a]);
        W.N[s] += 1; s = ns; k++;
      }
      W.episode += 1;
    }
    W.s = GOAL; W.steps = 0;
    setTick((t) => t + 1);
  }, []);

  const reset = useCallback(() => {
    setRunning(false);
    w.current = freshWorld(Math.floor(Math.random() * 1e6));
    setTick((t) => t + 1);
  }, []);

  useEffect(() => {
    if (!running) return;
    const ms = 440 - speed * 40;
    const id = setInterval(stepOnce, ms);
    return () => clearInterval(id);
  }, [running, speed, stepOnce]);

  const W = w.current;
  const cw = 60, W_px = NCOL * cw, H_px = NROW * cw;
  const cx = (s: number) => (s % NCOL) * cw + cw / 2;
  const cy = (s: number) => Math.floor(s / NCOL) * cw + cw / 2;

  const Vmax = (s: number) => Math.max(...W.Q[s]);
  const cellFill = (s: number) => {
    if (s === GOAL) return "color-mix(in srgb, var(--good) 55%, var(--canvas))";
    if (s === PIT) return "color-mix(in srgb, var(--bad) 55%, var(--canvas))";
    if (W.N[s] === 0) return "var(--surface)";
    const v = Vmax(s);
    const mag = Math.min(1, Math.abs(v));
    const base = v >= 0 ? ACCENT : "var(--bad)";
    return `color-mix(in srgb, ${base} ${(mag * 62 + 6).toFixed(0)}%, var(--canvas))`;
  };

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        <span style={head}>Watch Q-learning learn</span>
        <span style={{ fontSize: 11.5, color: "var(--faint)", fontFamily: "ui-monospace, monospace" }}>
          episode {W.episode} · step {W.steps}
        </span>
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <svg viewBox={`0 0 ${W_px} ${H_px}`} style={{ width: "min(100%, 300px)", height: "auto" }}>
          {Array.from({ length: NS }, (_, s) => {
            const r = Math.floor(s / NCOL), c = s % NCOL;
            const showArrow = W.N[s] > 0 && !isTerm(s);
            return (
              <g key={s}>
                <rect x={c * cw + 1} y={r * cw + 1} width={cw - 2} height={cw - 2} rx={5}
                  fill={cellFill(s)} stroke="var(--border)" strokeWidth={1} />
                {s === GOAL && <text x={cx(s)} y={cy(s) + 5} textAnchor="middle" fontSize={15} fontWeight={700} fill="var(--ink)">G</text>}
                {s === PIT && <text x={cx(s)} y={cy(s) + 5} textAnchor="middle" fontSize={15} fontWeight={700} fill="var(--ink)">P</text>}
                {showArrow && (
                  <text x={cx(s)} y={cy(s) + 6} textAnchor="middle" fontSize={17}
                    fill="color-mix(in srgb, var(--ink) 60%, transparent)">{ARROWS[argmax(W.Q[s])]}</text>
                )}
              </g>
            );
          })}
          {/* the agent */}
          {!isTerm(W.s) && (
            <circle cx={cx(W.s)} cy={cy(W.s)} r={11}
              fill={ACCENT} stroke="var(--canvas)" strokeWidth={2}
              style={{ transition: "cx 0.12s linear, cy 0.12s linear" }} />
          )}
        </svg>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12, alignItems: "center", justifyContent: "center" }}>
        <button style={{ ...btn, borderColor: ACCENT, background: `color-mix(in srgb, ${ACCENT} 16%, transparent)`, minWidth: 74 }}
          onClick={() => setRunning((r) => !r)}>{running ? "⏸ Pause" : "▶ Play"}</button>
        <button style={btn} onClick={() => { setRunning(false); stepOnce(); }}>Step</button>
        <button style={btn} onClick={() => fastForward(1000)}>Skip 1000 episodes</button>
        <button style={btn} onClick={reset}>Reset</button>
      </div>

      <label style={sl}>
        <span style={{ minWidth: 92 }}>ε (explore): <b style={mono}>{eps.toFixed(2)}</b></span>
        <input type="range" min={0} max={0.6} step={0.05} value={eps}
          onChange={(e) => setEps(Number(e.target.value))} style={{ flex: 1, accentColor: ACCENT }} aria-label="epsilon" />
      </label>
      <label style={sl}>
        <span style={{ minWidth: 92 }}>speed: <b style={mono}>{speed}</b></span>
        <input type="range" min={1} max={10} step={1} value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))} style={{ flex: 1, accentColor: ACCENT }} aria-label="speed" />
      </label>

      <div style={caption}>
        Each episode the agent teleports to a random cell (<em>exploring starts</em>) and navigates by ε-greedy steps
        toward the goal <b>G</b>; every step fires one Q-learning update, so the heatmap and arrows are the agent&rsquo;s
        live estimate of <M>Q</M>. Press <b>▶ Play</b> and watch: value floods <em>backward</em> from the goal one visit
        at a time — a cell only learns once a path from it to the goal has been sampled. Hit <b>Skip 1000 episodes</b> to
        jump ahead; the arrows settle into the optimal policy, every one heading for the goal along a shortest route and
        steering clear of the pit <b>P</b>.
      </div>
    </div>
  );
}

// tiny inline M so the caption can use it without importing the KaTeX component into a client bundle path
function M({ children }: { children: string }) {
  return <span style={{ fontStyle: "italic", fontFamily: "var(--font-serif, Georgia, serif)" }}>{children}</span>;
}

const wrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, margin: "1.6rem 0" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const caption: React.CSSProperties = { fontSize: 12.5, color: "var(--muted)", marginTop: 12, lineHeight: 1.55 };
const btn: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 7, cursor: "pointer", padding: "5px 12px", fontSize: 12.5, color: "var(--ink)", fontFamily: "var(--font-sans, sans-serif)", background: "transparent" };
const sl: React.CSSProperties = { display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "var(--muted)", marginTop: 10 };
const mono: React.CSSProperties = { color: "var(--ink)", fontFamily: "ui-monospace, monospace" };
