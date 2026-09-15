// Race two fire chiefs on the lab map, fire by fire. Each fire has its own dice; "same dice" gives both chiefs fire k's
// dice, "different dice" gives chief B a different fire k. The engine is heliSim's; the rules mirror the page's cells.
import { N, LAKE, BURNING, START_POS, lakeCells, villageCells, freshWorld, act, toward, chief, mulberry32, type World } from "./heliSim";

export const RULES = [
  { k: "hover", label: "Stand by" },
  { k: "random", label: "Random buttons" },
  { k: "dump", label: "One drop, then hover" },
  { k: "nearest", label: "Nearest fire" },
  { k: "guard", label: "Guard the village" },
  { k: "soak", label: "Soak the village" },
  { k: "dumpGuard", label: "One drop, then guard" },
] as const;
export type Rule = (typeof RULES)[number]["k"];
export const FIRES = 200;

const toLake = (w: World) => {
  let best = lakeCells[0], d = Infinity;
  for (const l of lakeCells) { const e = Math.abs(l[0] - w.pos[0]) + Math.abs(l[1] - w.pos[1]); if (e < d) { d = e; best = l; } }
  return toward(w.pos, best);
};

function policy(rule: Rule, actRng: () => number): (w: World) => number {
  switch (rule) {
    case "hover": return () => 0;
    case "random": return () => Math.floor(actRng() * 6);
    case "dump": return (w) => (w.t === 0 ? 5 : 0);
    case "nearest": return (w) => chief(w, "nearest");
    case "guard": return (w) => chief(w, "guard");
    case "soak": return (w) => (w.water === 0 ? toLake(w) : toward(w.pos, START_POS));
    case "dumpGuard": return (w) => (w.t === 0 ? 5 : chief(w, "guard"));
  }
}

export type Episode = { village: number; burnt: number; steps: number; final: World };

export function playFire(rule: Rule, fireSeed: number, actSeed: number): Episode {
  const rng = mulberry32(fireSeed), pol = policy(rule, mulberry32(actSeed));
  let w = freshWorld();
  while (!w.done) w = act(w, pol(w), rng);
  let burnt = 0, village = 0;
  for (let i = 0; i < N * N; i++) if (w.ever[i]) burnt++;
  for (const i of villageCells) if (w.ever[i]) village++;
  return { village, burnt, steps: w.t, final: w };
}

export type Race = {
  a: Episode[]; b: Episode[]; paired: boolean;
  meanA: number; meanB: number; diff: number; seSeparate: number; sePaired: number;
  better: number; same: number; worse: number;
};

const mean = (x: number[]) => x.reduce((s, v) => s + v, 0) / x.length;
const variance = (x: number[]) => { const m = mean(x); return x.reduce((s, v) => s + (v - m) ** 2, 0) / (x.length - 1); };

export function race(ruleA: Rule, ruleB: Rule, paired: boolean, metric: "village" | "burnt"): Race {
  const a: Episode[] = [], b: Episode[] = [];
  for (let k = 0; k < FIRES; k++) {
    a.push(playFire(ruleA, 1000 + k, 7000 + k));
    b.push(playFire(ruleB, paired ? 1000 + k : 51000 + k, 9000 + k));
  }
  const xa = a.map((e) => e[metric]), xb = b.map((e) => e[metric]);
  const d = xa.map((v, i) => v - xb[i]);
  const n = FIRES;
  return {
    a, b, paired,
    meanA: mean(xa), meanB: mean(xb), diff: mean(d),
    seSeparate: Math.sqrt(variance(xa) / n + variance(xb) / n),
    sePaired: Math.sqrt(variance(d) / n),
    better: d.filter((v) => v < 0).length, same: d.filter((v) => v === 0).length, worse: d.filter((v) => v > 0).length,
  };
}

export { BURNING, LAKE };
