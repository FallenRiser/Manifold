import { N, LAKE, TERRAIN, freshWorld, act, lakeCells, mulberry32, type World } from "./heliSim";

// A uniform random pilot on the lab map: every step it presses one of the six buttons with equal chance.
// The page's Python cells do the same thing on the real environment's 200 held-out worlds. The two help
// switches are the two things that could make the fill -> fly -> drop chain happen by luck: a bucket that
// never empties (no refill needed at all) and a helicopter parked on the water.

export type Help = { freeWater: boolean; onLake: boolean };

export type Funnel = {
  episodes: number;
  refilled: number;        // episodes where it ever filled the bucket at the lake
  scoredFirst: number;     // episodes where it put fire out with the bucket it started with
  scoredAfter: number;     // episodes where it put fire out after a refill  <- the chain
  putOut: number;          // cells put out per episode
  drops: number;           // drops per episode
  steps: number;           // steps per episode
  onLake: number;          // episodes where it ever stood on a lake cell
  lakeSteps: number[];     // step it first stood on the lake, for the episodes where it did
};

export const startLake = (() => {
  const [r, c] = freshWorld().pos;
  return lakeCells.reduce((b, l) => (Math.abs(l[0] - r) + Math.abs(l[1] - c) < Math.abs(b[0] - r) + Math.abs(b[1] - c) ? l : b), lakeCells[0]);
})();

export function startWorld(help: Help): World {
  const w = freshWorld();
  return help.onLake ? { ...w, pos: [startLake[0], startLake[1]] } : w;
}

/** One random button press. Returns the next world and what it did, so the lab can colour the trail. */
export function randomStep(prev: World, help: Help, rng: () => number) {
  const before = prev.putOut;
  const w = act(help.freeWater ? { ...prev, water: 1 } : prev, Math.floor(rng() * 6), rng);
  return { w, scored: w.putOut - before, filled: w.log[w.log.length - 1] === "fill" };
}

export function runEpisodes(n: number, seed: number, help: Help): Funnel {
  const f: Funnel = { episodes: n, refilled: 0, scoredFirst: 0, scoredAfter: 0, putOut: 0, drops: 0, steps: 0, onLake: 0, lakeSteps: [] };
  for (let k = 0; k < n; k++) {
    const rng = mulberry32(seed + k);
    let w = startWorld(help);
    let filled = false, first = 0, after = 0, stood = help.onLake ? 1 : 0;
    if (help.onLake) f.lakeSteps.push(0);
    while (!w.done) {
      const r = randomStep(w, help, rng);
      w = r.w;
      if (r.filled) filled = true;
      if (r.scored > 0) { if (filled) after += r.scored; else first += r.scored; }
      if (!stood && TERRAIN[w.pos[0] * N + w.pos[1]] === LAKE) { stood = 1; f.lakeSteps.push(w.t); }
    }
    f.refilled += filled ? 1 : 0;
    f.scoredFirst += first > 0 ? 1 : 0;
    f.scoredAfter += after > 0 ? 1 : 0;
    f.onLake += stood;
    f.putOut += w.putOut; f.drops += w.drops; f.steps += w.t;
  }
  return f;
}
