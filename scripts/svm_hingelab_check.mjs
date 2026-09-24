// Does HingeLossLab actually show what the page says it shows?
//
// The lab makes three claims by drawing them, and all three could quietly stop being true if the
// sampler, the loss helpers or the sweep resolution changed:
//
//   1. the mistake count is FLAT over most of the turn -- nothing for a descent method to follow;
//   2. the hinge is not flat anywhere, so there is always a downhill direction;
//   3. the two minima sit at DIFFERENT angles, which is the surrogate's cost seen as a picture.
//
// A lab that draws two confident curves which no longer make the point is a failure this project
// has shipped before, so this runs the lab's own functions over many samples and asserts it.
//
//     node scripts/svm_hingelab_check.mjs
import { hingeSum, sampleOverlap, zeroOneCount } from "../src/components/labs/svmSolver.ts";

const SEEDS = 60;
const N = 60;
const STEP = 0.5;

const dirFor = (deg) => {
  const t = (deg * Math.PI) / 180;
  return [2 * Math.cos(t), 2 * Math.sin(t)];
};

function sweep(pts) {
  const hinge = [];
  const zo = [];
  for (let d = 0; d < 360; d += STEP) {
    const w = dirFor(d);
    hinge.push(hingeSum(pts, w, 0));
    zo.push(zeroOneCount(pts, w, 0));
  }
  let bh = 0;
  let bz = 0;
  let flatZ = 0;
  let flatH = 0;
  let jump = 0;
  for (let i = 1; i < hinge.length; i++) {
    if (hinge[i] < hinge[bh]) bh = i;
    if (zo[i] < zo[bz]) bz = i;
    if (zo[i] === zo[i - 1]) flatZ++;
    if (Math.abs(hinge[i] - hinge[i - 1]) < 1e-12) flatH++;
    jump = Math.max(jump, Math.abs(zo[i] - zo[i - 1]));
  }
  const steps = hinge.length - 1;
  // Smallest turn between the two minima, going either way round.
  const raw = Math.abs(bh - bz) * STEP;
  return {
    flatZ: (100 * flatZ) / steps,
    flatH: (100 * flatH) / steps,
    jump,
    gap: Math.min(raw, 360 - raw),
    distinctZ: new Set(zo).size,
  };
}

const fails = [];
const check = (ok, msg) => { if (!ok) fails.push(msg); };

const rows = [];
for (let s = 1; s <= SEEDS; s++) {
  const { pts } = sampleOverlap(s, N, 1.0);
  rows.push(sweep(pts));
}
const mean = (f) => rows.reduce((a, r) => a + f(r), 0) / rows.length;

console.log(`\n  ${SEEDS} samples of ${N} points, boundary swept in ${STEP}-degree steps\n`);
console.log(`  ${"mean % of the turn where mistakes do not move".padEnd(50)}` +
  `${mean((r) => r.flatZ).toFixed(1)}%`);
console.log(`  ${"mean % of the turn where the hinge does not move".padEnd(50)}` +
  `${mean((r) => r.flatH).toFixed(1)}%`);
console.log(`  ${"mean largest one-step jump in the mistake count".padEnd(50)}` +
  `${mean((r) => r.jump).toFixed(2)}`);
console.log(`  ${"mean angle between the two minima, degrees".padEnd(50)}` +
  `${mean((r) => r.gap).toFixed(2)}`);
console.log(`  ${"samples where the two minima coincide".padEnd(50)}` +
  `${rows.filter((r) => r.gap === 0).length} of ${SEEDS}`);

// 1. the staircase has to be mostly flat, or there is no point drawing it
check(mean((r) => r.flatZ) > 80,
  `the mistake count is only flat over ${mean((r) => r.flatZ).toFixed(1)}% of the turn, ` +
  "so the lab no longer shows that there is nothing to descend");
check(rows.every((r) => r.flatZ > 60),
  "some sample had a mistake curve that was barely flat at all");

// 2. the hinge must never be flat -- this is the whole contrast
check(mean((r) => r.flatH) < 1,
  `the hinge is flat over ${mean((r) => r.flatH).toFixed(1)}% of the turn, so the contrast ` +
  "with the staircase has gone");

// 3. the staircase must actually jump, and the minima must usually disagree
check(mean((r) => r.jump) >= 1,
  "the mistake count never moves by a whole error in one step, which cannot happen for a count");
const coincide = rows.filter((r) => r.gap === 0).length;
check(coincide < SEEDS / 2,
  `the two minima land on the same angle in ${coincide} of ${SEEDS} samples, so the lab cannot ` +
  "show that minimising the hinge is not the same as minimising mistakes");
// A degenerate sample whose mistake curve takes one value would have nothing to show.
check(rows.every((r) => r.distinctZ > 3),
  "some sample's mistake count took almost no distinct values over the whole turn");

console.log();
if (fails.length) {
  for (const f of fails) console.log(`  FAIL  ${f}`);
  console.log(`\n${fails.length} check(s) failed -- the lab no longer shows what the page says.`);
  process.exit(1);
}
console.log("clean -- the staircase is still flat, the ramp still slopes, and they still disagree.");
