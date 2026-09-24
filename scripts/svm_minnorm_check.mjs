// Does MinNormLab's sweep agree with the one the page publishes?
//
// The lab draws a boundary and labels it "the canonical boundary for this direction", and draws a
// curve it calls ||w||. Both of those are claims. This holds the shipped TypeScript
// (canonicalForDirection in src/components/labs/svmSolver.ts) to the Python that produced the
// numbers on the page, on the same dataset and the same directions.
//
//     python scripts/svm_cases.py minnorm      # writes results/svm_minnorm_case.json
//     node scripts/svm_minnorm_check.mjs
import { readFileSync } from "node:fs";
import { canonicalForDirection } from "../src/components/labs/svmSolver.ts";

const c = JSON.parse(readFileSync("results/svm_minnorm_case.json", "utf8"));
const pts = c.X.map((row, i) => ({ x: row[0], z: row[1], y: c.y[i] === 1 ? 1 : -1 }));

// RELATIVE error, not absolute. ||w|| is 2/gap, so it blows up towards the edges of the
// separating cone: across these probes it spans 0.61 to 484.5, a factor of 800. An absolute
// limit is therefore a different test at each end of that range -- it first failed here at
// 7.79e-8 on the ||w|| = 484 direction, where the relative error was 1.61e-10 and nothing was
// actually wrong. Measure the spread before choosing the encoding.
let worstNorm = 0;
let worstMargin = 0;
let disagreeSep = 0;
let checked = 0;

for (const p of c.probes) {
  const got = canonicalForDirection(pts, p.deg);
  // A direction that separates in one language and not the other is the failure that matters
  // most: it is the lab drawing a corridor where there is none, or refusing to draw a real one.
  if (!!got !== p.sep) { disagreeSep++; continue; }
  if (!p.sep) continue;
  checked++;
  worstNorm = Math.max(worstNorm, Math.abs(got.norm - p.norm) / p.norm);
  worstMargin = Math.max(worstMargin, Math.abs(got.margin - p.margin) / p.margin);
}

const sep = c.probes.filter((p) => p.sep).length;
const norms = c.probes.filter((p) => p.sep).map((p) => p.norm);
console.log(`\n  ${c.probes.length} probe directions, ${sep} of them separating.`);
console.log(`  ${checked} compared numerically; ${disagreeSep} disagreed about separability.`);
console.log(`  ||w|| over those directions spans ${Math.min(...norms).toFixed(3)}`
  + ` to ${Math.max(...norms).toFixed(3)}.`);
console.log(`\n  worst ||w||   relative difference  ${worstNorm.toExponential(2)}  (limit 1e-8)`);
console.log(`  worst margin  relative difference  ${worstMargin.toExponential(2)}  (limit 1e-8)`);

// The identity the page is built on, re-checked on the TypeScript side rather than assumed to
// survive the port: in canonical form the margin is exactly 1/||w||.
let worstProd = 0;
for (const p of c.probes) {
  const got = canonicalForDirection(pts, p.deg);
  if (got) worstProd = Math.max(worstProd, Math.abs(got.norm * got.margin - 1));
}
console.log(`  worst |‖w‖ × margin − 1|  ${worstProd.toExponential(2)}  (limit 1e-12)`);

if (disagreeSep || worstNorm > 1e-8 || worstMargin > 1e-8 || worstProd > 1e-12) {
  console.log("\nFAIL -- the lab's sweep does not match the published one.\n");
  process.exit(1);
}
console.log("\nclean -- the lab sweeps the same boundaries the page reports.\n");
