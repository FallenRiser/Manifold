// Is the bound DualityLab draws actually a bound?
//
// The lab's entire argument is that the curve it plots never crosses the line marked "the
// answer", and touches it at exactly one place. Those are two claims about forty lines of
// closed-form arithmetic, and a sign slip in either the Lagrangian or the constraint rows would
// produce a curve that looks just as plausible while teaching the opposite of duality.
//
// So: sweep the price square densely and check the bound holds everywhere, check it is attained,
// check it is attained where the second price is zero, and check the minimiser the lab draws is
// the one the formula says.
//
//     node scripts/svm_dualitylab_check.mjs
import {
  TINY_G, TINY_H, TINY_OPT, TINY_P_STAR, tinyLagrangian, tinyObjective,
} from "../src/components/labs/svmSolver.ts";

const fails = [];

// The answer the lab marks has to be the real one: feasible, and no feasible point beats it.
{
  const [ox, oy] = TINY_OPT;
  const c0 = TINY_G[0][0] * ox + TINY_G[0][1] * oy - TINY_H[0];
  const c1 = TINY_G[1][0] * ox + TINY_G[1][1] * oy - TINY_H[1];
  if (c0 > 1e-12 || c1 > 1e-12) fails.push("the marked optimum is not feasible");
  if (Math.abs(tinyObjective(ox, oy) - TINY_P_STAR) > 1e-12) {
    fails.push("the marked optimum does not have the objective the lab prints");
  }
  let best = Infinity;
  for (let i = 0; i <= 700; i++) {
    for (let j = 0; j <= 700; j++) {
      const x = -1 + (i / 700) * 5;
      const y = -1 + (j / 700) * 5;
      if (x + y < 2 - 1e-12 || x < 0.5 - 1e-12) continue;
      best = Math.min(best, tinyObjective(x, y));
    }
  }
  console.log(`\n  ${"best feasible point on a 701x701 sweep".padEnd(46)}${best.toFixed(8)}`);
  console.log(`  ${"what the lab marks as the answer".padEnd(46)}${TINY_P_STAR.toFixed(8)}`);
  if (best < TINY_P_STAR - 1e-6) {
    fails.push(`the sweep found ${best.toFixed(8)}, below the marked answer`);
  }
}

// Weak duality, swept rather than argued: no non-negative pair of prices may beat the answer.
let worstOver = -Infinity;
let best = { g: -Infinity, lam: [0, 0] };
const N = 600;
for (let i = 0; i <= N; i++) {
  for (let j = 0; j <= N; j++) {
    const lam = [(i / N) * 4, (j / N) * 4];
    const { g } = tinyLagrangian(lam);
    worstOver = Math.max(worstOver, g - TINY_P_STAR);
    if (g > best.g) best = { g, lam };
  }
}
console.log(`\n  ${"price pairs swept".padEnd(46)}${((N + 1) ** 2).toLocaleString("en-US")}`);
console.log(`  ${"worst excess over the answer".padEnd(46)}${worstOver.toExponential(2)}`);
console.log(`  ${"best bound found".padEnd(46)}${best.g.toFixed(10)}`);
console.log(`  ${"at prices".padEnd(46)}(${best.lam[0].toFixed(4)}, ${best.lam[1].toFixed(4)})`);
if (worstOver > 1e-9) {
  fails.push(`a price pair beat the answer by ${worstOver.toExponential(2)} -- not a bound`);
}
if (TINY_P_STAR - best.g > 1e-6) {
  fails.push(`the best bound falls ${(TINY_P_STAR - best.g).toExponential(2)} short; the lab ` +
    "claims it closes");
}

// Complementary slackness: the price on the constraint with room must come out zero.
if (Math.abs(best.lam[1]) > 1e-6) {
  fails.push(`the slack constraint priced at ${best.lam[1].toFixed(4)}, it must be 0`);
}
if (Math.abs(best.lam[0] - 1) > 1e-6) {
  fails.push(`the binding constraint priced at ${best.lam[0].toFixed(4)}, it must be 1`);
}

// At those prices the unconstrained minimiser has to BE the constrained answer -- that is what
// the lab shows by sliding the dot onto the ring, and it is the part a sign slip would break.
{
  const { u, g } = tinyLagrangian([1, 0]);
  const off = Math.hypot(u[0] - TINY_OPT[0], u[1] - TINY_OPT[1]);
  console.log(`\n  ${"at the best prices, the dot lands".padEnd(46)}` +
    `(${u[0].toFixed(6)}, ${u[1].toFixed(6)})`);
  console.log(`  ${"distance from the marked optimum".padEnd(46)}${off.toExponential(2)}`);
  console.log(`  ${"and the bound reads".padEnd(46)}${g.toFixed(10)}`);
  if (off > 1e-9) fails.push(`the dot lands ${off.toExponential(2)} from the optimum`);
}

// A price above zero on the non-binding constraint must make the bound strictly worse, or the
// lab's second caption is false.
{
  let monotone = true;
  let prev = tinyLagrangian([1, 0]).g;
  for (let j = 1; j <= 60; j++) {
    const g = tinyLagrangian([1, (j / 60) * 0.6]).g;
    if (g > prev + 1e-12) monotone = false;
    prev = g;
  }
  console.log(`  ${"raising the second price only ever hurts".padEnd(46)}${monotone}`);
  if (!monotone) fails.push("raising the price on the slack constraint improved the bound");
}

console.log();
if (fails.length) {
  for (const f of fails) console.log(`  FAIL  ${f}`);
  console.log(`\n${fails.length} check(s) failed -- the lab is not drawing duality.`);
  process.exit(1);
}
console.log("clean -- the bound holds everywhere, closes once, and closes where the slack " +
  "price is zero.");
