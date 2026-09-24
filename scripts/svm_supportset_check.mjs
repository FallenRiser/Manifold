// Does the lab's delete button prove anything?
//
// SupportSetLab's whole argument is a non-event: press "drop every point with no price" and the
// readout stays at 0.0000 degrees. A non-event is the easiest thing in the world to fake -- a
// solver that ignored half its input, or a readout wired to a constant, would look identical and
// would be just as reassuring. So this checks the three things that have to be true for the
// non-event to mean what the page says it means:
//
//   1. the three groups the lab DRAWS are sklearn's three groups, not a threshold that happens
//      to look plausible;
//   2. refitting on the priced points alone really does return the same boundary;
//   3. dropping a priced point really does change it -- otherwise claim 2 is trivial. Note the
//      quantifier: SOME priced point, not every one. Both sklearn and the port agree that
//      individual support vectors are often redundant (seed 0's point 17 can go for 1.5e-08 of
//      movement), which is the page's own caveat, so requiring all of them to matter would fail
//      on correct behaviour.
//
// Cases come from `python scripts/svm_cases.py svset`.
//
//     node scripts/svm_supportset_check.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { dualFit } from "../src/components/labs/svmSolver.ts";

const here = dirname(fileURLToPath(import.meta.url));
const cases = JSON.parse(
  readFileSync(join(here, "..", "results", "svm_supportset_case.json"), "utf8"));

const deg = (u, v) => {
  const d = Math.hypot(...u) * Math.hypot(...v);
  if (d < 1e-12) return 0;
  return (Math.acos(Math.min(1, Math.abs((u[0] * v[0] + u[1] * v[1]) / d))) * 180) / Math.PI;
};
const mk = (c, keep) => c.X.map(([x, z], i) => ({ x, z, y: c.y[i] }))
  .filter((_, i) => (keep ? keep(i) : true));

// Limits from what the port achieves, printed under each run, not from taste.
const GROUP_LIMIT = 0;       // the split is discrete: it matches or it does not
const ANGLE_LIMIT = 1e-2;    // degrees, against sklearn's answer on the same points
const B_LIMIT = 1e-3;

const fails = [];
let wSame = 0;   // worst turn on the "drop the unpriced points" refit -- must stay ~0
let wPort = 0;   // worst disagreement with sklearn on a subset
let wB = 0;
let bestMove = 0;   // largest movement caused by dropping a PRICED point

console.log(`\n  ${"case".padEnd(15)}${"groups".padStart(12)}${"port deg".padStart(11)}` +
  `${"kept deg".padStart(11)}${"kept |db|".padStart(12)}${"max sv move".padStart(14)}`);

for (const c of cases) {
  const pts = mk(c);
  const got = dualFit(pts, c.C);

  // 1. the split the lab draws
  let bad = 0;
  for (let i = 0; i < pts.length; i++) if (got.group[i] !== c.group[i]) bad++;
  const portDeg = deg(got.w, c.w);

  // 2. the button: refit on the priced points alone
  const kept = dualFit(mk(c, (i) => c.group[i] > 0), c.C);
  const keptTurn = deg(kept.w, got.w);
  const keptDb = Math.abs(kept.b - got.b);
  // and it must still be sklearn's answer for that subset, or "unchanged" is unchanged from a
  // wrong number to the same wrong number.
  const keptVsSk = deg(kept.w, c.keptW);

  // 3. the control: dropping a priced point has to do something
  let maxMove = 0;
  for (const d of c.drops) {
    const r = dualFit(mk(c, (i) => i !== d.i), c.C);
    const move = Math.max(deg(r.w, got.w), Math.abs(r.b - got.b));
    maxMove = Math.max(maxMove, move);
    const off = deg(r.w, d.w);
    if (off > ANGLE_LIMIT) {
      fails.push(`seed ${c.seed}: dropping point ${d.i} lands ${off.toFixed(4)} deg from sklearn`);
    }
    wPort = Math.max(wPort, off);
  }

  wSame = Math.max(wSame, keptTurn);
  wB = Math.max(wB, keptDb);
  wPort = Math.max(wPort, portDeg, keptVsSk);
  bestMove = Math.max(bestMove, maxMove);

  console.log(`  ${`seed ${c.seed} C=${c.C}`.padEnd(15)}` +
    `${`${bad === 0 ? "match" : `${bad} WRONG`}`.padStart(12)}` +
    `${portDeg.toExponential(2).padStart(11)}${keptTurn.toExponential(2).padStart(11)}` +
    `${keptDb.toExponential(2).padStart(12)}${maxMove.toExponential(2).padStart(14)}`);

  if (bad > GROUP_LIMIT) {
    fails.push(`seed ${c.seed}: ${bad} point(s) drawn in the wrong group`);
  }
  if (portDeg > ANGLE_LIMIT) fails.push(`seed ${c.seed}: the full fit is ${portDeg} deg off`);
  if (keptTurn > ANGLE_LIMIT || keptDb > B_LIMIT) {
    fails.push(`seed ${c.seed}: dropping the unpriced points moved the boundary ` +
      `${keptTurn.toFixed(4)} deg / ${keptDb.toFixed(4)} -- the lab's button is lying`);
  }
  if (keptVsSk > ANGLE_LIMIT) {
    fails.push(`seed ${c.seed}: the kept-points refit is ${keptVsSk.toFixed(4)} deg from sklearn`);
  }
  // A solver that returned the same answer whatever you fed it would pass everything above,
  // so the contrast has to be positive too: on every case, at least one priced point must be
  // load-bearing.
  if (maxMove < 1e-3) {
    fails.push(`seed ${c.seed}: no priced point moved the boundary by as much as 1e-3, so ` +
      "'the unpriced ones do not matter' is not saying anything");
  }
}

console.log(`\n  ${"worst disagreement with sklearn, degrees".padEnd(48)}${wPort.toExponential(2)}` +
  ` (limit ${ANGLE_LIMIT})`);
console.log(`  ${"worst turn from dropping the unpriced points".padEnd(48)}${wSame.toExponential(2)}` +
  ` (limit ${ANGLE_LIMIT})`);
console.log(`  ${"worst offset shift from the same".padEnd(48)}${wB.toExponential(2)}` +
  ` (limit ${B_LIMIT})`);
console.log(`  ${"largest effect of dropping a PRICED point".padEnd(48)}${bestMove.toExponential(2)}` +
  " (must be > 1e-03)");

console.log();
if (fails.length) {
  for (const f of fails) console.log(`  FAIL  ${f}`);
  console.log(`\n${fails.length} check(s) failed -- the lab's non-event is not the one the page ` +
    "describes.");
  process.exit(1);
}
console.log("clean -- the unpriced points can go, the priced ones cannot, and both are sklearn's.");
