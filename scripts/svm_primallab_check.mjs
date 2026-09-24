// Does the bowl ConvexBowlLab draws have the shape the page says it has?
//
// The lab makes three claims that are easy to draw and easy to get wrong. That the height of the
// surface is the primal objective with the offset minimised out. That the offset minimiser is an
// interval whose middle is the right point to take. And that dropping a ball anywhere on the
// surface reaches the same bottom -- which is the page's whole argument, so a descent that
// quietly stopped a few degrees short would turn the argument into a picture of itself.
//
// `python scripts/svm_cases.py flat` records Python's answers on fixed datasets. This holds the
// TypeScript to them, and then checks the descent on the lab's own points, where there is no
// recorded answer to lean on.
//
//     node scripts/svm_primallab_check.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  descendPrimal, fitSVM, primalJ, profileHinge, sampleOverlap,
} from "../src/components/labs/svmSolver.ts";

const here = dirname(fileURLToPath(import.meta.url));
const cases = JSON.parse(
  readFileSync(join(here, "..", "results", "svm_primal_case.json"), "utf8"));

const deg = (u, v) => {
  const c = (u[0] * v[0] + u[1] * v[1]) / (Math.hypot(...u) * Math.hypot(...v));
  return (Math.acos(Math.max(-1, Math.min(1, c))) * 180) / Math.PI;
};

// Limits from what the port achieves, not from taste. Measured: the objective agrees with Python
// to 1.4e-12 relative and the offset to 2.1e-12 absolute over 600 probes, and descent lands
// 0.033 degrees from sklearn's boundary. Each limit sits a few hundred times above that, which
// leaves room for another machine's floating point and none for a real regression.
const VALUE_LIMIT = 1e-9;    // relative, on the objective and the hinge sum
const OFFSET_LIMIT = 1e-9;   // absolute, on b and on the ends of its interval
const ANGLE_LIMIT = 0.2;     // degrees, descent against sklearn
const EXCESS_LIMIT = 1e-3;   // relative, how far above the optimum descent settles

const fails = [];
let worstJ = 0;
let worstHinge = 0;
let worstB = 0;
let worstEnds = 0;

for (const c of cases) {
  const pts = c.X.map(([x, z], i) => ({ x, z, y: c.y[i] }));
  for (const p of c.probes) {
    const got = profileHinge(pts, p.w);
    worstHinge = Math.max(worstHinge,
      Math.abs(got.sum - p.hinge) / Math.max(1e-9, Math.abs(p.hinge)));
    worstJ = Math.max(worstJ, Math.abs(primalJ(pts, p.w, c.C) - p.J) / Math.abs(p.J));
    worstB = Math.max(worstB, Math.abs(got.b - p.b));
    worstEnds = Math.max(worstEnds, Math.abs(got.bLo - p.bLo), Math.abs(got.bHi - p.bHi));
  }
}

console.log(`\n  the surface, over ${cases.length * cases[0].probes.length} probe directions`);
console.log(`  ${"hinge sum, worst relative error".padEnd(46)}${worstHinge.toExponential(2)}`);
console.log(`  ${"objective, worst relative error".padEnd(46)}${worstJ.toExponential(2)}`);
console.log(`  ${"offset, worst absolute error".padEnd(46)}${worstB.toExponential(2)}`);
console.log(`  ${"ends of its interval, worst error".padEnd(46)}${worstEnds.toExponential(2)}`);
if (worstHinge > VALUE_LIMIT) fails.push(`hinge sum off by ${worstHinge.toExponential(2)}`);
if (worstJ > VALUE_LIMIT) fails.push(`objective off by ${worstJ.toExponential(2)}`);
if (worstB > OFFSET_LIMIT) fails.push(`offset off by ${worstB.toExponential(2)}`);
if (worstEnds > OFFSET_LIMIT) {
  fails.push(`the offset interval is not the one Python finds (${worstEnds.toExponential(2)})`);
}

// A midpoint that never differs from an endpoint would mean the interval logic is not running at
// all and every check above would pass vacuously.
let widest = 0;
for (const c of cases) {
  const pts = c.X.map(([x, z], i) => ({ x, z, y: c.y[i] }));
  for (const p of c.probes) {
    const got = profileHinge(pts, p.w);
    widest = Math.max(widest, got.bHi - got.bLo);
  }
}
console.log(`  ${"widest offset interval seen".padEnd(46)}${widest.toFixed(3)}`);
if (widest < 0.05) {
  fails.push("no probe produced a wide offset interval, so the midpoint logic is untested");
}

console.log(`\n  descent, 24 starts on a ring around each dataset`);
console.log(`  ${"dataset".padEnd(18)}${"worst angle".padStart(14)}${"worst excess".padStart(15)}`);
for (const c of cases) {
  const pts = c.X.map(([x, z], i) => ({ x, z, y: c.y[i] }));
  let wa = 0;
  let we = 0;
  for (let s = 0; s < 24; s++) {
    const th = (s / 24) * 2 * Math.PI;
    const r = 0.4 + (2.0 * ((s * 5) % 24)) / 24;
    const { end } = descendPrimal(pts, [r * Math.cos(th), r * Math.sin(th)], c.C, "hinge");
    wa = Math.max(wa, deg(end, c.wStar));
    we = Math.max(we, (primalJ(pts, end, c.C) - c.jStar) / c.jStar);
  }
  console.log(`  ${`seed ${c.seed} C=${c.C}`.padEnd(18)}${`${wa.toFixed(4)} deg`.padStart(14)}` +
    `${we.toExponential(2).padStart(15)}`);
  if (wa > ANGLE_LIMIT) {
    fails.push(`seed ${c.seed} C=${c.C}: descent stops ${wa.toFixed(3)} deg from sklearn`);
  }
  if (we > EXCESS_LIMIT) {
    fails.push(`seed ${c.seed} C=${c.C}: descent settles ${we.toExponential(2)} above the ` +
      "optimum");
  }
}

// The lab's own fixture, where there is no recorded answer: every start must reach the same
// place, that place must be where fitSVM puts the boundary, and nothing on a dense sweep of the
// plotted square may sit below it -- the three things "one bowl, one bottom" actually means.
console.log(`\n  the lab's own points`);
const C = 1;
for (const seed of [3, 4, 5]) {
  const { pts } = sampleOverlap(seed, 30, 1.3);
  const ref = fitSVM(pts, C);
  let spread = 0;
  let vsRef = 0;
  const ends = [];
  for (let s = 0; s < 24; s++) {
    const th = (s / 24) * 2 * Math.PI;
    ends.push(descendPrimal(pts, [2.4 * Math.cos(th), 2.4 * Math.sin(th)], C, "hinge").end);
  }
  for (const e of ends) {
    spread = Math.max(spread, deg(e, ends[0]));
    vsRef = Math.max(vsRef, deg(e, ref.w));
  }
  const best = ends.reduce((a, e) => (primalJ(pts, e, C) < primalJ(pts, a, C) ? e : a), ends[0]);
  const bestJ = primalJ(pts, best, C);
  let below = 0;
  for (let i = 0; i < 4000; i++) {
    const w = [((i * 37) % 101) / 20 - 2.5, ((i * 61) % 103) / 20.4 - 2.5];
    if (primalJ(pts, w, C) < bestJ * (1 - 1e-9)) below++;
  }
  console.log(`  ${`seed ${seed}`.padEnd(18)}${`${spread.toFixed(4)} deg apart`.padStart(18)}` +
    `${`${vsRef.toFixed(4)} deg vs fitSVM`.padStart(24)}${`${below} below`.padStart(12)}`);
  if (spread > ANGLE_LIMIT) {
    fails.push(`lab seed ${seed}: the 24 starts disagree by ${spread.toFixed(3)} deg`);
  }
  if (vsRef > 1.0) {
    fails.push(`lab seed ${seed}: descent lands ${vsRef.toFixed(3)} deg from fitSVM`);
  }
  if (below > 0) {
    fails.push(`lab seed ${seed}: ${below} sweep points sit below the bottom descent found`);
  }
}

// The 0-1 side has to be flat, or the contrast the lab draws is a lie about the other loss.
const { pts: p0 } = sampleOverlap(3, 30, 1.3);
const flat = descendPrimal(p0, [1.5, -1.0], C, "wrong");
console.log(`\n  the mistake-count side moved ${flat.moved} after a full descent`);
if (flat.moved !== 0) fails.push(`the 0-1 descent moved by ${flat.moved}, it must not move`);

console.log();
if (fails.length) {
  for (const f of fails) console.log(`  FAIL  ${f}`);
  console.log(`\n${fails.length} check(s) failed -- the lab is not drawing the primal, so the ` +
    "page is arguing from a picture of something else.");
  process.exit(1);
}
console.log("clean -- one bowl, one bottom, and it is the one sklearn lands in.");
