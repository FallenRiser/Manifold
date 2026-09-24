// Does the TypeScript duel behave exactly like the Python one?
//
// Both are fed the SAME boss decisions -- the starting bearing, every cooldown length and every
// move choice, recorded from a Python run by `python scripts/boss_cases.py port` -- and the same
// button on every frame. Any disagreement is then a real difference in the mechanics, not a
// difference between numpy's generator and JavaScript's.
//
//     node scripts/boss_port_check.mjs
//
// Node 22+ strips the types, so this imports the .ts directly.
import { readFileSync } from "node:fs";
import { Duel } from "../src/components/boss/duelSim.ts";

const c = JSON.parse(readFileSync(new URL("../results/boss_port_case.json", import.meta.url), "utf8"));

// Replay the recorded draws in order, in place of a generator.
let i = 0;
const next = (kind) => {
  const [k, v] = c.draws[i++];
  if (k !== kind) throw new Error(`draw ${i - 1} is a ${k}, the port asked for a ${kind}`);
  return v;
};
const oracle = {
  bearing: () => next("bearing"),
  cooldown: () => next("cooldown"),
  choose: () => next("choose"),
};

// the constructor already resets, which consumes the bearing and the first cooldown
const e = new Duel({ oracle });

const KEYS = ["px", "pz", "bx", "bz", "bang", "php", "bhp", "pst", "pa", "pf", "bm", "bf", "bStagger", "bPoise"];
const TOL = 1e-9;
let worst = 0, worstAt = null, bad = 0;

for (let t = 0; t < c.actions.length; t++) {
  e.step(c.actions[t]);
  const want = c.frames[t];
  for (let k = 0; k < KEYS.length; k++) {
    const got = e[KEYS[k]];
    const diff = Math.abs(got - want[k]);
    if (diff > worst) { worst = diff; worstAt = `frame ${t}, ${KEYS[k]}: ts ${got} vs py ${want[k]}`; }
    if (diff > TOL) bad++;
  }
}

const logMap = {
  parries: "parries", blocks: "blocks", guard_breaks: "guardBreaks", hits_taken: "hitsTaken",
  rolls: "rolls", dodges: "dodges", swings: "swings", hits_dealt: "hitsDealt",
  whiffs: "whiffs", arc_misses: "arcMisses", guard_frames: "guardFrames", wall_frames: "wallFrames",
  dmg_dealt: "dmgDealt", dmg_taken: "dmgTaken", poise_breaks: "poiseBreaks",
};
const logBad = [];
for (const [py, ts] of Object.entries(logMap)) {
  if (Math.abs(c.log[py] - e.log[ts]) > 1e-9) logBad.push(`${py}: py ${c.log[py]} vs ts ${e.log[ts]}`);
}

console.log(`replayed ${c.actions.length} frames with ${c.draws.length} recorded boss draws`);
console.log(`  largest disagreement in any tracked quantity: ${worst.toExponential(2)}`);
if (worstAt && worst > 0) console.log(`  (at ${worstAt})`);
console.log(`  counters: ${logBad.length ? "MISMATCH\n    " + logBad.join("\n    ") : "all 15 identical"}`);

if (bad === 0 && logBad.length === 0) {
  console.log("clean — the TypeScript arena and the shipped Python world are the same game.");
  process.exit(0);
}
console.log(`\n${bad} field(s) outside ${TOL}. The port has drifted from the Python.`);
process.exit(1);
