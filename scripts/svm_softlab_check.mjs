// Does SoftMarginLab actually demonstrate the trade it is on the page to demonstrate?
//
// The lab's whole claim is that C is an exchange rate: push it up and the corridor narrows while
// the debt Sigma xi falls, pull it down and the corridor widens while more points pay. If a
// change to the solver, the iteration count or the sampler flattened that, the lab would go on
// drawing a confident picture that no longer makes the point -- which has happened on this
// project before, in labs whose numbers nobody rechecked.
//
// It also checks the claim the page leans on hardest: with the clouds overlapping, points end up
// on the wrong side at EVERY setting of C, because no line separates them at all.
//
//     node scripts/svm_softlab_check.mjs
import { fitSVM, sampleOverlap } from "../src/components/labs/svmSolver.ts";

const SEEDS = 40;
const N = 90;
// The lab's slider maps 0..100 onto 1e-2..1e2; these are the decade marks it passes through.
const CS = [0.01, 0.1, 1, 10, 100];

function row(C, sep) {
  let margin = 0;
  let sumXi = 0;
  let paying = 0;
  let wrong = 0;
  let everySampleHasWrong = true;
  for (let s = 1; s <= SEEDS; s++) {
    const { pts } = sampleOverlap(s, N, sep);
    const fit = fitSVM(pts, C);
    const xi = fit.slack;
    margin += fit.margin;
    sumXi += xi.reduce((a, v) => a + v, 0);
    paying += xi.filter((v) => v > 1e-9).length;
    const w = xi.filter((v) => v > 1).length;
    wrong += w;
    if (w === 0) everySampleHasWrong = false;
  }
  return {
    C, sep,
    margin: margin / SEEDS,
    sumXi: sumXi / SEEDS,
    paying: paying / SEEDS,
    wrong: wrong / SEEDS,
    everySampleHasWrong,
  };
}

const fails = [];
function check(ok, msg) {
  if (!ok) fails.push(msg);
}

for (const sep of [1.4, 3.0]) {
  console.log(`\n  ${SEEDS} samples of ${N} points, clouds ${sep} apart (spread 1 each)`);
  console.log(
    `  ${"C".padStart(7)} ${"margin".padStart(9)} ${"sum xi".padStart(9)}` +
    `${"paying".padStart(9)} ${"wrong".padStart(8)}`);
  const rows = CS.map((C) => row(C, sep));
  for (const r of rows) {
    console.log(
      `  ${String(r.C).padStart(7)} ${r.margin.toFixed(3).padStart(9)}` +
      ` ${r.sumXi.toFixed(2).padStart(9)} ${r.paying.toFixed(1).padStart(9)}` +
      ` ${r.wrong.toFixed(1).padStart(8)}`);
  }

  const last = rows.length - 1;
  for (let i = 1; i <= last; i++) {
    check(rows[i].margin < rows[i - 1].margin,
      `sep ${sep}: margin did not shrink from C=${rows[i - 1].C} to C=${rows[i].C} ` +
      `(${rows[i - 1].margin.toFixed(3)} -> ${rows[i].margin.toFixed(3)})`);
    // Non-increasing, not strictly decreasing, and to a RELATIVE tolerance. Once the clouds are
    // far enough apart that the fit has stopped buying slack, Sigma xi is sitting on its floor
    // and the top decades of the dial legitimately read the same. Pegasos approaches from
    // outside, so down there the value wobbles by fractions of a percent -- an absolute 1e-6
    // limit flagged a 0.0850 -> 0.0855 step as a reversal. The real drops are multiples, so 5%
    // cannot hide one.
    check(rows[i].sumXi <= rows[i - 1].sumXi * 1.05 + 1e-9,
      `sep ${sep}: sum xi ROSE from C=${rows[i - 1].C} to C=${rows[i].C} ` +
      `(${rows[i - 1].sumXi.toFixed(4)} -> ${rows[i].sumXi.toFixed(4)})`);
    check(rows[i].paying <= rows[i - 1].paying,
      `sep ${sep}: more points pay at C=${rows[i].C} than at C=${rows[i - 1].C}`);
  }

  // A flat lab would pass every monotonicity test above, so the dial also has to MOVE. How far
  // depends on how far apart the clouds are, which is why these are ratios across the dial rather
  // than absolute counts: at sep 3.0 a wide corridor still only reaches 23 of the 90 points,
  // while at sep 1.4 it reaches 60, and both are the lab working.
  const widen = rows[0].margin / rows[last].margin;
  const debt = rows[0].sumXi / rows[last].sumXi;
  const pay = rows[0].paying / Math.max(rows[last].paying, 1e-9);
  console.log(`  across the dial: corridor ${widen.toFixed(1)}x wider, ` +
    `Sigma xi ${debt.toFixed(1)}x larger, ${pay.toFixed(1)}x as many points paying`);
  check(widen > 3, `sep ${sep}: the C dial barely moves the corridor (${widen.toFixed(2)}x)`);
  check(debt > 2, `sep ${sep}: the C dial barely moves the debt (${debt.toFixed(2)}x)`);
  check(pay > 3, `sep ${sep}: the C dial barely changes who pays (${pay.toFixed(2)}x)`);
}

// The page's motivating claim, checked rather than asserted: overlapping clouds leave points on
// the wrong side however hard C leans on them, so there is no hard-margin answer to fall back to.
const tight = CS.map((C) => row(C, 1.4));
check(tight.every((r) => r.everySampleHasWrong),
  "clouds 1.4 apart: some sample was separated perfectly, so slack was not actually forced");

// Pulling the clouds apart has to visibly relieve that. Not to ZERO, though: at sep 3.0 with
// spread 1 the tails still cross often enough that about one sample in ten has a point on the
// wrong side, so this is a ratio and not an equality. Asserting `wrong === 0` here failed, and
// the lab was right and the assertion wrong.
const wide = row(100, 3.0);
const relief = tight[tight.length - 1].wrong / Math.max(wide.wrong, 1e-9);
console.log(`\n  wrong-side points at C=100: ${tight[tight.length - 1].wrong.toFixed(2)} when the` +
  ` clouds are 1.4 apart, ${wide.wrong.toFixed(2)} at 3.0 -- ${relief.toFixed(0)}x fewer`);
check(relief > 10,
  `separating the clouds only cut wrong-side points ${relief.toFixed(1)}x, so the lab cannot ` +
  "show that the overlap is what forces the slack");

console.log();
if (fails.length) {
  for (const f of fails) console.log(`  FAIL  ${f}`);
  console.log(`\n${fails.length} check(s) failed -- the lab no longer shows what the page says.`);
  process.exit(1);
}
console.log("clean -- the C dial still trades corridor width against slack, in both directions.");
