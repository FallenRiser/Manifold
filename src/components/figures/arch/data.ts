// Measured series for the Architecture design track.
//
// Provenance is per-block. Nothing here is typed by hand from memory: every
// array below is copied out of the printed output of the named script section,
// and the scripts run on the same 800-point two-moons dataset (seed 0, 25% test
// split) as init_norm_cases.py and the ARCH_SETUP preamble.
//
// Two scripts feed this file, and the split matters:
//
//   scripts/architecture_cases.py drives sklearn's MLPClassifier. It is fine for
//   "how does accuracy move with width/depth/shape", which is what chapters 1-4
//   ask.
//
//   scripts/arch_depth.py hand-rolls the network, because MLPClassifier cannot
//   express a skip connection and replaces the initialisation you hand it.
//   Everything about chapter 5 comes from there, and so does every claim about
//   what happens under plain SGD.

import type { Series } from "../series";

const NEURAL = "var(--c-neural)";
const GOOD = "var(--good)";
const BAD = "var(--bad)";
const MUTED = "var(--muted)";

// --bad and --c-neural are close enough on screen that two series using them
// read as one colour in a legend. Wherever both appear in the same figure, the
// third series is separated by dash pattern as well.

// --- architecture_cases.py SECTION 3 ----------------------------------------
// Width sweep at depth 2, 5 seeds, Adam. The plateau the chapter argues for is
// real and it arrives early: width 16 is already within 0.002 of the best row,
// and 512 (264,705 parameters, 223x more) is 1.1 points WORSE.
export const WIDTH_SWEEP = [
  { x: 2, y: 0.7700, params: 15 },
  { x: 4, y: 0.8690, params: 37 },
  { x: 8, y: 0.9110, params: 105 },
  { x: 16, y: 0.9510, params: 337 },
  { x: 32, y: 0.9530, params: 1185 },
  { x: 64, y: 0.9470, params: 4417 },
  { x: 128, y: 0.9480, params: 17025 },
  { x: 256, y: 0.9430, params: 66817 },
  { x: 512, y: 0.9420, params: 264705 },
];

// --- architecture_cases.py SECTION 2 ----------------------------------------
// Depth sweep at width 32, 5 seeds, Adam. Best at depth 2; everything from 3 to
// 20 sits in a 1.2-point band. There is no depth payoff on this problem at all,
// which is the honest headline for chapter 3.
export const DEPTH_SWEEP = [
  { x: 1, y: 0.9180, params: 129 },
  { x: 2, y: 0.9530, params: 1185 },
  { x: 3, y: 0.9440, params: 2241 },
  { x: 4, y: 0.9450, params: 3297 },
  { x: 6, y: 0.9440, params: 5409 },
  { x: 8, y: 0.9360, params: 7521 },
  { x: 10, y: 0.9380, params: 9633 },
  { x: 12, y: 0.9390, params: 11745 },
  { x: 16, y: 0.9310, params: 15969 },
  { x: 20, y: 0.9430, params: 20193 },
];

// --- architecture_cases.py SECTION 1 ----------------------------------------
// The full (depth, width) grid. Feeds the heatmap and DepthVsWidthLab.
export type GridCell = { depth: number; width: number; params: number; train: number; test: number };
export const GRID: GridCell[] = [
  { depth: 1, width: 4, params: 17, train: 0.8600, test: 0.8520 },
  { depth: 1, width: 8, params: 33, train: 0.8783, test: 0.8660 },
  { depth: 1, width: 16, params: 65, train: 0.8930, test: 0.8850 },
  { depth: 1, width: 32, params: 129, train: 0.9213, test: 0.9180 },
  { depth: 1, width: 64, params: 257, train: 0.9357, test: 0.9380 },
  { depth: 2, width: 4, params: 37, train: 0.8827, test: 0.8690 },
  { depth: 2, width: 8, params: 105, train: 0.9187, test: 0.9110 },
  { depth: 2, width: 16, params: 337, train: 0.9487, test: 0.9510 },
  { depth: 2, width: 32, params: 1185, train: 0.9523, test: 0.9530 },
  { depth: 2, width: 64, params: 4417, train: 0.9520, test: 0.9470 },
  { depth: 3, width: 4, params: 57, train: 0.8760, test: 0.8570 },
  { depth: 3, width: 8, params: 177, train: 0.9250, test: 0.9060 },
  { depth: 3, width: 16, params: 609, train: 0.9523, test: 0.9470 },
  { depth: 3, width: 32, params: 2241, train: 0.9547, test: 0.9440 },
  { depth: 3, width: 64, params: 8577, train: 0.9557, test: 0.9440 },
  { depth: 4, width: 4, params: 77, train: 0.9183, test: 0.9120 },
  { depth: 4, width: 8, params: 249, train: 0.9257, test: 0.9090 },
  { depth: 4, width: 16, params: 881, train: 0.9540, test: 0.9440 },
  { depth: 4, width: 32, params: 3297, train: 0.9560, test: 0.9450 },
  { depth: 4, width: 64, params: 12737, train: 0.9593, test: 0.9430 },
  { depth: 6, width: 4, params: 117, train: 0.8343, test: 0.8130 },
  { depth: 6, width: 8, params: 393, train: 0.9397, test: 0.9250 },
  { depth: 6, width: 16, params: 1425, train: 0.9573, test: 0.9420 },
  { depth: 6, width: 32, params: 5409, train: 0.9567, test: 0.9440 },
  { depth: 6, width: 64, params: 21057, train: 0.9583, test: 0.9420 },
  { depth: 8, width: 4, params: 157, train: 0.6700, test: 0.6540 },
  { depth: 8, width: 8, params: 537, train: 0.9547, test: 0.9440 },
  { depth: 8, width: 16, params: 1969, train: 0.9583, test: 0.9430 },
  { depth: 8, width: 32, params: 7521, train: 0.9597, test: 0.9360 },
  { depth: 8, width: 64, params: 29377, train: 0.9660, test: 0.9320 },
];
export const GRID_DEPTHS = [1, 2, 3, 4, 6, 8];
export const GRID_WIDTHS = [4, 8, 16, 32, 64];

// --- architecture_cases.py SECTION 4 ----------------------------------------
// One budget, six shapes. The spread across all six is 1.2 points, and the
// shallowest is the best — the chapter's "spend it on width first" conclusion,
// with the honest note that the differences are barely outside the seed noise
// (test_std reaches 0.0066).
export const BUDGET = [
  { label: "1 x 333", params: 1333, test: 0.9550, sd: 0.0000 },
  { label: "2 x 22", params: 595, test: 0.9560, sd: 0.0058 },
  { label: "3 x 17", params: 681, test: 0.9470, sd: 0.0051 },
  { label: "4 x 14", params: 687, test: 0.9460, sd: 0.0020 },
  { label: "6 x 12", params: 829, test: 0.9440, sd: 0.0066 },
  { label: "8 x 10", params: 811, test: 0.9460, sd: 0.0058 },
];

// --- architecture_cases.py SECTION 7 ----------------------------------------
// Funnel vs constant vs inverted funnel: a null. 0.9450 / 0.9440 / 0.9430, with
// per-shape seed spreads of up to 0.0049. The page says so.
export const SCHEDULES = [
  { label: "funnel 64→32→16", params: 2817, test: 0.9450, sd: 0.0000 },
  { label: "constant 32→32→32", params: 2241, test: 0.9440, sd: 0.0049 },
  { label: "inverted 16→32→64", params: 2769, test: 0.9430, sd: 0.0040 },
];

// --- arch_depth.py SECTION 1 ------------------------------------------------
// Plain He+ReLU, width 16, Adam, 3 seeds. The mean barely moves (0.9483 at
// depth 2 to 0.9333 at depth 20); what moves is the SPREAD and the worst case.
export const DEPTH_PLAIN = [
  { depth: 2, train: 0.9556, test: 0.9483, sd: 0.0024, worst: 0.9450 },
  { depth: 4, train: 0.9594, test: 0.9467, sd: 0.0062, worst: 0.9400 },
  { depth: 6, train: 0.9628, test: 0.9400, sd: 0.0122, worst: 0.9250 },
  { depth: 8, train: 0.9583, test: 0.9433, sd: 0.0024, worst: 0.9400 },
  { depth: 12, train: 0.9544, test: 0.9267, sd: 0.0155, worst: 0.9050 },
  { depth: 16, train: 0.9539, test: 0.9450, sd: 0.0041, worst: 0.9400 },
  { depth: 20, train: 0.9539, test: 0.9333, sd: 0.0062, worst: 0.9250 },
  { depth: 30, train: 0.9033, test: 0.9017, sd: 0.0510, worst: 0.8300 },
  { depth: 40, train: 0.9439, test: 0.9283, sd: 0.0290, worst: 0.8900 },
];

// --- arch_depth.py SECTION 7 ------------------------------------------------
// The same sweep under plain SGD (lr 0.1), which is the regime where depth
// actually fails — Adam's per-parameter rescaling is what hides the wall in
// DEPTH_PLAIN above. Three architectures, one axis:
//
//   plain     fine to depth 20, then collapses: 0.7700 at 30, 0.7500 at 40,
//             with seed spreads of 0.2122 and 0.1980 (some seeds fail outright).
//   residual  WORSE than plain, and catastrophically so: 0.4700 from depth 12
//             on, which is below the 0.5300 majority class. A bare skip with no
//             normalisation makes the network diverge.
//   res+BN    flat across the whole range, 0.9417-0.9550, and the tightest seed
//             spread of the three everywhere.
export const SGD_DEPTH = [
  { depth: 2, plain: 0.9017, residual: 0.9100, resBN: 0.9550, plainSd: 0.0225, residualSd: 0.0286, resBNSd: 0.0041 },
  { depth: 4, plain: 0.9367, residual: 0.9350, resBN: 0.9550, plainSd: 0.0094, residualSd: 0.0041, resBNSd: 0.0000 },
  { depth: 8, plain: 0.9333, residual: 0.9467, resBN: 0.9450, plainSd: 0.0143, residualSd: 0.0024, resBNSd: 0.0041 },
  { depth: 12, plain: 0.9417, residual: 0.4700, resBN: 0.9483, plainSd: 0.0024, residualSd: 0.0000, resBNSd: 0.0047 },
  { depth: 20, plain: 0.9400, residual: 0.4700, resBN: 0.9417, plainSd: 0.0108, residualSd: 0.0000, resBNSd: 0.0047 },
  { depth: 30, plain: 0.7700, residual: 0.4700, resBN: 0.9417, plainSd: 0.2122, residualSd: 0.0000, resBNSd: 0.0155 },
  { depth: 40, plain: 0.7500, residual: 0.4700, resBN: 0.9467, plainSd: 0.1980, residualSd: 0.0000, resBNSd: 0.0047 },
];
export const MAJORITY_CLASS = 0.5300;

// --- arch_depth.py SECTION 6 ------------------------------------------------
// Std of the activations leaving each of 20 hidden layers, at He init, width 16.
// This is the whole of chapter 5 in one figure:
//   plain           0.513 -> 0.060     x0.1      the signal decays away
//   residual        0.513 -> 4741.58   x9246     the residual stream explodes
//   residual + BN   0.567 -> 4.15      x7.3      bounded
// A skip connection replaces multiplication with addition, and addition
// accumulates. Normalisation is what makes the accumulation survivable.
export const RESIDUAL_STREAM: Series[] = [
  {
    label: "plain — decays to 0.060",
    color: MUTED,
    dash: "5 3",
    values: [0.512832, 0.432597, 0.530031, 0.487866, 0.443944, 0.305446, 0.360149, 0.353335,
      0.454201, 0.414127, 0.519854, 0.262974, 0.369292, 0.37239, 0.229511, 0.155654,
      0.115111, 0.108279, 0.0809955, 0.0599596],
  },
  {
    label: "residual, no norm — grows to 4,742",
    color: BAD,
    values: [0.512832, 0.753746, 1.30753, 1.99655, 3.1649, 4.23624, 7.57534, 10.8912,
      14.7084, 28.3653, 47.2162, 88.9093, 142.987, 215.716, 390.609, 810.334,
      1292.14, 2224.72, 3083.45, 4741.58],
  },
  {
    label: "residual + BatchNorm — ends at 4.15",
    color: GOOD,
    values: [0.566708, 0.846182, 1.1567, 1.24964, 1.40318, 1.51647, 1.74192, 1.84519,
      1.96388, 2.14672, 2.35408, 2.52331, 2.66904, 2.80764, 2.90643, 3.1032,
      3.38251, 3.62498, 3.86343, 4.15354],
  },
];

// --- arch_depth.py SECTION 3 ------------------------------------------------
// Gradient norm at each of 21 weight matrices, depth 20, width 16, at He init
// (layer 1 is the input side). The plain net's first-layer gradient is 8x
// smaller than its last; the residual net's is 145x smaller, because the
// exploding forward stream drives the late layers' gradients up, not because
// the early ones vanish. The ratio alone does not distinguish these.
export const GRAD_BY_LAYER: Series[] = [
  {
    label: "plain — first/last 0.12",
    color: MUTED,
    dash: "5 3",
    values: [0.00172036, 0.00401483, 0.00529997, 0.00878388, 0.00563092, 0.00615618,
      0.00430038, 0.00595367, 0.00830802, 0.010273, 0.0101842, 0.0178308, 0.0132619,
      0.017662, 0.0178336, 0.0214669, 0.0126704, 0.019973, 0.0240619, 0.0211896, 0.014248],
  },
  {
    label: "residual, no norm — first/last 0.0069",
    color: BAD,
    values: [70.3712, 102.958, 142.079, 142.849, 124.654, 190.52, 208.781, 222.622,
      165.978, 148.715, 271.28, 440.991, 689.963, 770.897, 1085.92, 1717.21,
      1444.45, 4747.39, 5606.4, 6273.11, 10269.4],
  },
];

// --- arch_depth.py SECTION 4 ------------------------------------------------
// Four diagnostic shapes on 40 training points, sampled every 10 epochs inside
// one continuous 400-epoch run. 600 points of two moons cannot be overfit by
// any architecture, which is why architecture_cases.py's "overfit" row showed a
// smaller gap than its "good fit" row; 40 points can.
export const DIAG_EPOCHS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150,
  160, 170, 180, 190, 200, 210, 220, 230, 240, 250, 260, 270, 280, 290, 300, 310, 320, 330,
  340, 350, 360, 370, 380, 390, 400];

export type Diag = { key: string; title: string; verdict: string; train: number[]; test: number[] };

export const DIAGNOSTICS: Diag[] = [
  {
    key: "underfit",
    title: "Underfitting — 1 layer of 2 units",
    verdict: "Both curves flatten, low, together. Train accuracy tops out at 0.867 and the gap is only 0.030: the model is not failing to generalise, it is failing to fit. Add capacity.",
    train: [0.7500, 0.8417, 0.8583, 0.8583, 0.8583, 0.8667, 0.8667, 0.8667, 0.8667, 0.8667,
      0.8750, 0.8667, 0.8667, 0.8667, 0.8750, 0.8667, 0.8667, 0.8667, 0.8667, 0.8667,
      0.8667, 0.8667, 0.8667, 0.8667, 0.8667, 0.8667, 0.8667, 0.8667, 0.8667, 0.8667,
      0.8667, 0.8667, 0.8667, 0.8667, 0.8667, 0.8667, 0.8667, 0.8667, 0.8667, 0.8667],
    test: [0.6967, 0.8150, 0.8267, 0.8300, 0.8283, 0.8300, 0.8283, 0.8317, 0.8300, 0.8333,
      0.8333, 0.8333, 0.8333, 0.8350, 0.8333, 0.8333, 0.8333, 0.8350, 0.8333, 0.8333,
      0.8333, 0.8333, 0.8350, 0.8350, 0.8333, 0.8333, 0.8300, 0.8333, 0.8350, 0.8350,
      0.8367, 0.8333, 0.8333, 0.8367, 0.8367, 0.8350, 0.8367, 0.8350, 0.8333, 0.8367],
  },
  {
    key: "good",
    title: "A good fit — 2 layers of 16",
    verdict: "Train reaches 1.000 and held-out settles at 0.877 and stays there. A gap of 0.123 is not a problem to be fixed; it is what fitting 40 points costs. Nothing here is improved by training longer.",
    train: [0.8833, 0.9333, 0.9417, 0.9500, 0.9417, 0.9500, 0.9667, 0.9667, 0.9750, 0.9833,
      0.9750, 0.9917, 0.9917, 0.9917, 0.9917, 1.0000, 1.0000, 1.0000, 1.0000, 1.0000,
      1.0000, 1.0000, 1.0000, 1.0000, 1.0000, 1.0000, 1.0000, 1.0000, 1.0000, 1.0000,
      1.0000, 1.0000, 1.0000, 1.0000, 1.0000, 1.0000, 1.0000, 1.0000, 1.0000, 1.0000],
    test: [0.8400, 0.8617, 0.8667, 0.8700, 0.8767, 0.8733, 0.8750, 0.8750, 0.8750, 0.8783,
      0.8767, 0.8733, 0.8783, 0.8767, 0.8733, 0.8733, 0.8733, 0.8750, 0.8733, 0.8717,
      0.8750, 0.8717, 0.8733, 0.8733, 0.8733, 0.8733, 0.8733, 0.8717, 0.8767, 0.8750,
      0.8750, 0.8767, 0.8783, 0.8767, 0.8750, 0.8767, 0.8783, 0.8767, 0.8767, 0.8767],
  },
  {
    key: "overfit",
    title: "Overfitting — 4 layers of 128",
    verdict: "The only panel where held-out accuracy turns down: 0.860 at epoch 20, then 0.818 for the rest of the run. Train hits 1.000 by epoch 100 and never moves again. Everything after epoch 20 made the model worse.",
    train: [0.9333, 0.9583, 0.9750, 0.9750, 0.9833, 0.9917, 0.9917, 0.9917, 0.9917, 1.0000,
      1.0000, 1.0000, 1.0000, 1.0000, 1.0000, 1.0000, 1.0000, 1.0000, 1.0000, 1.0000,
      1.0000, 1.0000, 1.0000, 1.0000, 1.0000, 1.0000, 1.0000, 1.0000, 1.0000, 1.0000,
      1.0000, 1.0000, 1.0000, 1.0000, 1.0000, 1.0000, 1.0000, 1.0000, 1.0000, 1.0000],
    test: [0.8533, 0.8600, 0.8583, 0.8383, 0.8117, 0.8267, 0.8350, 0.8133, 0.8283, 0.8233,
      0.8200, 0.8217, 0.8217, 0.8200, 0.8200, 0.8200, 0.8200, 0.8200, 0.8200, 0.8200,
      0.8200, 0.8183, 0.8183, 0.8183, 0.8183, 0.8183, 0.8183, 0.8183, 0.8183, 0.8183,
      0.8183, 0.8183, 0.8183, 0.8183, 0.8183, 0.8183, 0.8183, 0.8183, 0.8183, 0.8183],
  },
  {
    key: "lr",
    title: "Not an architecture problem — 2 x 16 at lr 1.0",
    verdict: "The same architecture as the good fit, with the learning rate set 100x too high. Both curves jitter between the same two or three values for 400 epochs and never settle. No change of width or depth fixes this picture.",
    train: [0.7917, 0.8333, 0.7167, 0.7833, 0.8083, 0.8083, 0.8083, 0.8083, 0.8083, 0.8083,
      0.8083, 0.8083, 0.7750, 0.8083, 0.8083, 0.8083, 0.8083, 0.8083, 0.8083, 0.7750,
      0.8083, 0.7750, 0.8083, 0.7750, 0.8083, 0.8083, 0.8083, 0.8083, 0.7750, 0.8083,
      0.8083, 0.7750, 0.8083, 0.8083, 0.7750, 0.8083, 0.7750, 0.8083, 0.8083, 0.8083],
    test: [0.6933, 0.7867, 0.6167, 0.7000, 0.7183, 0.7183, 0.7183, 0.7167, 0.7183, 0.7183,
      0.7183, 0.7200, 0.7433, 0.7200, 0.7200, 0.7200, 0.7167, 0.7200, 0.7200, 0.7450,
      0.7200, 0.7450, 0.7183, 0.7450, 0.7200, 0.7183, 0.7200, 0.7183, 0.7450, 0.7200,
      0.7200, 0.7433, 0.7183, 0.7200, 0.7450, 0.7200, 0.7433, 0.7200, 0.7200, 0.7200],
  },
];

// --- arch_depth.py SECTION 5 ------------------------------------------------
// Overfit first, then regularise — on 40 points, where the claim is testable.
// architecture_cases.py section 8 printed this conclusion under numbers that
// contradicted it (L2 moved the gap from 0.0150 to 0.0163 and test DOWN).
// Here it holds: L2 at 1e-2 buys 6.7 points of test accuracy on the big net and
// halves the gap; at 1e-1 it over-corrects; on the too-small net it does
// nothing (-0.005), because there was no gap to close.
export const ORDER = [
  { label: "4 x 128, no L2", train: 1.0000, test: 0.8183 },
  { label: "4 x 128, L2 1e-2", train: 0.9833, test: 0.8850 },
  { label: "4 x 128, L2 1e-1", train: 0.8417, test: 0.7850 },
  { label: "1 x 2, no L2", train: 0.8667, test: 0.8367 },
  { label: "1 x 2, L2 1e-2", train: 0.8583, test: 0.8317 },
];

export { NEURAL, GOOD, BAD, MUTED };
