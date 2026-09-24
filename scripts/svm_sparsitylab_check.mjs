// Does SparsityLab still show the contrast it is on the page to show?
//
// Two claims, both drawn rather than stated:
//
//   1. under the hinge, the points past the margin contribute EXACTLY zero, and there are plenty
//      of them -- so most of the picture goes bare;
//   2. under log loss nothing reaches zero, and those same comfortable points still account for a
//      large share of the total pull.
//
// Either could quietly stop being true if the sampler, C, or a loss helper changed, and the lab
// would go on drawing a confident picture that no longer makes the point.
//
//     node scripts/svm_sparsitylab_check.mjs
import { fitSVM, logisticFit, pullOf, sampleOverlap } from "../src/components/labs/svmSolver.ts";

const SEEDS = 30;
const N = 110;
const SEP = 1.3;
const C = 1;

function measure(seed, loss) {
  const { pts } = sampleOverlap(seed, N, SEP);
  const fit = loss === "hinge" ? fitSVM(pts, C) : logisticFit(pts, C);
  const { w, b } = fit;
  const pull = pullOf(pts, w, b, loss);
  const total = pull.reduce((a, v) => a + v, 0);
  let far = 0;
  let farPull = 0;
  let zero = 0;
  pts.forEach((p, i) => {
    if (p.y * (w[0] * p.x + w[1] * p.z + b) > 1) { far++; farPull += pull[i]; }
    if (pull[i] === 0) zero++;
  });
  return { farCount: far, farShare: total > 0 ? (100 * farPull) / total : 0, zero, total };
}

const fails = [];
const check = (ok, msg) => { if (!ok) fails.push(msg); };

const h = [];
const l = [];
for (let s = 1; s <= SEEDS; s++) { h.push(measure(s, "hinge")); l.push(measure(s, "logistic")); }
const mean = (rows, f) => rows.reduce((a, r) => a + f(r), 0) / rows.length;

console.log(`\n  ${SEEDS} samples of ${N} points, clouds ${SEP} apart, C = ${C}\n`);
console.log(`  ${"".padEnd(38)}${"hinge".padStart(12)}${"log loss".padStart(14)}`);
console.log(`  ${"mean points past the margin".padEnd(38)}` +
  `${mean(h, (r) => r.farCount).toFixed(1).padStart(12)}` +
  `${mean(l, (r) => r.farCount).toFixed(1).padStart(14)}`);
console.log(`  ${"mean share of the pull they exert".padEnd(38)}` +
  `${(mean(h, (r) => r.farShare).toFixed(4) + "%").padStart(12)}` +
  `${(mean(l, (r) => r.farShare).toFixed(2) + "%").padStart(14)}`);
console.log(`  ${"mean points pulling with exactly zero".padEnd(38)}` +
  `${mean(h, (r) => r.zero).toFixed(1).padStart(12)}` +
  `${mean(l, (r) => r.zero).toFixed(1).padStart(14)}`);

// 1. the hinge's zero must be exact, on every sample, not merely small
check(h.every((r) => r.farShare === 0),
  "some sample had points past the hinge margin exerting non-zero pull, which would mean the " +
  "derivative is no longer exactly zero out there");
check(mean(h, (r) => r.zero) > N / 3,
  `only ${mean(h, (r) => r.zero).toFixed(1)} of ${N} points carry zero pull under the hinge, ` +
  "so the bare picture the lab draws has mostly filled in");

// 2. log loss must never reach zero, and the far points must still matter in aggregate
check(l.every((r) => r.zero === 0),
  "some point reached exactly zero pull under log loss, which it cannot do");
check(mean(l, (r) => r.farShare) > 20,
  `points past the margin account for only ${mean(l, (r) => r.farShare).toFixed(1)}% of the ` +
  "log-loss pull, so the lab cannot show that they collectively matter");

// 3. both fits have to be real, or the comparison is between two accidents
check(h.every((r) => r.total > 0) && l.every((r) => r.total > 0),
  "a fit produced zero total pull, so it is not fitting anything");

console.log();
if (fails.length) {
  for (const f of fails) console.log(`  FAIL  ${f}`);
  console.log(`\n${fails.length} check(s) failed -- the lab no longer shows what the page says.`);
  process.exit(1);
}
console.log("clean -- the hinge still switches off out there, and log loss still does not.");
