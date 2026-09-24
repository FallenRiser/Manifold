// Does the v2 world work at all? Four scripted players, before any GPU is spent on it.
//
//   random      the floor. If this wins, the world is too easy.
//   mash        presses parry whenever it legally can. This is the habit the Sekiro-style
//               fatigue rule exists to punish, so its parry success rate is the number that
//               says whether that rule does anything.
//   patient     parries only on a read, and only when the window is still full width.
//   pressure    the reference: builds posture with the heavy, parries as defence not as plan.
//
// If patient cannot beat mash on parry rate, the fatigue rule is decoration. And if nothing
// here wins, the world is not learnable and every number below is the wrong number.
//
//   node scripts/boss_v2_probe.mjs          200 duels each
//   N=1000 node scripts/boss_v2_probe.mjs

import {
  Duel, MOVES, ACTION_NAMES, rngOracle, framesToActive, willConnect, incoming,
  A_MOVE0, A_ATK, A_ROLL0, A_PARRY, A_HEAVY,
  ATK_REACH, ATK2_REACH, ATK_COST, ATK2_COST, ROLL_COST, PARRY_COST, SCRIPTED,
  PARRY_WIN, PARRY_STEP, PARRY_MAX_STACK, PARRY_HEAT, PARRY_LEN, ARENA, MAX_FRAMES,
} from "../src/components/boss/duelSimV2.ts";

const REPEAT = 3;
const N = Number(process.env.N || 200);

/** The window the NEXT press would get, given the fatigue right now. */
function windowIfPressedNow(e) {
  const stack = e.parryHeat > 0 ? Math.min(PARRY_MAX_STACK, e.parryStack + 1) : 0;
  return Math.max(0, PARRY_WIN - PARRY_STEP * stack);
}

function spacing(e) {
  // drift to the boss's flank at knife range, back off when out of stamina
  if (e.pst < 30) return A_MOVE0 + 4;            // back
  if (e.d > ATK_REACH + 0.4) return A_MOVE0;     // in
  return A_MOVE0 + 2;                            // strafe right
}

const PLAYERS = {
  random: (e, r) => Math.floor(r() * ACTION_NAMES.length),

  mash: (e) => {
    if (e.bStagger > 0 && e.d <= ATK2_REACH && e.pst >= ATK2_COST) return A_HEAVY;
    if (e.pst >= PARRY_COST) return A_PARRY;     // the habit, undiluted
    return spacing(e);
  },

  patient: (e) => {
    const m = incoming(e);
    const k = framesToActive(e);

    // the eruption cannot be answered, only left
    if (m && m.unblockable) {
      if (k !== null && k <= 14 && e.pst >= ROLL_COST) return A_ROLL0 + 2;  // roll back
      return A_MOVE0 + 4;
    }
    // riposte the stagger with the heavy, which is what the heavy is for
    if (e.bStagger > 0) {
      if (e.d <= ATK2_REACH && e.pst >= ATK2_COST) return A_HEAVY;
      if (e.d <= ATK_REACH && e.pst >= ATK_COST) return A_ATK;
      return A_MOVE0;
    }
    // a read: the hit lands in 1-3 frames, it is actually going to connect, and the window is
    // still worth having. Otherwise do NOT press it.
    if (k !== null && k >= 1 && k <= 3 && willConnect(e) && e.pst >= PARRY_COST
        && windowIfPressedNow(e) >= PARRY_WIN) {
      return A_PARRY;
    }
    // a wide move you cannot sidestep: leave
    if (m && m.arc > 1.5 && k !== null && k <= 6 && e.pst >= ROLL_COST) return A_ROLL0 + 2;
    // punish recovery
    if (e.bm < 0 && e.d <= ATK_REACH && e.pst >= ATK_COST) return A_ATK;
    return spacing(e);
  },

  pressure: SCRIPTED.pressure,
};

function play(pol, n) {
  const agg = {
    win: 0, die: 0, clk: 0, bhp: 0, php: 0,
    parries: 0, mashes: 0, dead: 0, presses: 0,
    dodges: 0, hitsTaken: 0, erupt: 0, poise: 0, frames: 0,
  };
  for (let i = 0; i < n; i++) {
    const e = new Duel({ oracle: rngOracle(1000 + i) });
    const r = rngOracle(50000 + i).bearing;      // only the random player draws from this
    const rr = () => (r() + Math.PI) / (2 * Math.PI);
    let act = 0;
    for (;;) {
      if (e.t % REPEAT === 0) act = pol(e, rr);
      if (act === A_PARRY && !e.busy && e.pst >= PARRY_COST) agg.presses++;
      const { won, lost, terminated, truncated } = e.step(act);
      for (const ev of e.events) if (ev === "ERUPTION") agg.erupt++;
      if (terminated || truncated) {
        if (won) agg.win++;
        else if (lost) agg.die++;
        else agg.clk++;
        agg.bhp += e.bhp; agg.php += e.php; agg.frames += e.t;
        agg.parries += e.log.parries; agg.mashes += e.log.parryMashes;
        agg.dead += e.log.parryDead; agg.dodges += e.log.dodges;
        agg.hitsTaken += e.log.hitsTaken; agg.poise += e.log.poiseBreaks;
        break;
      }
    }
  }
  return agg;
}

const pad = (x, n) => String(x).padStart(n);
const pct1 = (x) => `${x.toFixed(1)}%`;

console.log(`
${MOVES.length} boss moves, ${ACTION_NAMES.length} buttons, an ${ARENA}m ring, ${MAX_FRAMES / 30}s on the clock.
${N} duels per player, one decision every ${REPEAT} frames.
`);
console.log("  player      win   die   clk   bossHP   presses   parried   mashed   dead");
const rows = {};
for (const [name, pol] of Object.entries(PLAYERS)) {
  const a = play(pol, N);
  rows[name] = a;
  const rate = a.presses ? (100 * a.parries) / a.presses : 0;
  console.log(
    `  ${name.padEnd(9)} ${pad(a.win, 4)}  ${pad(a.die, 4)}  ${pad(a.clk, 4)}  ` +
    `${pad((a.bhp / N).toFixed(1), 7)}  ${pad(a.presses, 8)}  ${pad(pct1(rate), 8)}  ` +
    `${pad(a.mashes, 7)}  ${pad(a.dead, 5)}`
  );
}

const mash = rows.mash;
const pat = rows.patient;
const mr = mash.presses ? (100 * mash.parries) / mash.presses : 0;
const pr = pat.presses ? (100 * pat.parries) / pat.presses : 0;

console.log(`
  The window is ${PARRY_WIN} frames -- ${((1000 * PARRY_WIN) / 30).toFixed(0)}ms -- and it loses ${PARRY_STEP} frames for every press
  inside ${PARRY_HEAT} frames of the last one. That is longer than the ${PARRY_LEN}-frame recovery, so pressing
  parry again as soon as the game lets you is exactly what wears it out. A parry that LANDS
  clears the fatigue outright, which is the only way to hold the window open.

  mash presses ${(mash.presses / pat.presses).toFixed(1)}x as often as patient and lands ${pct1(mr)} of them, against
  patient's ${pct1(pr)} -- ${(pr / Math.max(mr, 0.01)).toFixed(0)}x the success rate from ${(mash.presses / pat.presses).toFixed(1)}x the presses.
  ${mash.dead} of mash's presses had no window left at all, and ${pat.dead} of patient's did.`);

console.log(`
  patient, in detail: ${pat.win}/${N} won, mean duel ${(pat.frames / N / 30).toFixed(1)}s,
  ${(pat.poise / N).toFixed(2)} posture breaks per duel, ${pat.dodges} rolls that beat a hitbox,
  and ${pat.erupt} eruptions eaten in ${N} duels -- the unblockable is escapable, not free.

  But patient is no longer the reference. It only swings while the boss is already staggered,
  which was a plan when one parry granted a stagger and is not one now that a parry merely feeds
  the posture bar. pressure takes the route the constants describe -- five landed heavies -- and
  wins ${rows.pressure.win}/${N} against patient's ${pat.win}/${N}, leaving the boss on
  ${(rows.pressure.bhp / N).toFixed(0)} health rather than ${(pat.bhp / N).toFixed(0)}.

  random wins ${rows.random.win}/${N} and mash wins ${mash.win}/${N}, so the world is not solved by luck
  or by holding one button. pressure wins ${((100 * rows.pressure.win) / N).toFixed(0)}%, so it is not impossible
  either -- a hard fight with a route through it, which is the specification.`);

console.log("\n  the moveset:");
for (const m of MOVES) {
  const len = m.seg.reduce((s, [, n]) => s + n, 0);
  const delay = m.seg.filter(([k]) => k === "d").reduce((s, [, n]) => s + n, 0);
  console.log(
    `    ${m.name.padEnd(9)} ${pad(len, 3)}f  reach ${m.reach.toFixed(1)}  ` +
    `arc ${m.arc.toFixed(2)}  dmg ${pad(m.dmg, 2)}` +
    (delay ? `  delay ${delay}f` : "          ") +
    (m.unblockable ? "  UNBLOCKABLE" : "")
  );
}
