import {
  N, VILLAGE, BURNING, TERRAIN, FIRE_EVERY, MAX_STEPS, DROP_R,
  freshWorld, act, fireTick, toward, chief, lakeCells, mulberry32, type World,
} from "./heliSim";

// One order, priced by two rewards. From a single moment in one fire we ask, for each of the 256 cells the
// commander could name: how much fire does that order end up putting out, and how much of the map -- and of
// the village -- burns afterwards? Every continuation is flown on the SAME dice, and the whole sweep is
// repeated over several dice draws, because one fire is far too noisy to compare two rewards on. The point
// of holding all of that still is that the two maps can then differ only in the order that was given.

export const VILLAGE_CENTRE: [number, number] = [2, 12];

export type Eval = { hit: number; putOut: number; lit: number; vlit: number; steps: number };

const nearestLake = (w: World) =>
  lakeCells.reduce((b, l) => (Math.abs(l[0] - w.pos[0]) + Math.abs(l[1] - w.pos[1]) < Math.abs(b[0] - w.pos[0]) + Math.abs(b[1] - w.pos[1]) ? l : b), lakeCells[0]);

/** One step, counting what catches: the helicopter, then the clock, then the fire, then the end checks. */
function stepCounting(prev: World, a: number, rng: () => number) {
  const before = prev.putOut;
  const w = act(prev, a, rng, 1e9, 1e9);          // the helicopter only: fireEvery is out of reach, so no tick yet
  const afterAction = w.S.slice();                // what the fire tick is about to see
  let lit = 0, vlit = 0;
  if (w.t % FIRE_EVERY === 0) {
    fireTick(w, rng);
    for (let i = 0; i < N * N; i++)
      if (w.S[i] === BURNING && afterAction[i] !== BURNING) { lit += 1; if (TERRAIN[i] === VILLAGE) vlit += 1; }
  }
  w.done = !w.S.some((s) => s === BURNING) ? "fire out" : w.t >= MAX_STEPS ? "time called" : "";
  return { w, lit, vlit, hit: w.putOut - before };
}

/** Fly the guard chief for `t0` steps from a fresh fire. This is the moment the commander is handed. */
export function momentAt(t0: number, seed = 1): World {
  const rng = mulberry32(seed);
  let w = freshWorld();
  for (let k = 0; k < t0 && !w.done; k++) w = stepCounting(w, chief(w, "guard"), rng).w;
  return w;
}

/** How much fire a drop centred on `target` covers if it lands on the map exactly as it is now. */
export function coverNow(w: World, target: number): number {
  const r = Math.floor(target / N), c = target % N;
  let n = 0;
  for (let rr = Math.max(r - DROP_R, 0); rr <= Math.min(r + DROP_R, N - 1); rr++)
    for (let cc = Math.max(c - DROP_R, 0); cc <= Math.min(c + DROP_R, N - 1); cc++)
      if (w.S[rr * N + cc] === BURNING) n += 1;
  return n;
}

/** Name one target, let the pilot deliver it, then hand the fire back to the guard chief until it is over. */
export function evalTarget(w0: World, target: number, seed: number): Eval {
  const rng = mulberry32(seed);
  const tgt: [number, number] = [Math.floor(target / N), target % N];
  let w = w0, lit = 0, vlit = 0, hit = 0, toLake = w0.water === 0, delivered = false;
  while (!w.done) {
    const a = delivered ? chief(w, "guard") : toward(w.pos, toLake ? nearestLake(w) : tgt);
    const landing = !delivered && a === 5 && !toLake;
    const s = stepCounting(w, a, rng);
    w = s.w; lit += s.lit; vlit += s.vlit;
    if (landing) { hit = s.hit; delivered = true; }
    else if (a === 5 && toLake) toLake = false;
  }
  return { hit, putOut: w.putOut - w0.putOut, lit, vlit, steps: w.t - w0.t };
}

/** Every order the commander could give, each flown to the end of the fire on one shared set of dice. */
export function sweep(w0: World, seed: number): Eval[] {
  return Array.from({ length: N * N }, (_, i) => evalTarget(w0, i, seed));
}

/** What the damage reward charges for a continuation: ordinary cells at 1, village cells at `rate`. */
export const damage = (e: Eval, rate = 11) => e.lit - e.vlit + rate * e.vlit;

export type Maps = { pay: number[]; harm: number[]; vill: number[]; draws: number };

/** Average the two maps over `draws` sets of dice. One fire decides nothing; twelve settle the shape. */
export function addDraw(m: Maps, w0: World, draw: number): Maps {
  const E = sweep(w0, 4000 + 137 * draw);
  const n = m.draws + 1;
  return {
    draws: n,
    pay: m.pay.map((v, i) => (v * m.draws + E[i].putOut) / n),
    harm: m.harm.map((v, i) => (v * m.draws + damage(E[i])) / n),
    vill: m.vill.map((v, i) => (v * m.draws + E[i].vlit) / n),
  };
}

export const emptyMaps = (): Maps => ({ pay: new Array(N * N).fill(0), harm: new Array(N * N).fill(0), vill: new Array(N * N).fill(0), draws: 0 });

export const argbest = (xs: number[], sign: 1 | -1) =>
  xs.reduce((b, x, i) => (sign * x > sign * xs[b] ? i : b), 0);
