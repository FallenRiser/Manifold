// Does the SMO in the browser reach the same prices sklearn does?
//
// GramLab draws one bar per training point and calls its height that point's Lagrange
// multiplier. That is a claim about a hand-written SMO, and the lab's whole argument -- rotate
// the data and NOTHING in the dual moves -- would look exactly as convincing if the prices were
// quietly wrong, because wrong prices are just as invariant as right ones.
//
// So: `python scripts/svm_cases.py dual` records sklearn's multipliers on fixed datasets, and
// this holds the port to them. It also re-checks the two KKT facts page 9 measured, because a
// solver that satisfies neither would still produce a pretty picture.
//
//     node scripts/svm_dual_check.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { dualFit, gramMatrix } from "../src/components/labs/svmSolver.ts";

const here = dirname(fileURLToPath(import.meta.url));
const cases = JSON.parse(
  readFileSync(join(here, "..", "results", "svm_dual_case.json"), "utf8"));

const deg = (u, v) => {
  const c = (u[0] * v[0] + u[1] * v[1]) / (Math.hypot(...u) * Math.hypot(...v));
  return (Math.acos(Math.max(-1, Math.min(1, c))) * 180) / Math.PI;
};

// Limits from what the port achieves, not from taste. Measured worst case is printed below each
// run; these sit a few hundred times above it, which survives another machine's floating point
// and nothing else.
const ALPHA_LIMIT = 1e-4;     // absolute, on each multiplier
const OBJ_LIMIT = 1e-6;       // relative, on the dual objective
const ANGLE_LIMIT = 1e-2;     // degrees, on the boundary the prices imply
const KKT_LIMIT = 1e-6;       // the equality constraint and complementary slackness

const fails = [];
let wA = 0;
let wO = 0;
let wG = 0;
let wEq = 0;
let wCs = 0;

console.log(`\n  ${"case".padEnd(16)}${"max |da|".padStart(11)}${"obj rel".padStart(11)}` +
  `${"angle deg".padStart(12)}${"sum a_i y_i".padStart(14)}${"passes".padStart(9)}`);
for (const c of cases) {
  const pts = c.X.map(([x, z], i) => ({ x, z, y: c.y[i] }));
  const got = dualFit(pts, c.C, gramMatrix(pts));

  const da = Math.max(...got.alpha.map((v, i) => Math.abs(v - c.alpha[i])));
  const rel = Math.abs(got.objective - c.objective) / Math.abs(c.objective);
  const ang = deg(got.w, c.w);
  const eq = Math.abs(got.alpha.reduce((s, v, i) => s + v * c.y[i], 0));
  // Complementary slackness: a price below C means the point sits on its margin.
  let cs = 0;
  for (let i = 0; i < pts.length; i++) {
    if (got.group[i] !== 1) continue;
    const z = c.y[i] * (got.w[0] * pts[i].x + got.w[1] * pts[i].z + got.b);
    cs = Math.max(cs, Math.abs(z - 1));
  }

  wA = Math.max(wA, da);
  wO = Math.max(wO, rel);
  wG = Math.max(wG, ang);
  wEq = Math.max(wEq, eq);
  wCs = Math.max(wCs, cs);

  console.log(`  ${`seed ${c.seed} C=${c.C}`.padEnd(16)}${da.toExponential(2).padStart(11)}` +
    `${rel.toExponential(2).padStart(11)}${ang.toExponential(2).padStart(12)}` +
    `${eq.toExponential(2).padStart(14)}${String(got.passes).padStart(9)}`);

  if (da > ALPHA_LIMIT) fails.push(`seed ${c.seed} C=${c.C}: a price is ${da.toExponential(2)} off`);
  if (rel > OBJ_LIMIT) fails.push(`seed ${c.seed} C=${c.C}: objective off by ${rel.toExponential(2)}`);
  if (ang > ANGLE_LIMIT) fails.push(`seed ${c.seed} C=${c.C}: boundary ${ang.toFixed(4)} deg off`);
  if (eq > KKT_LIMIT) fails.push(`seed ${c.seed} C=${c.C}: sum a_i y_i = ${eq.toExponential(2)}`);
  if (cs > 1e-3) fails.push(`seed ${c.seed} C=${c.C}: a free price sits ${cs.toExponential(2)} off its margin`);
  // Prices outside the box are not prices.
  for (const v of got.alpha) {
    if (v < -1e-9 || v > c.C + 1e-9) {
      fails.push(`seed ${c.seed} C=${c.C}: a price left the box (${v})`);
      break;
    }
  }
  // Three identical alphas would pass every test above and mean the solver never ran.
  if (new Set(got.alpha.map((v) => v.toFixed(6))).size < 3) {
    fails.push(`seed ${c.seed} C=${c.C}: the prices take fewer than 3 distinct values`);
  }
}

console.log(`\n  ${"worst multiplier error".padEnd(46)}${wA.toExponential(2)} (limit ${ALPHA_LIMIT})`);
console.log(`  ${"worst objective, relative".padEnd(46)}${wO.toExponential(2)} (limit ${OBJ_LIMIT})`);
console.log(`  ${"worst boundary angle, degrees".padEnd(46)}${wG.toExponential(2)} (limit ${ANGLE_LIMIT})`);
console.log(`  ${"worst |sum a_i y_i|".padEnd(46)}${wEq.toExponential(2)} (limit ${KKT_LIMIT})`);
console.log(`  ${"worst free price off its margin".padEnd(46)}${wCs.toExponential(2)}`);

// The lab's actual claim: rotating the data must leave the Gram matrix, and therefore every
// price, exactly where it was.
{
  const c = cases[0];
  const pts = c.X.map(([x, z], i) => ({ x, z, y: c.y[i] }));
  const base = dualFit(pts, c.C, gramMatrix(pts));
  let worstK = 0;
  let worstA = 0;
  const K0 = gramMatrix(pts);
  for (let t = 1; t <= 12; t++) {
    const th = (t / 12) * 2 * Math.PI;
    const co = Math.cos(th);
    const si = Math.sin(th);
    const rot = pts.map((p) => ({ x: p.x * co - p.z * si, z: p.x * si + p.z * co, y: p.y }));
    const K1 = gramMatrix(rot);
    for (let i = 0; i < pts.length; i++) {
      for (let j = 0; j < pts.length; j++) worstK = Math.max(worstK, Math.abs(K0[i][j] - K1[i][j]));
    }
    const r = dualFit(rot, c.C, K1);
    worstA = Math.max(worstA, ...r.alpha.map((v, i) => Math.abs(v - base.alpha[i])));
  }
  console.log(`\n  ${"rotating the cloud, worst change in Gram".padEnd(46)}${worstK.toExponential(2)}`);
  console.log(`  ${"rotating the cloud, worst change in a price".padEnd(46)}${worstA.toExponential(2)}`);
  if (worstK > 1e-12) fails.push(`rotation moved the Gram matrix by ${worstK.toExponential(2)}`);
  if (worstA > 1e-6) fails.push(`rotation moved a price by ${worstA.toExponential(2)}`);
}

console.log();
if (fails.length) {
  for (const f of fails) console.log(`  FAIL  ${f}`);
  console.log(`\n${fails.length} check(s) failed -- the bars in the lab are not Lagrange ` +
    "multipliers, so the invariance it shows means nothing.");
  process.exit(1);
}
console.log("clean -- the browser reaches sklearn's prices, and rotation leaves them alone.");
