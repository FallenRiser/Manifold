// The training ground's engine: the World 1 boat and its tabular Q-learner, in TypeScript, with three
// sandbox extensions the Python pages never measured — wind direction, wind strength and a wind that
// wanders during a race. With the defaults (wind 0°, strength "moderate" = 3 m/s top speed, steady) the
// physics and the learning rule are line-for-line train_sailor; only the random numbers differ (a seeded
// mulberry32 stream here, numpy there), so individual results will not match the Python pages digit for digit.

import { ARRIVE, COURSE, D_EDGES, INERTIA, MARK_DIST, MAX_STEPS, NO_GO, RAMP, TURN, bestAngle, polarWith, wrap } from "./sim";

export type TrainConfig = {
  boats: number;
  races: number;
  alpha: number;
  gamma: number;
  eps0: number;
  reward: "progress" | "time" | "speed";
  edge: "penalty" | "free" | "none";
  view: "relative" | "absolute";
  /** where the wind blows FROM, measured like a heading: 0 = from the mark, straight down the course */
  windDir: number;
  /** the boat's top speed in this wind, m/s (3 = the Python boat) */
  windSpeed: number;
  /** how far the wind may wander from windDir during a race, degrees (0 = steady) */
  shift: number;
  /** where every race starts, metres (the Python boat: 0, 0) */
  startX: number;
  startY: number;
  /** where the mark is, metres (the Python boat: 0, 60) */
  markX: number;
  markY: number;
  /** a whirlpool the boat cannot see: 0 off, 1 gentle, 2 strong */
  vortex: 0 | 1 | 2;
  vortexX: number;
  vortexY: number;
};

/** radius of the vortex core, metres; the current fades to nothing at 2.5× this */
export const VORTEX_R = 15;
const VORTEX_PEAK = [0, 0.8, 1.6]; // m/s at the edge of the core

export const LIMITS = { boats: 16, races: 3000 };
export const DEFAULTS: TrainConfig = {
  boats: 8, races: 2000, alpha: 0.5, gamma: 0.99, eps0: 0.1,
  reward: "progress", edge: "penalty", view: "relative", windDir: 0, windSpeed: 3, shift: 0, startX: 0, startY: 0,
  markX: 0, markY: MARK_DIST, vortex: 0, vortexX: -35, vortexY: 28,
};

/** the race area is a circle of radius COURSE centred halfway between start and mark — (0, 30) for the Python boat */
export const courseCentre = (cfg: Pick<TrainConfig, "startX" | "startY" | "markX" | "markY">) =>
  ({ x: (cfg.startX + cfg.markX) / 2, y: (cfg.startY + cfg.markY) / 2 });

/** the water's own velocity at (x, y): a Rankine-style vortex turning anticlockwise with a slight pull inward */
export function currentAt(x: number, y: number, cfg: Pick<TrainConfig, "vortex" | "vortexX" | "vortexY">) {
  if (!cfg.vortex) return { cx: 0, cy: 0 };
  const dx = x - cfg.vortexX, dy = y - cfg.vortexY, r = Math.hypot(dx, dy);
  if (r < 1e-6 || r >= 2.5 * VORTEX_R) return { cx: 0, cy: 0 };
  const peak = VORTEX_PEAK[cfg.vortex];
  const sp = r < VORTEX_R ? (peak * r) / VORTEX_R : ((peak * VORTEX_R) / r) * (1 - (r - VORTEX_R) / (1.5 * VORTEX_R));
  return { cx: (-dy / r) * sp - (dx / r) * 0.25 * sp, cy: (dx / r) * sp - (dy / r) * 0.25 * sp };
}
export const WIND_LIMIT = 45;

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const N_STATES = 36 * 24 * 6; // both views index 5184 cells

type Env = { x: number; y: number; h: number; u: number; t: number; tacks: number; wind: number };

function envReset(rng: () => number, cfg: TrainConfig): Env {
  return { x: cfg.startX, y: cfg.startY, h: rng() * 360 - 180, u: 0, t: 0, tacks: 0, wind: cfg.windDir };
}

function envStep(e: Env, a: number, cfg: TrainConfig, rng: () => number) {
  const oldRel = wrap(e.h - e.wind);
  e.h = wrap(e.h + (a - 1) * TURN);
  if (cfg.shift > 0) e.wind = Math.max(cfg.windDir - cfg.shift, Math.min(cfg.windDir + cfg.shift, e.wind + (rng() - 0.5) * 4));
  const rel = wrap(e.h - e.wind);
  if ((oldRel >= 0) !== (rel >= 0) && Math.abs(rel) < 90) e.tacks += 1;
  e.u += (polarWith(rel, NO_GO, RAMP, cfg.windSpeed) - e.u) * INERTIA;
  const d0 = Math.hypot(cfg.markX - e.x, cfg.markY - e.y);
  const rad = (e.h * Math.PI) / 180;
  const { cx, cy } = currentAt(e.x, e.y, cfg);
  e.x += e.u * Math.sin(rad) + cx; e.y += e.u * Math.cos(rad) + cy;
  const d1 = Math.hypot(cfg.markX - e.x, cfg.markY - e.y);
  e.t += 1;
  const arrived = d1 <= ARRIVE;
  const c = courseCentre(cfg);
  const out = cfg.edge !== "none" && Math.hypot(e.x - c.x, e.y - c.y) > COURSE;
  const terminated = arrived || out;
  const truncated = !terminated && e.t >= MAX_STEPS;
  let r: number;
  if (cfg.reward === "time") { r = -1; if (out && cfg.edge === "penalty") r += -(MAX_STEPS - e.t); }
  else if (cfg.reward === "speed") r = e.u + (out && cfg.edge === "penalty" ? -100 : 0);
  else { r = d0 - d1; if (out && cfg.edge === "penalty") r += -100; }
  return { r, terminated, truncated, arrived, out };
}

function view(e: Env, cfg: TrainConfig) {
  const hi = ((Math.floor((e.h + 180) / 10) % 36) + 36) % 36;
  if (cfg.view === "absolute") {
    const xi = Math.min(11, Math.max(0, Math.floor((e.x + 60) / 10)));
    const yi = Math.min(11, Math.max(0, Math.floor((e.y + 30) / 10)));
    return (hi * 12 + xi) * 12 + yi;
  }
  const dx = cfg.markX - e.x, dy = cfg.markY - e.y;
  const bearing = (Math.atan2(dx, dy) * 180) / Math.PI;
  const d = Math.hypot(dx, dy);
  const bi = ((Math.floor((bearing + 180) / 15) % 24) + 24) % 24;
  let di = 0;
  for (const edge of D_EDGES) if (d > edge) di++;
  return (hi * 24 + bi) * 6 + di;
}

const argmax3 = (Q: Float64Array, s: number) => {
  const o = s * 3;
  let b = 0;
  if (Q[o + 1] > Q[o + b]) b = 1;
  if (Q[o + 2] > Q[o + b]) b = 2;
  return b;
};

export type StepDetail = {
  race: number; t: number; s: number; a: number; explored: boolean; eps: number; r: number; s2: number;
  maxNext: number; target: number; qBefore: [number, number, number]; qAfter: [number, number, number];
  terminated: boolean; truncated: boolean; arrived: boolean; out: boolean; newRace: boolean;
};

export type RaceEnd = "arrived" | "out" | "clock";

export class Learner {
  Q = new Float64Array(N_STATES * 3);
  race = 0;
  updates = 0;
  /** finishes in each block of 50 practice races */
  curve: number[] = [];
  private block = 0;
  lastTrack: { x: number[]; y: number[]; end: RaceEnd } = { x: [], y: [], end: "clock" };
  /** the race in progress (slow-motion mode reads it) */
  cur: { x: number[]; y: number[] } = { x: [], y: [] };
  recent: RaceEnd[] = [];
  /** the boat's current heading (or where it pointed when its last race ended) and the wind it felt */
  heading = 0;
  wind = 0;
  private env: Env | null = null;
  private s = 0;
  private agent: () => number;
  private world: () => number;

  cfg: TrainConfig;
  seed: number;

  constructor(cfg: TrainConfig, seed: number) {
    this.cfg = cfg;
    this.seed = seed;
    this.agent = mulberry32(seed * 7919 + 1);
    this.world = mulberry32(seed * 104729 + 17);
  }

  get done() { return this.race >= this.cfg.races; }
  get envState() { return this.env; }

  /** one environment step and one Q-learning update — exactly the inner loop of train_sailor */
  step(): StepDetail | null {
    if (this.done) return null;
    let newRace = false;
    if (!this.env) {
      this.env = envReset(this.world, this.cfg);
      this.s = view(this.env, this.cfg);
      this.cur = { x: [this.env.x], y: [this.env.y] };
      newRace = true;
    }
    const { Q, cfg } = this;
    const e = this.env, s = this.s, o = s * 3;
    const eps = cfg.eps0 * Math.max(0, 1 - this.race / cfg.races);
    const explored = this.agent() < eps;
    const a = explored ? Math.floor(this.agent() * 3) : argmax3(Q, s);
    const qBefore: [number, number, number] = [Q[o], Q[o + 1], Q[o + 2]];
    const res = envStep(e, a, cfg, this.world);
    const s2 = view(e, cfg);
    const maxNext = Math.max(Q[s2 * 3], Q[s2 * 3 + 1], Q[s2 * 3 + 2]);
    const target = res.r + (res.terminated ? 0 : cfg.gamma * maxNext);
    Q[o + a] += cfg.alpha * (target - Q[o + a]);
    this.updates++;
    this.s = s2;
    this.cur.x.push(e.x); this.cur.y.push(e.y);
    this.heading = e.h; this.wind = e.wind;
    const detail: StepDetail = {
      race: this.race, t: e.t, s, a, explored, eps, r: res.r, s2, maxNext, target, qBefore,
      qAfter: [Q[o], Q[o + 1], Q[o + 2]], terminated: res.terminated, truncated: res.truncated,
      arrived: res.arrived, out: res.out, newRace,
    };
    if (res.terminated || res.truncated) {
      const end: RaceEnd = res.arrived ? "arrived" : res.out ? "out" : "clock";
      this.lastTrack = { x: this.cur.x, y: this.cur.y, end };
      this.recent.push(end);
      if (this.recent.length > 100) this.recent.shift();
      if (res.arrived) this.block++;
      this.race++;
      if (this.race % 50 === 0) { this.curve.push(this.block / 50); this.block = 0; }
      this.env = null;
    }
    return detail;
  }

  /** a whole practice race without building step details (fast path, same arithmetic) */
  runRace() {
    const r0 = this.race;
    while (!this.done && this.race === r0) this.step();
  }
}

export type Evaluation = { arrived: number; left: number; meanTime: number | null; tacks: number; beatAngle: number | null };

/** the frozen, greedy table on 200 fixed held-out starts (the same starts for every boat) */
export function evaluate(L: Learner, n = 200): Evaluation {
  const cfg = L.cfg;
  const best = bestAngle().angle;
  let arrived = 0, left = 0, tacks = 0;
  const times: number[] = [], beat: number[] = [];
  for (let k = 0; k < n; k++) {
    const rng = mulberry32(900001 + k);
    const e = envReset(rng, cfg);
    for (;;) {
      const a = argmax3(L.Q, view(e, cfg));
      const res = envStep(e, a, cfg, rng);
      const bearingRel = wrap((Math.atan2(cfg.markX - e.x, cfg.markY - e.y) * 180) / Math.PI - e.wind);
      if (Math.abs(bearingRel) < best - 5 && e.u > 0.5 * (cfg.windSpeed / 3)) beat.push(Math.abs(wrap(e.h - e.wind)));
      if (res.terminated || res.truncated) {
        if (res.arrived) { arrived++; times.push(e.t); }
        if (res.out) left++;
        tacks += e.tacks;
        break;
      }
    }
  }
  beat.sort((p, q) => p - q);
  return {
    arrived, left, tacks: tacks / n,
    meanTime: times.length ? times.reduce((p, q) => p + q, 0) / times.length : null,
    beatAngle: beat.length ? beat[Math.floor(beat.length / 2)] : null,
  };
}
