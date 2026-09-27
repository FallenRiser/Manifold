// Page 15's guard. UnitsDialLab changes the units of one feature and refits the default rbf SVM
// in the browser, and the page's argument rests on what that refit does. So it is held against
// sklearn's answers on the identical points, recorded by `python scripts/svm_cases.py unitsdial`
// into results/svm_units_case.json.
//
// Five things:
//
//   1. the lab's points ARE the script's points. The generator is Lehmer plus the four
//      arithmetic operations, all exact or correctly rounded in both languages, so the limit
//      is 0.
//   2. at every stop on the dial, raw and standardised, the shipped fit is sklearn's fit: the
//      same gamma, the same support count, the same training and held-out accuracy, and not
//      one training point labelled differently. Decision values are compared relative to each
//      case's own spread. The limit is 1e-5, far tighter than svm_choice_check.mjs can afford,
//      because this lab does not use dualFit's pass-capped heuristic: it runs smoFit, page 14's
//      maximal-violating-pair SMO, to a KKT tolerance of 1e-8. dualFit stopped 3e-4 short of
//      the optimum on three of these stops and moved support vectors; the first smoFit left
//      rounding residue at C - 1e-17 and cycled on five of them. Both were caught here. Every
//      fit must also finish well inside its step cap.
//   3. standardised, the dial does nothing. Every stop gives every held-out point the label
//      k = 1 gives it. That is the lab's toggle, and the page says it in words.
//   4. raw, the dial costs accuracy at BOTH ends. If either end stopped hurting, the lab would
//      be showing half the page's claim.
//   5. the share readout: standardised, the horizontal feature carries exactly half of every
//      squared distance.
//
//     node scripts/svm_units_check.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { UNITS_DIAL, unitsFit, unitsPoints } from "../src/components/labs/svmSolver.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CASES = path.join(ROOT, "results", "svm_units_case.json");

if (!fs.existsSync(CASES)) {
  console.log(`missing ${CASES}\nrun:  python scripts/svm_cases.py unitsdial`);
  process.exit(1);
}
const ref = JSON.parse(fs.readFileSync(CASES, "utf8"));

let failed = 0;
const fail = (m) => {
  console.log(`  FAIL  ${m}`);
  failed += 1;
};

const F_LIMIT = 1e-5;

console.log("units dial: the shipped fit against sklearn\n");

// ------------------------------------------------------------------ 1. the same points
const train = unitsPoints(80, 5);
const test = unitsPoints(80, 6);
let worstPt = 0;
for (const [mine, theirs] of [
  [train, ref.train],
  [test, ref.test],
]) {
  if (mine.length !== theirs.length) fail(`${mine.length} points against the script's ${theirs.length}`);
  for (let i = 0; i < mine.length; i += 1) {
    worstPt = Math.max(
      worstPt,
      Math.abs(mine[i].x - theirs[i].x),
      Math.abs(mine[i].z - theirs[i].z),
      Math.abs(mine[i].y - theirs[i].y),
    );
  }
}
if (worstPt !== 0) fail(`the lab's points differ from the script's by ${worstPt} (must be exactly 0)`);

const acc = (fit, pts) => {
  let r = 0;
  for (const p of pts) if (Math.sign(fit.at(p.x, p.z)) === p.y) r += 1;
  return r / pts.length;
};

// ------------------------------------------------------------------ 2. sklearn, stop by stop
let worstF = 0;
let worstAt = "";
const rows = [];
for (const c of ref.cases) {
  const fit = unitsFit(train, c.k, c.standardise);
  const tag = `k=${c.k}${c.standardise ? " std" : ""}`;
  if (Math.abs(fit.gamma - c.gamma) > 1e-9 * c.gamma) {
    fail(`${tag}: gamma ${fit.gamma} against sklearn's ${c.gamma}`);
  }
  const span = Math.max(...c.f.map(Math.abs));
  let worst = 0;
  let flipped = 0;
  for (let i = 0; i < train.length; i += 1) {
    worst = Math.max(worst, Math.abs(fit.f[i] - c.f[i]) / span);
    if (Math.sign(fit.f[i]) !== Math.sign(c.f[i])) flipped += 1;
  }
  if (worst > worstF) {
    worstF = worst;
    worstAt = tag;
  }
  if (fit.steps >= 200000) fail(`${tag}: smoFit hit its step cap -- it did not converge`);
  if (worst > F_LIMIT) fail(`${tag}: decision values differ by ${worst.toExponential(2)} of span`);
  if (flipped) fail(`${tag}: ${flipped}/${train.length} training points labelled differently`);
  const nsv = fit.alpha.filter((a) => a > 1e-9).length;
  if (nsv !== c.nsv) fail(`${tag}: ${nsv} support vectors against sklearn's ${c.nsv}`);
  const tr = acc(fit, train);
  const te = acc(fit, test);
  if (tr !== c.train) fail(`${tag}: training accuracy ${tr} against sklearn's ${c.train}`);
  if (te !== c.test) fail(`${tag}: held-out accuracy ${te} against sklearn's ${c.test}`);
  rows.push({ k: c.k, std: c.standardise, fit, nsv, tr, te, share: fit.share });
}
const before = failed;
console.log(`  ${ref.cases.length} cases, ${UNITS_DIAL.length} stops x raw/standardised`);
if (before === 0) {
  console.log("  every gamma, support count, training and held-out accuracy equal to sklearn's");
}
console.log(`  worst decision-value gap ${worstF.toExponential(2)} of span (at ${worstAt}), limit ${F_LIMIT}\n`);

// ------------------------------------------------------------------ 3. standardised: no dial
const std = rows.filter((r) => r.std);
const one = std.find((r) => r.k === 1).fit;
for (const r of std) {
  const moved = test.filter((p) => Math.sign(r.fit.at(p.x, p.z)) !== Math.sign(one.at(p.x, p.z)));
  if (moved.length) fail(`standardised k=${r.k}: ${moved.length} held-out labels differ from k=1`);
}

// ------------------------------------------------------------------ 4. raw: both ends hurt
const raw = rows.filter((r) => !r.std);
const mid = std[0].te;
const lo = raw[0];
const hi = raw[raw.length - 1];
for (const r of raw) {
  console.log(
    `  raw k=${String(r.k).padEnd(5)} share ${r.share.toFixed(4)}  #sv ${String(r.nsv).padStart(2)}` +
      `  train ${r.tr.toFixed(4)}  held-out ${r.te.toFixed(4)}`,
  );
}
console.log(`  standardised, every k        #sv ${std[0].nsv}  held-out ${mid.toFixed(4)}`);
if (!(lo.te < mid - 0.1)) fail(`k=${lo.k} scores ${lo.te}, not clearly below standardised ${mid}`);
if (!(hi.te < mid - 0.1)) fail(`k=${hi.k} scores ${hi.te}, not clearly below standardised ${mid}`);

// ------------------------------------------------------------------ 5. the share readout
for (const r of std) {
  if (Math.abs(r.share - 0.5) > 1e-12) fail(`standardised k=${r.k}: share ${r.share}, not 1/2`);
}

console.log(failed === 0 ? "\nsvm_units_check: clean" : `\nsvm_units_check: ${failed} failure(s)`);
process.exit(failed === 0 ? 0 : 1);
