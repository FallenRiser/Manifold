// Plant a bug in the lab world's step, then run random-ish play with invariants checked after every step. Play: half
// the actions from the guard chief, half random; every episode gets a random time limit of 10-119 steps so that time
// is really called. The rules are heliSim's (flat map, fixed wind, one bucket, 5 x 5 drop).

import {
  N, TERRAIN, SPREAD, BURN_TIME, DIRS, WIND_GAIN, WDIR, WSPD, DIAGONAL, DRYING, WET, DROP_R, MOVES, LAKE,
  UNBURNT, BURNING, BURNT, freshWorld, chief, mulberry32, type World,
} from "./heliSim";

export type Bug = "none" | "wall" | "unburn" | "bucket" | "lake" | "longburn" | "wind" | "timecalled";
export const BUGS: { k: Bug; label: string }[] = [
  { k: "none", label: "no bug" },
  { k: "wall", label: "no wall at the edge" },
  { k: "unburn", label: "a drop un-burns burnt cells" },
  { k: "bucket", label: "a drop never empties the bucket" },
  { k: "lake", label: "the lake dries out" },
  { k: "longburn", label: "cells burn one tick too long" },
  { k: "wind", label: "the wind blows the wrong way" },
  { k: "timecalled", label: "time is called even when the fire is out" },
];
export const RULES = [
  "a burnt cell stays burnt",
  "fire only where there is fuel",
  "a burning cell has time left",
  "the record of fire only grows",
  "the helicopter stays on the map, moves at most 1",
  "a drop empties the bucket",
  "no button, no change in water",
  "moisture in [0.05, 1], the lake exactly 1",
  "the clock moves by one",
  "the episode ends as 'fire out' exactly when no fire is left",
] as const;
export const EPISODES = 200;

export const onMap = (p: [number, number]) => p[0] >= 0 && p[0] < N && p[1] >= 0 && p[1] < N;

function fireTickBug(w: World, rng: () => number, bug: Bug) {
  const dice = Array.from({ length: N * N }, rng);
  const wdir = bug === "wind" ? WDIR + Math.PI : WDIR;
  const wr = -Math.cos(wdir), wc = Math.sin(wdir);
  const S = w.S.slice(), timer = w.timer.slice();
  for (let i = 0; i < N * N; i++) {
    const r = Math.floor(i / N), c = i % N;
    if (w.S[i] === BURNING) {
      timer[i] -= 1;
      if (bug === "longburn" ? timer[i] < 0 : timer[i] <= 0) S[i] = BURNT;
      continue;
    }
    if (w.S[i] !== UNBURNT || SPREAD[TERRAIN[i]] === 0) continue;
    let notLit = 1;
    for (const [dr, dc] of DIRS) {
      const nr = r - dr, nc = c - dc;
      if (nr < 0 || nr >= N || nc < 0 || nc >= N || w.S[nr * N + nc] !== BURNING) continue;
      const dist = Math.hypot(dr, dc);
      const p = SPREAD[TERRAIN[i]] * (1 - w.M[i]) * Math.exp(WIND_GAIN * WSPD * (dr * wr + dc * wc) / dist) * (dist > 1 ? DIAGONAL : 1);
      notLit *= 1 - Math.min(p, 1);
    }
    if (dice[i] < 1 - notLit) { S[i] = BURNING; timer[i] = BURN_TIME[TERRAIN[i]]; }
  }
  w.S = S; w.timer = timer;
  w.M = w.M.map((m, i) => (TERRAIN[i] === LAKE ? (bug === "lake" ? m - DRYING : 1) : Math.max(m - DRYING, 0.05)));
  w.ever = w.ever.map((e, i) => e || S[i] === BURNING);
}

function stepBug(prev: World, a: number, rng: () => number, bug: Bug, maxSteps: number): World {
  const w: World = { ...prev, S: prev.S.slice(), timer: prev.timer.slice(), M: prev.M.slice(), ever: prev.ever.slice(), log: [], lastDrop: null };
  const [r, c] = w.pos;
  const here = onMap(w.pos) ? TERRAIN[r * N + c] : -1;
  if (a < 5) {
    const [dr, dc] = MOVES[a];
    w.pos = bug === "wall" ? [r + dr, c + dc] : [Math.min(Math.max(r + dr, 0), N - 1), Math.min(Math.max(c + dc, 0), N - 1)];
  } else if (here === LAKE) {
    w.water = 1;
  } else if (w.water > 0) {
    for (let rr = Math.max(r - DROP_R, 0); rr <= Math.min(r + DROP_R, N - 1); rr++)
      for (let cc = Math.max(c - DROP_R, 0); cc <= Math.min(c + DROP_R, N - 1); cc++) {
        const j = rr * N + cc;
        if (bug === "unburn" ? w.S[j] !== UNBURNT : w.S[j] === BURNING) { w.S[j] = UNBURNT; w.timer[j] = 0; w.putOut++; }
        w.M[j] = Math.max(w.M[j], WET);
      }
    if (bug !== "bucket") w.water -= 1;
    w.drops += 1;
  }
  w.t += 1;
  if (w.t % 2 === 0) fireTickBug(w, rng, bug);
  const burning = w.S.some((s) => s === BURNING);
  if (bug === "timecalled") w.done = w.t >= maxSteps ? "time called" : !burning ? "fire out" : "";
  else w.done = !burning ? "fire out" : w.t >= maxSteps ? "time called" : "";
  return w;
}

/** The invariants: for each broken rule, the cells involved (may be empty). */
function check(b: World, w: World, a: number): Map<string, number[]> {
  const out = new Map<string, number[]>();
  const add = (rule: string, i?: number) => { if (!out.has(rule)) out.set(rule, []); if (i !== undefined) out.get(rule)!.push(i); };
  for (let i = 0; i < N * N; i++) {
    if (b.S[i] === BURNT && w.S[i] !== BURNT) add(RULES[0], i);
    if (w.S[i] === BURNING && SPREAD[TERRAIN[i]] === 0) add(RULES[1], i);
    if (w.S[i] === BURNING && w.timer[i] <= 0) add(RULES[2], i);
    if ((b.ever[i] && !w.ever[i]) || (w.S[i] !== UNBURNT && !w.ever[i])) add(RULES[3], i);
    if (w.M[i] < 0.05 || w.M[i] > 1 || (TERRAIN[i] === LAKE && w.M[i] !== 1)) add(RULES[7], i);
  }
  if (!onMap(w.pos) || Math.abs(w.pos[0] - b.pos[0]) + Math.abs(w.pos[1] - b.pos[1]) > 1) add(RULES[4]);
  const dropped = a === 5 && b.water > 0 && onMap(b.pos) && TERRAIN[b.pos[0] * N + b.pos[1]] !== LAKE;
  if (dropped && w.water !== b.water - 1) add(RULES[5]);
  if (a < 5 && w.water !== b.water) add(RULES[6]);
  if (w.t !== b.t + 1) add(RULES[8]);
  if ((w.done === "fire out") !== !w.S.some((s) => s === BURNING)) add(RULES[9]);
  return out;
}

export type Result = {
  steps: number; drops: number; fills: number; fireOut: number; timeCalled: number;
  broken: Map<string, { count: number; ep: number; step: number }>;
  first: { rule: string; ep: number; step: number; world: World; cells: number[] } | null;
};

export function huntBugs(bug: Bug): Result {
  const act = mulberry32(7);
  const res: Result = { steps: 0, drops: 0, fills: 0, fireOut: 0, timeCalled: 0, broken: new Map(), first: null };
  for (let ep = 0; ep < EPISODES; ep++) {
    const dice = mulberry32(1000 + ep);
    const maxSteps = 10 + Math.floor(act() * 110);
    let w = freshWorld();
    while (!w.done) {
      const useChief = act() < 0.5;
      const a = useChief && onMap(w.pos) ? chief(w, "guard") : Math.floor(act() * 6);
      const next = stepBug(w, a, dice, bug, maxSteps);
      res.steps++;
      if (next.water > w.water) res.fills++;
      if (a === 5 && w.water > 0 && onMap(w.pos) && TERRAIN[w.pos[0] * N + w.pos[1]] !== LAKE) res.drops++;
      for (const [rule, cells] of check(w, next, a)) {
        const e = res.broken.get(rule);
        if (e) e.count++; else res.broken.set(rule, { count: 1, ep, step: next.t });
        if (!res.first) res.first = { rule, ep, step: next.t, world: next, cells };
      }
      // Once off the map, put the helicopter back on the edge so the episode can go on (the rule already fired).
      w = onMap(next.pos) ? next : { ...next, pos: [Math.min(Math.max(next.pos[0], 0), N - 1), Math.min(Math.max(next.pos[1], 0), N - 1)] };
    }
    if (w.done === "fire out") res.fireOut++; else res.timeCalled++;
  }
  return res;
}
