// Does the TypeScript copy of the v2 duellist agree with torch?
//
// The v2 arena lets you watch the trained policy and reads its Q-values off the screen. That is
// only honest if the thing running in the browser computes what torch computed, so this replays
// real duel states -- recorded by `python scripts/boss_v2_train.py export` -- through the whole
// browser path and compares at every stage:
//
//   state  ->  Duel.obs()      38 floats, against the shipped Python obs()
//          ->  qValues()       17 Q-values, against torch
//          ->  argmax          the button, which is the only thing you actually see
//
// It also checks the WORLD hash, which the v1 check has no equivalent of and should: the net
// carries the BOSS_SETUP_V2 sha1 it trained against, and if the repo's world has moved since,
// every number on the page is about a world that no longer exists.
//
//     python scripts/boss_v2_train.py export --tag v2_dqn_6000k_s0
//     node scripts/boss_policy_check_v2.mjs
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { Duel, ACTION_NAMES } from "../src/components/boss/duelSimV2.ts";
import { decodeNet, qValues, argmax, margin, N_OBS, N_ACTIONS }
  from "../src/components/boss/trainedPolicyV2.ts";

const here = (p) => new URL(p, import.meta.url);
const c = JSON.parse(readFileSync(here("../results/boss_policy_case_v2.json"), "utf8"));
const man = JSON.parse(readFileSync(here(`../public/boss/${c.tag}.json`), "utf8"));
const raw = readFileSync(here(`../public/boss/${c.tag}.bin`));

let fail = 0;
const check = (ok, msg) => { if (!ok) fail++; console.log(`  ${ok ? "ok  " : "FAIL"} ${msg}`); };

console.log(`case: ${c.obs.length} states from ${c.tag}\n`);

// 0. the constants the browser hard-codes are the ones torch actually exported
check(N_OBS === c.obsWidth && N_OBS === man.obs, `observation width ${N_OBS} matches the manifest`);
check(N_ACTIONS === c.actions && N_ACTIONS === man.actions, `action count ${N_ACTIONS} matches the manifest`);
check(ACTION_NAMES.length === N_ACTIONS && ACTION_NAMES.every((n, i) => n === man.actionNames[i]),
  `the ${N_ACTIONS} button labels are in the same order as the ${N_ACTIONS} outputs`);

// 0b. the world this net was trained against is still the world in this repo
const src = readFileSync(here("../src/lib/runtimeSetup.ts"), "utf8");
const m = src.match(/export const BOSS_SETUP_V2 = `([\s\S]*?)\n`;/);
const worldNow = createHash("sha1").update(m[1]).digest("hex").slice(0, 12);
check(worldNow === man.world_sha1,
  `world ${worldNow} is the one the net trained against (${man.world_sha1})`);

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
let worstQ = 0, worstQAt = null, agree = 0;
const gaps = [];
for (let i = 0; i < mine.length; i++) {
  const got = qValues(net, mine[i]);
  const want = c.q[i];
  for (let k = 0; k < N_ACTIONS; k++) {
    const d = Math.abs(got[k] - want[k]);
    if (d > worstQ) { worstQ = d; worstQAt = `state ${i}, action ${k}: ts ${got[k]} vs py ${want[k]}`; }
  }
  if (argmax(got) === argmax(want)) agree++;
  gaps.push(margin(want));
}
check(worstQ < 2e-3, `Q-values agree to ${worstQ.toExponential(2)} over ${mine.length * N_ACTIONS} values`);
if (worstQAt && worstQ > 0) console.log(`       worst at ${worstQAt}`);
check(agree === mine.length, `same button chosen ${agree}/${mine.length}`);

gaps.sort((a, b) => a - b);
const q = (p) => gaps[Math.min(gaps.length - 1, Math.floor(p * gaps.length))];
console.log(`       best-minus-second margin: p10 ${q(0.1).toFixed(3)}  median ${q(0.5).toFixed(3)}`
  + `  p90 ${q(0.9).toFixed(3)}`);
console.log("       (a panel showing confidence encodes against THAT spread, not against each");
console.log("        frame's own min and max -- see the note in trainedPolicyV2.ts)");

console.log(fail
  ? `\nFAIL -- the browser would play differently from the net that was scored.`
  : `\nOK -- the browser runs the same policy that scored ${man.final.win}/${man.final.n}.`);
process.exit(fail ? 1 : 0);
