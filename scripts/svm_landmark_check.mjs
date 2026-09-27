// Page 20's guard. LandmarkLab fits an SVM on the kernel m landmark points imply (the Nystroem
// approximation) at six values of m, plus the exact SVM, in the browser. Held against sklearn's
// SVC(kernel="precomputed") on the identical approximate kernel, recorded by
// `python scripts/svm_cases.py landmarks` into results/svm_landmark_case.json.
//
// Three things:
//
//   1. the lab's points are the script's points, exactly.
//   2. every fit is sklearn's: stopped on the KKT tolerance; the approximate kernel's first two
//      entries within 1e-9 of numpy's; the same support count and the same accuracy on the 400
//      new points; decision values within 1e-5 of span unless the browser's dual objective is
//      the higher one (page 16's rule); and never a lower dual objective than libsvm's.
//   3. the page's story is there: 20 landmarks are within half a point of the exact SVM on new
//      points, and 2 landmarks are at least 20 points worse.
//
//     node scripts/svm_landmark_check.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  LANDMARKS,
  LANDMARK_GAMMA,
  landmarkData,
  landmarkFit,
  rbfGram,
  rbfSmo,
} from "../src/components/labs/svmSolver.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CASES = path.join(ROOT, "results", "svm_landmark_case.json");
if (!fs.existsSync(CASES)) {
  console.log(`missing ${CASES}\nrun:  python scripts/svm_cases.py landmarks`);
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

console.log("Landmarks: the shipped fits against sklearn\n");

const { train, val } = landmarkData();
let worst = 0;
for (const [mine, theirs] of [
  [train, ref.train],
  [val, ref.val],
]) {
  if (mine.length !== theirs.length) fail(`${mine.length} points against ${theirs.length}`);
  mine.forEach((p, i) => {
    worst = Math.max(worst, Math.abs(p.x - theirs[i].x), Math.abs(p.z - theirs[i].z), Math.abs(p.y - theirs[i].y));
  });
}
if (worst !== 0) fail(`the lab's points differ from the script's by ${worst}`);
if (ref.gamma !== LANDMARK_GAMMA) fail("gamma differs from the script's");

const y = train.map((p) => p.y);
const dual = (alpha, K) => {
  let o = 0;
  for (let i = 0; i < alpha.length; i += 1) {
    if (!alpha[i]) continue;
    o += alpha[i];
    for (let j = 0; j < alpha.length; j += 1) o -= 0.5 * alpha[i] * alpha[j] * y[i] * y[j] * K[i][j];
  }
  return o;
};

const got = {};
let worstF = 0;
let maxSteps = 0;
let excused = 0;
for (const c of ref.cases) {
  const tag = c.m === 0 ? "exact" : `m=${c.m}`;
  if (!LANDMARKS.includes(c.m)) fail(`${tag} is not on the lab's dial`);
  const fit = c.m === 0 ? rbfSmo(train, 1, LANDMARK_GAMMA) : landmarkFit(train, c.m);
  const K = c.m === 0 ? rbfGram(train, LANDMARK_GAMMA) : fit.K;
  if (c.m !== 0) {
    const dk = Math.max(Math.abs(K[0][0] - c.K00), Math.abs(K[0][1] - c.K01));
    if (dk > 1e-9) fail(`${tag}: approximate kernel differs from numpy's by ${dk.toExponential(2)}`);
  }
  maxSteps = Math.max(maxSteps, fit.steps);
  if (fit.steps >= CAP) fail(`${tag}: smoFit hit its step cap`);
  const obj = dual(fit.alpha, K);
  const lessOptimal = obj < c.objective - 1e-9 * Math.abs(c.objective);
  if (lessOptimal) fail(`${tag}: dual objective ${obj} below libsvm's ${c.objective}`);
  const span = Math.max(...c.f.map(Math.abs));
  let wf = 0;
  fit.f.forEach((v, i) => (wf = Math.max(wf, Math.abs(v - c.f[i]) / span)));
  worstF = Math.max(worstF, wf);
  if (wf > F_LIMIT) {
    if (lessOptimal) fail(`${tag}: decision values differ by ${wf.toExponential(2)} of span`);
    else excused += 1;
  }
  const nsv = fit.alpha.filter((a) => a > 1e-9).length;
  if (nsv !== c.nsv) fail(`${tag}: ${nsv} support vectors against sklearn's ${c.nsv}`);
  const acc = val.filter((p) => Math.sign(fit.score(p.x, p.z)) === p.y).length / val.length;
  if (acc !== c.val) fail(`${tag}: accuracy ${acc} vs sklearn ${c.val}`);
  got[c.m] = { acc, nsv };
}

if (!(got[0].acc - got[20].acc <= 0.005)) fail(`20 landmarks: ${got[20].acc} vs exact ${got[0].acc}`);
if (!(got[0].acc - got[2].acc >= 0.2)) fail(`2 landmarks: ${got[2].acc} is not 20 points below exact`);

console.log(`  ${ref.cases.length} fits`);
console.log(`  worst decision-value gap ${worstF.toExponential(2)} of span (limit ${F_LIMIT}); ${excused} excused`);
console.log(`  most SMO steps ${maxSteps.toLocaleString("en-US")} (cap ${CAP.toLocaleString("en-US")})\n`);
for (const m of LANDMARKS) {
  console.log(`  ${(m === 0 ? "exact" : `m=${m}`).padStart(6)}  accuracy ${got[m].acc.toFixed(4)}  SVs ${got[m].nsv}`);
}
console.log(failed === 0 ? "\nsvm_landmark_check: clean" : `\nsvm_landmark_check: ${failed} failure(s)`);
process.exit(failed === 0 ? 0 : 1);
