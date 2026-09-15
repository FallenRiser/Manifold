// Figure inputs for the Function-approximation track.
//
// The numeric series live in ./data.generated.ts, written by
// scripts/fa_emit_data.js from the stdout of scripts/fa_figures.py, which in
// turn runs the FA_SETUP code shipped in runtimeSetup.ts. This file only names
// them, colours them, and records what each one showed — so that a claim in a
// caption and the array behind it cannot drift apart silently.
//
// Headline numbers that the captions quote, with their source:
//
//   aggregation, 10 groups   best-fit VE 0.0544   fa_figures.py agg
//   aggregation, 20 groups   best-fit VE 0.0273   fa_figures.py agg
//   tile coding, 50x11       best-fit VE 0.0009   fa_figures.py agg
//   Baird off-policy         ||w|| 10.34 -> 709.21 in 1000 steps (68.6x)
//   Baird on-policy          ||w|| 10.34 -> 9.00   (stable) — matches fa_cases.py
//   Mountain Car, 200 eps    last-20 mean 136.2 steps, best 89
//   cost-to-go range         -1.5 to 113.3
//   width dial, 5 seeds      4x4: first20 237.7 / last50 170.9
//                            8x8: first20 394.4 / last50 143.1
//                            16x16: first20 710.0 / last50 156.7
//   replay batch spread      consecutive 0.0527, sampled 0.0810 (1.5x)

import {
  AGG_10, AGG_20, TILES_FIT, V_TRUE, MU,
  BAIRD_STEPS, BAIRD_OFF, BAIRD_ON,
  MC_COST, MC_ACTION, MC_POS_GRID, MC_VEL_GRID, MC_STEPS,
  WIDTH_EP, WIDTH_4, WIDTH_8, WIDTH_16,
  REPLAY_CONSEC, REPLAY_SAMPLED,
  TD_VE_OPT, TD_FIXED,
} from "./data.generated";
import type { Line } from "./Staircase";

const GOLD = "var(--c-rl)";
const GOOD = "var(--good)";
const BAD = "var(--bad)";
const MUTED = "var(--muted)";

// The 1000-state walk, sampled every 10 states.
export const WALK_STATES = Array.from({ length: V_TRUE.length }, (_, i) => i * 10 + 1);
export const WALK_MU = MU;

/** The true value function on its own — "this is what a table would store". */
export const TRUE_ONLY: Line[] = [
  { label: "true vπ (all 1000 states)", values: V_TRUE, color: GOLD },
];

/** Aggregation as a staircase against the smooth truth. */
export const AGG_VS_TRUE: Line[] = [
  { label: "true vπ", values: V_TRUE, color: MUTED, dash: "4 3" },
  { label: "10 groups — best fit, VE 0.0544", values: AGG_10, color: GOLD, step: true },
];

export const AGG_RESOLUTION: Line[] = [
  { label: "true vπ", values: V_TRUE, color: MUTED, dash: "4 3" },
  { label: "10 groups — VE 0.0544", values: AGG_10, color: BAD, step: true },
  { label: "20 groups — VE 0.0273", values: AGG_20, color: GOLD, step: true },
];

/** Tile coding reaches a floor 60x lower than aggregation's, and is smooth. */
export const TILES_VS_AGG: Line[] = [
  { label: "true vπ", values: V_TRUE, color: MUTED, dash: "4 3" },
  { label: "10 groups — VE 0.0544", values: AGG_10, color: BAD, step: true },
  { label: "50 tilings of 11 — VE 0.0009", values: TILES_FIT, color: GOOD },
];

// --- Baird ------------------------------------------------------------------
export const BAIRD_X = BAIRD_STEPS;
export const BAIRD_SERIES = [
  { label: "off-policy — all three legs", values: BAIRD_OFF, color: BAD },
  { label: "on-policy — one leg dropped", values: BAIRD_ON, color: GOOD, dash: "5 3" },
];

// --- Mountain Car -----------------------------------------------------------
export const MC = { cost: MC_COST, action: MC_ACTION, pos: MC_POS_GRID, vel: MC_VEL_GRID };
export const MC_LEARNING = MC_STEPS;

// The width dial, smoothed over a 10-episode window and thinned for drawing.
export const WIDTH_DIAL = {
  x: WIDTH_EP,
  series: [
    { label: "4×4 tiles — coarse", values: WIDTH_4, color: BAD },
    { label: "8×8 tiles", values: WIDTH_8, color: GOLD },
    { label: "16×16 tiles — fine", values: WIDTH_16, color: GOOD, dash: "5 3" },
  ],
};

export const REPLAY = { consecutive: REPLAY_CONSEC, sampled: REPLAY_SAMPLED };

// fa_figures.py td: the two places a 10-group aggregation can end up.
//   VE optimum      VE 0.0544   the best the representation can do
//   TD fixed point  VE 0.1167   where semi-gradient TD actually converges
// 2.15x worse, with the largest per-group difference 0.1711. TD is not solving
// the approximation problem the previous chapter posed; it solves a different
// one, and this is the size of the discrepancy.
export const TD_DESTINATIONS: Line[] = [
  { label: "true v\u03c0", values: V_TRUE, color: MUTED, dash: "4 3" },
  { label: "VE optimum \u2014 VE 0.0544", values: TD_VE_OPT, color: GOOD, step: true },
  { label: "TD fixed point \u2014 VE 0.1167", values: TD_FIXED, color: BAD, step: true },
];

export { GOLD, GOOD, BAD, MUTED };
