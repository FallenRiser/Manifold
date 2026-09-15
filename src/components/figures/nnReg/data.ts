// Measured series for the Regularisation track.
//
//   python scripts/regularisation_cases.py     # sections 1-9, the summaries
//   python scripts/reg_curves.py               # the per-epoch trajectory (curves.ts)
//
// Every array is copied from that output. The setup is deliberately one that
// overfits — a 3x256 MLP on 250 points with 50 features and 10% label noise —
// because a regulariser cannot be demonstrated on a problem with no gap to
// close. Train accuracy is 1.000 in essentially every classification row below;
// the only thing that moves is test accuracy, and therefore the gap.
//
// Read these honestly. Several of them are nulls, and the nulls are the most
// useful rows in the track: they are what stops "add a regulariser" from being
// cargo cult.

export type Sweep = { x: number; a: number; b?: number };

// --- SECTION 1 --------------------------------------------------------------
export const BASELINE = { train: 1.0, test: 0.756, gap: 0.244 };

// Capacity vs gap, no regularisation. The surprise: more capacity does not
// widen the gap here — the widest net is the BEST of the four.
export const CAPACITY = [
  { label: "1 × 32", train: 1.0, test: 0.753, gap: 0.247 },
  { label: "2 × 64", train: 1.0, test: 0.754, gap: 0.246 },
  { label: "3 × 256", train: 1.0, test: 0.751, gap: 0.249 },
  { label: "4 × 512", train: 1.0, test: 0.77, gap: 0.23 },
];

// --- SECTION 2 --------------------------------------------------------------
// 2a) Regression, AdamW: the textbook case. Train MSE up, test MSE down.
export const DECAY_REGRESSION: Sweep[] = [
  { x: 0.0, a: 0.0535, b: 0.0221 },
  { x: 0.0001, a: 0.0526, b: 0.022 },
  { x: 0.001, a: 0.0542, b: 0.0216 },
  { x: 0.01, a: 0.0516, b: 0.0218 },
  { x: 0.03, a: 0.0511, b: 0.0224 },
  { x: 0.1, a: 0.0478, b: 0.0227 },
  { x: 0.3, a: 0.0412, b: 0.029 },
];

// 2b) Classification, SGD + momentum: decay moves test accuracy, barely.
export const DECAY_SGD: Sweep[] = [
  { x: 0.0, a: 0.768 },
  { x: 0.0001, a: 0.766 },
  { x: 0.001, a: 0.768 },
  { x: 0.005, a: 0.77 },
  { x: 0.01, a: 0.771 },
  { x: 0.05, a: 0.767 },
];

// 2c) The honest null: the same sweep under full-batch AdamW does nothing.
export const DECAY_ADAMW: Sweep[] = [
  { x: 0.0, a: 0.755 },
  { x: 0.01, a: 0.751 },
  { x: 0.1, a: 0.753 },
];

// --- SECTION 3 --------------------------------------------------------------
export const WD_VS_L2 = [
  { label: "AdamW, decoupled wd 1e-3", test: 0.751, gap: 0.249 },
  { label: "Adam + L2 in the loss 1e-3", test: 0.77, gap: 0.23 },
];

// --- SECTION 4 --------------------------------------------------------------
// The shallow inverted U the page describes and never drew.
export const DROPOUT: Sweep[] = [
  { x: 0.0, a: 0.751 },
  { x: 0.1, a: 0.754 },
  { x: 0.2, a: 0.771 },
  { x: 0.3, a: 0.773 },
  { x: 0.5, a: 0.777 },
  { x: 0.7, a: 0.773 },
];

// --- SECTION 5 --------------------------------------------------------------
export const MC_DROPOUT = { deterministic: 0.749, singlePassMean: 0.717, singlePassStd: 0.01, fiftyPass: 0.749 };

// --- SECTION 6 --------------------------------------------------------------
export const ES_REGRESSION = { bestEpoch: 34, ofEpochs: 4000, testAtBest: 0.0118, testAtEnd: 0.076 };
// The counter-example: stopping on validation LOSS costs you accuracy.
export const ES_CLASSIFICATION = { bestEpoch: 3, ofEpochs: 600, testAtBest: 0.741, testAtEnd: 0.754 };

// --- SECTION 7 --------------------------------------------------------------
// Input jitter — monotone, and still rising at the largest setting tested.
export const JITTER: Sweep[] = [
  { x: 0.0, a: 0.753 },
  { x: 0.05, a: 0.755 },
  { x: 0.1, a: 0.76 },
  { x: 0.2, a: 0.766 },
  { x: 0.4, a: 0.784 },
];

// --- SECTION 8 --------------------------------------------------------------
// Two nulls and one reversal. Label smoothing moves test accuracy by 0.002 over
// its whole range; mixup makes things worse above alpha 0.2.
export const LABEL_SMOOTH: Sweep[] = [
  { x: 0.0, a: 0.752 },
  { x: 0.05, a: 0.752 },
  { x: 0.1, a: 0.753 },
  { x: 0.2, a: 0.754 },
];
export const MIXUP: Sweep[] = [
  { x: 0.2, a: 0.757 },
  { x: 0.4, a: 0.749 },
  { x: 1.0, a: 0.747 },
];

// --- SECTION 9 --------------------------------------------------------------
export const COMBOS = [
  { label: "none", test: 0.753, gap: 0.247 },
  { label: "weight decay 1e-2", test: 0.751, gap: 0.249 },
  { label: "dropout 0.3", test: 0.772, gap: 0.228 },
  { label: "wd + dropout", test: 0.781, gap: 0.219 },
  { label: "wd + dropout + jitter", test: 0.774, gap: 0.226 },
];

export const BN_AS_REG = { off: { test: 0.751, gap: 0.249 }, on: { test: 0.763, gap: 0.237 } };
