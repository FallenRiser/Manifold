// The duel, version 2 — "The Warden, rebound".
//
// v1 (duelSim.ts / BOSS_SETUP) is FROZEN. Every number published in World 3 was measured against
// it, so it does not change again; this file is a second world standing beside it, not a patch to
// the first. Read the two side by side and the diff IS the lesson: what happens to a learner when
// you take an environment it had solved and make it honest.
//
// Three things are different, and each one exists to break a specific habit the v1 agent had.
//
//   1. EIGHT moves, not five. v1's five were all frontal cones of a similar width, so "back away
//      and to the side" answered nearly all of them. v2 adds a jab (too fast to react to, so it
//      has to be respected pre-emptively), a sweep whose arc is 1.9 radians (you cannot sidestep
//      it, only leave), and a wind-up-and-erupt AoE that covers the full circle out to 4.2m (you
//      cannot block or parry it at all -- the only answer is to not be there).
//
//   2. The parry window is SIX FRAMES -- 200ms, the same wall-clock as the source material --
//      and it shrinks every time you
//      press it again too soon. See PARRY_HEAT below. v1's agent could hold parry as a nearly
//      free defensive option; here mashing it costs you the option entirely.
//
//   3. A bigger ring, and a heavy attack for the player, so that "walk in and poke" is no longer
//      the whole of offence.
//
// As in v1, this is a port of the Python in BOSS_SETUP_V2 and not the same program: JavaScript has
// no numpy generator, so a duel here will not be bit-identical to the same seed in Python. The
// MECHANICS are checked instead -- feed this and the Python the SAME boss decisions and every
// frame of state matches (scripts/boss_port_check_v2.mjs).

export const FPS = 30;
export const MAX_FRAMES = 1080; // 36 seconds

export const ARENA = 11.0;
export const START_D = 5.5;

export const P_HP_MAX = 100.0;
export const P_ST_MAX = 100.0;
export const B_HP_MAX = 300.0;

export const P_SPEED = 0.075;
export const B_CHASE = 0.105;
export const B_TURN_IDLE = 0.13;
export const B_TURN_WIND = 0.045;

export const ST_REGEN = 0.55;
export const ST_DELAY = 20;

export const A_IDLE = 0;
export const A_MOVE0 = 1;
export const A_ATK = 9;
export const A_ROLL0 = 10;
export const A_GUARD = 14;
export const A_PARRY = 15;
export const A_HEAVY = 16;
export const N_ACTIONS = 17;
// Twelve RESERVED slots for the move one-hot, not len(MOVES). The ninth move shifted every
// index after it and made two trained nets unloadable; this is the cheap insurance against
// doing that again. Three unused floats is a fair price.
export const MOVE_SLOTS = 12;
export const N_OBS = 38;

/** The seventeen buttons, in output order. The v2 port check compares this against the list the
 *  shipped Python world exports, because a label that is off by one is invisible. */
export const ACTION_NAMES = [
  "idle", "move in", "move in-right", "move right", "move back-right", "move back",
  "move back-left", "move left", "move in-left", "attack", "roll in", "roll right",
  "roll back", "roll left", "guard", "parry", "heavy attack",
];

// --- the player's two swings ------------------------------------------------------------------
// Light: fast and cheap, and worth very little posture. Twelve or thirteen of them break the
// boss, which is a real plan but a slow one -- see the note on POISE_REGEN.
export const ATK_SEG: Seg[] = [["w", 8], ["h", 2], ["r", 14]];
export const ATK_REACH = 2.0;
export const ATK_DMG = 12.0;
export const ATK_COST = 20.0;
export const POISE_HIT = 16.0;
// Heavy: slower than every boss move except the eruption, and worth more poise damage than a
// light -- but nothing like a whole pool on its own.
//
// Breaking poise takes THREE landed swings, and it takes three whatever you throw: heavy-only,
// light-only or mixed. That is not the arithmetic it looks like (36 + 36 = 72 >= 70), because
// the pool REGENERATES while you are swinging -- a heavy is 39 frames, which is 3.1 points back
// -- so two heavies land on 1.2 remaining and the third puts it down. Measured, not reasoned:
// scripts/boss_v2_cases.py poise prints the trace.
//
// The first build had the heavy at 50 against a pool of 50, so ONE broke poise from full and the
// trained agent stunlocked the boss for a 12.8s win. See scripts/boss_v2_stunlock.py.
export const ATK2_SEG: Seg[] = [["w", 14], ["h", 3], ["r", 22]];
export const ATK2_REACH = 2.3;
export const ATK2_DMG = 26.0;
export const ATK2_COST = 34.0;
// 33 against a pool of 100: FIVE landed heavies break the boss, not one and not two. The
// heavy is the posture weapon -- a light is worth about half of it per swing and less than half
// per second, so committing to the slow swing is what actually moves the bar.
export const POISE_HIT2 = 33.0;

export const ROLL_LEN = 18;
export const ROLL_I0 = 3;
export const ROLL_I1 = 12;
export const ROLL_DIST = 1.7;
export const ROLL_COST = 25.0;

// --- the parry, rebuilt -----------------------------------------------------------------------
// Sekiro's deflect is 12 frames at 60fps by default, and it SHRINKS with each recent press of the
// guard button -- down to about 4 frames, and to nothing if you mash -- clearing again after about
// 30 frames of not pressing, or instantly on a successful deflect.
//
// Ported to this sim's 30fps: 6 frames of window -- 200ms, the same wall-clock as the
// source material -- losing PARRY_STEP frames for each press inside PARRY_HEAT, and heat that
// outlasts the recovery so that pressing again as soon as you are able DOES stack. An earlier
// build used 3 frames and called it a port; it was half the window it claimed to be. The width
// is forgiving now and the fatigue does the punishing, which is the split the source actually
// uses: a correct read should land, and what should cost you is pressing when you had not read
// anything. PARRY_LEN is shorter than v1's 22 precisely so that mashing is physically possible
// -- a mechanic that punishes an input you cannot make teaches nothing.
export const PARRY_LEN = 16;
export const PAR_I0 = 2;
export const PARRY_WIN = 6;
// Frames of window lost per press inside PARRY_HEAT. At 2 the ladder is 6 -> 4 -> 2 -> 0, so
// three hasty presses still spend the window completely.
export const PARRY_STEP = 2;
export const PARRY_HEAT = 30;
export const PARRY_MAX_STACK = 3;
export const PARRY_COST = 15.0;

export const GUARD_CHIP = 0.2;
export const GUARD_ST = 0.6;
export const HITSTUN = 20;
export const GUARDBREAK = 45;
export const STAGGER = 55;
export const RIPOSTE_MULT = 3.0;
export const B_POISE_MAX = 100.0;
// The bar is progress you can LOSE. At 0.35 a frame the boss recovers 10.5 posture a second, so
// disengaging for two seconds gives back roughly the whole of one heavy. That is the tension the
// old 0.08 did not have: there, progress was permanent and backing off was free, so there was no
// reason not to poke once and leave. Now pressure has to be sustained or it is wasted.
export const POISE_REGEN = 0.35;
export const POISE_STAGGER = 60;
// A landed parry is the biggest single source of posture damage in the game -- more than a
// heavy -- but it does NOT stagger on its own any more. It cancels the move and interrupts for
// PARRY_FLINCH frames, which is far too short to riposte into. The riposte window only opens
// when the bar actually breaks. One deflect never dropped a Sekiro boss either.
export const PARRY_POISE = 50.0;
export const PARRY_FLINCH = 14;
// Posture recovery is tied to vitality. Above REGEN_HI health it recovers at full rate, between
// REGEN_LO and REGEN_HI at half, and below REGEN_LO it does not recover at all. This is what
// makes the fight snowball: the pressure you build early stops leaking once the boss is hurt.
export const REGEN_HI = 0.7;
export const REGEN_LO = 0.5;
export const ENGAGE = 3.4;
// How far out the boss will start a GAP-CLOSER. Everything else needs you inside ENGAGE, so
// backing off used to mean the boss simply walked at you and nothing happened until it arrived.
// The lunge closes 18 x 0.22 = 4.0 units during its own windup, which is what makes retreating
// a decision with a cost rather than a free reset.
export const LUNGE_ENGAGE = 7.0;
export const BODY = 0.95;

export type Kind = "w" | "d" | "h" | "r";
export type Seg = [Kind, number];
export type Move = {
  name: string; seg: Seg[]; reach: number; arc: number; dmg: number; adv: number;
  /** true for the AoE: it cannot be blocked or parried, only avoided. */
  unblockable?: boolean;
  /** true for a gap-closer: the boss may start it from beyond ENGAGE, out to LUNGE_ENGAGE. */
  gap?: boolean;
};

// arc is a HALF-angle in radians: the move connects when |off-axis| <= arc. 3.2 is past pi, which
// is how "everywhere" is spelled.
export const MOVES: Move[] = [
  { name: "jab", seg: [["w", 6], ["h", 2], ["r", 10]], reach: 2.2, arc: 0.70, dmg: 11, adv: 0.05 },
  { name: "slash", seg: [["w", 14], ["h", 3], ["r", 16]], reach: 2.4, arc: 0.80, dmg: 18, adv: 0.03 },
  { name: "thrust", seg: [["w", 18], ["h", 2], ["r", 22]], reach: 3.6, arc: 0.35, dmg: 22, adv: 0.075 },
  { name: "sweep", seg: [["w", 16], ["h", 4], ["r", 24]], reach: 3.2, arc: 1.90, dmg: 26, adv: 0.04 },
  { name: "heavy", seg: [["w", 20], ["d", 8], ["h", 4], ["r", 28]], reach: 2.7, arc: 0.95, dmg: 34, adv: 0.015 },
  { name: "slam", seg: [["w", 24], ["d", 12], ["h", 5], ["r", 30]], reach: 2.6, arc: 1.40, dmg: 30, adv: 0 },
  { name: "combo", seg: [["w", 12], ["h", 3], ["w", 9], ["h", 3], ["r", 22]], reach: 2.3, arc: 0.70, dmg: 14, adv: 0.045 },
  { name: "flurry", seg: [["w", 14], ["h", 2], ["w", 16], ["h", 2], ["w", 16], ["h", 2],
    ["w", 16], ["h", 2], ["w", 16], ["h", 2], ["r", 26]],
    reach: 2.4, arc: 0.75, dmg: 9, adv: 0.03 },
  { name: "onslaught", seg: [["w", 16], ["h", 2], ["w", 18], ["h", 2], ["w", 18], ["h", 2],
    ["w", 18], ["h", 2], ["d", 14], ["w", 10], ["h", 2], ["w", 18], ["h", 2],
    ["w", 18], ["h", 2], ["r", 30]],
    reach: 2.5, arc: 0.80, dmg: 8, adv: 0.025 },
  { name: "lunge", seg: [["w", 18], ["h", 3], ["r", 26]], reach: 2.8, arc: 0.60, dmg: 24, adv: 0.22, gap: true },
  { name: "eruption", seg: [["w", 30], ["d", 8], ["h", 6], ["r", 34]], reach: 4.2, arc: 3.20, dmg: 40, adv: 0, unblockable: true },
];

export function moveLen(m: { seg: Seg[] }) {
  let n = 0;
  for (const [, k] of m.seg) n += k;
  return n;
}

export function phaseAt(m: { seg: Seg[] }, f: number): [Kind, number] {
  let acc = 0;
  for (let i = 0; i < m.seg.length; i++) {
    const [kind, n] = m.seg[i];
    if (f < acc + n) return [kind, i];
    acc += n;
  }
  return ["r", m.seg.length - 1];
}

export function wrapAngle(a: number) {
  const tau = 2 * Math.PI;
  return ((a + Math.PI) % tau + tau) % tau - Math.PI;
}

function clampArena(x: number, z: number): [number, number] {
  const r = Math.hypot(x, z);
  if (r <= ARENA) return [x, z];
  return [(x * ARENA) / r, (z * ARENA) / r];
}

// mulberry32 -- small, deterministic, and NOT numpy. See the note at the top of the file.
export function rng32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Injectable boss decisions. The equivalence test feeds these from a Python run. */
export type Oracle = {
  bearing: () => number;
  cooldown: (lo: number, hi: number) => number;
  choose: (cands: number[], weights: number[]) => number;
};

export function rngOracle(seed: number): Oracle {
  const r = rng32(seed);
  return {
    bearing: () => r() * 2 * Math.PI - Math.PI,
    cooldown: (lo, hi) => lo + Math.floor(r() * (hi - lo)),
    choose: (cands, weights) => {
      const tot = weights.reduce((a, b) => a + b, 0);
      let u = r() * tot;
      for (let i = 0; i < cands.length; i++) {
        u -= weights[i];
        if (u <= 0) return cands[i];
      }
      return cands[cands.length - 1];
    },
  };
}

export type DuelOpts = {
  aggr?: number;
  chip?: number;
  clock?: number;
  timeout?: "truncate" | "defeat";
  oracle?: Oracle;
  /** Overridable so the superseded build is still reproducible: the first v2 had a 50-point
   *  poise pool and a heavy worth 50, i.e. a guaranteed break from full. See boss_v2_stunlock. */
  poiseMax?: number;
  poiseHit?: number;
  poiseHit2?: number;
  poiseRegen?: number;
  parryPoise?: number;
};

export type DuelLog = {
  parries: number; blocks: number; guardBreaks: number; hitsTaken: number; rolls: number;
  dodges: number; swings: number; heavies: number; hitsDealt: number; whiffs: number;
  arcMisses: number; guardFrames: number; wallFrames: number; dmgDealt: number; dmgTaken: number;
  poiseBreaks: number;
  /** parry presses that were inside the recovery of the last one, i.e. mashing */
  parryMashes: number;
  /** parry presses whose window had already been squeezed to nothing */
  parryDead: number;
};

export class Duel {
  aggr: number; chip: number; clock: number; timeout: "truncate" | "defeat"; o: Oracle;
  poiseMax: number; poiseHit: number; poiseHit2: number; poiseRegen: number;
  parryPoise: number;
  t = 0;
  px = 0; pz = 0; bx = 0; bz = 0; bang = 0;
  php = P_HP_MAX; bhp = B_HP_MAX; pst = P_ST_MAX;
  pa = A_IDLE; pf = 0; pStun = 0; pRegenLock = 0; pHitDone = false; guarding = false;
  bm = -1; bf = 0; bSegDone = -1; bCd = 0; bStagger = 0; bPoise = B_POISE_MAX;
  /** how far the parry window has been worn down: 0 is fresh, PARRY_MAX_STACK is no window at all */
  parryStack = 0;
  /** frames left in which another press counts as a repeat. Set on every press. */
  parryHeat = 0;
  /** the window length the CURRENT parry was started with, frozen at press time */
  parryWin = PARRY_WIN;
  /** a brief interrupt from a parry: the move is cancelled, but this is NOT a riposte window */
  bFlinch = 0;
  log!: DuelLog;
  /** set for exactly one frame, so the renderer can flash something */
  events: string[] = [];

  constructor(opts: DuelOpts = {}) {
    this.aggr = opts.aggr ?? 0.5;
    this.chip = opts.chip ?? GUARD_CHIP;
    this.clock = opts.clock ?? MAX_FRAMES;
    this.timeout = opts.timeout ?? "truncate";
    this.o = opts.oracle ?? rngOracle(1);
    this.poiseMax = opts.poiseMax ?? B_POISE_MAX;
    this.poiseHit = opts.poiseHit ?? POISE_HIT;
    this.poiseHit2 = opts.poiseHit2 ?? POISE_HIT2;
    this.poiseRegen = opts.poiseRegen ?? POISE_REGEN;
    this.parryPoise = opts.parryPoise ?? PARRY_POISE;
    this.reset();
  }

  reset(oracle?: Oracle) {
    if (oracle) this.o = oracle;
    this.t = 0;
    const th = this.o.bearing();
    this.bx = 0; this.bz = 0;
    this.px = START_D * Math.sin(th); this.pz = START_D * Math.cos(th);
    this.bang = this.toPlayer();
    this.php = P_HP_MAX; this.bhp = B_HP_MAX; this.pst = P_ST_MAX;
    this.pa = A_IDLE; this.pf = 0; this.pStun = 0; this.pRegenLock = 0;
    this.pHitDone = false; this.guarding = false;
    this.bm = -1; this.bf = 0; this.bSegDone = -1; this.bStagger = 0;
    this.bPoise = this.poiseMax;
    this.parryStack = 0; this.parryHeat = 0; this.parryWin = PARRY_WIN;
    this.bFlinch = 0;
    this.bCd = this.o.cooldown(10, 40);
    this.log = {
      parries: 0, blocks: 0, guardBreaks: 0, hitsTaken: 0, rolls: 0, dodges: 0, swings: 0,
      heavies: 0, hitsDealt: 0, whiffs: 0, arcMisses: 0, guardFrames: 0, wallFrames: 0,
      dmgDealt: 0, dmgTaken: 0, poiseBreaks: 0, parryMashes: 0, parryDead: 0,
    };
    this.events = [];
  }

  get d() { return Math.hypot(this.px - this.bx, this.pz - this.bz); }
  toPlayer() { return Math.atan2(this.px - this.bx, this.pz - this.bz); }
  offAxis() { return wrapAngle(this.toPlayer() - this.bang); }

  /** Is the parry live THIS frame? Uses the window frozen when the button went down. */
  get parryLive() {
    return this.pa === A_PARRY && this.pf >= PAR_I0 && this.pf < PAR_I0 + this.parryWin;
  }

  /**
   * The thirty-eight floats a learner sees -- a line-for-line port of the Python obs().
   *
   * It writes into a Float32Array rather than a number[] on purpose. numpy stores this vector
   * as float32, so every field is rounded to single precision before the network sees it, and
   * computing it in doubles here would make the browser's policy drift from the trained one.
   *
   * The last two slots are new in v2 and they are not optional: with a parry window that depends
   * on what you pressed half a second ago, an agent that cannot see its own fatigue is being
   * asked to solve a partially observed problem for no reason.
   */
  obs(out = new Float32Array(N_OBS)): Float32Array {
    out.fill(0);
    const m = this.bm >= 0 ? MOVES[this.bm] : null;
    const kind = m ? phaseAt(m, this.bf)[0] : "i";
    const off = this.offAxis();
    out[0] = this.d / ARENA;
    out[1] = Math.sin(off);
    out[2] = Math.cos(off);
    out[3] = (ARENA - Math.hypot(this.px, this.pz)) / ARENA;   // room behind you
    out[4] = this.php / P_HP_MAX;
    out[5] = this.bhp / B_HP_MAX;
    out[6] = this.pst / P_ST_MAX;
    out[7] = this.pa / (N_ACTIONS - 1);
    out[8] = Math.min(this.pf, 40) / 40;
    out[9] = this.pStun / GUARDBREAK;
    out[10] = this.guarding ? 1 : 0;
    if (m) out[11 + this.bm] = 1;                              // which move (12 reserved slots)
    out[23] = Math.min(this.bf, 60) / 60;
    out[24] = kind === "w" ? 1 : 0;
    out[25] = kind === "d" ? 1 : 0;
    out[26] = kind === "h" ? 1 : 0;
    out[27] = kind === "r" ? 1 : 0;
    out[28] = this.bStagger / STAGGER;
    out[29] = m ? m.reach / ARENA : 0;
    out[30] = m ? m.arc / Math.PI : 0;                         // arc can exceed 1, so normalise
    out[31] = m && this.d <= m.reach && Math.abs(off) <= m.arc ? 1 : 0;
    out[32] = this.t / this.clock;
    out[33] = this.bPoise / this.poiseMax;
    out[34] = this.parryStack / PARRY_MAX_STACK;               // how worn the parry is
    out[35] = this.parryHeat / PARRY_HEAT;                     // how long until it comes back
    out[36] = this.bFlinch / PARRY_FLINCH;                     // parried and interrupted
    // How far through THIS move we are, which out[23] stops being able to say once a move runs
    // past its 60-frame cap. flurry is 114 frames and onslaught is 174, so without this the back
    // half of every long string is a single indistinguishable instant to the network.
    out[37] = m ? Math.min(1, this.bf / moveLen(m)) : 0;
    return out;
  }

  get busy() {
    if (this.pStun > 0) return true;
    if (this.pa === A_ATK) return this.pf < moveLen({ seg: ATK_SEG });
    if (this.pa === A_HEAVY) return this.pf < moveLen({ seg: ATK2_SEG });
    if (this.pa >= A_ROLL0 && this.pa <= A_ROLL0 + 3) return this.pf < ROLL_LEN;
    if (this.pa === A_PARRY) return this.pf < PARRY_LEN;
    return false;
  }

  private spend(c: number) {
    this.pst = Math.max(0, this.pst - c);
    this.pRegenLock = ST_DELAY;
  }

  private shift(eighths: number, dist: number) {
    const ang = this.toPlayer() + Math.PI + (eighths * Math.PI) / 4;
    [this.px, this.pz] = clampArena(this.px + dist * Math.sin(ang), this.pz + dist * Math.cos(ang));
    this.separate();
  }

  private close(dist: number) {
    [this.bx, this.bz] = clampArena(this.bx + dist * Math.sin(this.bang), this.bz + dist * Math.cos(this.bang));
    this.separate();
  }

  /** Keep the two bodies apart, so the boss shoves the player instead of walking through them. */
  private separate() {
    let dx = this.px - this.bx;
    let dz = this.pz - this.bz;
    let r = Math.hypot(dx, dz);
    if (r >= BODY) return;
    if (r < 1e-9) { dx = Math.sin(this.bang); dz = Math.cos(this.bang); r = 1; }
    const ux = dx / r, uz = dz / r;
    [this.px, this.pz] = clampArena(this.bx + ux * BODY, this.bz + uz * BODY);
    if (Math.hypot(this.px - this.bx, this.pz - this.bz) < BODY - 1e-9) {
      [this.bx, this.bz] = clampArena(this.px - ux * BODY, this.pz - uz * BODY);
    }
  }

  private segStart(m: Move, seg: number) {
    let n = 0;
    for (let i = 0; i < seg; i++) n += m.seg[i][1];
    return n;
  }

  /** The button went down on a parry. Freeze the window it gets, and charge it for the habit. */
  private startParry() {
    if (this.parryHeat > 0) {
      this.parryStack = Math.min(PARRY_MAX_STACK, this.parryStack + 1);
      this.log.parryMashes++;
    } else {
      this.parryStack = 0;
    }
    this.parryHeat = PARRY_HEAT;
    this.parryWin = Math.max(0, PARRY_WIN - PARRY_STEP * this.parryStack);
    if (this.parryWin === 0) {
      this.log.parryDead++;
      this.events.push("parry dead");
    }
    this.pa = A_PARRY; this.pf = 0;
    this.spend(PARRY_COST);
  }

  step(a: number) {
    this.events = [];

    // 1. the button, if it is even read this frame
    if (!this.busy) {
      this.guarding = a === A_GUARD;
      if (a >= A_MOVE0 && a <= A_MOVE0 + 7) {
        this.pa = a; this.pf = 0;
      } else if (a === A_ATK && this.pst >= ATK_COST) {
        this.pa = A_ATK; this.pf = 0; this.pHitDone = false;
        this.spend(ATK_COST); this.log.swings++;
      } else if (a === A_HEAVY && this.pst >= ATK2_COST) {
        this.pa = A_HEAVY; this.pf = 0; this.pHitDone = false;
        this.spend(ATK2_COST); this.log.swings++; this.log.heavies++;
      } else if (a >= A_ROLL0 && a <= A_ROLL0 + 3 && this.pst >= ROLL_COST) {
        this.pa = a; this.pf = 0; this.spend(ROLL_COST); this.log.rolls++;
      } else if (a === A_PARRY && this.pst >= PARRY_COST) {
        this.startParry();
      } else if (a === A_IDLE || a === A_GUARD) {
        this.pa = a; this.pf = 0;
      }
    }
    if (this.guarding) this.log.guardFrames++;
    if (Math.hypot(this.px, this.pz) > ARENA - 0.6) this.log.wallFrames++;

    // 2. the player moves
    if (this.pStun === 0) {
      if (this.pa >= A_MOVE0 && this.pa <= A_MOVE0 + 7) {
        this.shift(this.pa - A_MOVE0, P_SPEED * (this.guarding ? 0.55 : 1));
      } else if (this.pa >= A_ROLL0 && this.pa <= A_ROLL0 + 3 && this.pf < ROLL_I1) {
        this.shift(2 * (this.pa - A_ROLL0), ROLL_DIST / ROLL_I1);
      }
    }

    // 3. the boss decides
    if (this.bStagger > 0) {
      this.bStagger--;
    } else if (this.bFlinch > 0) {
      this.bFlinch--;
    } else if (this.bm < 0) {
      if (this.bCd > 0) this.bCd--;
      const want = wrapAngle(this.toPlayer() - this.bang);
      this.bang += Math.max(-B_TURN_IDLE, Math.min(B_TURN_IDLE, want));
      if (this.d > ENGAGE) this.close(B_CHASE);
      if (this.bCd <= 0 && this.d <= LUNGE_ENGAGE) {
        // Beyond ENGAGE only a gap-closer is eligible, and pick() returns -1 when none reaches.
        const want = this.pick(this.d > ENGAGE);
        if (want >= 0) { this.bm = want; this.bf = 0; this.bSegDone = -1; }
      }
    }

    // 4. the boss animation, its facing, and its hitboxes
    if (this.bm >= 0 && this.bStagger === 0 && this.bFlinch === 0) {
      const m = MOVES[this.bm];
      const [kind, seg] = phaseAt(m, this.bf);
      if (kind === "w" || kind === "d") {
        const want = wrapAngle(this.toPlayer() - this.bang);
        this.bang += Math.max(-B_TURN_WIND, Math.min(B_TURN_WIND, want));
        this.close(m.adv);
      }
      if (kind === "h" && seg !== this.bSegDone) {
        if (this.d <= m.reach && Math.abs(this.offAxis()) <= m.arc) {
          this.bossHits(m.dmg, m);
          this.bSegDone = seg;
        } else if (this.bf === this.segStart(m, seg)) {
          this.log.whiffs++;
          if (this.d <= m.reach) { this.log.arcMisses++; this.events.push("arc miss"); }
        }
      }
      this.bf++;
      if (this.bf >= moveLen(m)) {
        this.bm = -1; this.bf = 0;
        const lo = Math.round(6 + 40 * (1 - this.aggr));
        this.bCd = this.o.cooldown(lo, lo + 26);
      }
    }

    // 5. the player's own hitbox
    if (this.pa === A_ATK || this.pa === A_HEAVY) {
      const heavy = this.pa === A_HEAVY;
      const segs = heavy ? ATK2_SEG : ATK_SEG;
      const reach = heavy ? ATK2_REACH : ATK_REACH;
      const [kind] = phaseAt({ seg: segs }, this.pf);
      if (kind === "h" && !this.pHitDone && this.d <= reach) {
        const mult = this.bStagger > 0 ? RIPOSTE_MULT : 1;
        const dealt = (heavy ? ATK2_DMG : ATK_DMG) * mult;
        this.bhp -= dealt;
        this.pHitDone = true;
        this.log.hitsDealt++;
        this.log.dmgDealt += dealt;
        this.events.push(mult > 1 ? "riposte" : "hit dealt");
        if (mult === 1) {
          // Poise. The multiplier was read BEFORE this, so the hit that breaks the pool does
          // ordinary damage and the riposte is the NEXT one: a break only pays if you follow up.
          this.bPoise -= heavy ? this.poiseHit2 : this.poiseHit;
          if (this.bPoise <= 0) {
            this.stagger(POISE_STAGGER);
            this.log.poiseBreaks++;
            this.events.push("POISE BREAK");
          }
        }
      }
    }

    // 6. clocks
    if (this.bStagger === 0) {
      // vitality-linked recovery: full, half, then none
      const frac = this.bhp / B_HP_MAX;
      const scale = frac > REGEN_HI ? 1 : frac > REGEN_LO ? 0.5 : 0;
      this.bPoise = Math.min(this.poiseMax, this.bPoise + this.poiseRegen * scale);
    }
    this.pf++;
    if (this.pStun > 0) this.pStun--;
    if (this.parryHeat > 0) this.parryHeat--;
    if (this.pRegenLock > 0) this.pRegenLock--;
    else if (!this.guarding) this.pst = Math.min(P_ST_MAX, this.pst + ST_REGEN);
    this.t++;

    const won = this.bhp <= 0;
    let lost = this.php <= 0;
    let terminated = won || lost;
    let truncated = this.t >= this.clock && !terminated;
    if (truncated && this.timeout === "defeat") { lost = true; terminated = true; truncated = false; }
    return { won, lost, terminated, truncated };
  }

  private pick(far = false) {
    const cands: number[] = [];
    for (let i = 0; i < MOVES.length; i++) {
      const m = MOVES[i];
      if (far && !m.gap) continue;
      let wind = 0;
      for (const [k, n] of m.seg) if (k === "w" || k === "d") wind += n;
      if (m.reach + m.adv * wind >= this.d - 0.1) cands.push(i);
    }
    // Out past ENGAGE there is no fallback: if nothing can reach, the boss keeps walking.
    if (far && !cands.length) return -1;
    const use = cands.length ? cands : [1];
    // The slow, committing moves get likelier as aggression rises; the eruption stays rare
    // whatever happens, because a boss that opens with it every time is a boss with one move.
    const w = use.map((i) => {
      const n = MOVES[i].name;
      if (n === "eruption") return 0.35 + 0.5 * this.aggr;
      if (n === "lunge") return 1.4;
      // long strings are the parry test, so they are common on purpose
      if (n === "flurry") return 1.5;
      if (n === "onslaught") return 0.9 + 0.6 * this.aggr;
      if (n === "heavy" || n === "slam") return 1 + 1.5 * this.aggr;
      return 1;
    });
    return this.o.choose(use, w);
  }

  /** Put the boss down. Any stagger cancels the move it had out and refills its poise. */
  private stagger(frames: number) {
    this.bStagger = frames;
    this.bPoise = this.poiseMax;
    this.bm = -1; this.bf = 0; this.bCd = 0;
  }

  private bossHits(dmg: number, m: Move) {
    if (this.pa >= A_ROLL0 && this.pa <= A_ROLL0 + 3 && this.pf >= ROLL_I0 && this.pf <= ROLL_I1) {
      this.log.dodges++; this.events.push("dodge"); return;
    }
    // The eruption goes through the shield and through the parry. Rolling out of it works only
    // because i-frames are i-frames; standing in it and pressing a button does not.
    if (!m.unblockable) {
      if (this.parryLive) {
        this.log.parries++; this.events.push("PARRY");
        // A clean parry clears the fatigue outright, exactly as a successful deflect does in
        // Sekiro. Landing one is what buys back the next one.
        this.parryStack = 0; this.parryHeat = 0;
        // ...and it feeds the posture bar rather than skipping it. The move is cancelled and the
        // boss is interrupted, but there is no riposte here -- only a BREAK opens that window.
        this.bPoise -= this.parryPoise;
        this.bm = -1; this.bf = 0;
        this.bFlinch = PARRY_FLINCH;
        if (this.bPoise <= 0) {
          this.stagger(POISE_STAGGER);
          this.log.poiseBreaks++;
          this.events.push("POSTURE BREAK");
        }
        return;
      }
      if (this.guarding && this.pst > 0) {
        const chip = dmg * this.chip;
        this.php -= chip;
        this.pst -= dmg * GUARD_ST;
        this.pRegenLock = ST_DELAY;
        this.log.blocks++; this.log.dmgTaken += chip;
        this.events.push("block");
        if (this.pst <= 0) {
          this.pst = 0; this.pStun = GUARDBREAK; this.pa = A_IDLE; this.pf = 0;
          this.guarding = false; this.log.guardBreaks++; this.events.push("GUARD BREAK");
        }
        return;
      }
    }
    // Hitstun scales with the size of the blow. A flat 20 frames was fine when every move hit
    // once, but a 7-hit string lands every 18-20 frames, so a flat stun locked you through the
    // whole rest of the combo after one missed parry -- eat one, eat all seven. A 9-damage chip
    // now stuns 8 frames, which is short enough to recover and contest the next beat; the
    // eruption still stuns the full 20. Being hit should cost you a beat, not the string.
    const stun = Math.max(8, Math.min(HITSTUN, Math.round((HITSTUN * dmg) / 22)));
    this.php -= dmg;
    this.pStun = stun;
    this.pa = A_IDLE; this.pf = 0; this.guarding = false;
    this.log.hitsTaken++; this.log.dmgTaken += dmg;
    this.events.push(m.unblockable ? "ERUPTION" : "hit taken");
  }
}

// ------------------------------------------------------------------ scripted duellists
export function framesToActive(e: Duel): number | null {
  if (e.bm < 0 || e.bStagger > 0) return null;
  const m = MOVES[e.bm];
  let acc = 0;
  for (let i = 0; i < m.seg.length; i++) {
    const [kind, n] = m.seg[i];
    if (kind === "h" && acc + n > e.bf && i !== e.bSegDone) return Math.max(0, acc - e.bf);
    acc += n;
  }
  return null;
}

export function willConnect(e: Duel, slack = 0.25) {
  if (e.bm < 0 || e.bStagger > 0) return false;
  const m = MOVES[e.bm];
  return e.d <= m.reach + slack && Math.abs(e.offAxis()) <= m.arc;
}

/** Is the move currently out one that no button can answer? */
export function incoming(e: Duel): Move | null {
  return e.bm >= 0 && e.bStagger === 0 ? MOVES[e.bm] : null;
}

/** How many frames of parry the NEXT press would get, given the fatigue right now. */
export function windowIfPressedNow(e: Duel) {
  const stack = e.parryHeat > 0 ? Math.min(PARRY_MAX_STACK, e.parryStack + 1) : 0;
  return Math.max(0, PARRY_WIN - PARRY_STEP * stack);
}

const IN = 0, RIGHT = 2, BACK = 4;

function holdRange(e: Duel, lo = 1.6, hi = 2.3) {
  if (e.pst < 30) return A_MOVE0 + BACK;
  if (e.d > hi) return A_MOVE0 + IN;
  if (e.d < lo) return A_MOVE0 + BACK;
  return A_MOVE0 + RIGHT;
}

function bossRecovering(e: Duel) {
  if (e.bm < 0 || e.bStagger > 0) return false;
  return phaseAt(MOVES[e.bm], e.bf)[0] === "r";
}

/**
 * The scripted duellists, ported from the same functions in BOSS_SETUP_V2 so that what you watch
 * here is what the ladder scored. "mash parry" is on the list on purpose: it is the habit the
 * shrinking window exists to punish, and watching it fail is the clearest way to see the rule.
 */
export const SCRIPTED: Record<string, (e: Duel) => number> = {
  "patient parry": (e) => {
    const m = incoming(e);
    const k = framesToActive(e);
    if (m && m.unblockable) {
      if (k !== null && k <= 14 && e.pst >= ROLL_COST) return A_ROLL0 + 2;
      return A_MOVE0 + BACK;
    }
    if (e.bStagger > 0) {
      if (e.d <= ATK2_REACH && e.pst >= ATK2_COST) return A_HEAVY;
      if (e.d <= ATK_REACH && e.pst >= ATK_COST) return A_ATK;
      return A_MOVE0 + IN;
    }
    if (k !== null && k >= 1 && k <= 3 && willConnect(e) && e.pst >= PARRY_COST
        && windowIfPressedNow(e) >= PARRY_WIN) {
      return A_PARRY;
    }
    if (m && m.arc > 1.5 && k !== null && k <= 6 && e.pst >= ROLL_COST) return A_ROLL0 + 2;
    if (e.bm < 0 && e.d <= ATK_REACH && e.pst >= ATK_COST) return A_ATK;
    return holdRange(e);
  },

  "mash parry": (e) => {
    if (e.bStagger > 0 && e.d <= ATK2_REACH && e.pst >= ATK2_COST) return A_HEAVY;
    if (e.pst >= PARRY_COST) return A_PARRY;
    return holdRange(e);
  },

  "roll, punish": (e) => {
    const k = framesToActive(e);
    if (k !== null && k >= 3 && k <= 10 && willConnect(e) && e.pst >= ROLL_COST) return A_ROLL0 + 2;
    if (e.bStagger > 0 || bossRecovering(e)) {
      if (e.pst >= ATK_COST + ROLL_COST) {
        return e.d <= ATK_REACH && e.pst >= ATK_COST ? A_ATK : A_MOVE0 + IN;
      }
    }
    return holdRange(e);
  },

  /**
   * The reference player for v2, and the one that plays the game the numbers describe.
   *
   * "patient parry" is not that player: it only swings while the boss is already staggered,
   * which was fine when one parry granted a stagger and is useless now that a parry only feeds
   * the posture bar. The route the constants actually describe is five landed heavies, so this
   * pressures with the heavy and treats the parry as defence rather than as the plan.
   */
  pressure: (e) => {
    const m = incoming(e);
    const k = framesToActive(e);
    if (m && m.unblockable) {
      if (k !== null && k <= 14 && e.pst >= ROLL_COST) return A_ROLL0 + 2;
      return A_MOVE0 + BACK;
    }
    if (e.bStagger > 0) {                       // a break is earned; cash it
      if (e.d <= ATK2_REACH && e.pst >= ATK2_COST) return A_HEAVY;
      if (e.d <= ATK_REACH && e.pst >= ATK_COST) return A_ATK;
      return A_MOVE0 + IN;
    }
    if (k !== null && k >= 1 && k <= 3 && willConnect(e) && e.pst >= PARRY_COST
        && windowIfPressedNow(e) > 0) {
      return A_PARRY;
    }
    if (m && m.arc > 1.5 && k !== null && k <= 6 && e.pst >= ROLL_COST) return A_ROLL0 + 2;
    if (e.d <= ATK2_REACH && e.pst >= ATK2_COST && (e.bm < 0 || bossRecovering(e))) return A_HEAVY;
    if (e.d <= ATK_REACH && e.pst >= ATK_COST && (e.bm < 0 || bossRecovering(e))) return A_ATK;
    if (e.pst < 40) return A_MOVE0 + BACK;
    return e.d > ATK2_REACH ? A_MOVE0 + IN : A_MOVE0 + RIGHT;
  },

  "hold guard": () => A_GUARD,
};
