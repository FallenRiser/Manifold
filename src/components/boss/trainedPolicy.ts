// The duellist from `python scripts/boss_train.py dqn --decisions 2000000 --seed 0`, running here.
//
// For the policy you watch in the arena to be the policy that won 200 of 200 held-out duels, three
// separate things have to hold, and each is checked rather than asserted:
//
//   1. the WEIGHTS are the same. public/boss/*.bin is raw little-endian float32 straight out of
//      torch -- not quantised, not base64, not rounded -- written by `boss_train.py export`, and
//      scripts/boss_policy_check.mjs compares its sha1 against the one torch recorded.
//   2. the OBSERVATION is the same. That is `Duel.obs()` in duelSim.ts, a line-for-line port of
//      the shipped Python obs(), replayed against recorded states by the same check.
//   3. the ARITHMETIC is the same. That is `qValues()` below -- the three matmuls and two ReLUs
//      of torch's nn.Sequential -- compared value for value against what torch produced.
//
// This file deliberately imports NOTHING. It is pure array arithmetic, which keeps it loadable by
// `node scripts/boss_policy_check.mjs` without a bundler, and keeps the check honest: the browser
// runs this exact file.

/** Input and output widths of the EXPORTED NET. boss_policy_check.mjs asserts both against the
 *  manifest torch wrote, so these cannot silently drift from the world's own constants. */
export const N_OBS = 27;
export const N_ACTIONS = 16;
const WIDTH = 256;

/** Layer order in the .bin, which is the order `LAYERS` names in boss_train.py. */
export type Net = {
  w0: Float32Array; b0: Float32Array; // 256 x 27, 256
  w1: Float32Array; b1: Float32Array; // 256 x 256, 256
  w2: Float32Array; b2: Float32Array; // 16 x 256, 16
  width: number;
};

/** Cut the flat blob into the six tensors, in the order boss_train.py wrote them. */
export function decodeNet(buf: ArrayBuffer, width = WIDTH): Net {
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

export async function loadNet(url: string): Promise<Net> {
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
export function qValues(net: Net, v: ArrayLike<number>, out = qOut): Float32Array {
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
 * Worth showing in the lab, because a policy that is mashing a cheap button through a hold and
 * a policy that has read the attack look identical in the action trace and quite different here.
 */
export function margin(q: ArrayLike<number>): number {
  let a = -Infinity, b = -Infinity;
  for (let i = 0; i < q.length; i++) {
    if (q[i] > a) { b = a; a = q[i]; } else if (q[i] > b) b = q[i];
  }
  return a - b;
}
