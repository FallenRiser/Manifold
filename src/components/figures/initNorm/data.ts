// Measured series for the Initialisation & normalisation track.
//
// Every array here is copied verbatim from a script in this repo — nothing is
// drawn by hand and nothing is smoothed. Re-run the two scripts and diff:
//
//   python scripts/init_norm_cases.py   # statistics AT INIT  (sections 1-8)
//   python scripts/init_norm_train.py   # what happens when you TRAIN (1-3)
//
// The split matters. init_norm_cases.py measures a freshly-built network:
// activation variances, gradient norms, dead fractions. init_norm_train.py
// hand-rolls the training loop (Linear + optional BatchNorm + ReLU, Adam) so
// that the init under test is the init that actually trains — sklearn's
// MLPClassifier silently replaces whatever you hand it, which is why the older
// script reports the identical accuracy for every init scale.

export type { Series } from "../series";
import type { Series } from "../series";

// --- init_norm_cases.py SECTION 2 -------------------------------------------
// Activation variance per layer, 10 layers of width 64, ReLU.
// Xavier decays by ~2x per layer (the half that ReLU discards); He holds.
export const VAR_BY_LAYER_RELU: Series[] = [
  {
    label: "scale 1.0 — explodes",
    color: "var(--bad)",
    values: [0.4915, 16.9458, 610.2299, 18305.6585, 724534.768, 30732964.4125,
      1023363727.3723, 21853524077.3291, 711598786715.8379, 28104782915230.328],
  },
  {
    label: "He — holds",
    color: "var(--good)",
    values: [0.4915, 0.5296, 0.5959, 0.5586, 0.691, 0.9159, 0.9531, 0.636, 0.6472, 0.7988],
  },
  {
    label: "Xavier — halves each layer",
    color: "var(--warn)",
    values: [0.2457, 0.1324, 0.0745, 0.0349, 0.0216, 0.0143, 0.0074, 0.0025, 0.0013, 0.0008],
  },
  {
    label: "scale 0.01 — vanishes",
    color: "var(--muted)",
    dash: "3 3",
    // Printed at 4 decimal places this column reads "0.0000" ten times, which is
    // how it appeared in the prose. It is not zero: it is decaying by two to
    // three decades PER LAYER, from 4.9e-05 to 2.8e-27. On a log axis that is a
    // perfectly straight line — the same geometric law as Xavier's, just steeper.
    values: [4.915e-5, 1.695e-7, 6.102e-10, 1.831e-12, 7.245e-15, 3.073e-17,
      1.023e-19, 2.185e-22, 7.116e-25, 2.81e-27],
  },
];

// tanh, same sweep — the contrast that explains why Xavier was fine until ReLU.
// Xavier still drifts down under tanh, but by a factor of 7 over ten layers
// rather than ReLU's factor of 315. This is the regime Xavier was designed in.
export const VAR_BY_LAYER_TANH: Series[] = [
  {
    label: "He",
    color: "var(--good)",
    values: [0.402324, 0.335264, 0.341324, 0.322963, 0.296561, 0.298513, 0.287963, 0.3063, 0.28792, 0.30714],
  },
  {
    label: "Xavier",
    color: "var(--warn)",
    values: [0.289076, 0.178315, 0.146275, 0.113126, 0.0766478, 0.0600451, 0.0512455, 0.0522387, 0.0437265, 0.0428449],
  },
];

// --- init_norm_cases.py SECTION 4 -------------------------------------------
// Pre-activation std per layer, depth 8, width 32, ReLU, three scales.
export const PREACT_STD: Series[] = [
  {
    label: "too large (5.0)",
    color: "var(--bad)",
    values: [5.244, 107.8141, 2025.6249, 38931.0837, 714635.2895, 10326253.7318,
      234195857.1981, 4197047183.9033],
  },
  {
    label: "He (correct)",
    color: "var(--good)",
    values: [1.0488, 1.0781, 1.0128, 0.9733, 0.8933, 0.6454, 0.7319, 0.6558],
  },
  {
    label: "too small (0.001)",
    color: "var(--muted)",
    dash: "3 3",
    // Printed to 4dp this reads 0.0010 then 0.0000 seven times. It is not zero.
    values: [0.0010488, 4.31256e-6, 1.6205e-8, 6.22897e-11, 2.28683e-13,
      6.6088e-16, 2.99771e-18, 1.07444e-20],
  },
];

// Fraction of pre-activations beyond |z| > 5 — the saturation that the
// too-large column buys. Same run as PREACT_STD.
export const EXTREME_FRAC = { small: [0, 0, 0, 0, 0, 0, 0, 0], he: [0.001, 0, 0, 0, 0, 0, 0, 0], large: [0.282, 0.93, 0.996, 1, 1, 1, 1, 1] };

// --- init_norm_cases.py SECTION 3 -------------------------------------------
// Gradient ratio (last layer / first layer) at init, 10 layers of width 64.
export const XAVIER_VS_HE = [
  { act: "sigmoid", xavier: 3727758.7939, he: 351255.9895 },
  { act: "tanh", xavier: 5.4532, he: 8.1234 },
  { act: "relu", xavier: 2.2285, he: 7.5839 },
];

// --- init_norm_cases.py SECTION 8 -------------------------------------------
// Activation std per layer, depth 4, width 16 — why zero init cannot work.
// Zero really is zero here: every unit in a layer emits the identical value, so
// the layer has an effective width of one no matter how many units it has.
export const SYMMETRY = {
  zero: [0, 0, 0, 0],
  tiny: [0.000512832, 1.22357e-6, 4.24024e-9, 1.10391e-11],
  he: [0.512832, 0.432597, 0.530031, 0.487866],
};

export const SYMMETRY_SERIES: Series[] = [
  { label: "He — healthy", color: "var(--good)", values: SYMMETRY.he },
  { label: "tiny random (0.001) — symmetry broken, signal gone", color: "var(--warn)", values: SYMMETRY.tiny },
  {
    label: "zero — exactly 0 at every layer",
    color: "var(--bad)",
    dash: "3 3",
    values: SYMMETRY.zero,
    note: "the only genuinely zero line in this track; every other 0.0000 was a rounded small number",
  },
];

// --- init_norm_train.py SECTION 1 -------------------------------------------
// 8 hidden layers of width 32, Adam lr 0.01, 60 epochs, 3 seeds.
// Majority class on this test set = 0.5300, so 0.4700 is a CONSTANT predictor:
// all 200 test points come back with the identical logit, -0.055570, i.e. class
// 0 for everything. Gradient norm at the first layer at init: 1.33e-20.
// Note the seed spread in the last column — too-large init is not merely worse
// on average, it is unreliable (+/- 0.069 against +/- 0.004 for Xavier).
export const INIT_OUTCOME = [
  { init: "0.001", std: 0.001, acc: 0.47, sd: 0.0 },
  { init: "0.01", std: 0.01, acc: 0.47, sd: 0.0 },
  { init: "xavier", std: 0.1768, acc: 0.945, sd: 0.0041 },
  { init: "he", std: 0.25, acc: 0.9383, sd: 0.0062 },
  { init: "1.0", std: 1.0, acc: 0.8767, sd: 0.0688 },
  { init: "5.0", std: 5.0, acc: 0.8433, sd: 0.0563 },
];
export const MAJORITY_CLASS = 0.53;

// --- init_norm_train.py SECTION 2 -------------------------------------------
// Post-activation std per hidden layer AFTER training, He init, depth 10.
// He sets the scale correctly at step 0; training then walks it away — 0.50 at
// layer 1 to 5.87 by layer 7. BatchNorm is what holds it there.
export const ACT_STD_TRAINED: Series[] = [
  {
    label: "without BatchNorm",
    color: "var(--bad)",
    values: [0.5, 0.492, 0.666, 1.331, 2.636, 4.067, 5.867, 5.599, 5.658, 4.556],
  },
  {
    label: "with BatchNorm",
    color: "var(--good)",
    values: [0.57, 0.625, 0.661, 0.71, 0.71, 0.693, 0.643, 0.658, 0.669, 0.709],
  },
];

// The honest null: on this problem BatchNorm does not buy accuracy. At depth 20
// it costs some. What it buys is INIT_SENSITIVITY below.
export const ACC_VS_DEPTH = [
  { depth: 2, noBn: 0.945, bn: 0.945 },
  { depth: 4, noBn: 0.94, bn: 0.9467 },
  { depth: 8, noBn: 0.9383, bn: 0.9467 },
  { depth: 12, noBn: 0.9483, bn: 0.95 },
  { depth: 16, noBn: 0.9433, bn: 0.945 },
  { depth: 20, noBn: 0.9433, bn: 0.93 },
];

// --- init_norm_train.py SECTION 3 -------------------------------------------
// The track's thesis as a number. Spread across init scales: 0.4750 -> 0.0083,
// a 57x collapse. BatchNorm rescues the two dead inits outright.
export const INIT_SENSITIVITY = [
  { init: "0.001", noBn: 0.47, bn: 0.95 },
  { init: "0.01", noBn: 0.47, bn: 0.95 },
  { init: "xavier", noBn: 0.945, bn: 0.9433 },
  { init: "he", noBn: 0.9383, bn: 0.9467 },
  { init: "1.0", noBn: 0.8767, bn: 0.9467 },
  { init: "5.0", noBn: 0.8433, bn: 0.9417 },
];
export const SENSITIVITY_SPREAD = { noBn: 0.475, bn: 0.0083 };
