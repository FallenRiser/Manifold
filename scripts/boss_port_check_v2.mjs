// Does the TypeScript v2 duel behave exactly like the Python v2 one?
//
// Both are fed the SAME boss decisions -- the starting bearing, every cooldown length and every
// move choice, recorded from a Python run by `python scripts/boss_v2_cases.py port` -- and the
// same button on every frame. Any disagreement is then a real difference in the mechanics, not a
// difference between numpy's generator and JavaScript's.
//
// Two cases, not one. 'patient parry' exercises the reads, the rolls and the heavy attack;
// 'mash parry' is the only thing that drives the new fatigue counter to its ceiling, and the
// parry state (stack, heat, window) is compared frame by frame like everything else.
//
//     node scripts/boss_port_check_v2.mjs
//
// Node 22+ strips the types, so this imports the .ts directly.
import { readFileSync } from "node:fs";
import { Duel } from "../src/components/boss/duelSimV2.ts";

const c = JSON.parse(readFileSync(new URL("../results/boss_port_case_v2.json", import.meta.url), "utf8"));

// The TypeScript field for each Python field, in the order the case file records them.
const FIELD = {
  px: "px", pz: "pz", bx: "bx", bz: "bz", bang: "bang", php: "php", bhp: "bhp", pst: "pst",
  pa: "pa", pf: "pf", bm: "bm", bf: "bf",
  b_stagger: "bStagger", b_poise: "bPoise",
  parry_stack: "parryStack", parry_heat: "parryHeat", parry_win: "parryWin",
};
const LOG = {
  parries: "parries", blocks: "blocks", guard_breaks: "guardBreaks", hits_taken: "hitsTaken",
  rolls: "rolls", dodges: "dodges", swings: "swings", heavies: "heavies",
  hits_dealt: "hitsDealt", whiffs: "whiffs", arc_misses: "arcMisses",
  guard_frames: "guardFrames", wall_frames: "wallFrames", dmg_dealt: "dmgDealt",
  dmg_taken: "dmgTaken", poise_breaks: "poiseBreaks", parry_mashes: "parryMashes",
  parry_dead: "parryDead",
};
const TOL = 1e-9;

let anyBad = 0;
console.log(`\n${c.cases.length} recorded duels, ${c.keys.length} state fields compared every frame.\n`);

for (const cs of c.cases) {
  let i = 0;
  const next = (kind) => {
    const [k, v] = cs.draws[i++];
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

  let worst = 0;
  let worstAt = null;
  let bad = 0;
  for (let t = 0; t < cs.actions.length; t++) {
    e.step(cs.actions[t]);
    const want = cs.frames[t];
    for (let k = 0; k < c.keys.length; k++) {
      const got = e[FIELD[c.keys[k]]];
      const diff = Math.abs(got - want[k]);
      if (diff > worst) {
        worst = diff;
        worstAt = `frame ${t}, ${c.keys[k]}: ts ${got} vs py ${want[k]}`;
      }
      if (diff > TOL) bad++;
    }
  }

  const logBad = [];
  for (const [py, ts] of Object.entries(LOG)) {
    if (Math.abs(cs.log[py] - e.log[ts]) > 1e-9) {
      logBad.push(`${py}: py ${cs.log[py]} vs ts ${e.log[ts]}`);
    }
  }

  const n = cs.actions.length * c.keys.length;
  console.log(`  ${cs.player.padEnd(14)} seed ${cs.seed}  ${String(cs.actions.length).padStart(4)} frames`);
  console.log(`    state    ${bad === 0 ? "all " + n + " values identical" : bad + " of " + n + " differ"}`);
  console.log(`    worst    ${worst.toExponential(2)}${worstAt && worst > TOL ? "  " + worstAt : ""}`);
  console.log(`    counters ${logBad.length === 0 ? "all " + Object.keys(LOG).length + " identical" : logBad.join("; ")}`);
  console.log(`    parry    py ${cs.log.parries} landed / ${cs.log.parry_mashes} mashed / ${cs.log.parry_dead} dead`);
  console.log();
  anyBad += bad + logBad.length;
}

if (anyBad === 0) {
  console.log("clean -- the TypeScript arena and the shipped Python world are the same game.\n");
} else {
  console.log(`FAILED -- ${anyBad} disagreement(s).\n`);
  process.exit(1);
}
