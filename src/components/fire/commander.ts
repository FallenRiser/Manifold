import { N, LAKE, BURNING, TERRAIN, freshWorld, act, lakeCells, toward, mulberry32, type World } from "./heliSim";

// The commander's interface on the lab map. One decision is a TARGET CELL; between decisions a scripted pilot
// flies there, filling at the nearest lake first if the bucket is empty, and presses the button on arrival.
// The decision ends on that press, or when the clock K runs out — whichever comes first.
//
// The fire's dice come from their own generator, so every rule and every clock meets the identical fire in
// episode k. The random dispatcher draws from a second generator, so choosing targets never disturbs the fire.

export type Mode = "you" | "nearest" | "guard" | "random";
export const CLOCKS = [1, 2, 4, 8, 999] as const;   // 999 = no clock: one decision per sortie
export const NO_CLOCK = 999;

export type Decision = { target: number; toLake: boolean; steps: number };

export type Funnel = {
  episodes: number;
  refilled: number;      // episodes where it ever filled the bucket at the lake
  scoredFirst: number;   // put fire out with the bucket it started with
  scoredAfter: number;   // put fire out after a refill — the whole chain
  putOut: number; drops: number; steps: number; decisions: number;
};

const manhattan = (a: [number, number], b: [number, number]) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
const cellOf = (i: number): [number, number] => [Math.floor(i / N), i % N];
const burningCells = (w: World) => w.S.flatMap((s, i) => (s === BURNING ? [i] : []));

export const VILLAGE_CENTRE: [number, number] = [2, 12];

/** A dispatcher rule: the map in, one of the 256 cells out. "you" is handled by the lab, not here. */
export function pickTarget(w: World, mode: Exclude<Mode, "you">, rng: () => number): number {
  if (mode === "random") return Math.floor(rng() * N * N);
  const fire = burningCells(w);
  if (fire.length === 0) return w.pos[0] * N + w.pos[1];
  if (mode === "nearest") return fire.reduce((b, i) => (manhattan(cellOf(i), w.pos) < manhattan(cellOf(b), w.pos) ? i : b), fire[0]);
  const toVillage = (i: number) => Math.hypot(Math.floor(i / N) - VILLAGE_CENTRE[0], (i % N) - VILLAGE_CENTRE[1]);
  return fire.reduce((b, i) => (toVillage(i) < toVillage(b) ? i : b), fire[0]);
}

export function beginDecision(w: World, target: number): Decision {
  return { target, toLake: w.water === 0, steps: 0 };
}

/** One step of the scripted pilot. `done` means the decision is finished and the commander chooses again. */
export function stepDecision(w: World, d: Decision, K: number, rng: () => number) {
  const lake = lakeCells.reduce((b, l) => (manhattan(l, w.pos) < manhattan(b, w.pos) ? l : b), lakeCells[0]);
  const a = toward(w.pos, d.toLake ? lake : cellOf(d.target));
  const next = act(w, a, rng);
  const arrived = a === 5;
  const nd: Decision = { ...d, toLake: d.toLake && !arrived, steps: d.steps + 1 };
  const dropped = arrived && !d.toLake;
  return { w: next, d: nd, done: dropped || !!next.done || nd.steps >= K };
}

/** Count n episodes of one rule at one clock. Episode k always meets the same fire, whatever the rule. */
export function runEpisodes(n: number, seed: number, mode: Exclude<Mode, "you">, K: number): Funnel {
  const f: Funnel = { episodes: n, refilled: 0, scoredFirst: 0, scoredAfter: 0, putOut: 0, drops: 0, steps: 0, decisions: 0 };
  for (let k = 0; k < n; k++) {
    const rng = mulberry32(seed + k), pickRng = mulberry32(90000 + seed + k);
    let w = freshWorld();
    let filled = false, first = 0, after = 0;
    while (!w.done) {
      let d = beginDecision(w, pickTarget(w, mode, pickRng));
      f.decisions += 1;
      for (;;) {
        const before = w.putOut;
        const r = stepDecision(w, d, K, rng);
        w = r.w; d = r.d;
        if (w.log[w.log.length - 1] === "fill") filled = true;
        if (w.putOut > before) { if (filled) after += w.putOut - before; else first += w.putOut - before; }
        if (r.done) break;
      }
    }
    f.refilled += filled ? 1 : 0;
    f.scoredFirst += first > 0 ? 1 : 0;
    f.scoredAfter += after > 0 ? 1 : 0;
    f.putOut += w.putOut; f.drops += w.drops; f.steps += w.t;
  }
  return f;
}

export const isLake = (p: [number, number]) => TERRAIN[p[0] * N + p[1]] === LAKE;
