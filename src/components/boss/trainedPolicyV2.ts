// The duellist from `python scripts/boss_v2_train.py dqn --decisions 6000000 --seed 0`, running here.
//
// A separate file from trainedPolicy.ts on purpose, exactly as duelSimV2.ts is separate from
// duelSim.ts. That one is pinned to v1's 27-float observation and 16 buttons and is asserted at
// those widths by scripts/boss_policy_check.mjs; widening it in place would put the frozen v1
// numbers at the mercy of a v2 edit, which has already happened once on this project.
//
// For the policy you watch in the arena to be the policy the published table describes, four
// things have to hold, and each is checked rather than asserted:
//
//   1. the WEIGHTS are the same. public/boss/v2_*.bin is raw little-endian float32 straight out
//      of torch, written by `boss_v2_train.py export`, and boss_policy_check_v2.mjs compares its
//      sha1 against the one torch recorded.
//   2. the OBSERVATION is the same. That is `Duel.obs()` in duelSimV2.ts, replayed against
//      recorded states by the same check.
//   3. the ARITHMETIC is the same. That is `qValues()` below, compared value for value.
//   4. the WORLD is the same. The manifest carries the BOSS_SETUP_V2 sha1 the net trained
//      against, because this world has had three hashes in a single day and "n_obs happens to
//      differ" is luck, not provenance.
//
// This file deliberately imports NOTHING, so `node scripts/boss_policy_check_v2.mjs` loads the
// exact file the browser runs, with no bundler in between.

/** Input and output widths of the EXPORTED NET. boss_policy_check_v2.mjs asserts both against
 *  the manifest torch wrote, so these cannot silently drift from the world's own constants. */
export const N_OBS = 38;
export const N_ACTIONS = 17;
const WIDTH = 256;

/** Layer order in the .bin, which is the order `LAYERS` names in boss_v2_train.py. */
export type NetV2 = {
  w0: Float32Array; b0: Float32Array; // 256 x 38, 256
  w1: Float32Array; b1: Float32Array; // 256 x 256, 256
  w2: Float32Array; b2: Float32Array; // 17 x 256, 17
  width: number;
};

export function decodeNet(buf: ArrayBuffer, width = WIDTH): NetV2 {
  const f = new Float32Array(buf);
  const want = width * N_OBS + width + width * width + width + N_ACTIONS * width + N_ACTIONS;
  if (f.length !== want) throw new Error(`weights are ${f.length} floats, expected ${want}`);
  let i = 0;
  const take = (n: number) => f.subarray(i, (i += n));
  return {
    w0: take(width * N_OBS), b0: take(width),
    w1: take(width * width), b1: take(width),
    w2: take(N_ACTIONS * width), b2: take(N_ACTIONS),
    width,
  };
}

export async function loadNet(url: string): Promise<NetV2> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  return decodeNet(await r.arrayBuffer());
}

// Scratch buffers, so a duel running at 30 Hz does not allocate two 256-vectors per decision.
const h0 = new Float32Array(WIDTH);
const h1 = new Float32Array(WIDTH);
const qOut = new Float32Array(N_ACTIONS);

/**
 * Three matmuls and two ReLUs: torch's `nn.Sequential(Linear, ReLU, Linear, ReLU, Linear)`.
 *
 * torch stores a Linear's weight as (out, in) and computes x @ W.T, so row `o` of the weight is
 * the fan-in for output `o` -- which is why the inner loop walks `o * in + j`.
 */
export function qValues(net: NetV2, v: ArrayLike<number>, out = qOut): Float32Array {
  const { w0, b0, w1, b1, w2, b2, width } = net;
  for (let o = 0; o < width; o++) {
    let s = b0[o];
    const base = o * N_OBS;
    for (let j = 0; j < N_OBS; j++) s += w0[base + j] * v[j];
    h0[o] = s > 0 ? s : 0;
  }
  for (let o = 0; o < width; o++) {
    let s = b1[o];
    const base = o * width;
    for (let j = 0; j < width; j++) s += w1[base + j] * h0[j];
    h1[o] = s > 0 ? s : 0;
  }
  for (let o = 0; o < N_ACTIONS; o++) {
    let s = b2[o];
    const base = o * width;
    for (let j = 0; j < width; j++) s += w2[base + j] * h1[j];
    out[o] = s;
  }
  return out;
}

export function argmax(q: ArrayLike<number>): number {
  let best = 0;
  for (let i = 1; i < q.length; i++) if (q[i] > q[best]) best = i;
  return best;
}

/**
 * How decided the choice was: best Q minus second-best.
 *
 * Do NOT render this by min-max normalising the Q vector. The v1 arena shipped a panel that did
 * exactly that and was unreadable, because the FAN of the values varies several-fold from frame
 * to frame -- rescaling to the extremes every frame makes a confident choice and a coin-flip
 * look identical. Encode against the measured spread instead; scripts/boss_qspread_v2.mjs
 * reports the p10/median/p90 this panel should be built against.
 */
export function margin(q: ArrayLike<number>): number {
  let a = -Infinity, b = -Infinity;
  for (let i = 0; i < q.length; i++) {
    if (q[i] > a) { b = a; a = q[i]; } else if (q[i] > b) b = q[i];
  }
  return a - b;
}

/** Best and second-best action indices, for a panel that wants to name the runner-up. */
export function top2(q: ArrayLike<number>): [number, number] {
  let a = 0, b = -1;
  for (let i = 1; i < q.length; i++) if (q[i] > q[a]) { b = a; a = i; }
  if (b < 0) { b = a === 0 ? 1 : 0; }
  for (let i = 0; i < q.length; i++) if (i !== a && (b === a || q[i] > q[b])) b = i;
  return [a, b];
}
