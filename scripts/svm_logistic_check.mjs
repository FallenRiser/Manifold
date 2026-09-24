// Is logisticFit in the lab actually logistic regression?
//
// SparsityLab draws a second boundary beside the SVM's and labels it log loss. That label is a
// claim about forty lines of hand-written gradient descent, and the whole page turns on the two
// boundaries behaving differently for the RIGHT reason. If the logistic side were simply
// under-converged it would also sit somewhere else, and the page would be reading a bug as a
// finding.
//
// So: `python scripts/svm_cases.py pull` records sklearn's answer on fixed datasets, and this
// holds the TypeScript to it.
//
//     node scripts/svm_logistic_check.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { logisticFit } from "../src/components/labs/svmSolver.ts";

const here = dirname(fileURLToPath(import.meta.url));
const cases = JSON.parse(
  readFileSync(join(here, "..", "results", "svm_logistic_case.json"), "utf8"));

const deg = (u, v) => {
  const c = (u[0] * v[0] + u[1] * v[1]) / (Math.hypot(...u) * Math.hypot(...v));
  return (Math.acos(Math.max(-1, Math.min(1, Math.abs(c)))) * 180) / Math.PI;
};

// Limits set from what the port actually achieves, not picked by eye. Measured worst case is
// 8.5e-7 degrees and 2.6e-9 relative, so these sit roughly a thousand times above the observed
// noise -- loose enough to survive a different machine's floating point, tight enough that
// under-convergence or a mishandled C would trip them. The first draft used 0.5 degrees and 5%,
// which the port beat by six orders of magnitude and which would therefore have caught nothing.
const ANGLE_LIMIT = 1e-3;    // degrees between the two boundaries
const NORM_LIMIT = 1e-6;     // relative difference in ||w||, since C changes its scale 100x

let worstAngle = 0;
let worstNorm = 0;
const fails = [];

console.log(`\n  ${"dataset".padEnd(16)}${"angle deg".padStart(11)}${"|w| ours".padStart(11)}` +
  `${"|w| sklearn".padStart(13)}${"rel diff".padStart(11)}`);
for (const c of cases) {
  const pts = c.X.map(([x, z], i) => ({ x, z, y: c.y[i] }));
  const got = logisticFit(pts, c.C);
  const a = deg(got.w, c.w);
  const n1 = Math.hypot(...got.w);
  const n2 = Math.hypot(...c.w);
  const rel = Math.abs(n1 - n2) / n2;
  worstAngle = Math.max(worstAngle, a);
  worstNorm = Math.max(worstNorm, rel);
  console.log(`  ${`seed ${c.seed} C=${c.C}`.padEnd(16)}${a.toExponential(2).padStart(11)}` +
    `${n1.toFixed(4).padStart(11)}${n2.toFixed(4).padStart(13)}` +
    `${rel.toExponential(2).padStart(11)}`);
  if (a > ANGLE_LIMIT) {
    fails.push(`seed ${c.seed} C=${c.C}: boundary is ${a.toFixed(3)} deg off sklearn's ` +
      `(limit ${ANGLE_LIMIT})`);
  }
  if (rel > NORM_LIMIT) {
    fails.push(`seed ${c.seed} C=${c.C}: ||w|| is off by ${(100 * rel).toFixed(2)}% ` +
      `(limit ${NORM_LIMIT})`);
  }
}

console.log(`\n  worst angle ${worstAngle.toExponential(2)} deg (limit ${ANGLE_LIMIT})`);
console.log(`  worst ||w|| relative difference ${worstNorm.toExponential(2)} ` +
  `(limit ${NORM_LIMIT})`);

// A fit that returned w = 0 would pass an angle test vacuously and be useless, so require the
// scale to be real too.
for (const c of cases) {
  const pts = c.X.map(([x, z], i) => ({ x, z, y: c.y[i] }));
  if (Math.hypot(...logisticFit(pts, c.C).w) < 1e-6) {
    fails.push(`seed ${c.seed} C=${c.C}: returned a zero weight vector`);
  }
}

console.log();
if (fails.length) {
  for (const f of fails) console.log(`  FAIL  ${f}`);
  console.log(`\n${fails.length} check(s) failed -- the lab's logistic side is not logistic ` +
    "regression, so the comparison it draws means nothing.");
  process.exit(1);
}
console.log("clean -- the lab's log-loss boundary is the one sklearn finds.");
