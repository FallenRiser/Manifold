// Page 16's guard. CGridLab fits every cell of a C x gamma grid in the browser and colours the
// grid by what those fits score, so the heat map IS a claim about 48 models. It is held against
// sklearn's answers on the identical points, recorded by `python scripts/svm_cases.py cgrid`
// into results/svm_grid_case.json.
//
// Four things:
//
//   1. the lab's points are the script's points, exactly.
//   2. every cell is sklearn's model: the same support count, the same training accuracy, the
//      same accuracy on the 200 new points, no training point labelled differently -- and every
//      fit stopped on the KKT tolerance, not on the step cap. The fit must also be at least as
//      optimal as sklearn's: a dual objective no lower than libsvm's, to 1e-9 relative.
//
//      Decision values are compared to 1e-5 of the case's spread, with one exception worked
//      out rather than waved through. On seven large-C cells they differ by up to 9.6e-5, and
//      in every one of them the browser's dual objective is HIGHER than libsvm's (27942.4808991
//      against 27942.4808748 at C=1000, gamma=0.03): smoFit runs to a KKT gap of 1e-8, libsvm
//      stops earlier on its own criterion. So a decision-value gap fails only when the browser
//      is the less optimal side -- when it is the more optimal one, the gap is the reference's.
//   3. the right-hand cliff the page describes is there: at the largest gamma, every C
//      memorises its 80 points (training 1.00) and scores at least 0.15 below the best cell on
//      new ones.
//   4. the best cell for new points is NOT the best cell for training points -- the lab's
//      toggle exists to show that the two colourings disagree.
//
//     node scripts/svm_grid_check.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  GRID_LAB_C,
  GRID_LAB_G,
  gridPoints,
  rbfGram,
  rbfSmo,
} from "../src/components/labs/svmSolver.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CASES = path.join(ROOT, "results", "svm_grid_case.json");

if (!fs.existsSync(CASES)) {
  console.log(`missing ${CASES}\nrun:  python scripts/svm_cases.py cgrid`);
  process.exit(1);
}
const ref = JSON.parse(fs.readFileSync(CASES, "utf8"));

let failed = 0;
const fail = (m) => {
  console.log(`  FAIL  ${m}`);
  failed += 1;
};
const F_LIMIT = 1e-5;
const CAP = 200000;

console.log("C x gamma grid: the shipped fits against sklearn\n");

// ------------------------------------------------------------------ 1. the same points
const { train, val } = gridPoints();
let worstPt = 0;
for (const [mine, theirs] of [
  [train, ref.train],
  [val, ref.val],
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

// ------------------------------------------------------------------ 2. every cell
if (ref.cells.length !== GRID_LAB_C.length * GRID_LAB_G.length) {
  fail(`${ref.cells.length} recorded cells for a ${GRID_LAB_C.length} x ${GRID_LAB_G.length} lab grid`);
}
let worstF = 0;
let worstAt = "";
let maxSteps = 0;
let excused = 0;
const got = new Map();
const dual = (alpha, K) => {
  let o = 0;
  for (let i = 0; i < train.length; i += 1) {
    o += alpha[i];
    for (let j = 0; j < train.length; j += 1) {
      o -= 0.5 * alpha[i] * alpha[j] * train[i].y * train[j].y * K[i][j];
    }
  }
  return o;
};
for (const c of ref.cells) {
  const tag = `C=${c.C} gamma=${c.gamma}`;
  if (!GRID_LAB_C.includes(c.C) || !GRID_LAB_G.includes(c.gamma)) fail(`${tag} is not on the lab's grid`);
  const fit = rbfSmo(train, c.C, c.gamma);
  maxSteps = Math.max(maxSteps, fit.steps);
  if (fit.steps >= CAP) fail(`${tag}: smoFit hit its step cap -- it did not converge`);
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
  const obj = dual(fit.alpha, rbfGram(train, c.gamma));
  const lessOptimal = obj < c.objective - 1e-9 * Math.abs(c.objective);
  if (lessOptimal) {
    fail(`${tag}: dual objective ${obj} below sklearn's ${c.objective} -- the fit is not converged`);
  }
  if (worst > F_LIMIT) {
    if (lessOptimal) fail(`${tag}: decision values differ by ${worst.toExponential(2)} of span`);
    else excused += 1;
  }
  if (flipped) fail(`${tag}: ${flipped}/${train.length} training points labelled differently`);
  const nsv = fit.alpha.filter((a) => a > 1e-9).length;
  if (nsv !== c.nsv) fail(`${tag}: ${nsv} support vectors against sklearn's ${c.nsv}`);
  let tr = 0;
  for (let i = 0; i < train.length; i += 1) if (Math.sign(fit.f[i]) === train[i].y) tr += 1;
  let va = 0;
  for (const p of val) if (Math.sign(fit.score(p.x, p.z)) === p.y) va += 1;
  if (tr / train.length !== c.train) fail(`${tag}: training ${tr / train.length} vs sklearn ${c.train}`);
  if (va / val.length !== c.val) fail(`${tag}: new points ${va / val.length} vs sklearn ${c.val}`);
  got.set(`${c.C}|${c.gamma}`, { train: tr / train.length, val: va / val.length });
}
const before = failed;
console.log(`  ${ref.cells.length} cells`);
if (before === 0) console.log("  every support count, training and new-point accuracy equal to sklearn's");
console.log(`  worst decision-value gap ${worstF.toExponential(2)} of span (at ${worstAt}), limit ${F_LIMIT}`);
console.log(`  ${excused} cell(s) over that limit, each with a dual objective at or above libsvm's`);
console.log("  every fit at least as optimal as sklearn's, to 1e-9 relative");
console.log(`  most SMO steps in any cell ${maxSteps.toLocaleString("en-US")} (cap ${CAP.toLocaleString("en-US")})\n`);

// ------------------------------------------------------------------ 3. the cliff
const all = [...got.values()];
const bestVal = Math.max(...all.map((v) => v.val));
const gTop = GRID_LAB_G[GRID_LAB_G.length - 1];
for (const C of GRID_LAB_C) {
  const v = got.get(`${C}|${gTop}`);
  if (v.train !== 1) fail(`C=${C} gamma=${gTop}: training ${v.train}, the page says it memorises`);
  if (!(v.val <= bestVal - 0.15)) fail(`C=${C} gamma=${gTop}: new points ${v.val}, not a cliff below ${bestVal}`);
}

// ------------------------------------------------------------------ 4. the two colourings disagree
const bestTrain = Math.max(...all.map((v) => v.train));
const trainWinners = [...got.entries()].filter(([, v]) => v.train === bestTrain).map(([k]) => k);
const valWinners = [...got.entries()].filter(([, v]) => v.val === bestVal).map(([k]) => k);
const valOfTrainWinners = trainWinners.map((k) => got.get(k).val);
if (Math.min(...valOfTrainWinners) > bestVal - 0.1) {
  fail("every cell that fits the training points best also scores near the best on new points");
}

for (const C of GRID_LAB_C) {
  console.log(
    `  C=${String(C).padEnd(5)} ` +
      GRID_LAB_G.map((g) => {
        const v = got.get(`${C}|${g}`);
        return `${v.train.toFixed(2)}/${v.val.toFixed(2)}`;
      }).join(" "),
  );
}
console.log(`\n  best on new points ${bestVal.toFixed(4)} at ${valWinners.join(", ")}`);
console.log(`  ${trainWinners.length} cells fit the training points perfectly; the worst of them` +
  ` scores ${Math.min(...valOfTrainWinners).toFixed(4)} on new points`);

console.log(failed === 0 ? "\nsvm_grid_check: clean" : `\nsvm_grid_check: ${failed} failure(s)`);
process.exit(failed === 0 ? 0 : 1);
