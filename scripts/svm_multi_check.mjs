// Page 17's guard. MultiClassLab builds three-class SVMs out of binary ones in the browser, both
// ways -- one-vs-rest and one-vs-one -- with a linear and an rbf kernel, on two layouts. Every
// region it shades and every recall it prints is a claim about 24 binary fits. They are held
// against sklearn's answers on the identical points, recorded by
// `python scripts/svm_cases.py masking` into results/svm_multi_case.json.
//
// Four things:
//
//   1. the lab's points are the script's points, exactly.
//   2. every binary model is sklearn's: stopped on the KKT tolerance, not the step cap; a dual
//      objective no lower than libsvm's (1e-9 relative); decision values within 1e-5 of span
//      unless the browser is the more optimal side (page 16's rule); the same support count.
//
//      One exception to the support count, worked out rather than waved through. On the row
//      layout, linear B-vs-rest has no line to offer: its optimum is w = 0, a constant score of
//      -1. With w = 0 the prices are not unique -- many ways of spending them give the same
//      zero-weight boundary -- so the count is not a property of the model. For a model whose
//      decision values are constant to 1e-5, the count is reported, not compared.
//   3. the three-class labels on all 600 new points equal sklearn's, and so does every
//      per-class recall.
//   4. the page's story is there: on the row layout, linear one-vs-rest gets at most 0.6 of
//      the middle class and one-vs-one at least 0.8, and B-vs-rest says "B" to none of B's own
//      training points; on the triangle, all four settings are within 0.01 of each other.
//
//     node scripts/svm_multi_check.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MULTI_PAIRS, multiData, multiFit } from "../src/components/labs/svmSolver.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CASES = path.join(ROOT, "results", "svm_multi_case.json");

if (!fs.existsSync(CASES)) {
  console.log(`missing ${CASES}\nrun:  python scripts/svm_cases.py masking`);
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

console.log("Multi-class: the shipped fits against sklearn\n");

const got = {};
let worstF = 0;
let maxSteps = 0;
let excused = 0;
let fitted = 0;
for (const layout of ["row", "triangle"]) {
  const r = ref[layout];
  const { train, val } = multiData(layout);

  // ---------------------------------------------------------------- 1. the same points
  let worstPt = 0;
  for (const [mine, theirs] of [
    [train, r.train],
    [val, r.val],
  ]) {
    if (mine.length !== theirs.length) fail(`${layout}: ${mine.length} points against ${theirs.length}`);
    for (let i = 0; i < mine.length; i += 1) {
      worstPt = Math.max(
        worstPt,
        Math.abs(mine[i].x - theirs[i].x),
        Math.abs(mine[i].z - theirs[i].z),
        Math.abs(mine[i].c - theirs[i].c),
      );
    }
  }
  if (worstPt !== 0) fail(`${layout}: the lab's points differ from the script's by ${worstPt}`);

  for (const kernel of ["linear", "rbf"]) {
    for (const strat of ["ovr", "ovo"]) {
      const key = `${kernel}/${strat}`;
      const tag = `${layout} ${key}`;
      const c = r.fits[key];
      const fit = multiFit(train, kernel, strat);

      // -------------------------------------------------------------- 2. every binary model
      fit.models.forEach((m, j) => {
        fitted += 1;
        const cm = c.models[j];
        const want = strat === "ovr" ? [j, null] : MULTI_PAIRS[j];
        if (m.pos !== cm.pos || m.neg !== cm.neg || m.pos !== want[0] || m.neg !== want[1]) {
          fail(`${tag}: model ${j} is ${m.pos} vs ${m.neg}, the script's is ${cm.pos} vs ${cm.neg}`);
        }
        const mt = `${tag} ${m.pos} vs ${m.neg === null ? "rest" : m.neg}`;
        maxSteps = Math.max(maxSteps, m.steps);
        if (m.steps >= CAP) fail(`${mt}: smoFit hit its step cap -- it did not converge`);
        const y = m.idx.map((i) => (train[i].c === m.pos ? 1 : -1));
        let obj = 0;
        for (let a = 0; a < y.length; a += 1) {
          obj += m.alpha[a];
          for (let b = 0; b < y.length; b += 1) {
            if (m.alpha[a] === 0 || m.alpha[b] === 0) continue;
            const p = train[m.idx[a]];
            const q = train[m.idx[b]];
            const k =
              kernel === "linear"
                ? p.x * q.x + p.z * q.z
                : Math.exp(-0.5 * ((p.x - q.x) ** 2 + (p.z - q.z) ** 2));
            obj -= 0.5 * m.alpha[a] * m.alpha[b] * y[a] * y[b] * k;
          }
        }
        const lessOptimal = obj < cm.objective - 1e-9 * Math.abs(cm.objective);
        if (lessOptimal) fail(`${mt}: dual objective ${obj} below sklearn's ${cm.objective}`);
        const span = Math.max(...cm.f.map(Math.abs));
        let worst = 0;
        for (let i = 0; i < y.length; i += 1) worst = Math.max(worst, Math.abs(m.f[i] - cm.f[i]) / span);
        worstF = Math.max(worstF, worst);
        if (worst > F_LIMIT) {
          if (lessOptimal) fail(`${mt}: decision values differ by ${worst.toExponential(2)} of span`);
          else excused += 1;
        }
        const flat = Math.max(...cm.f) - Math.min(...cm.f) < F_LIMIT;
        if (flat) {
          console.log(`  ${mt}: constant score ${cm.f[0].toFixed(4)} -- w = 0; support count ` +
            `${m.nsv} here, ${cm.nsv} in sklearn (not unique, not compared)`);
        } else if (m.nsv !== cm.nsv) {
          fail(`${mt}: ${m.nsv} support vectors against sklearn's ${cm.nsv}`);
        }
      });

      // -------------------------------------------------------------- 3. labels and recall
      const pred = val.map((p) => fit.predict(p.x, p.z));
      const diff = pred.filter((v, i) => v !== c.pred[i]).length;
      if (diff) fail(`${tag}: ${diff}/${val.length} new points labelled differently from sklearn`);
      const recall = [0, 1, 2].map((k) => {
        const own = val.map((p, i) => [p.c, pred[i]]).filter(([t]) => t === k);
        return own.filter(([, v]) => v === k).length / own.length;
      });
      recall.forEach((v, k) => {
        if (v !== c.recall[k]) fail(`${tag}: recall of class ${k} ${v} vs sklearn ${c.recall[k]}`);
      });
      const acc = pred.filter((v, i) => v === val[i].c).length / val.length;
      if (acc !== c.acc) fail(`${tag}: accuracy ${acc} vs sklearn ${c.acc}`);

      // the share of the lab's plot with no clean winner, on the lab's own 30 x 30 grid
      let lim = 1.2;
      for (const p of train) lim = Math.max(lim, Math.abs(p.x) + 0.25, Math.abs(p.z) + 0.25);
      lim = Math.round(lim * 1000) / 1000;
      let unclear = 0;
      for (let a = 0; a < 30; a += 1) {
        for (let b = 0; b < 30; b += 1) {
          const x = -lim + ((a + 0.5) * 2 * lim) / 30;
          const z = -lim + ((b + 0.5) * 2 * lim) / 30;
          if (!fit.clean(x, z)) unclear += 1;
        }
      }
      got[tag] = { acc, recall, unclear: unclear / 900, fit, train };
    }
  }
}

console.log(`\n  ${fitted} binary fits`);
console.log(`  worst decision-value gap ${worstF.toExponential(2)} of span, limit ${F_LIMIT}`);
console.log(`  ${excused} fit(s) over that limit, each with a dual objective at or above libsvm's`);
console.log(`  most SMO steps in any fit ${maxSteps.toLocaleString("en-US")} (cap ${CAP.toLocaleString("en-US")})\n`);

// ------------------------------------------------------------------ 4. the page's story
const rowR = got["row linear/ovr"];
const rowO = got["row linear/ovo"];
if (!(rowR.recall[1] <= 0.6)) fail(`row: linear one-vs-rest gets ${rowR.recall[1]} of B, the page says half`);
if (!(rowO.recall[1] >= 0.8)) fail(`row: linear one-vs-one gets ${rowO.recall[1]} of B`);
const bModel = rowR.fit.models[1];
const saysB = bModel.f.filter((v, i) => v > 0 && rowR.train[bModel.idx[i]].c === 1).length;
if (saysB !== 0) fail(`row: B-vs-rest says "B" to ${saysB} of B's training points, the page says none`);
const tri = ["linear/ovr", "linear/ovo", "rbf/ovr", "rbf/ovo"].map((k) => got[`triangle ${k}`].acc);
if (Math.max(...tri) - Math.min(...tri) > 0.01) fail(`triangle: accuracies ${tri} are not within 0.01`);

for (const [tag, v] of Object.entries(got)) {
  console.log(
    `  ${tag.padEnd(20)} acc ${v.acc.toFixed(4)}  recall ${v.recall.map((x) => x.toFixed(3)).join(" ")}` +
      `  no clean winner ${(100 * v.unclear).toFixed(1)}% of the plot`,
  );
}

console.log(failed === 0 ? "\nsvm_multi_check: clean" : `\nsvm_multi_check: ${failed} failure(s)`);
process.exit(failed === 0 ? 0 : 1);
