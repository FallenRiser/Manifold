// How decided is the v2 duellist, and does it depend on what the boss is doing?
//
// This exists because of a mistake. The v1 arena shipped a Q-value panel that min-max normalised
// the seventeen values every frame, which made every decision look equally confident -- the FAN
// of the values varies several-fold frame to frame, so rescaling to the extremes throws away the
// only thing the panel was for. A panel that shows confidence has to be encoded against the
// MEASURED spread, which means measuring it first.
//
//   node scripts/boss_qspread_v2.mjs
//   N=200 node scripts/boss_qspread_v2.mjs
//
// Reports the best-minus-second margin, split by the phase of the boss move in progress, because
// "it is indecisive" and "it is indecisive while nothing is happening" are different claims.

import { readFileSync } from "node:fs";
import { Duel, MOVES, ACTION_NAMES, phaseAt } from "../src/components/boss/duelSimV2.ts";
import { decodeNet, qValues, argmax, margin, top2 }
  from "../src/components/boss/trainedPolicyV2.ts";

const here = (p) => new URL(p, import.meta.url);
const TAG = process.env.TAG || "v2_dqn_6000k_s0";
const N = Number(process.env.N || 120);
const REPEAT = 3;

const raw = readFileSync(here(`../public/boss/${TAG}.bin`));
const ab = new ArrayBuffer(raw.byteLength);
new Uint8Array(ab).set(raw);
const net = decodeNet(ab);

const PHASES = [["i", "no move out"], ["w", "windup"], ["d", "DELAY"],
                ["h", "active"], ["r", "recovery"]];
const bucket = {};
for (const [k] of PHASES) bucket[k] = [];
const pairs = new Map();          // how often each (best, runner-up) pair comes up
const all = [];

for (let i = 0; i < N; i++) {
  const e = new Duel({ oracle: (await import("../src/components/boss/duelSimV2.ts")).rngOracle(1000 + i) });
  let act = 0;
  for (;;) {
    if (e.t % REPEAT === 0) {
      const q = qValues(net, e.obs());
      act = argmax(q);
      const k = e.bm >= 0 && e.bStagger === 0 ? phaseAt(MOVES[e.bm], e.bf)[0] : "i";
      const m = margin(q);
      bucket[k].push(m);
      all.push(m);
      const [a, b] = top2(q);
      const key = `${ACTION_NAMES[a]}  vs  ${ACTION_NAMES[b]}`;
      pairs.set(key, (pairs.get(key) || 0) + 1);
    }
    const { terminated, truncated } = e.step(act);
    if (terminated || truncated) break;
  }
}

const pct = (arr, p) => {
  const s = [...arr].sort((x, y) => x - y);
  return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : 0;
};

console.log(`\n${TAG}: best-minus-second Q margin over ${all.length} decisions in ${N} duels\n`);
console.log("  phase          decisions      p10     p25   median      p75      p90");
for (const [k, label] of PHASES) {
  const b = bucket[k];
  if (!b.length) { console.log(`  ${label.padEnd(13)} none`); continue; }
  console.log(`  ${label.padEnd(13)} ${String(b.length).padStart(9)}  `
    + [0.1, 0.25, 0.5, 0.75, 0.9].map((p) => pct(b, p).toFixed(3).padStart(7)).join("  "));
}
console.log(`  ${"ALL".padEnd(13)} ${String(all.length).padStart(9)}  `
  + [0.1, 0.25, 0.5, 0.75, 0.9].map((p) => pct(all, p).toFixed(3).padStart(7)).join("  "));

const med = pct(all, 0.5), p90 = pct(all, 0.9), p10 = pct(all, 0.1);
console.log(`\n  The median decision is won by ${med.toFixed(3)}, and the p90 by ${p90.toFixed(3)} --`);
console.log(`  a ${(p90 / Math.max(p10, 1e-6)).toFixed(0)}x range between the tenth and ninetieth percentile. A panel`);
console.log(`  that rescales to each frame's own min and max erases exactly that difference.`);
console.log(`  Encode against these numbers: below ~${med.toFixed(2)} is a near-tie, above ~${p90.toFixed(2)} is a real call.`);

console.log("\n  the closest calls it keeps having to make (best vs runner-up):");
[...pairs.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).forEach(([k, n]) =>
  console.log(`    ${String(n).padStart(6)}  ${k}`));
console.log("\n  Most of these are pairs of NEIGHBOURING moves. A small margin between two actions");
console.log("  that do almost the same thing is indifference, not confusion -- which is why the");
console.log("  panel names the runner-up instead of only showing a confidence bar.");
