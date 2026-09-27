// Page 19's guard. NoiseFeatureLab puts k pure-noise columns next to the two real moons
// features and fits three models in the browser at every stop on its dial: the default rbf
// SVM, sklearn-default logistic regression, and a 100-tree random forest. They are held against
// sklearn on the identical points, recorded by `python scripts/svm_cases.py noisefeat` into
// results/svm_noise_case.json.
//
// Four things:
//
//   1. the lab's points and noise columns are the script's, exactly.
//   2. the SVM is sklearn's at every k: gamma='scale' reproduced to 1e-12 relative, the same
//      support count, the same accuracy on the 400 new points, decision values within 1e-5 of
//      span (or a dual objective above libsvm's), stopped on the KKT tolerance.
//   3. logistic regression is sklearn's: weights and intercept within 1e-5, the same accuracy.
//   4. the forest cannot be sklearn's -- its randomness is its own -- so it is held to the
//      spread of twenty sklearn forests on the same data: its accuracy must fall inside their
//      range widened by 0.01 at every k. And the page's story must be there: from k = 0 to
//      k = 5 the SVM loses at least twice what the lab's forest loses, and at k = 5 the SVM is
//      within 0.03 of logistic regression.
//
//     node scripts/svm_noise_check.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  NOISE_K,
  forestFit,
  logregFit,
  noiseData,
  noiseMatrix,
  rbfSmoD,
} from "../src/components/labs/svmSolver.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CASES = path.join(ROOT, "results", "svm_noise_case.json");
if (!fs.existsSync(CASES)) {
  console.log(`missing ${CASES}\nrun:  python scripts/svm_cases.py noisefeat`);
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

console.log("Noise features: the shipped fits against sklearn\n");

// ------------------------------------------------------------------ 1. the same data
const D = noiseData();
let worst = 0;
for (const [mine, theirs] of [
  [D.train, ref.train],
  [D.val, ref.val],
]) {
  if (mine.length !== theirs.length) fail(`${mine.length} points against ${theirs.length}`);
  mine.forEach((p, i) => {
    worst = Math.max(worst, Math.abs(p.x - theirs[i].x), Math.abs(p.z - theirs[i].z), Math.abs(p.y - theirs[i].y));
  });
}
for (const [mine, theirs] of [
  [D.extraTrain, ref.extra_train],
  [D.extraVal, ref.extra_val],
]) {
  mine.forEach((r, i) => r.forEach((v, j) => (worst = Math.max(worst, Math.abs(v - theirs[i][j])))));
}
if (worst !== 0) fail(`the lab's data differ from the script's by ${worst}`);
if (ref.cases.map((c) => c.k).join() !== NOISE_K.join()) fail("the dial differs from the script's");

const acc = (score, B, yB) => B.filter((x, i) => Math.sign(score(x)) === yB[i]).length / B.length;
const rows = [];
let worstF = 0;
let worstW = 0;
let maxSteps = 0;
let excused = 0;
for (const c of ref.cases) {
  const tag = `k=${c.k}`;
  const { A, B, yA, yB, gamma } = noiseMatrix(c.k);

  // ---------------------------------------------------------------- 2. the SVM
  if (Math.abs(gamma - c.gamma) > 1e-12 * c.gamma) fail(`${tag}: gamma ${gamma} vs sklearn ${c.gamma}`);
  const s = rbfSmoD(A, yA, 1, gamma);
  maxSteps = Math.max(maxSteps, s.steps);
  if (s.steps >= CAP) fail(`${tag}: smoFit hit its step cap`);
  let obj = 0;
  for (let i = 0; i < A.length; i += 1) {
    if (!s.alpha[i]) continue;
    obj += s.alpha[i];
    for (let j = 0; j < A.length; j += 1) obj -= 0.5 * s.alpha[i] * s.alpha[j] * yA[i] * yA[j] * s.K[i][j];
  }
  const lessOptimal = obj < c.objective - 1e-9 * Math.abs(c.objective);
  if (lessOptimal) fail(`${tag}: dual objective ${obj} below libsvm's ${c.objective}`);
  const span = Math.max(...c.f.map(Math.abs));
  let wf = 0;
  s.f.forEach((v, i) => (wf = Math.max(wf, Math.abs(v - c.f[i]) / span)));
  worstF = Math.max(worstF, wf);
  if (wf > F_LIMIT) {
    if (lessOptimal) fail(`${tag}: decision values differ by ${wf.toExponential(2)} of span`);
    else excused += 1;
  }
  const nsv = s.alpha.filter((a) => a > 1e-9).length;
  if (nsv !== c.nsv) fail(`${tag}: ${nsv} support vectors against sklearn's ${c.nsv}`);
  const sa = acc(s.score, B, yB);
  if (sa !== c.svm) fail(`${tag}: SVM accuracy ${sa} vs sklearn ${c.svm}`);

  // ---------------------------------------------------------------- 3. logistic regression
  const l = logregFit(A, yA);
  const dw = Math.max(Math.abs(l.b - c.b), ...l.w.map((v, j) => Math.abs(v - c.w[j])));
  worstW = Math.max(worstW, dw);
  if (dw > 1e-5) fail(`${tag}: logistic weights differ from sklearn's by ${dw.toExponential(2)}`);
  const la = acc(l.score, B, yB);
  if (la !== c.logreg) fail(`${tag}: logistic accuracy ${la} vs sklearn ${c.logreg}`);

  // ---------------------------------------------------------------- 4. the forest
  const fa = acc(forestFit(A, yA).score, B, yB);
  const lo = Math.min(...c.forest) - 0.01;
  const hi = Math.max(...c.forest) + 0.01;
  if (fa < lo || fa > hi) fail(`${tag}: lab forest ${fa} outside sklearn's twenty forests ${lo + 0.01}-${hi - 0.01} (+-0.01)`);
  rows.push({ k: c.k, svm: sa, logreg: la, forest: fa, sk: c.forest });
}

const at = (k) => rows.find((r) => r.k === k);
const dSvm = at(0).svm - at(5).svm;
const dFor = at(0).forest - at(5).forest;
if (!(dSvm >= 2 * dFor)) fail(`the SVM loses ${dSvm} by k=5 and the forest ${dFor}: not twice`);
if (!(Math.abs(at(5).svm - at(5).logreg) <= 0.03)) fail("at k=5 the SVM is not within 0.03 of logistic regression");

console.log(`  ${rows.length} stops: SVM, logistic regression and forest at each`);
console.log(`  worst SVM decision-value gap ${worstF.toExponential(2)} of span (limit ${F_LIMIT}); ${excused} excused`);
console.log(`  worst logistic weight gap ${worstW.toExponential(2)} (limit 1e-5)`);
console.log(`  most SMO steps ${maxSteps.toLocaleString("en-US")} (cap ${CAP.toLocaleString("en-US")})\n`);
console.log("     k      SVM   log.reg.  lab forest   sklearn forests (20 seeds)");
for (const r of rows) {
  const m = r.sk.reduce((a, b) => a + b, 0) / r.sk.length;
  console.log(
    `  ${String(r.k).padStart(4)}   ${r.svm.toFixed(4)}   ${r.logreg.toFixed(4)}      ${r.forest.toFixed(4)}` +
      `   ${m.toFixed(4)} (${Math.min(...r.sk).toFixed(4)}-${Math.max(...r.sk).toFixed(4)})`,
  );
}
console.log(failed === 0 ? "\nsvm_noise_check: clean" : `\nsvm_noise_check: ${failed} failure(s)`);
process.exit(failed === 0 ? 0 : 1);
