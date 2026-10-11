// Keys to directions, shared by both arenas so they cannot disagree. The v2 arena once shipped its own
// copy of the movement table, mirrored left for right, a week after the v1 arena had been fixed for
// the same mistake. scripts/boss_controls_check.mjs measures every binding in both worlds against the
// camera; do not reason a change to this file out, run the check.
//
// fwd is +1 for W and -1 for S; side is +1 for D and -1 for A.
//
// Directions are the world's: eighths measured from "towards the boss", climbing the opposite way
// round from the screen. The camera looks ALONG the knight's local +z, which puts local +x on the
// LEFT of the picture, so screen-right is eighth 6 (local -x), not 2.

/** The eighth a held W/A/S/D combination walks along, or null when nothing is held. */
export function moveEighth(fwd: number, side: number): number | null {
  if (fwd === 0 && side === 0) return null;
  const table: Record<string, number> = {
    "1,0": 0, "1,1": 7, "0,1": 6, "-1,1": 5, "-1,0": 4, "-1,-1": 3, "0,-1": 2, "1,-1": 1,
  };
  return table[`${fwd},${side}`];
}

/**
 * The quarter a roll goes along (quarter q steps along eighth 2q): 0 in, 1 left, 2 back, 3 right.
 * A roll has four directions and the keys have eight, so the diagonals need a rule: any sideways key
 * wins, because a roll to the side is the one that leaves an attack's arc while staying in reach to
 * punish. Forward alone rolls in; back, or nothing held, rolls back.
 */
export function rollQuarter(fwd: number, side: number): number {
  if (side > 0) return 3;
  if (side < 0) return 1;
  return fwd > 0 ? 0 : 2;
}
