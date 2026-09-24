// Does the TypeScript copy of the trained duellist agree with torch?
//
// The arena lab lets you watch the policy that won 200 of 200 held-out duels. That claim is only
// honest if the thing running in the browser computes what torch computed, so this replays real
// duel states -- recorded off real duels by `python scripts/boss_train.py export` -- through the
// whole browser path and compares at every stage:
//
//   state  ->  Duel.obs()      27 floats, against the shipped Python obs()
//          ->  qValues()       16 Q-values, against torch
//          ->  argmax          the button, which is the only thing you actually see
//
//     python scripts/boss_train.py export
//     node scripts/boss_policy_check.mjs
//
// Node 22+ strips the types, so this imports the .ts directly, exactly as boss_port_check.mjs does.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { Duel, ACTION_NAMES } from "../src/components/boss/duelSim.ts";
import { decodeNet, qValues, argmax, N_OBS, N_ACTIONS } from "../src/components/boss/trainedPolicy.ts";

const here = (p) => new URL(p, import.meta.url);
const c = JSON.parse(readFileSync(here("../results/boss_policy_case.json"), "utf8"));
const man = JSON.parse(readFileSync(here(`../public/boss/${c.tag}.json`), "utf8"));
const raw = readFileSync(here(`../public/boss/${c.tag}.bin`));

let fail = 0;
const check = (ok, msg) => { if (!ok) fail++; console.log(`  ${ok ? "ok  " : "FAIL"} ${msg}`); };

console.log(`case: ${c.obs.length} states from ${c.tag}\n`);

// 0. the constants the browser hard-codes are the ones torch actually exported
check(N_OBS === c.obsWidth && N_OBS === man.obs, `observation width ${N_OBS} matches the manifest`);
check(N_ACTIONS === c.actions && N_ACTIONS === man.actions, `action count ${N_ACTIONS} matches the manifest`);
check(ACTION_NAMES.length === N_ACTIONS && ACTION_NAMES.every((n, i) => n === man.actionNames[i]),
  `the sixteen button labels are in the same order as the sixteen outputs`);

// 1. the weights the browser will fetch are the weights torch exported
const sha1 = createHash("sha1").update(raw).digest("hex");
check(sha1 === c.sha1, `weights sha1 ${sha1.slice(0, 12)} is the one torch recorded`);
check(raw.byteLength === man.bytes, `${raw.byteLength} bytes, ${man.params} parameters`);
if (fail) process.exit(1);

// Node's Buffer may not be 4-byte aligned, so copy into a fresh ArrayBuffer before viewing it.
const ab = new ArrayBuffer(raw.byteLength);
new Uint8Array(ab).set(raw);
const net = decodeNet(ab);

// 2. obs(): drive a real Duel to each recorded state and rebuild the vector
const e = new Duel();
let worstV = 0, worstVAt = null;
const mine = [];
for (let i = 0; i < c.state.length; i++) {
  Object.assign(e, c.state[i]);
  e.guarding = !!c.state[i].guarding;
  const got = e.obs();
  mine.push(Float32Array.from(got));
  for (let k = 0; k < N_OBS; k++) {
    const d = Math.abs(got[k] - c.obs[i][k]);
    if (d > worstV) { worstV = d; worstVAt = `state ${i}, v[${k}]: ts ${got[k]} vs py ${c.obs[i][k]}`; }
  }
}
check(worstV < 1e-6, `obs() agrees to ${worstV.toExponential(2)} over ${c.state.length * N_OBS} floats`);
if (worstVAt && worstV > 0) console.log(`       worst at ${worstVAt}`);

// 3. qValues(): the same three matmuls, on the vector the browser itself just built
let worstQ = 0, worstQAt = null, agree = 0, gapSum = 0;
for (let i = 0; i < mine.length; i++) {
  const got = qValues(net, mine[i]);
  const want = c.q[i];
  for (let k = 0; k < N_ACTIONS; k++) {
    const d = Math.abs(got[k] - want[k]);
    if (d > worstQ) { worstQ = d; worstQAt = `state ${i}, action ${k}: ts ${got[k]} vs py ${want[k]}`; }
  }
  if (argmax(got) === argmax(want)) agree++;
  const sorted = [...want].sort((x, y) => y - x);
  gapSum += sorted[0] - sorted[1];
}
// float32 accumulated in a different order than torch's BLAS differs in the last bits; the
// disagreement worth caring about is one big enough to flip a button.
check(worstQ < 2e-3, `Q-values agree to ${worstQ.toExponential(2)} over ${mine.length * N_ACTIONS} values`);
if (worstQAt && worstQ > 0) console.log(`       worst at ${worstQAt}`);
check(agree === mine.length, `same button chosen ${agree}/${mine.length}`);
console.log(`       mean margin between best and second-best Q: ${(gapSum / mine.length).toFixed(3)}`);

console.log(fail
  ? `\nFAIL -- the browser would play differently from the net that was scored.`
  : `\nOK -- the browser runs the same policy that scored ${man.final.win}/${man.final.n}.`);
process.exit(fail ? 1 : 0);
