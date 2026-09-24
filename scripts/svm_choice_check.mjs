// The fourteenth guard. KernelChoiceLab runs page 12's substitution in the browser: the same dual
// solver the whole track uses, handed an rbf table instead of a linear one. That is a claim about
// shipped code, so it is checked against something outside itself -- sklearn's answers on the
// identical points, recorded by `python scripts/svm_cases.py reach` into
// results/svm_choice_case.json.
//
// Three things:
//
//   1. the shipped rbfFit lands on sklearn's boundary across three worlds and the whole gamma
//      dial. The tolerance is on the DECISION VALUES and on the labels they imply, not on the
//      multipliers: an SMO and an interior-point QP reach the same model by different routes and
//      will not agree multiplier by multiplier where the solution is degenerate.
//   2. the half-life the lab prints really is sqrt(ln2 / gamma) -- the number the page reasons
//      with, so it gets checked rather than assumed.
//   3. the SHAPE of the support set over the dial, per world. On the two curved worlds it is a
//      U -- too wide and too narrow both cost you points, and the cheapest model is in between.
//      On the straight world there is no U and the count climbs from the first gamma, because a
//      straight boundary has no scale to resolve: the widest kernel on the dial is already the
//      right one. Asserting the U everywhere is what the first version of this guard did, and it
//      failed on correct behaviour. Whatever the shape, the top of the dial pins nearly every
//      point, and that much IS universal.
//
//     node scripts/svm_choice_check.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { rbfFit } from "../src/components/labs/svmSolver.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CASES = path.join(ROOT, "results", "svm_choice_case.json");

if (!fs.existsSync(CASES)) {
  console.log(`missing ${CASES}\nrun:  python scripts/svm_cases.py reach`);
  process.exit(1);
}

const cases = JSON.parse(fs.readFileSync(CASES, "utf8"));

// A decision value is only meaningful against the scale of the problem, and that scale runs over
// orders of magnitude across this dial, so the comparison is relative to each case's own spread.
//
// 8e-2 is loose, deliberately and with a reason. The browser solver is an SMO with a 400-pass
// cap and sklearn's is an interior-point QP run to 1e-10, so on a degenerate problem they stop
// at slightly different points of the same solution: the worst case here is rings/gamma=3 at
// 2.98e-2, on a point sitting at |f| = 1.61, well outside the margin where nothing hinges on it.
// What must NOT drift is the model itself, and those two checks are exact -- every support count
// equal to sklearn's, and not one point labelled differently anywhere.
const F_LIMIT = 8e-2;

let failed = 0;
const fail = (m) => {
  console.log(`  FAIL  ${m}`);
  failed += 1;
};

console.log("kernel choice: the shipped rbf solver against sklearn\n");

// ------------------------------------------------------------------ 1 & 2
const byWorld = new Map();
let worstF = 0;
let worstAt = null;

for (const c of cases) {
  const pts = c.X.map((row, i) => ({ x: row[0], z: row[1], y: c.y[i] > 0 ? 1 : -1 }));
  const fit = rbfFit(pts, 1.0, c.gamma);

  const span = Math.max(...c.f.map(Math.abs));
  let worst = 0;
  let flipped = 0;
  for (let i = 0; i < pts.length; i += 1) {
    worst = Math.max(worst, Math.abs(fit.f[i] - c.f[i]) / Math.max(span, 1e-9));
    if (Math.sign(fit.f[i]) !== Math.sign(c.f[i])) flipped += 1;
  }
  if (worst > worstF) {
    worstF = worst;
    worstAt = `${c.world} gamma=${c.gamma}`;
  }
  if (worst > F_LIMIT) {
    fail(`${c.world} gamma=${c.gamma}: decision values differ by ${worst.toExponential(2)} of span`);
  }
  if (flipped > 0) {
    fail(`${c.world} gamma=${c.gamma}: ${flipped}/${pts.length} points labelled differently`);
  }

  // the half-life the lab prints
  const half = Math.sqrt(Math.LN2 / c.gamma);
  if (Math.abs(Math.exp(-c.gamma * half * half) - 0.5) > 1e-12) {
    fail(`gamma=${c.gamma}: sqrt(ln2/gamma) is not where similarity halves`);
  }

  const nsv = fit.alpha.filter((a) => a > 1e-9).length;
  if (!byWorld.has(c.world)) byWorld.set(c.world, []);
  byWorld.get(c.world).push({ gamma: c.gamma, nsv, n: pts.length, sk: c.nsv });
  if (nsv !== c.nsv) {
    fail(`${c.world} gamma=${c.gamma}: ${nsv} support vectors against sklearn's ${c.nsv}`);
  }
}

console.log(`  ${cases.length} cases across 3 worlds and 8 values of gamma`);
console.log("  every support count equal to sklearn's, and no point labelled differently");
console.log(`  worst decision-value gap ${worstF.toExponential(2)} of the case's own span` +
  ` (at ${worstAt}), limit ${F_LIMIT}`);
console.log("  half-life sqrt(ln2/gamma) is where exp(-gamma r^2) = 1/2, at every gamma\n");

// ------------------------------------------------------------------ 3. the shape of the dial
// The two curved worlds have a scale that has to be resolved, so they pay at both ends. The
// straight world does not, so it only pays at the narrow end.
const WANT_U = { rings: true, moons: true, straight: false };

for (const [world, rows] of byWorld) {
  const counts = rows.map((r) => r.nsv);
  const sk = rows.map((r) => r.sk);
  const n = rows[0].n;
  const top = counts[counts.length - 1];
  const min = Math.min(...counts);
  const iMin = counts.indexOf(min);
  const isU = iMin > 0 && iMin < counts.length - 1;
  console.log(
    `  ${world.padEnd(9)} #sv ${counts.join(" ").padEnd(26)} min ${String(min).padStart(2)}` +
      ` at gamma=${String(rows[iMin].gamma).padEnd(5)} top ${top}/${n}  ${isU ? "U" : "climbing"}`,
  );
  console.log(`  ${" ".repeat(9)} sklearn ${sk.join(" ")}`);

  if (isU !== WANT_U[world]) {
    fail(`${world}: support count is ${isU ? "U-shaped" : "monotone"}, the page says the opposite`);
  }
  // sklearn must agree about the shape, or the lab is illustrating its own solver's habits
  const skMin = sk.indexOf(Math.min(...sk));
  const skIsU = skMin > 0 && skMin < sk.length - 1;
  if (skIsU !== isU) {
    fail(`${world}: shipped solver says ${isU ? "U" : "climbing"}, sklearn says the other`);
  }
  // this much holds everywhere: turn gamma up far enough and the model keeps every point
  if (top < 0.8 * n) {
    fail(`${world}: at gamma=200 only ${top}/${n} points are support vectors, page says nearly all`);
  }
}

console.log(failed === 0 ? "\nclean." : `\n${failed} problem(s).`);
process.exit(failed === 0 ? 0 : 1);
