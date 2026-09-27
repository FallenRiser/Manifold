// Page 18's guard. PlattLab turns an SVM's decision values into probabilities three ways -- a
// plain squash, Platt's sigmoid fitted on the training scores, and Platt's sigmoid fitted on
// held-out (5-fold) scores -- at nine values of C. Every curve, reliability bar and log loss it
// shows rests on 54 SVM fits and 18 sigmoid fits in the browser. They are held against
// sklearn's answers on the identical points, recorded by `python scripts/svm_cases.py scale`
// into results/svm_platt_case.json.
//
// Four things:
//
//   1. the lab's points are the script's points, exactly.
//   2. every SVM is sklearn's: stopped on the KKT tolerance, the same support count, the same
//      accuracy on the 200 new points, training scores within 1e-5 of span -- and the same
//      for the held-out scores, which come from five more fits per stop (fold = i % 5). Every
//      fit's dual objective must be at least libsvm's (1e-9 relative). A score gap over 1e-5
//      fails only if the browser is the LESS optimal side: page 16's rule, needed here at
//      C = 1000, where libsvm stops earlier than smoFit's KKT gap of 1e-8.
//   3. every sigmoid is sklearn's: A and B within 1e-3, and the browser's Newton fit is at least
//      as good at its own job -- a smoothed-target loss no higher than the loss at sklearn's
//      (A, B), to 1e-9 relative. The log loss it reports on new points is within 1e-4.
//   4. the page's story is there: the squash's loss on new points spans a wider range across
//      the dial than either Platt fit's does, and at every stop below C = 100 the squash is the
//      worst of the three.
//
//     node scripts/svm_platt_check.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  rbfGram,
  PLATT_C,
  PLATT_GAMMA,
  gridPoints,
  plattFit,
  plattStop,
  sigmoidAt,
} from "../src/components/labs/svmSolver.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CASES = path.join(ROOT, "results", "svm_platt_case.json");

if (!fs.existsSync(CASES)) {
  console.log(`missing ${CASES}\nrun:  python scripts/svm_cases.py scale`);
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

console.log("Platt scaling: the shipped fits against sklearn\n");

// ------------------------------------------------------------------ 1. the same points
const { train, val } = gridPoints();
let worstPt = 0;
for (const [mine, theirs] of [
  [train, ref.train],
  [val, ref.val],
]) {
  if (mine.length !== theirs.length) fail(`${mine.length} points against ${theirs.length}`);
  for (let i = 0; i < mine.length; i += 1) {
    worstPt = Math.max(
      worstPt,
      Math.abs(mine[i].x - theirs[i].x),
      Math.abs(mine[i].z - theirs[i].z),
      Math.abs(mine[i].y - theirs[i].y),
    );
  }
}
if (worstPt !== 0) fail(`the lab's points differ from the script's by ${worstPt}`);
if (ref.gamma !== PLATT_GAMMA) fail(`gamma ${PLATT_GAMMA} against the script's ${ref.gamma}`);
if (ref.cases.map((c) => c.C).join() !== PLATT_C.join()) fail("the C dial differs from the script's");

const y = train.map((p) => p.y);
const yv = val.map((p) => (p.y > 0 ? 1 : 0));
const ll = (p) => {
  let s = 0;
  for (let i = 0; i < p.length; i += 1) {
    const q = Math.min(1 - 1e-15, Math.max(1e-15, p[i]));
    s -= yv[i] * Math.log(q) + (1 - yv[i]) * Math.log(1 - q);
  }
  return s / p.length;
};
// the smoothed-target loss at any (A, B), to compare optima
const smoothLoss = (f, A, B) => {
  const np = y.filter((v) => v > 0).length;
  const hi = (np + 1) / (np + 2);
  const lo = 1 / (y.length - np + 2);
  let s = 0;
  for (let i = 0; i < f.length; i += 1) {
    const t = y[i] > 0 ? hi : lo;
    const z = A * f[i] + B;
    s += z >= 0 ? t * z + Math.log(1 + Math.exp(-z)) : (t - 1) * z + Math.log(1 + Math.exp(z));
  }
  return s;
};

const dual = (pts, alpha) => {
  const K = rbfGram(pts, PLATT_GAMMA);
  let o = 0;
  for (let i = 0; i < pts.length; i += 1) {
    if (alpha[i] === 0) continue;
    o += alpha[i];
    for (let j = 0; j < pts.length; j += 1) o -= 0.5 * alpha[i] * alpha[j] * pts[i].y * pts[j].y * K[i][j];
  }
  return o;
};
let excused = 0;
let worstF = 0;
let worstAB = 0;
let worstLL = 0;
let maxSteps = 0;
const got = [];
for (const c of ref.cases) {
  const tag = `C=${c.C}`;
  const st = plattStop(train, val, c.C);

  // ---------------------------------------------------------------- 2. the SVMs
  for (const s of [st.fit.steps, ...st.cvSteps]) {
    maxSteps = Math.max(maxSteps, s);
    if (s >= CAP) fail(`${tag}: an SMO hit its step cap`);
  }
  const nsv = st.fit.alpha.filter((a) => a > 1e-9).length;
  if (nsv !== c.nsv) fail(`${tag}: ${nsv} support vectors against sklearn's ${c.nsv}`);
  const acc = st.fv.filter((f, i) => Math.sign(f) === val[i].y).length / val.length;
  if (acc !== c.val) fail(`${tag}: accuracy ${acc} on new points vs sklearn's ${c.val}`);
  // optimality of every fit: the full model, then each fold's
  const lessOptimal = [];
  const full = dual(train, st.fit.alpha);
  lessOptimal.push(full < c.objective - 1e-9 * Math.abs(c.objective));
  st.cvAlpha.forEach((a, k) => {
    const pts = train.filter((_, i) => i % 5 !== k);
    const o = dual(pts, a);
    lessOptimal.push(o < c.cv_objectives[k] - 1e-9 * Math.abs(c.cv_objectives[k]));
  });
  lessOptimal.forEach((bad, k) => {
    if (bad) fail(`${tag}: ${k === 0 ? "the model" : `fold ${k - 1}`} has a dual objective below libsvm's`);
  });
  for (const [mine, theirs, what] of [
    [st.ft, c.f, "training"],
    [st.fcv, c.fcv, "held-out"],
  ]) {
    const span = Math.max(...theirs.map(Math.abs));
    for (let i = 0; i < mine.length; i += 1) {
      const d = Math.abs(mine[i] - theirs[i]) / span;
      worstF = Math.max(worstF, d);
      if (d > F_LIMIT) {
        const who = what === "training" ? lessOptimal[0] : lessOptimal[1 + (i % 5)];
        if (who) fail(`${tag}: ${what} score ${i} differs by ${d.toExponential(2)} of span`);
        else excused += 1;
      }
    }
  }

  // ---------------------------------------------------------------- 3. the sigmoids
  const row = { C: c.C };
  for (const [key, f] of [
    ["train", st.ft],
    ["cv", st.fcv],
  ]) {
    const p = plattFit(f, y);
    const r = c[key];
    worstAB = Math.max(worstAB, Math.abs(p.A - r.A), Math.abs(p.B - r.B));
    if (Math.abs(p.A - r.A) > 1e-3 || Math.abs(p.B - r.B) > 1e-3) {
      fail(`${tag} ${key}: A, B = ${p.A.toFixed(5)}, ${p.B.toFixed(5)} vs sklearn ${r.A.toFixed(5)}, ${r.B.toFixed(5)}`);
    }
    const theirs = smoothLoss(f, r.A, r.B);
    if (p.loss > theirs + 1e-9 * Math.abs(theirs)) {
      fail(`${tag} ${key}: Newton loss ${p.loss} above the loss at sklearn's A, B (${theirs})`);
    }
    const mine = ll(st.fv.map((v) => sigmoidAt(v, p.A, p.B)));
    worstLL = Math.max(worstLL, Math.abs(mine - r.ll));
    if (Math.abs(mine - r.ll) > 1e-4) fail(`${tag} ${key}: log loss ${mine} vs sklearn ${r.ll}`);
    row[key] = mine;
  }
  row.squash = ll(st.fv.map((v) => sigmoidAt(v, -1, 0)));
  if (Math.abs(row.squash - c.squash.ll) > 1e-4) fail(`${tag}: squash log loss ${row.squash} vs ${c.squash.ll}`);
  row.p90 = [...st.fv.map(Math.abs)].sort((a, b) => a - b)[Math.floor(0.9 * st.fv.length)];
  row.A = plattFit(st.fcv, y).A;
  got.push(row);
}

console.log(`  ${ref.cases.length} stops, ${ref.cases.length * 6} SVM fits`);
console.log(`  worst score gap ${worstF.toExponential(2)} of span (limit ${F_LIMIT})`);
console.log(`  ${excused} score(s) over that limit, each from a fit at least as optimal as libsvm's`);
console.log("  every fit's dual objective at or above libsvm's, to 1e-9 relative");
console.log(`  worst A or B gap ${worstAB.toExponential(2)} (limit 1e-3); worst log-loss gap ${worstLL.toExponential(2)}`);
console.log(`  most SMO steps in any fit ${maxSteps.toLocaleString("en-US")} (cap ${CAP.toLocaleString("en-US")})\n`);

// ------------------------------------------------------------------ 4. the page's story
const range = (k) => Math.max(...got.map((r) => r[k])) - Math.min(...got.map((r) => r[k]));
if (!(range("squash") > range("train") && range("squash") > range("cv"))) {
  fail("the squash's loss does not vary more across the dial than Platt's");
}
for (const r of got) {
  if (r.C < 100 && !(r.squash > r.train && r.squash > r.cv)) fail(`C=${r.C}: the squash is not the worst`);
}

console.log("       C   |f| p90   A (held-out)   loss: squash   Platt/train   Platt/held-out");
for (const r of got) {
  console.log(
    `  ${String(r.C).padStart(6)} ${r.p90.toFixed(3).padStart(9)} ${r.A.toFixed(2).padStart(14)}` +
      ` ${r.squash.toFixed(4).padStart(14)} ${r.train.toFixed(4).padStart(13)} ${r.cv.toFixed(4).padStart(16)}`,
  );
}

console.log(failed === 0 ? "\nsvm_platt_check: clean" : `\nsvm_platt_check: ${failed} failure(s)`);
process.exit(failed === 0 ? 0 : 1);
