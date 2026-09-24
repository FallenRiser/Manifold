// How wide is the fan of Q-values the arena panel has to draw?
//
// The panel on `watch-it-fight` draws sixteen bars, one per button, re-computed every three
// frames. Its first version min-max normalised them inside each frame -- (q - worst) / (best -
// worst) -- which is the obvious choice and the wrong one, because it throws away the only thing
// that varies: how far apart the sixteen values actually are. This measures that.
//
//     node scripts/boss_qspread.mjs
//
// Node 22+ strips the types, so this imports the .ts directly, as boss_policy_check.mjs does.
import { readFileSync } from "node:fs";
import { Duel, ACTION_NAMES, rngOracle } from "../src/components/boss/duelSim.ts";
import { decodeNet, qValues, argmax } from "../src/components/boss/trainedPolicy.ts";

// 200 duels, matching the count `boss_train.py probe` uses. The duels themselves are NOT the
// same ones: this world is seeded by mulberry32 and the Python one by numpy PCG64, so these are
// an independent sample of the same policy rather than a reproduction of that run.
const DUELS = Number(process.env.DUELS || 200);
const SEED0 = Number(process.env.SEED0 || 1000);
const REPEAT = 3;      // the shipped decision rate
const Q_SPAN = 4;      // the fixed half-width the panel now uses, in raw Q units
const WIDE = 0.9;      // a bar this full or fuller is "pinned" -- it reads as maximum

const here = (p) => new URL(p, import.meta.url);
const raw = readFileSync(here("../public/boss/dqn_2000k_s0.bin"));
const net = decodeNet(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength));

const pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.round(p * (s.length - 1))]; };
const row = (label, a) =>
  console.log(`  ${label.padEnd(20)} ${pct(a, 0.1).toFixed(2).padStart(7)} ${pct(a, 0.5).toFixed(2).padStart(8)}`
    + `${pct(a, 0.9).toFixed(2).padStart(8)} ${Math.max(...a).toFixed(2).padStart(7)}`);

const fans = [], margins = [], vals = [], pinnedOld = [], pinnedNew = [];
const openingOld = [];   // the first three seconds, which is all most readers watch
const picks = new Array(ACTION_NAMES.length).fill(0);
let n = 0;

for (let d = 0; d < DUELS; d++) {
  const e = new Duel({ oracle: rngOracle(SEED0 + d) });
  let done = false, decision = 0;
  while (!done) {
    const q = qValues(net, e.obs());
    let lo = Infinity, hi = -Infinity, sum = 0;
    for (let i = 0; i < q.length; i++) {
      if (q[i] < lo) lo = q[i];
      if (q[i] > hi) hi = q[i];
      sum += q[i];
    }
    const mean = sum / q.length;
    const sorted = [...q].sort((a, b) => b - a);
    fans.push(hi - lo);
    margins.push(sorted[0] - sorted[1]);
    vals.push(lo, hi);

    // How many of the sixteen bars read as "full" under each encoding?
    let old = 0, neu = 0;
    for (let i = 0; i < q.length; i++) {
      if ((q[i] - lo) / Math.max(1e-9, hi - lo) >= WIDE) old++;
      if (Math.min(1, Math.sqrt(Math.abs(q[i] - mean) / Q_SPAN)) >= WIDE) neu++;
    }
    pinnedOld.push(old);
    pinnedNew.push(neu);
    if (decision++ < 30) openingOld.push(old);   // 30 decisions = 90 frames = 3 seconds

    const act = argmax(q);
    picks[act]++;
    n++;
    for (let k = 0; k < REPEAT; k++) {
      const out = e.step(act);
      if (out.terminated || out.truncated) { done = true; break; }
    }
  }
}

console.log(`${n} decisions over ${DUELS} duels of the trained net\n`);
console.log("                           p10   median     p90     max");
row("fan (best - worst)", fans);
row("margin (best - 2nd)", margins);
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
console.log(`\n  raw Q-values run from ${Math.min(...vals).toFixed(1)} to ${Math.max(...vals).toFixed(1)}.`);
console.log(`  The fan is the number that matters, and it is ${(pct(fans, 0.9) / pct(fans, 0.5)).toFixed(0)}x wider at the 90th percentile`);
console.log(`  than at the median, ${(pct(fans, 0.9) / pct(fans, 0.1)).toFixed(0)}x wider than at the 10th. A scale recomputed inside each`);
console.log(`  frame divides by exactly that, so a full-width bar stands for ${pct(fans, 0.5).toFixed(2)} of Q in a`);
console.log(`  median frame and ${pct(fans, 0.9).toFixed(2)} in a wide one. There is no reading certainty off it.`);

console.log("\nbars reading as full (>= 90% of the track), out of 16:");
const pin = (label, a) =>
  console.log(`  ${label.padEnd(24)} median ${pct(a, 0.5)}    mean ${mean(a).toFixed(1)}`);
pin("normalised per frame", pinnedOld);
pin("...its first 3 seconds", openingOld);
pin(`fixed +/-${Q_SPAN} scale`, pinnedNew);
console.log(`\n  ${(100 * mean(pinnedOld) / ACTION_NAMES.length).toFixed(0)}% of the panel pinned against the right-hand edge on an average frame is`);
console.log(`  the visible symptom; the unreadable scale is the defect. A fixed scale clips ${(100 * mean(pinnedNew) / ACTION_NAMES.length).toFixed(0)}%`);
console.log("  of bars instead, which is the price of being able to compare two frames at all.");

console.log("\nwhat it presses, greedy, no exploration:");
picks.map((c, i) => [ACTION_NAMES[i], (100 * c) / n])
  .filter(([, s]) => s >= 0.5)
  .sort((a, b) => b[1] - a[1])
  .forEach(([name, s]) => console.log(`  ${name.padEnd(16)} ${s.toFixed(2)}%`));
