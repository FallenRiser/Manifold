import {
  N, VILLAGE, BURNING, TERRAIN, FIRE_EVERY, MAX_STEPS,
  freshWorld, act, fireTick, toward, chief, lakeCells, mulberry32, type World,
} from "./heliSim";

// Pricing the rule book. Every rule is flown ONCE and its episode is recorded as four running totals:
// cells that caught, village cells that caught, and the same two counted again on every fire tick they
// spend alight. A reward is then just an opinion about those totals, so the dial can re-price the whole
// book without flying anything again — which is the page's point: the reward is not part of the world.

export const VILLAGE_CENTRE: [number, number] = [2, 12];

export type Tally = { lit: number; vlit: number; rent: number; vrent: number; putOut: number; drops: number; steps: number; burnt: number };
export type Book = Record<string, Tally>;

export const RULES = ["stand by", "one drop, then hover", "nearest", "guard", "soak the village", "drop, then guard"] as const;
export type Rule = (typeof RULES)[number];

const nearestLake = (w: World) =>
  lakeCells.reduce((b, l) => (Math.abs(l[0] - w.pos[0]) + Math.abs(l[1] - w.pos[1]) < Math.abs(b[0] - w.pos[0]) + Math.abs(b[1] - w.pos[1]) ? l : b), lakeCells[0]);

export function action(rule: Rule, w: World): number {
  switch (rule) {
    case "stand by": return 0;
    case "one drop, then hover": return w.t === 0 ? 5 : 0;
    case "nearest": return chief(w, "nearest");
    case "guard": return chief(w, "guard");
    case "soak the village": return w.water === 0 ? toward(w.pos, nearestLake(w)) : toward(w.pos, VILLAGE_CENTRE);
    case "drop, then guard": return w.t === 0 ? 5 : chief(w, "guard");
  }
}

/** One step, with the environment's own bookkeeping: helicopter, then the clock, then the fire, then the end checks. */
function stepCounting(prev: World, a: number, rng: () => number) {
  const w = act(prev, a, rng, 1e9, 1e9);          // the helicopter only: fireEvery is out of reach, so no tick yet
  const afterAction = w.S.slice();                // what the fire tick is about to see
  let lit = 0, vlit = 0, burning = 0, vburning = 0;
  if (w.t % FIRE_EVERY === 0) {
    fireTick(w, rng);
    for (let i = 0; i < N * N; i++) {
      if (w.S[i] !== BURNING) continue;
      burning += 1;
      if (TERRAIN[i] === VILLAGE) vburning += 1;
      if (afterAction[i] !== BURNING) { lit += 1; if (TERRAIN[i] === VILLAGE) vlit += 1; }
    }
  }
  w.done = !w.S.some((s) => s === BURNING) ? "fire out" : w.t >= MAX_STEPS ? "time called" : "";
  return { w, lit, vlit, burning, vburning };
}

export function runRule(rule: Rule, n: number, seed: number): Tally {
  const t: Tally = { lit: 0, vlit: 0, rent: 0, vrent: 0, putOut: 0, drops: 0, steps: 0, burnt: 0 };
  for (let k = 0; k < n; k++) {
    const rng = mulberry32(seed + k);
    let w = freshWorld();
    while (!w.done) {
      const r = stepCounting(w, action(rule, w), rng);
      w = r.w;
      t.lit += r.lit; t.vlit += r.vlit; t.rent += r.burning; t.vrent += r.vburning;
    }
    t.putOut += w.putOut; t.drops += w.drops; t.steps += w.t;
    t.burnt += w.ever.filter(Boolean).length;
  }
  for (const k of Object.keys(t) as (keyof Tally)[]) t[k] /= n;
  return t;
}

export function runBook(n: number, seed: number): Book {
  return Object.fromEntries(RULES.map((r) => [r, runRule(r, n, seed)])) as Book;
}

export type Shape = "catch" | "rent";

/** What a rule costs, given an opinion: `rate` is what one village cell is worth in ordinary cells. */
export function cost(t: Tally, rate: number, shape: Shape): number {
  const [all, vill] = shape === "catch" ? [t.lit, t.vlit] : [t.rent, t.vrent];
  return all - vill + rate * vill;
}

/** Where the leader of the book changes, as the exchange rate is turned up from `lo` to `hi`. */
export function leaderBands(book: Book, shape: Shape, lo: number, hi: number) {
  const bands: { from: number; to: number; rule: Rule }[] = [];
  const leaderAt = (x: number) => RULES.reduce((b, r) => (cost(book[r], x, shape) < cost(book[b], x, shape) ? r : b), RULES[0]);
  let from = lo, who = leaderAt(lo), prev = lo;
  for (let i = 1; i <= 600; i++) {
    const x = lo * Math.pow(hi / lo, i / 600);
    const now = leaderAt(x);
    if (now !== who) {
      let a = prev, b = x;                                   // bisect, so the boundary is the real crossover
      for (let k = 0; k < 40; k++) { const m = Math.sqrt(a * b); if (leaderAt(m) === who) a = m; else b = m; }
      bands.push({ from, to: b, rule: who }); from = b; who = now;
    }
    prev = x;
  }
  bands.push({ from, to: hi, rule: who });
  return bands;
}
