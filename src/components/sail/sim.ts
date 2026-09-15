// The sailboat of World 1, ported line for line from ENV_SETUP (src/lib/runtimeSetup.ts) so the labs can
// sail it live. The formulas are identical; the only thing a lab cannot reproduce is numpy's random
// stream, so labs that need a random start pick their own and never quote the Python pages' numbers.

export const V_MAX = 3.0;
export const NO_GO = 30.0;
export const RAMP = 12.0;
export const TURN = 10.0;
export const INERTIA = 0.3;
export const MARK_DIST = 60.0;
export const ARRIVE = 10.0;
export const MAX_STEPS = 200;
export const COURSE = 150.0;
export const MARK = { x: 0, y: MARK_DIST };
export const CENTRE = { x: 0, y: MARK_DIST / 2 };

export function polarWith(angle: number, noGo = NO_GO, ramp = RAMP, vMax = V_MAX) {
  const a = Math.abs(angle);
  if (a <= noGo) return 0;
  const drive = 1 - Math.exp(-(a - noGo) / ramp);
  const x = Math.min(1, Math.max(0, (a - 100) / 80));
  return vMax * drive * (1 - 0.4 * x * x);
}
export const polar = (angle: number) => polarWith(angle);

/** Python's (d + 180) % 360 - 180, which is never negative before the shift */
export const wrap = (d: number) => ((((d + 180) % 360) + 360) % 360) - 180;

export function bestAngle(noGo = NO_GO, ramp = RAMP) {
  let best = 0, bestV = -Infinity;
  for (let i = 0; i <= 18000; i++) {
    const a = i / 100;
    const v = polarWith(a, noGo, ramp) * Math.cos((a * Math.PI) / 180);
    if (v > bestV) { bestV = v; best = a; }
  }
  return { angle: best, vmg: bestV };
}
export const BEST = bestAngle();

export type Reward = "progress" | "time" | "speed";
export type Edge = "penalty" | "free" | "none";

export type Boat = { x: number; y: number; h: number; u: number; t: number; tacks: number };
export type StepResult = {
  obs: [number, number, number, number];
  reward: number;
  terminated: boolean;
  truncated: boolean;
  arrived: boolean;
  out: boolean;
};

export const newBoat = (heading: number): Boat => ({ x: 0, y: 0, h: heading, u: 0, t: 0, tacks: 0 });

/** Sail.step, mutating the boat in place */
export function stepBoat(b: Boat, a: number, reward: Reward = "progress", edge: Edge = "penalty", clock = MAX_STEPS): StepResult {
  const old = b.h;
  b.h = wrap(b.h + (a - 1) * TURN);
  if ((old >= 0) !== (b.h >= 0) && Math.abs(b.h) < 90) b.tacks += 1;
  b.u += (polar(b.h) - b.u) * INERTIA;
  const d0 = Math.hypot(MARK.x - b.x, MARK.y - b.y);
  const rad = (b.h * Math.PI) / 180;
  b.x += b.u * Math.sin(rad);
  b.y += b.u * Math.cos(rad);
  const d1 = Math.hypot(MARK.x - b.x, MARK.y - b.y);
  b.t += 1;
  const arrived = d1 <= ARRIVE;
  const out = edge !== "none" && Math.hypot(b.x, b.y - MARK.y / 2) > COURSE;
  const terminated = arrived || out;
  const truncated = !terminated && b.t >= clock;
  let r: number;
  if (reward === "time") {
    r = -1;
    if (out && edge === "penalty") r += -1 * (clock - b.t);
  } else if (reward === "speed") {
    r = b.u + (out && edge === "penalty" ? -100 : 0);
  } else {
    r = d0 - d1;
    if (out && edge === "penalty") r += -100;
  }
  return { obs: [b.x, b.y, b.h, b.u], reward: r, terminated, truncated, arrived, out };
}

export const bearingOfMark = (x: number, y: number) => (Math.atan2(MARK.x - x, MARK.y - y) * 180) / Math.PI;
export const distToMark = (x: number, y: number) => Math.hypot(MARK.x - x, MARK.y - y);

/** the layline expert from ENV_SETUP */
export function expertAction(b: Boat) {
  const bear = bearingOfMark(b.x, b.y);
  let want: number;
  if (Math.abs(bear) >= BEST.angle) want = bear;
  else {
    let side = b.h >= 0 ? 1 : -1;
    if (side > 0 && bear <= -(BEST.angle - 1)) side = -1;
    if (side < 0 && bear >= BEST.angle - 1) side = 1;
    want = side * BEST.angle;
  }
  const err = wrap(want - b.h);
  return Math.abs(err) < 5 ? 1 : err > 0 ? 2 : 0;
}

export function pointAtMarkAction(b: Boat) {
  const err = wrap(bearingOfMark(b.x, b.y) - b.h);
  return Math.abs(err) < 5 ? 1 : err > 0 ? 2 : 0;
}

// ---- the two views from "Designing what the boat sees" ----
export const D_EDGES = [15, 30, 50, 80, 120];

export function observeParts(x: number, y: number, h: number) {
  const bearing = bearingOfMark(x, y);
  const d = distToMark(x, y);
  const hi = ((Math.floor((h + 180) / 10) % 36) + 36) % 36;
  const bi = ((Math.floor((bearing + 180) / 15) % 24) + 24) % 24;
  const di = D_EDGES.filter((e) => d > e).length;
  return { hi, bi, di, bearing, d, cell: (hi * 24 + bi) * 6 + di };
}

export function viewAbsoluteParts(x: number, y: number, h: number) {
  const hi = ((Math.floor((h + 180) / 10) % 36) + 36) % 36;
  const xi = Math.min(11, Math.max(0, Math.floor((x + 60) / 10)));
  const yi = Math.min(11, Math.max(0, Math.floor((y + 30) / 10)));
  return { hi, xi, yi, cell: (hi * 12 + xi) * 12 + yi };
}

/** Sail a whole race with a helm function; returns the recorded track */
export function sailRace(heading: number, helm: (b: Boat) => number, reward: Reward = "progress", edge: Edge = "penalty") {
  const b = newBoat(heading);
  const x = [b.x], y = [b.y], h = [b.h], u = [b.u];
  let res: StepResult;
  do {
    res = stepBoat(b, helm(b), reward, edge);
    x.push(b.x); y.push(b.y); h.push(b.h); u.push(b.u);
  } while (!res.terminated && !res.truncated);
  return { x, y, h, u, tacks: b.tacks, end: res.arrived ? "arrived" : res.out ? "out" : "clock" } as const;
}
