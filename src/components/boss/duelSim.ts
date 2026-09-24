// A TypeScript port of the duel in BOSS_SETUP, so the arena below can be PLAYED rather than
// replayed. Every constant, every frame count and every hit test is the same as the Python.
//
// It is a port, not the same program: JavaScript has no numpy generator, so a duel here will not
// be bit-identical to the same seed in Python. The mechanics are checked instead -- feed this and
// the Python the SAME boss decisions and every frame of state matches (scripts/boss_cases.py port).

export const FPS = 30;
export const MAX_FRAMES = 900;

export const ARENA = 8.0;
export const START_D = 4.0;

export const P_HP_MAX = 100.0;
export const P_ST_MAX = 100.0;
export const B_HP_MAX = 240.0;

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
export const N_ACTIONS = 16;
export const N_OBS = 27;

/** The sixteen buttons, in output order. boss_policy_check.mjs compares this against the list
 *  the shipped Python world exports, because a label that is off by one is invisible. */
export const ACTION_NAMES = [
  "idle", "move in", "move in-right", "move right", "move back-right", "move back",
  "move back-left", "move left", "move in-left", "attack", "roll in", "roll right",
  "roll back", "roll left", "guard", "parry",
];

export const ATK_SEG: Seg[] = [["w", 8], ["h", 2], ["r", 14]];
export const ATK_REACH = 2.0;
export const ATK_DMG = 12.0;
export const ATK_COST = 20.0;

export const ROLL_LEN = 18;
export const ROLL_I0 = 3;
export const ROLL_I1 = 12;
export const ROLL_DIST = 1.7;
export const ROLL_COST = 25.0;

export const PARRY_LEN = 22;
export const PAR_I0 = 3;
export const PAR_I1 = 7;
export const PARRY_COST = 15.0;

export const GUARD_CHIP = 0.2;
export const GUARD_ST = 0.6;
export const HITSTUN = 20;
export const GUARDBREAK = 45;
export const STAGGER = 55;
export const RIPOSTE_MULT = 3.0;
// poise: two clean hits empty the pool, and the boss goes down for POISE_STAGGER frames.
// See the note above the same constants in BOSS_SETUP for why 60 and not 55.
export const B_POISE_MAX = 50.0;
export const POISE_HIT = 25.0;
export const POISE_REGEN = 0.08;
export const POISE_STAGGER = 60;
export const ENGAGE = 2.9;
export const BODY = 0.95; // the two of them are solid: neither walks through the other

export type Kind = "w" | "d" | "h" | "r";
export type Seg = [Kind, number];
export type Move = { name: string; seg: Seg[]; reach: number; arc: number; dmg: number; adv: number };

export const MOVES: Move[] = [
  { name: "slash", seg: [["w", 14], ["h", 3], ["r", 16]], reach: 2.4, arc: 0.8, dmg: 18, adv: 0.03 },
  { name: "thrust", seg: [["w", 18], ["h", 2], ["r", 22]], reach: 3.6, arc: 0.35, dmg: 22, adv: 0.075 },
  { name: "heavy", seg: [["w", 20], ["d", 8], ["h", 4], ["r", 28]], reach: 2.7, arc: 0.95, dmg: 34, adv: 0.015 },
  { name: "slam", seg: [["w", 24], ["d", 12], ["h", 5], ["r", 30]], reach: 2.6, arc: 1.4, dmg: 30, adv: 0 },
  { name: "combo", seg: [["w", 12], ["h", 3], ["w", 9], ["h", 3], ["r", 22]], reach: 2.3, arc: 0.7, dmg: 14, adv: 0.045 },
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
};

export type DuelLog = {
  parries: number; blocks: number; guardBreaks: number; hitsTaken: number; rolls: number;
  dodges: number; swings: number; hitsDealt: number; whiffs: number; arcMisses: number;
  guardFrames: number; wallFrames: number; dmgDealt: number; dmgTaken: number;
  poiseBreaks: number;
};

export class Duel {
  aggr: number; chip: number; clock: number; timeout: "truncate" | "defeat"; o: Oracle;
  t = 0;
  px = 0; pz = 0; bx = 0; bz = 0; bang = 0;
  php = P_HP_MAX; bhp = B_HP_MAX; pst = P_ST_MAX;
  pa = A_IDLE; pf = 0; pStun = 0; pRegenLock = 0; pHitDone = false; guarding = false;
  bm = -1; bf = 0; bSegDone = -1; bCd = 0; bStagger = 0; bPoise = B_POISE_MAX;
  log!: DuelLog;
  /** set for exactly one frame, so the renderer can flash something */
  events: string[] = [];

  constructor(opts: DuelOpts = {}) {
    this.aggr = opts.aggr ?? 0.5;
    this.chip = opts.chip ?? GUARD_CHIP;
    this.clock = opts.clock ?? MAX_FRAMES;
    this.timeout = opts.timeout ?? "truncate";
    this.o = opts.oracle ?? rngOracle(1);
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
    this.bPoise = B_POISE_MAX;
    this.bCd = this.o.cooldown(10, 40);
    this.log = {
      parries: 0, blocks: 0, guardBreaks: 0, hitsTaken: 0, rolls: 0, dodges: 0, swings: 0,
      hitsDealt: 0, whiffs: 0, arcMisses: 0, guardFrames: 0, wallFrames: 0, dmgDealt: 0, dmgTaken: 0,
      poiseBreaks: 0,
    };
    this.events = [];
  }

  get d() { return Math.hypot(this.px - this.bx, this.pz - this.bz); }
  toPlayer() { return Math.atan2(this.px - this.bx, this.pz - this.bz); }
  offAxis() { return wrapAngle(this.toPlayer() - this.bang); }

  /**
   * The twenty-seven floats a learner sees -- a line-for-line port of the Python obs().
   *
   * It writes into a Float32Array rather than a number[] on purpose. numpy stores this vector
   * as float32, so every field is rounded to single precision before the network sees it, and
   * computing it in doubles here would make the browser's policy drift from the trained one.
   * scripts/boss_policy_check.mjs replays recorded states through both and compares.
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
    if (m) out[11 + this.bm] = 1;                              // which move (5 slots)
    out[16] = Math.min(this.bf, 60) / 60;
    out[17] = kind === "w" ? 1 : 0;
    out[18] = kind === "d" ? 1 : 0;
    out[19] = kind === "h" ? 1 : 0;
    out[20] = kind === "r" ? 1 : 0;
    out[21] = this.bStagger / STAGGER;
    out[22] = m ? m.reach / ARENA : 0;
    out[23] = m ? m.arc : 0;
    out[24] = m && this.d <= m.reach && Math.abs(off) <= m.arc ? 1 : 0;
    out[25] = this.t / this.clock;
    out[26] = this.bPoise / B_POISE_MAX;
    return out;
  }

  get busy() {
    if (this.pStun > 0) return true;
    if (this.pa === A_ATK) return this.pf < moveLen({ seg: ATK_SEG });
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
      } else if (a >= A_ROLL0 && a <= A_ROLL0 + 3 && this.pst >= ROLL_COST) {
        this.pa = a; this.pf = 0; this.spend(ROLL_COST); this.log.rolls++;
      } else if (a === A_PARRY && this.pst >= PARRY_COST) {
        this.pa = A_PARRY; this.pf = 0; this.spend(PARRY_COST);
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
    } else if (this.bm < 0) {
      if (this.bCd > 0) this.bCd--;
      const want = wrapAngle(this.toPlayer() - this.bang);
      this.bang += Math.max(-B_TURN_IDLE, Math.min(B_TURN_IDLE, want));
      if (this.d > ENGAGE) this.close(B_CHASE);
      if (this.bCd <= 0 && this.d <= ENGAGE) {
        this.bm = this.pick();
        this.bf = 0; this.bSegDone = -1;
      }
    }

    // 4. the boss animation, its facing, and its hitboxes
    if (this.bm >= 0 && this.bStagger === 0) {
      const m = MOVES[this.bm];
      const [kind, seg] = phaseAt(m, this.bf);
      if (kind === "w" || kind === "d") {
        const want = wrapAngle(this.toPlayer() - this.bang);
        this.bang += Math.max(-B_TURN_WIND, Math.min(B_TURN_WIND, want));
        this.close(m.adv);
      }
      if (kind === "h" && seg !== this.bSegDone) {
        if (this.d <= m.reach && Math.abs(this.offAxis()) <= m.arc) {
          this.bossHits(m.dmg);
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
    if (this.pa === A_ATK) {
      const [kind] = phaseAt({ seg: ATK_SEG }, this.pf);
      if (kind === "h" && !this.pHitDone && this.d <= ATK_REACH) {
        const mult = this.bStagger > 0 ? RIPOSTE_MULT : 1;
        const dealt = ATK_DMG * mult;
        this.bhp -= dealt;
        this.pHitDone = true;
        this.log.hitsDealt++;
        this.log.dmgDealt += dealt;
        this.events.push(mult > 1 ? "riposte" : "hit dealt");
        if (mult === 1) {
          // Poise. The multiplier was read BEFORE this, so the hit that breaks the pool does
          // ordinary damage and the riposte is the NEXT one: a break only pays if you follow up.
          this.bPoise -= POISE_HIT;
          if (this.bPoise <= 0) {
            this.stagger(POISE_STAGGER);
            this.log.poiseBreaks++;
            this.events.push("POISE BREAK");
          }
        }
      }
    }

    // 6. clocks
    if (this.bStagger === 0) this.bPoise = Math.min(B_POISE_MAX, this.bPoise + POISE_REGEN);
    this.pf++;
    if (this.pStun > 0) this.pStun--;
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

  private pick() {
    const cands: number[] = [];
    for (let i = 0; i < MOVES.length; i++) {
      const m = MOVES[i];
      let wind = 0;
      for (const [k, n] of m.seg) if (k === "w" || k === "d") wind += n;
      if (m.reach + m.adv * wind >= this.d - 0.1) cands.push(i);
    }
    const use = cands.length ? cands : [1];
    const w = use.map((i) => (MOVES[i].name === "heavy" || MOVES[i].name === "slam" ? 1 + 1.5 * this.aggr : 1));
    return this.o.choose(use, w);
  }

  /** Put the boss down. Any stagger cancels the move it had out and refills its poise. */
  private stagger(frames: number) {
    this.bStagger = frames;
    this.bPoise = B_POISE_MAX;
    this.bm = -1; this.bf = 0; this.bCd = 0;
  }

  private bossHits(dmg: number) {
    if (this.pa >= A_ROLL0 && this.pa <= A_ROLL0 + 3 && this.pf >= ROLL_I0 && this.pf <= ROLL_I1) {
      this.log.dodges++; this.events.push("dodge"); return;
    }
    if (this.pa === A_PARRY && this.pf >= PAR_I0 && this.pf <= PAR_I1) {
      this.log.parries++; this.events.push("PARRY");
      this.stagger(STAGGER);
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
    this.php -= dmg;
    this.pStun = HITSTUN;
    this.pa = A_IDLE; this.pf = 0; this.guarding = false;
    this.log.hitsTaken++; this.log.dmgTaken += dmg;
    this.events.push("hit taken");
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

export function bossRecovering(e: Duel) {
  if (e.bm < 0) return e.bStagger === 0;
  return phaseAt(MOVES[e.bm], e.bf)[0] === "r";
}

const holdRange = (e: Duel, lo = 1.5, hi = 2.2) =>
  e.d > hi ? A_MOVE0 + 0 : e.d < lo ? A_MOVE0 + 4 : A_IDLE;

const closeAndHit = (e: Duel) =>
  e.d > ATK_REACH - 0.15 ? A_MOVE0 + 0 : e.pst >= ATK_COST ? A_ATK : A_IDLE;

export const SCRIPTED: Record<string, (e: Duel) => number> = {
  "mash attack": closeAndHit,
  "hold guard": () => A_GUARD,
  circle: () => A_MOVE0 + 2,
  "block, punish": (e) =>
    (e.bStagger > 0 || bossRecovering(e)) && e.pst >= ATK_COST ? closeAndHit(e) : A_GUARD,
  "sidestep, punish": (e) => {
    const k = framesToActive(e);
    if (k !== null && k >= 3 && k <= 10 && willConnect(e) && e.pst >= ROLL_COST) {
      return e.offAxis() >= 0 ? A_ROLL0 + 1 : A_ROLL0 + 3;
    }
    if ((e.bStagger > 0 || bossRecovering(e)) && e.pst >= ATK_COST + ROLL_COST) return closeAndHit(e);
    return holdRange(e);
  },
  "patient parry": (e) => {
    const k = framesToActive(e);
    const want = Math.floor((PAR_I0 + PAR_I1) / 2);
    if (k !== null && k >= 3 && k <= want && willConnect(e) && e.pst >= PARRY_COST) return A_PARRY;
    if (e.bStagger > moveLen({ seg: ATK_SEG })) {
      if (e.pst >= ATK_COST + PARRY_COST || e.d > ATK_REACH - 0.15) return closeAndHit(e);
    }
    return holdRange(e);
  },
};
