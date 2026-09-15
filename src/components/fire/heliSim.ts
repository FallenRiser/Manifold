// The helicopter world used by the in-page labs. The rules are the environment's: the helicopter acts every step and
// the fire every `fireEvery` steps (spread SPREAD x 0.8 with moisture and wind, corners x 0.7, drying 0.01 a fire
// tick); one bucket; the button fills over the lake and drops a 5 x 5 square anywhere else, putting burning cells out
// (not burnt) and leaving moisture 0.9. The map is hand-made and flat (slope barely matters), the wind is fixed, and the
// dice come from a seeded generator: they are rolled on fire ticks only, so they never depend on the helicopter.

export const N = 16;
export const GRASS = 0, FOREST = 1, ROCK = 2, LAKE = 3, VILLAGE = 4;
export const UNBURNT = 0, BURNING = 1, BURNT = 2;
export const SPREAD = [0.24, 0.128, 0, 0, 0.16];
export const BURN_TIME = [2, 5, 0, 0, 4];
export const DIAGONAL = 0.7, WIND_GAIN = 1.5, DRYING = 0.01, WET = 0.9, DROP_R = 2, FIRE_EVERY = 2, MAX_STEPS = 300;
export const DIRS: [number, number][] = [[-1, 0], [-1, 1], [0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1]];
export const MOVES: [number, number][] = [[0, 0], [-1, 0], [0, 1], [1, 0], [0, -1]];
export const WDIR = Math.PI * 0.75, WSPD = 0.45;            // blowing toward the south-east, gently
export const START_POS: [number, number] = [2, 12];         // the middle of the village
export const IGNITIONS = [9 * N + 3, 5 * N + 7];

export type Kind = "lake" | "fill" | "fire" | "hit" | "miss" | "hover" | "wasted";
export type World = {
  S: number[]; timer: number[]; M: number[]; ever: boolean[];
  pos: [number, number]; water: number; t: number; putOut: number; drops: number;
  log: Kind[]; lastDrop: { r: number; c: number; t: number } | null; done: "" | "fire out" | "time called";
};

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const TERRAIN = (() => {
  const T = new Array(N * N).fill(GRASS);
  for (let i = 0; i < N * N; i++) {
    const r = Math.floor(i / N), c = i % N;
    if (Math.hypot(r - 7.5, c - 5) < 3.6 || Math.hypot(r - 11, c - 10) < 2.4) T[i] = FOREST;
    if (Math.hypot(r - 13, c - 3) <= 1.6) T[i] = LAKE;
  }
  for (let r = 1; r <= 3; r++) for (let c = 11; c <= 13; c++) T[r * N + c] = VILLAGE;
  for (const [r, c] of [[4, 2], [5, 2], [12, 14], [8, 12]]) T[r * N + c] = ROCK;
  return T;
})();

export const lakeCells = TERRAIN.flatMap((ty, i) => (ty === LAKE ? [[Math.floor(i / N), i % N] as [number, number]] : []));
export const villageCells = TERRAIN.flatMap((ty, i) => (ty === VILLAGE ? [i] : []));

export function freshWorld(): World {
  const S = new Array(N * N).fill(UNBURNT), timer = new Array(N * N).fill(0);
  const M = TERRAIN.map((ty, i) => {
    if (ty === LAKE) return 1;
    const r = Math.floor(i / N), c = i % N;
    return 0.15 + 0.25 * Math.exp(-Math.hypot(r - 13, c - 3) / 2);
  });
  for (const i of IGNITIONS) { S[i] = BURNING; timer[i] = BURN_TIME[TERRAIN[i]]; }
  return { S, timer, M, ever: S.map((s) => s === BURNING), pos: START_POS, water: 1, t: 0, putOut: 0, drops: 0, log: [], lastDrop: null, done: "" };
}

export function fireTick(w: World, rng: () => number) {
  const dice = Array.from({ length: N * N }, rng);
  const wr = -Math.cos(WDIR), wc = Math.sin(WDIR);
  const S = w.S.slice(), timer = w.timer.slice();
  for (let i = 0; i < N * N; i++) {
    const r = Math.floor(i / N), c = i % N;
    if (w.S[i] === BURNING) {
      timer[i] -= 1;
      if (timer[i] <= 0) S[i] = BURNT;
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
  w.M = w.M.map((m, i) => (TERRAIN[i] === LAKE ? 1 : Math.max(m - DRYING, 0.05)));
  w.ever = w.ever.map((e, i) => e || S[i] === BURNING);
}

/** One step: the helicopter acts, the clock advances, and the fire ticks if it is due. Time is called after
 *  maxSteps (the environment's 300 at the shipped clock; the clocks page scales it with fireEvery). */
export function act(prev: World, a: number, rng: () => number, fireEvery = FIRE_EVERY, maxSteps = MAX_STEPS): World {
  const w: World = { ...prev, S: prev.S.slice(), timer: prev.timer.slice(), M: prev.M.slice(), log: [...prev.log], lastDrop: null };
  const [r, c] = w.pos;
  let kind: Kind;
  if (a < 5) {
    const [dr, dc] = MOVES[a];
    w.pos = [Math.min(Math.max(r + dr, 0), N - 1), Math.min(Math.max(c + dc, 0), N - 1)];
    kind = a === 0 ? "hover" : w.water === 0 ? "lake" : "fire";
  } else if (TERRAIN[r * N + c] === LAKE) {
    kind = w.water < 1 ? "fill" : "wasted";
    w.water = 1;
  } else if (w.water > 0) {
    let out = 0;
    for (let rr = Math.max(r - DROP_R, 0); rr <= Math.min(r + DROP_R, N - 1); rr++)
      for (let cc = Math.max(c - DROP_R, 0); cc <= Math.min(c + DROP_R, N - 1); cc++) {
        const j = rr * N + cc;
        if (w.S[j] === BURNING) { w.S[j] = UNBURNT; w.timer[j] = 0; out++; }
        w.M[j] = Math.max(w.M[j], WET);
      }
    w.water -= 1; w.drops += 1; w.putOut += out;
    w.lastDrop = { r, c, t: w.t + 1 };
    kind = out > 0 ? "hit" : "miss";
  } else {
    kind = "wasted";
  }
  w.t += 1;
  w.log.push(kind);
  if (w.t % fireEvery === 0) fireTick(w, rng);
  if (!w.S.some((s) => s === BURNING)) w.done = "fire out";
  else if (w.t >= maxSteps) w.done = "time called";
  return w;
}

export function toward(pos: [number, number], target: [number, number]) {
  const dr = target[0] - pos[0], dc = target[1] - pos[1];
  if (dr === 0 && dc === 0) return 5;
  if (Math.abs(dr) >= Math.abs(dc)) return dr > 0 ? 3 : 1;
  return dc > 0 ? 2 : 4;
}

export function chief(w: World, mode: "nearest" | "guard") {
  const manhattan = (a: [number, number], b: [number, number]) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
  const argmin = <T,>(xs: T[], f: (x: T) => number) => xs.reduce((best, x) => (f(x) < f(best) ? x : best), xs[0]);
  if (w.water === 0) return toward(w.pos, argmin(lakeCells, (l) => manhattan(l, w.pos)));
  const fire = w.S.flatMap((s, i) => (s === BURNING ? [[Math.floor(i / N), i % N] as [number, number]] : []));
  if (fire.length === 0) return 0;
  const target = mode === "nearest"
    ? argmin(fire, (f) => manhattan(f, w.pos))
    : argmin(fire, (f) => Math.hypot(f[0] - 2, f[1] - 12));
  return toward(w.pos, target);
}
