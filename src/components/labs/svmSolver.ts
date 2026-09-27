// The soft-margin linear SVM the MarginLab draws, solved in the browser.
//
// The lab cannot call sklearn, so it runs full-batch Pegasos on the soft-margin primal
//
//     (lambda/2) ||w||^2 + mean_i max(0, 1 - y_i (w . x_i + b)),   lambda = 1 / (C n)
//
// which is the same objective sklearn's C parameterisation minimises; the intercept is left
// unregularised, as SVC does. That equivalence is a claim, so it is checked rather than asserted:
// scripts/svm_cases.py `solver` records sklearn's answer on fixed datasets and
// scripts/svm_solver_check.mjs holds THIS code to it. Worst disagreement at the time of writing
// is 0.023 degrees of boundary angle. If you change the iteration count or the schedule, re-run
// that check before believing the picture the lab draws.

/** See the note in fitSVM: this is a convergence tolerance, not a modelling choice. */
export const SV_TOL = 1e-2;

export type Pt = { x: number; z: number; y: 1 | -1 };

export type Fit = {
  w: [number, number];
  b: number;
  /** Full width of the corridor, 2/||w|| -- the quantity the maximum-margin idea maximises. */
  margin: number;
  /** Per-point: does this point sit on or inside the margin (or on the wrong side)? */
  sv: boolean[];
  /** Mean hinge loss, so the lab can show what the boundary is actually paying. */
  hinge: number;
  /**
   * Per-point slack xi_i = max(0, 1 - y_i f(x_i)): how far inside its own margin line this
   * point sits, in functional units. Zero for every point outside the corridor, between 0 and 1
   * inside it, and above 1 once the point is on the wrong side of the boundary altogether.
   *
   * Not something the solver returns separately -- it is fixed by w and b, so it is recomputed
   * here rather than tracked. Reproduced by `python scripts/svm_cases.py slack`.
   */
  slack: number[];
};

// 4000 under-converges at the top of the lab's C dial: the closest points settle above z = 1 and
// nothing gets ringed as a support vector (scripts/svm_sv_tolerance.mjs). 20000 fixes that and
// costs 0.74 ms a solve on the lab's 14 points -- 22 solves inside one 60fps frame, where a drag
// needs one (scripts/svm_solver_bench.mjs). Keep this in step with pegasos() in svm_cases.py, or
// the port check fails.
export function fitSVM(pts: Pt[], C: number, iters = 20000): Fit {
  const n = pts.length;
  let w0 = 0;
  let w1 = 0;
  let b = 0;
  if (n === 0) return { w: [0, 0], b: 0, margin: 0, sv: [], hinge: 0, slack: [] };

  const lam = 1 / (C * n);
  for (let t = 1; t <= iters; t++) {
    const eta = 1 / (lam * t);
    let g0 = 0;
    let g1 = 0;
    let gb = 0;
    for (let i = 0; i < n; i++) {
      const p = pts[i];
      if (p.y * (w0 * p.x + w1 * p.z + b) < 1) {
        g0 += p.y * p.x;
        g1 += p.y * p.z;
        gb += p.y;
      }
    }
    const shrink = 1 - eta * lam;
    w0 = shrink * w0 + (eta / n) * g0;
    w1 = shrink * w1 + (eta / n) * g1;
    b = b + (eta / n) * gb;
  }

  const norm = Math.hypot(w0, w1);
  let hinge = 0;
  const slack = pts.map((p) => Math.max(0, 1 - p.y * (w0 * p.x + w1 * p.z + b)));
  const sv = pts.map((p) => {
    const z = p.y * (w0 * p.x + w1 * p.z + b);
    hinge += Math.max(0, 1 - z);
    // A support vector is a point the solution touches: on the margin, inside it, or over the
    // boundary. Textbook test is z <= 1 exactly, which is right for a QP and WRONG here --
    // Pegasos approaches the optimum from outside, so the closest points settle a hair above 1
    // and an exact test rings nothing at all. Measured by scripts/svm_sv_tolerance.mjs: at C=10
    // the nearest point sits at z = 1.005, and more iterations do not fix it. 1e-2 is the
    // smallest tolerance that never rings zero across the C range this lab exposes.
    return z <= 1 + SV_TOL;
  });

  return {
    w: [w0, w1],
    b,
    margin: norm > 0 ? 2 / norm : 0,
    sv,
    hinge: hinge / n,
    slack,
  };
}

export type Canon = {
  w: [number, number];
  b: number;
  /** ||w|| in canonical form, which is 1/margin exactly. */
  norm: number;
  /** Geometric margin: the half-width of the corridor. */
  margin: number;
  /** Indices of the points the boundary is resting on. */
  touch: number[];
};

/**
 * The one canonical boundary whose normal points at `deg`, or null if no boundary with that
 * normal separates the classes.
 *
 * Project every point onto the unit normal. The direction is usable only if the nearest +1
 * projection clears the furthest -1 projection; the widest corridor along it is then exactly that
 * gap, and canonical form (closest point scores 1) pins ||w|| = 2/gap with no freedom left. So a
 * direction determines a boundary completely -- which is what lets the whole search be drawn as a
 * curve over one angle.
 *
 * This lives here rather than in MinNormLab so scripts/svm_minnorm_check.mjs can import it: a lab
 * that labels its picture "the canonical boundary" should be held to that, the same way
 * svm_solver_check.mjs holds fitSVM to sklearn.
 */
/** Deterministic RNG, so a given sample number always redraws the same picture. */
export function seededRng(seed: number) {
  let a = seed * 1831565813 + 0x6d2b79f5;
  return () => {
    a = Math.imul(a ^ (a >>> 15), 1 | a);
    a = (a + Math.imul(a ^ (a >>> 7), 61 | a)) ^ a;
    return ((a ^ (a >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Points from a KNOWN boundary, kept clear of a band of half-width `band` around it.
 *
 * The band is what makes many different separators fit the same training data, so it is the
 * variable that decides whether choosing well among them is worth anything. Mirrors `_draw` in
 * scripts/svm_cases.py; the RNG differs, so individual samples do not match the script's.
 */
export function sampleWithBand(seed: number, n: number, band: number, spread = 3) {
  const r = seededRng(seed);
  const th = r() * Math.PI * 2;
  const wt: [number, number] = [Math.cos(th), Math.sin(th)];
  const pts: Pt[] = [];
  let guard = 0;
  while (pts.length < n && guard++ < 40000) {
    const x = (r() * 2 - 1) * spread;
    const z = (r() * 2 - 1) * spread;
    const s = wt[0] * x + wt[1] * z;
    if (Math.abs(s) < band) continue;
    pts.push({ x, z, y: s > 0 ? 1 : -1 });
  }
  return { wt, pts };
}

/**
 * Two Gaussian clouds whose centres sit at +/- `sep` along a random direction, spread 1.
 *
 * The counterpart to sampleWithBand, and the opposite situation. There the gap was a quirk of the
 * SAMPLE, so a separator always existed and the only question was which one to pick. Here the
 * clouds genuinely interpenetrate, so below about sep = 2.5 no line separates the training data
 * and the hard margin has no answer at all -- which is the whole reason slack exists.
 *
 * Mirrors `_overlap` in scripts/svm_cases.py. The RNG differs, so individual samples do not match
 * the script's; the behaviour across the dial is what both are showing.
 */
export function sampleOverlap(seed: number, n: number, sep: number) {
  const r = seededRng(seed);
  const th = r() * Math.PI * 2;
  const wt: [number, number] = [Math.cos(th), Math.sin(th)];
  // Box-Muller: seededRng is uniform, and two clouds need normal noise to overlap the way the
  // script's do. Guarded against log(0), which would return -Infinity and blank the whole lab.
  const gauss = () => {
    const u = Math.max(r(), 1e-12);
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
  };
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const y: 1 | -1 = r() < 0.5 ? -1 : 1;
    pts.push({ x: gauss() + sep * y * wt[0], z: gauss() + sep * y * wt[1], y });
  }
  return { wt, pts };
}

/**
 * Logistic regression on the same data, so a lab can put the two losses side by side.
 *
 * Minimises (1/2)||w||^2 + C * sum_i log(1 + exp(-y_i f(x_i))), which is sklearn's
 * parameterisation, intercept unregularised. Plain gradient descent with a fixed step: the
 * objective is smooth and convex, so there is no kink to trip it and no schedule to tune. The
 * step is divided by C and n because the loss term grows with both, and without that the same
 * step that converges at C = 0.1 diverges at C = 10.
 *
 * "This is logistic regression" is a claim, so scripts/svm_logistic_check.mjs holds it to
 * sklearn's answer on fixed datasets recorded by `python scripts/svm_cases.py pull`.
 */
export function logisticFit(pts: Pt[], C: number, iters = 4000): { w: [number, number]; b: number } {
  const n = pts.length;
  if (n === 0) return { w: [0, 0], b: 0 };
  let w0 = 0;
  let w1 = 0;
  let b = 0;
  const step = 0.5 / (C * n);
  for (let t = 0; t < iters; t++) {
    let g0 = 0;
    let g1 = 0;
    let gb = 0;
    for (const p of pts) {
      const z = p.y * (w0 * p.x + w1 * p.z + b);
      // sigmoid(-z), written so neither branch overflows exp() for large |z|.
      const s = z > 0 ? Math.exp(-z) / (1 + Math.exp(-z)) : 1 / (1 + Math.exp(z));
      g0 += p.y * p.x * s;
      g1 += p.y * p.z * s;
      gb += p.y * s;
    }
    w0 -= step * (w0 - C * g0);
    w1 -= step * (w1 - C * g1);
    b += step * C * gb;
  }
  return { w: [w0, w1], b };
}

/** Per-point pull on the boundary: |dL/dz|, which is what actually moves w during a fit. */
export function pullOf(pts: Pt[], w: [number, number], b: number, loss: "hinge" | "logistic") {
  return pts.map((p) => {
    const z = p.y * (w[0] * p.x + w[1] * p.z + b);
    if (loss === "hinge") return z < 1 ? 1 : 0;
    return z > 0 ? Math.exp(-z) / (1 + Math.exp(-z)) : 1 / (1 + Math.exp(z));
  });
}

/** Total hinge loss of a boundary: sum over points of max(0, 1 - y f(x)). */
export function hingeSum(pts: Pt[], w: [number, number], b: number) {
  let s = 0;
  for (const p of pts) s += Math.max(0, 1 - p.y * (w[0] * p.x + w[1] * p.z + b));
  return s;
}

/**
 * Count of misclassified points: the 0-1 loss, the thing anyone actually wants minimised.
 *
 * `<= 0` rather than `< 0`, so a point lying exactly on the boundary counts as wrong. It matters
 * for the staircase this lab draws: without it, the step lands half a point off at every jump.
 */
export function zeroOneCount(pts: Pt[], w: [number, number], b: number) {
  let n = 0;
  for (const p of pts) if (p.y * (w[0] * p.x + w[1] * p.z + b) <= 0) n++;
  return n;
}

/** Stops at the FIRST separator it finds, which is the whole point of the comparison. */
export function perceptronFit(pts: Pt[], iters = 3000) {
  let w0 = 0;
  let w1 = 0;
  let b = 0;
  for (let t = 0; t < iters; t++) {
    let errs = 0;
    for (const p of pts) {
      if (p.y * (w0 * p.x + w1 * p.z + b) <= 0) {
        w0 += p.y * p.x;
        w1 += p.y * p.z;
        b += p.y;
        errs++;
      }
    }
    if (!errs) break;
  }
  return { w: [w0, w1] as [number, number], b };
}

/** The widest-corridor boundary, found by sweeping every direction in canonical form. */
export function maxMarginFit(pts: Pt[], step = 0.5): Canon | null {
  let best: Canon | null = null;
  for (let d = 0; d < 360; d += step) {
    const c = canonicalForDirection(pts, d);
    if (c && (!best || c.norm < best.norm)) best = c;
  }
  return best;
}

/** Angle in degrees between two directions, ignoring which way each one points. */
export function angleBetween(u: [number, number], v: [number, number]) {
  const c = (u[0] * v[0] + u[1] * v[1]) / (Math.hypot(u[0], u[1]) * Math.hypot(v[0], v[1]));
  return (Math.acos(Math.min(1, Math.max(-1, Math.abs(c)))) * 180) / Math.PI;
}

export function canonicalForDirection(pts: Pt[], deg: number): Canon | null {
  const t = (deg * Math.PI) / 180;
  const u: [number, number] = [Math.cos(t), Math.sin(t)];
  let a = Infinity;
  let c = -Infinity;
  for (const p of pts) {
    const proj = u[0] * p.x + u[1] * p.z;
    if (p.y === 1) a = Math.min(a, proj);
    else c = Math.max(c, proj);
  }
  if (a <= c) return null;
  const gap = a - c;
  const s = 2 / gap;
  const w: [number, number] = [s * u[0], s * u[1]];
  const b = (-s * (a + c)) / 2;
  const touch: number[] = [];
  pts.forEach((p, i) => {
    if (p.y * (w[0] * p.x + w[1] * p.z + b) <= 1 + 1e-9) touch.push(i);
  });
  return { w, b, norm: s, margin: gap / 2, touch };
}

/**
 * The primal objective with the offset already minimised away:
 *
 *     J(w) = (1/2)||w||^2 + C * min_b sum_i max(0, 1 - y_i (w . x_i + b))
 *
 * Partially minimising a jointly convex function over one of its arguments leaves something
 * that is still convex, so this is the real bowl and not a slice through it.
 *
 * The inner minimisation is exact rather than searched. For fixed w the hinge sum is piecewise
 * linear in b with a kink at b = y_i - w . x_i, and on each piece its slope is the whole number
 * -sum{y_i : y_i(w . x_i + b) < 1}. So the flat piece, if there is one, is found by testing
 * slopes for equality with zero rather than by thresholding something small. Convexity makes the
 * slope non-decreasing, so the run of zeros is contiguous and the minimising offsets form an
 * interval. `scripts/svm_cases.py flat` is the same argument in Python.
 *
 * The returned b is the MIDDLE of that interval, which matters more than it looks. Away from the
 * optimum the interval is routinely wider than 1, and the subgradient primalGrad reads off an
 * endpoint is an extreme member of the subdifferential -- measured 2% to 24% away from the true
 * slope, enough that descent zigzagged and stalled several degrees short. The midpoint is also
 * what sklearn returns.
 */
export function profileHinge(pts: Pt[], w: [number, number]) {
  const f = (p: Pt) => w[0] * p.x + w[1] * p.z;
  const kinks = Array.from(new Set(pts.map((p) => p.y - f(p)))).sort((a, b) => a - b);
  const edges = [kinks[0] - 1, ...kinks, kinks[kinks.length - 1] + 1];
  const slopeAt = (b: number) => {
    let s = 0;
    for (const p of pts) if (p.y * (f(p) + b) < 1) s -= p.y;
    return s;
  };

  let lo = NaN;
  let hi = NaN;
  for (let j = 0; j < edges.length - 1; j++) {
    const s = slopeAt(0.5 * (edges[j] + edges[j + 1]));
    if (s === 0) {
      if (Number.isNaN(lo)) lo = edges[j];
      hi = edges[j + 1];
    } else if (s > 0) {
      if (Number.isNaN(lo)) {
        lo = edges[j];
        hi = edges[j];
      }
      break;
    }
  }
  // Only reachable if every slope is negative, which needs one class to be missing entirely.
  if (Number.isNaN(lo)) lo = hi = kinks[kinks.length - 1];

  const b = 0.5 * (lo + hi);
  return { sum: hingeSum(pts, w, b), b, bLo: lo, bHi: hi };
}

/** The primal objective at a direction, with the offset chosen for it. */
export function primalJ(pts: Pt[], w: [number, number], C: number) {
  return 0.5 * (w[0] * w[0] + w[1] * w[1]) + C * profileHinge(pts, w).sum;
}

/**
 * The same, for the count of mistakes: min over b of how many points end up on the wrong side.
 *
 * Breakpoints are where a point crosses the boundary, b = -w . x_i, not where it crosses the
 * margin. The count is constant between them, so it is evaluated once per gap and the offset
 * returned is the middle of the widest gap that achieves the minimum -- the count alone would
 * be satisfied by an offset lying a hair from a point, and the lab draws this boundary.
 */
export function profileWrong(pts: Pt[], w: [number, number]) {
  const cuts = Array.from(new Set(pts.map((p) => -(w[0] * p.x + w[1] * p.z))))
    .sort((a, b) => a - b);
  const edges = [cuts[0] - 1, ...cuts, cuts[cuts.length - 1] + 1];
  let best = pts.length + 1;
  let bestB = 0;
  let bestWidth = -1;
  for (let j = 0; j < edges.length - 1; j++) {
    const mid = 0.5 * (edges[j] + edges[j + 1]);
    const n = zeroOneCount(pts, w, mid);
    const width = edges[j + 1] - edges[j];
    if (n < best || (n === best && width > bestWidth)) {
      best = n;
      bestB = mid;
      bestWidth = width;
    }
  }
  return { n: best, b: bestB };
}

/**
 * A subgradient of primalJ. Danskin's rule: with b already sitting at its minimiser, the
 * gradient in w is the ordinary one taken at that b. Points exactly on their margin contribute
 * nothing -- one valid choice among the subgradients there, and the one descent behaves on.
 */
export function primalGrad(pts: Pt[], w: [number, number], C: number): [number, number] {
  const { b } = profileHinge(pts, w);
  let g0 = w[0];
  let g1 = w[1];
  for (const p of pts) {
    if (1 - p.y * (w[0] * p.x + w[1] * p.z + b) > 0) {
      g0 -= C * p.y * p.x;
      g1 -= C * p.y * p.z;
    }
  }
  return [g0, g1];
}

/**
 * Roll downhill from a starting direction; keep the path to draw and the best point reached.
 *
 * Subgradient steps on a 4/(C n sqrt(t)) schedule. The 1/sqrt(t) decay is the standard one for
 * an objective with kinks -- a fixed step chatters across them instead of settling in -- and the
 * constant was picked by measuring, not by eye: at 2000 steps it lands 0.03 degrees from the
 * boundary sklearn finds, where the same run with a constant of 1 stops 4.6 degrees short.
 *
 * `end` is the cheapest iterate visited rather than the last one, which is the usual reading of
 * a subgradient method: the sequence is not monotone, so the final point is not reliably the
 * best one it stood on.
 *
 * Under "wrong" there is nothing to roll down. The count of mistakes is constant between its
 * breakpoints, so its gradient is zero almost everywhere and the path stays exactly where it
 * started -- which is the comparison the lab exists to draw, not a failure of the descent.
 */
export function descendPrimal(
  pts: Pt[],
  start: [number, number],
  C: number,
  loss: "hinge" | "wrong",
  steps = 2000,
) {
  let w: [number, number] = [start[0], start[1]];
  let end: [number, number] = [start[0], start[1]];
  if (loss === "wrong") return { path: [end], end, moved: 0 };

  let bestJ = primalJ(pts, w, C);
  const path: Array<[number, number]> = [[w[0], w[1]]];
  let nextKeep = 1;
  for (let t = 1; t <= steps; t++) {
    const g = primalGrad(pts, w, C);
    const eta = 4 / (C * pts.length * Math.sqrt(t));
    w = [w[0] - eta * g[0], w[1] - eta * g[1]];
    const j = primalJ(pts, w, C);
    if (j < bestJ) {
      bestJ = j;
      end = [w[0], w[1]];
    }
    // Geometric thinning: the first steps cover most of the distance and deserve every point,
    // the last thousand sit on top of each other and would just be ink.
    if (t >= nextKeep) {
      path.push([w[0], w[1]]);
      nextKeep = Math.max(t + 1, Math.ceil(t * 1.08));
    }
  }
  path.push(end);
  return { path, end, moved: Math.hypot(end[0] - start[0], end[1] - start[1]) };
}

// ---------------------------------------------------------------------------------------------
// The two-variable problem page 9 uses to show what a Lagrange multiplier is, before the SVM's
// forty-three variables get involved:
//
//     minimise (1/2)(x^2 + y^2)   subject to   x + y >= 2   and   x >= 0.5
//
// Its answer is (1, 1) with objective 1. The first constraint binds, the second does not, which
// is complementary slackness in four numbers. Reproduced by `python scripts/svm_cases.py
// lagrangian`, and held to it by scripts/svm_dualitylab_check.mjs.
// ---------------------------------------------------------------------------------------------

/** The constraint rows, written as Gu <= h so they match the standard form used on page 8. */
export const TINY_G: [number, number][] = [[-1, -1], [-1, 0]];
export const TINY_H: [number, number] = [-2, -0.5];
export const TINY_OPT: [number, number] = [1, 1];
export const TINY_P_STAR = 1;

/**
 * The Lagrangian at prices `lam`, minimised over x and y with no constraints at all.
 *
 * L is strictly convex in u, so setting its gradient to zero is the whole job: u = -G' lam, in
 * closed form, no solver and no tolerance. The value is a lower bound on the constrained answer
 * for every non-negative pair of prices, and equals it at exactly one pair.
 */
export function tinyLagrangian(lam: [number, number]) {
  const u: [number, number] = [
    -(TINY_G[0][0] * lam[0] + TINY_G[1][0] * lam[1]),
    -(TINY_G[0][1] * lam[0] + TINY_G[1][1] * lam[1]),
  ];
  const c0 = TINY_G[0][0] * u[0] + TINY_G[0][1] * u[1] - TINY_H[0];
  const c1 = TINY_G[1][0] * u[0] + TINY_G[1][1] * u[1] - TINY_H[1];
  return {
    u,
    g: 0.5 * (u[0] * u[0] + u[1] * u[1]) + lam[0] * c0 + lam[1] * c1,
    /** How far each constraint is from being met, negative meaning satisfied with room. */
    violation: [c0, c1] as [number, number],
    feasible: c0 <= 1e-12 && c1 <= 1e-12,
  };
}

/** The objective itself, for drawing contours. */
export function tinyObjective(x: number, y: number) {
  return 0.5 * (x * x + y * y);
}

// ---------------------------------------------------------------------------------------------
// The DUAL, solved in the browser. Page 10 needs the prices themselves, not just the boundary
// they imply, and nothing above produces them -- Pegasos walks the primal and never forms an
// alpha.
//
//     maximise  sum_i a_i - (1/2) sum_ij a_i a_j y_i y_j K_ij
//     subject to  sum_i a_i y_i = 0   and   0 <= a_i <= C
//
// This is SMO, which page 14 takes apart properly. The short version of why it works: the
// equality constraint means no single alpha can move on its own, so the smallest possible step
// is a PAIR, and a pair has a closed-form optimum. Picking the partner by largest |E_i - E_j|
// rather than at random keeps it deterministic, which a lab that renders on the server and again
// in the browser needs.
//
// Held to sklearn by scripts/svm_dual_check.mjs on recorded cases.
// ---------------------------------------------------------------------------------------------

/** Every pairwise inner product. The only thing the dual ever learns about the data. */
export function gramMatrix(pts: Pt[]): number[][] {
  const n = pts.length;
  const K: number[][] = [];
  for (let i = 0; i < n; i++) {
    K.push(new Array(n));
    for (let j = 0; j < n; j++) K[i][j] = pts[i].x * pts[j].x + pts[i].z * pts[j].z;
  }
  return K;
}

export type DualFit = {
  alpha: number[];
  b: number;
  w: [number, number];
  /** sum a - (1/2) a' Q a, the value being maximised. */
  objective: number;
  /** 0 = no price, 1 = priced below C, 2 = pinned at C. The three groups from page 9. */
  group: (0 | 1 | 2)[];
  passes: number;
};

export function dualFit(pts: Pt[], C: number, K?: number[][], maxPasses = 400): DualFit {
  const n = pts.length;
  const y = pts.map((p) => p.y);
  const Km = K ?? gramMatrix(pts);
  const a = new Array(n).fill(0);
  let b = 0;
  const TOL = 1e-9;
  const EPS = 1e-12;
  const E = new Array(n).fill(0);

  const refreshE = () => {
    for (let i = 0; i < n; i++) {
      let s = b;
      for (let k = 0; k < n; k++) if (a[k] !== 0) s += a[k] * y[k] * Km[k][i];
      E[i] = s - y[i];
    }
  };

  /** One exact two-price step, or false if this pair has nowhere to go. */
  const step = (i: number, j: number) => {
    if (i === j) return false;
    const ai = a[i];
    const aj = a[j];
    const [L, H] = y[i] !== y[j]
      ? [Math.max(0, aj - ai), Math.min(C, C + aj - ai)]
      : [Math.max(0, ai + aj - C), Math.min(C, ai + aj)];
    if (H - L < EPS) return false;
    const eta = 2 * Km[i][j] - Km[i][i] - Km[j][j];
    if (eta >= -EPS) return false;                       // no curvature to descend
    let nj = aj - (y[j] * (E[i] - E[j])) / eta;
    nj = Math.min(H, Math.max(L, nj));
    if (Math.abs(nj - aj) < 1e-13) return false;
    const ni = ai + y[i] * y[j] * (aj - nj);

    const b1 = b - E[i] - y[i] * (ni - ai) * Km[i][i] - y[j] * (nj - aj) * Km[i][j];
    const b2 = b - E[j] - y[i] * (ni - ai) * Km[i][j] - y[j] * (nj - aj) * Km[j][j];
    // A price strictly inside the box pins b exactly; with both at a bound, any offset in
    // [b2, b1] is optimal and the midpoint is the usual pick. Page 8 measured that interval.
    b = ni > TOL && ni < C - TOL ? b1 : nj > TOL && nj < C - TOL ? b2 : (b1 + b2) / 2;
    a[i] = ni;
    a[j] = nj;
    refreshE();
    return true;
  };

  let passes = 0;
  refreshE();
  for (; passes < maxPasses; passes++) {
    let changed = 0;
    for (let i = 0; i < n; i++) {
      const ri = y[i] * E[i];
      // KKT violated: either the point is inside its margin with room to raise its price, or
      // outside its margin carrying a price it should not have.
      if (!((ri < -TOL && a[i] < C - TOL) || (ri > TOL && a[i] > TOL))) continue;
      // The partner with the largest error difference is the step that buys the most -- but it
      // is often pinned in a corner where L equals H and nothing can move. Without a fallback
      // the whole sweep then reports "no change" on the first pass and stops with the prices
      // barely off zero, which is exactly what happened: 35 degrees of boundary error and an
      // objective half what it should be. So: best partner first, then everyone else.
      let j = -1;
      let best = -1;
      for (let t = 0; t < n; t++) {
        if (t === i) continue;
        const dd = Math.abs(E[i] - E[t]);
        if (dd > best) {
          best = dd;
          j = t;
        }
      }
      if (j >= 0 && step(i, j)) {
        changed++;
        continue;
      }
      for (let t = 0; t < n; t++) {
        if (t !== j && step(i, t)) {
          changed++;
          break;
        }
      }
    }
    if (changed === 0) break;
  }

  let w0 = 0;
  let w1 = 0;
  for (let i = 0; i < n; i++) {
    w0 += a[i] * y[i] * pts[i].x;
    w1 += a[i] * y[i] * pts[i].z;
  }
  let obj = 0;
  for (let i = 0; i < n; i++) {
    obj += a[i];
    for (let j = 0; j < n; j++) obj -= 0.5 * a[i] * a[j] * y[i] * y[j] * Km[i][j];
  }
  const group = a.map((v) => (v <= TOL ? 0 : v >= C - TOL ? 2 : 1)) as (0 | 1 | 2)[];
  return { alpha: a, b, w: [w0, w1], objective: obj, group, passes };
}

/** exp(-gamma |x - z|^2) for every pair. The only thing that changes versus gramMatrix. */
export function rbfGram(pts: Pt[], gamma: number): number[][] {
  const n = pts.length;
  const K: number[][] = [];
  for (let i = 0; i < n; i++) {
    K.push(new Array(n));
    for (let j = 0; j < n; j++) {
      const dx = pts[i].x - pts[j].x;
      const dz = pts[i].z - pts[j].z;
      K[i][j] = Math.exp(-gamma * (dx * dx + dz * dz));
    }
  }
  return K;
}

export type KernelFit = DualFit & {
  /** f(x_i) on the training points. */
  f: number[];
  /** f at a fresh point, the only way to score one: no w exists in the feature space. */
  score: (x: number, z: number) => number;
};

/**
 * The same dual, the same box, the same offset rule -- with an rbf table instead of a linear one.
 *
 * `w` on the returned fit is the sum of a_i y_i x_i in INPUT space and is not the model's weight
 * vector; page 12 is about why no such vector can be written down here. Use `score`.
 */
export function rbfFit(pts: Pt[], C: number, gamma: number): KernelFit {
  const fit = dualFit(pts, C, rbfGram(pts, gamma));
  const score = (x: number, z: number) => {
    let s = fit.b;
    for (let i = 0; i < pts.length; i++) {
      if (fit.alpha[i] <= 1e-9) continue;
      const dx = pts[i].x - x;
      const dz = pts[i].z - z;
      s += fit.alpha[i] * pts[i].y * Math.exp(-gamma * (dx * dx + dz * dz));
    }
    return s;
  };
  return { ...fit, f: pts.map((p) => score(p.x, p.z)), score };
}

// ---------------------------------------------------------------------------------------------
// Page 15: the same points in different units.

/**
 * The two moons UnitsDialLab draws. Reproduced exactly by `_units_points` in
 * scripts/svm_cases.py, which is why there is no trig here: the half-circle is walked with the
 * rational parameterisation ((1 - m^2), 2m) / (1 + m^2), and +, -, *, / are correctly rounded
 * in both languages, so both walk the same bits. Lehmer generator (exact under 2^53), noise
 * from a sum of six uniforms, rounded to three decimals.
 */
export function unitsPoints(n: number, seed: number, noise = 0.25): Pt[] {
  let st = (seed % 2147483646) + 1;
  const u = () => {
    st = (st * 48271) % 2147483647;
    return st / 2147483647;
  };
  const gauss = () => {
    let t = 0;
    for (let i = 0; i < 6; i += 1) t += u();
    return (t - 3) / 1.2247;
  };
  const out: Pt[] = [];
  for (let i = 0; i < n; i += 1) {
    const y = i % 2 === 0 ? 1 : -1;
    const t = 0.02 + 0.96 * u();
    const m = t / (1 - t);
    const c = (1 - m * m) / (1 + m * m);
    const s = (2 * m) / (1 + m * m);
    let x = y > 0 ? c : 1 - c;
    let z = y > 0 ? s : 0.5 - s;
    x = (x - 0.5 + gauss() * noise) / 0.87;
    z = (z - 0.25 + gauss() * noise) / 0.5;
    out.push({ x: Math.round(x * 1000) / 1000, z: Math.round(z * 1000) / 1000, y });
  }
  return out;
}

/**
 * Page 14's SMO as a solver rather than a demonstration: always the maximal violating pair,
 * the two-variable step in closed form, clipped to the box, stopped when the largest KKT
 * violation falls under tol. dualFit's pass-based heuristic stops on a pass cap; on the
 * stretched and squashed problems page 15 builds, that cap arrived 3e-4 short of the optimum
 * and moved support vectors. This one stops when the conditions hold, not when it is tired.
 */
export function smoFit(
  y: number[],
  K: number[][],
  C: number,
  tol = 1e-8,
  maxSteps = 200000,
): { alpha: number[]; b: number; steps: number } {
  const n = y.length;
  const a = new Array(n).fill(0);
  const u = new Array(n).fill(0); // sum_k a_k y_k K[k][i], kept current step by step
  let steps = 0;
  for (; steps < maxSteps; steps += 1) {
    let top = -1;
    let bot = -1;
    for (let k = 0; k < n; k += 1) {
      const r = y[k] - u[k];
      const up = (y[k] > 0 && a[k] < C) || (y[k] < 0 && a[k] > 0);
      const dn = (y[k] < 0 && a[k] < C) || (y[k] > 0 && a[k] > 0);
      if (up && (top < 0 || r > y[top] - u[top])) top = k;
      if (dn && (bot < 0 || r < y[bot] - u[bot])) bot = k;
    }
    if (top < 0 || bot < 0 || y[top] - u[top] - (y[bot] - u[bot]) < tol) break;
    const i = top;
    const j = bot;
    const eta = 2 * K[i][j] - K[i][i] - K[j][j];
    if (eta >= 0) break;
    const [L, H] =
      y[i] !== y[j]
        ? [Math.max(0, a[j] - a[i]), Math.min(C, C + a[j] - a[i])]
        : [Math.max(0, a[i] + a[j] - C), Math.min(C, a[i] + a[j])];
    const gi = u[i] - y[i];
    const gj = u[j] - y[j];
    const ajRaw = Math.min(H, Math.max(L, a[j] - (y[j] * (gi - gj)) / eta));
    // snap onto the box: a price left at C - 1e-17 by rounding still counts as movable, the
    // same pair is picked again with no room to move, and the loop never ends.
    const snap = (v: number) => (v < 1e-12 ? 0 : v > C - 1e-12 ? C : v);
    const aj = snap(ajRaw);
    const ai = snap(a[i] + y[i] * y[j] * (a[j] - aj));
    const di = (ai - a[i]) * y[i];
    const dj = (aj - a[j]) * y[j];
    a[i] = ai;
    a[j] = aj;
    for (let k = 0; k < n; k += 1) u[k] += di * K[i][k] + dj * K[j][k];
  }
  // the offset: every free price puts its point exactly on the margin, so average what each
  // one says b must be. With none free, b is anywhere in the feasible gap; take its middle.
  let sum = 0;
  let cnt = 0;
  let lo = -Infinity;
  let hi = Infinity;
  for (let k = 0; k < n; k += 1) {
    const r = y[k] - u[k];
    if (a[k] > 1e-12 && a[k] < C - 1e-12) {
      sum += r;
      cnt += 1;
    }
    const up = (y[k] > 0 && a[k] < C) || (y[k] < 0 && a[k] > 0);
    const dn = (y[k] < 0 && a[k] < C) || (y[k] > 0 && a[k] > 0);
    if (up) lo = Math.max(lo, r);
    if (dn) hi = Math.min(hi, r);
  }
  const b = cnt ? sum / cnt : (lo + hi) / 2;
  return { alpha: a, b, steps };
}

export type RbfSmo = {
  alpha: number[];
  b: number;
  steps: number;
  /** f(x_i) on the training points. */
  f: number[];
  /** the decision value anywhere. */
  score: (x: number, z: number) => number;
};

/** The default rbf SVM on smoFit: the kernel table, the solve, and the decision function. */
export function rbfSmo(pts: Pt[], C: number, gamma: number, maxSteps = 200000): RbfSmo {
  const n = pts.length;
  const fit = smoFit(
    pts.map((p) => p.y),
    rbfGram(pts, gamma),
    C,
    1e-8,
    maxSteps,
  );
  const score = (x: number, z: number) => {
    let sc = fit.b;
    for (let i = 0; i < n; i += 1) {
      if (fit.alpha[i] <= 0) continue;
      const dx = pts[i].x - x;
      const dz = pts[i].z - z;
      sc += fit.alpha[i] * pts[i].y * Math.exp(-gamma * (dx * dx + dz * dz));
    }
    return sc;
  };
  return { ...fit, f: pts.map((p) => score(p.x, p.z)), score };
}

/** The stops on UnitsDialLab's dial: what the horizontal feature is multiplied by. */
export const UNITS_DIAL = [0.01, 0.03, 0.1, 0.3, 1, 3, 10, 30, 100];

export type UnitsFit = {
  alpha: number[];
  b: number;
  steps: number;
  /** f(x_i) on the training points. */
  f: number[];
  /** sklearn's gamma='scale': 1 / (n_features * variance of every number in the table). */
  gamma: number;
  /** the horizontal feature's share of the average squared distance, var_x / (var_x + var_z). */
  share: number;
  /** where a point given in the drawn coordinates lands in the numbers the kernel sees. */
  map: (x: number, z: number) => [number, number];
  /** the decision value at a point given in the drawn coordinates. */
  at: (x: number, z: number) => number;
};

/**
 * Multiply the horizontal feature by k, optionally standardise (population sd, like sklearn's
 * StandardScaler, fitted on these points only), then fit the default rbf SVM: C = 1,
 * gamma = 'scale'. The same thing section 55 of svm_cases.py hands sklearn, solved by smoFit.
 */
export function unitsFit(base: Pt[], k: number, standardise: boolean): UnitsFit {
  const n = base.length;
  const raw = base.map((p) => [k * p.x, p.z] as [number, number]);
  const mean = (j: 0 | 1) => raw.reduce((a, r) => a + r[j], 0) / n;
  const mu: [number, number] = [mean(0), mean(1)];
  const sd: [number, number] = [0, 1].map((j) =>
    Math.sqrt(raw.reduce((a, r) => a + (r[j] - mu[j]) ** 2, 0) / n),
  ) as [number, number];
  const map = (x: number, z: number): [number, number] =>
    standardise ? [(k * x - mu[0]) / sd[0], (z - mu[1]) / sd[1]] : [k * x, z];
  const pts: Pt[] = base.map((p) => {
    const [a, b] = map(p.x, p.z);
    return { x: a, z: b, y: p.y };
  });
  let m = 0;
  for (const p of pts) m += p.x + p.z;
  m /= 2 * n;
  let v = 0;
  let vx = 0;
  let vz = 0;
  const mx = pts.reduce((a, p) => a + p.x, 0) / n;
  const mz = pts.reduce((a, p) => a + p.z, 0) / n;
  for (const p of pts) {
    v += (p.x - m) ** 2 + (p.z - m) ** 2;
    vx += (p.x - mx) ** 2;
    vz += (p.z - mz) ** 2;
  }
  const gamma = 1 / (2 * (v / (2 * n)));
  const fit = rbfSmo(pts, 1, gamma);
  const score = fit.score;
  return {
    alpha: fit.alpha,
    b: fit.b,
    steps: fit.steps,
    f: fit.f,
    gamma,
    share: vx / (vx + vz),
    map,
    at: (x: number, z: number) => {
      const [a, b] = map(x, z);
      return score(a, b);
    },
  };
}

// ---------------------------------------------------------------------------------------------
// Page 16: the C x gamma grid.

/** CGridLab's grid. The C = 10000 row is left off: its small-gamma cell takes ~1.4M SMO steps. */
export const GRID_LAB_C = [0.01, 0.1, 1, 10, 100, 1000];
export const GRID_LAB_G = [0.03, 0.1, 0.3, 1, 3, 10, 30, 100];

/** CGridLab's points: page 15's moons generator, noisier, 80 to train on and 200 to check. */
export const gridPoints = () => ({
  train: unitsPoints(80, 5, 0.45),
  val: unitsPoints(200, 6, 0.45),
});

// ---------------------------------------------------------------------------------------------
// Page 17: many classes from a two-class machine.

export type MultiLayout = "row" | "triangle";
export type MultiKernel = "linear" | "rbf";
export type MultiStrategy = "ovr" | "ovo";

/** Where MultiClassLab puts its three classes: in a row (B sandwiched) or at a triangle's corners. */
export const MULTI_LAYOUTS: Record<MultiLayout, [number, number][]> = {
  row: [
    [-2, 0],
    [0, 0],
    [2, 0],
  ],
  triangle: [
    [0, 1.6],
    [-1.8, -1],
    [1.8, -1],
  ],
};
export const MULTI_GAMMA = 0.5;
export const MULTI_C = 1;

/** A point with one of three classes, 0 1 2. */
export type MPt = { x: number; z: number; c: number };

/** n points per class, classes interleaved: Lehmer, six-uniform noise at unit variance, 3 dp. */
export function multiPoints(n: number, seed: number, layout: MultiLayout, sd = 0.7): MPt[] {
  let st = (seed % 2147483646) + 1;
  const u = () => {
    st = (st * 48271) % 2147483647;
    return st / 2147483647;
  };
  const gauss = () => {
    let t = 0;
    for (let i = 0; i < 6; i += 1) t += u();
    return (t - 3) / Math.SQRT1_2;
  };
  const out: MPt[] = [];
  for (let i = 0; i < 3 * n; i += 1) {
    const c = i % 3;
    const [cx, cz] = MULTI_LAYOUTS[layout][c];
    const x = cx + gauss() * sd;
    const z = cz + gauss() * sd;
    out.push({ x: Math.floor(x * 1000 + 0.5) / 1000, z: Math.floor(z * 1000 + 0.5) / 1000, c });
  }
  return out;
}

/** MultiClassLab's points: 30 per class to train on, 200 per class to check. */
export const multiData = (layout: MultiLayout) => ({
  train: multiPoints(30, 7, layout),
  val: multiPoints(200, 8, layout),
});

export type BinaryModel = {
  /** the class on the +1 side. */
  pos: number;
  /** the class on the -1 side; null means "every other class". */
  neg: number | null;
  /** which training points this model was fitted on. */
  idx: number[];
  alpha: number[];
  b: number;
  steps: number;
  nsv: number;
  /** f on its own training points. */
  f: number[];
  score: (x: number, z: number) => number;
};

const kern = (k: MultiKernel, ax: number, az: number, bx: number, bz: number) => {
  if (k === "linear") return ax * bx + az * bz;
  const dx = ax - bx;
  const dz = az - bz;
  return Math.exp(-MULTI_GAMMA * (dx * dx + dz * dz));
};

/** One binary SVM on page 14's smoFit: `pos` against `neg`, or against everything else. */
export function binaryFit(
  train: MPt[],
  k: MultiKernel,
  pos: number,
  neg: number | null,
  maxSteps = 200000,
): BinaryModel {
  const idx: number[] = [];
  train.forEach((p, i) => {
    if (neg === null || p.c === pos || p.c === neg) idx.push(i);
  });
  const P = idx.map((i) => train[i]);
  const y = P.map((p) => (p.c === pos ? 1 : -1));
  const K = P.map((p) => P.map((q) => kern(k, p.x, p.z, q.x, q.z)));
  const fit = smoFit(y, K, MULTI_C, 1e-8, maxSteps);
  const score = (x: number, z: number) => {
    let s = fit.b;
    for (let i = 0; i < P.length; i += 1) {
      if (fit.alpha[i] <= 0) continue;
      s += fit.alpha[i] * y[i] * kern(k, P[i].x, P[i].z, x, z);
    }
    return s;
  };
  return {
    pos,
    neg,
    idx,
    ...fit,
    nsv: fit.alpha.filter((a) => a > 1e-9).length,
    f: P.map((p) => score(p.x, p.z)),
    score,
  };
}

export type MultiFit = {
  models: BinaryModel[];
  /** the predicted class. OvR: the largest score. OvO: the most duels won, first class on a tie. */
  predict: (x: number, z: number) => number;
  /** false where the rule had no clean answer: OvR with no or several models saying "mine",
   *  OvO with every class on one win. */
  clean: (x: number, z: number) => boolean;
};

export const MULTI_PAIRS: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 2],
];

export function multiFit(train: MPt[], k: MultiKernel, s: MultiStrategy): MultiFit {
  if (s === "ovr") {
    const models = [0, 1, 2].map((c) => binaryFit(train, k, c, null));
    const scores = (x: number, z: number) => models.map((m) => m.score(x, z));
    return {
      models,
      predict: (x, z) => {
        const f = scores(x, z);
        let best = 0;
        for (let c = 1; c < 3; c += 1) if (f[c] > f[best]) best = c;
        return best;
      },
      clean: (x, z) => scores(x, z).filter((v) => v > 0).length === 1,
    };
  }
  const models = MULTI_PAIRS.map(([a, b]) => binaryFit(train, k, a, b));
  const votes = (x: number, z: number) => {
    const v = [0, 0, 0];
    models.forEach((m) => {
      v[m.score(x, z) > 0 ? m.pos : (m.neg as number)] += 1;
    });
    return v;
  };
  return {
    models,
    predict: (x, z) => {
      const v = votes(x, z);
      let best = 0;
      for (let c = 1; c < 3; c += 1) if (v[c] > v[best]) best = c;
      return best;
    },
    clean: (x, z) => Math.max(...votes(x, z)) > 1,
  };
}

// ---------------------------------------------------------------------------------------------
// Page 18: probabilities from an SVM.

/** PlattLab's C dial. gamma stays at 1; the points are CGridLab's. */
export const PLATT_C = [0.01, 0.03, 0.1, 0.3, 1, 3, 10, 100, 1000];
export const PLATT_GAMMA = 1;

/** Platt's sigmoid, P(y = +1 | f) = 1 / (1 + exp(A f + B)). */
export const sigmoidAt = (f: number, A: number, B: number) => {
  const z = A * f + B;
  return z >= 0 ? Math.exp(-z) / (1 + Math.exp(-z)) : 1 / (1 + Math.exp(z));
};

/**
 * Fit A and B by Newton's method on Platt's smoothed targets -- (N+ + 1)/(N+ + 2) for a
 * positive, 1/(N- + 2) for a negative -- the cross-entropy libsvm and sklearn both minimise.
 * Two parameters and a convex loss, so Newton with a backtracking line search reaches the
 * optimum in a handful of steps. Returns the loss at the optimum too, for the guard to compare.
 */
export function plattFit(f: number[], y: number[]): { A: number; B: number; loss: number } {
  const n = f.length;
  let np = 0;
  for (const v of y) if (v > 0) np += 1;
  const nn = n - np;
  const hi = (np + 1) / (np + 2);
  const lo = 1 / (nn + 2);
  const t = y.map((v) => (v > 0 ? hi : lo));
  // loss with z = A f + B, p = 1/(1+e^z): sum t log(1+e^-z)... written stably
  const loss = (A: number, B: number) => {
    let s = 0;
    for (let i = 0; i < n; i += 1) {
      const z = A * f[i] + B;
      // -t log p - (1-t) log(1-p), p = 1/(1+e^z)
      s += z >= 0 ? t[i] * z + Math.log(1 + Math.exp(-z)) : (t[i] - 1) * z + Math.log(1 + Math.exp(z));
    }
    return s;
  };
  let A = 0;
  let B = Math.log((nn + 1) / (np + 1));
  let L = loss(A, B);
  for (let it = 0; it < 200; it += 1) {
    let gA = 0;
    let gB = 0;
    let h11 = 1e-12;
    let h22 = 1e-12;
    let h21 = 0;
    for (let i = 0; i < n; i += 1) {
      const p = sigmoidAt(f[i], A, B);
      const d1 = t[i] - p; // dL/dz
      const d2 = p * (1 - p);
      gA += f[i] * d1;
      gB += d1;
      h11 += f[i] * f[i] * d2;
      h22 += d2;
      h21 += f[i] * d2;
    }
    if (Math.abs(gA) < 1e-11 && Math.abs(gB) < 1e-11) break;
    const det = h11 * h22 - h21 * h21;
    const dA = -(h22 * gA - h21 * gB) / det;
    const dB = -(-h21 * gA + h11 * gB) / det;
    const slope = gA * dA + gB * dB;
    let step = 1;
    let moved = false;
    while (step >= 1e-12) {
      const nA = A + step * dA;
      const nB = B + step * dB;
      const nL = loss(nA, nB);
      if (nL <= L + 1e-4 * step * slope) {
        A = nA;
        B = nB;
        L = nL;
        moved = true;
        break;
      }
      step /= 2;
    }
    if (!moved) break;
  }
  return { A, B, loss: L };
}

export type PlattStop = {
  C: number;
  fit: RbfSmo;
  /** the model's own scores for its 80 training points. */
  ft: number[];
  /** each training point scored by a model fitted on the other four fifths (fold = i % 5). */
  fcv: number[];
  /** scores for the 200 new points. */
  fv: number[];
  cvSteps: number[];
  /** each fold's prices, over the 64 points it was fitted on. */
  cvAlpha: number[][];
};

/** One stop on PlattLab's dial: the SVM, its training scores, held-out scores, new-point scores. */
export function plattStop(train: Pt[], val: Pt[], C: number): PlattStop {
  const fit = rbfSmo(train, C, PLATT_GAMMA);
  const fcv = new Array(train.length).fill(0);
  const cvSteps: number[] = [];
  const cvAlpha: number[][] = [];
  for (let k = 0; k < 5; k += 1) {
    const inFit = train.filter((_, i) => i % 5 !== k);
    const m = rbfSmo(inFit, C, PLATT_GAMMA);
    cvSteps.push(m.steps);
    cvAlpha.push(m.alpha);
    train.forEach((p, i) => {
      if (i % 5 === k) fcv[i] = m.score(p.x, p.z);
    });
  }
  return { C, fit, ft: fit.f, fcv, fv: val.map((p) => fit.score(p.x, p.z)), cvSteps, cvAlpha };
}

// ---------------------------------------------------------------------------------------------
// Page 19: SVM vs logistic regression vs forest, with useless features added.

/** NoiseFeatureLab's dial: how many pure-noise columns sit next to the two real ones. */
export const NOISE_K = [0, 1, 2, 5, 10, 20, 50];

/** k-at-most-50 noise columns: Lehmer, six-uniform noise at unit variance, 3 dp. */
export function noiseColumns(n: number, k: number, seed: number): number[][] {
  let st = (seed % 2147483646) + 1;
  const u = () => {
    st = (st * 48271) % 2147483647;
    return st / 2147483647;
  };
  const out: number[][] = [];
  for (let i = 0; i < n; i += 1) {
    const row: number[] = [];
    for (let j = 0; j < k; j += 1) {
      let t = 0;
      for (let m = 0; m < 6; m += 1) t += u();
      row.push(Math.floor(((t - 3) / Math.SQRT1_2) * 1000 + 0.5) / 1000);
    }
    out.push(row);
  }
  return out;
}

/** The lab's data: page 15's moons (200 to train, 400 to check) and 50 noise columns each. */
export const noiseData = () => ({
  train: unitsPoints(200, 21),
  val: unitsPoints(400, 22),
  extraTrain: noiseColumns(200, 50, 1021),
  extraVal: noiseColumns(400, 50, 1022),
});

/** Stack the two real features with the first k noise columns and standardise on the train set. */
export function noiseMatrix(k: number) {
  const { train, val, extraTrain, extraVal } = noiseData();
  const rows = (P: Pt[], E: number[][]) => P.map((p, i) => [p.x, p.z, ...E[i].slice(0, k)]);
  const A = rows(train, extraTrain);
  const B = rows(val, extraVal);
  const d = 2 + k;
  const mu = new Array(d).fill(0);
  const sd = new Array(d).fill(0);
  for (const r of A) for (let j = 0; j < d; j += 1) mu[j] += r[j] / A.length;
  for (const r of A) for (let j = 0; j < d; j += 1) sd[j] += (r[j] - mu[j]) ** 2 / A.length;
  for (let j = 0; j < d; j += 1) sd[j] = Math.sqrt(sd[j]) || 1;
  const z = (M: number[][]) => M.map((r) => r.map((v, j) => (v - mu[j]) / sd[j]));
  const As = z(A);
  let m = 0;
  let v = 0;
  for (const r of As) for (const x of r) m += x;
  m /= As.length * d;
  for (const r of As) for (const x of r) v += (x - m) ** 2;
  v /= As.length * d;
  return {
    A: As,
    B: z(B),
    yA: train.map((p) => p.y),
    yB: val.map((p) => p.y),
    // sklearn's gamma='scale': 1 / (features x variance of every entry)
    gamma: 1 / (d * v),
    mu,
    sd,
  };
}

/** The default rbf SVM in any number of dimensions, on page 14's smoFit. */
export function rbfSmoD(A: number[][], y: number[], C: number, gamma: number) {
  const n = A.length;
  const K = A.map((a) =>
    A.map((b) => {
      let s = 0;
      for (let j = 0; j < a.length; j += 1) s += (a[j] - b[j]) ** 2;
      return Math.exp(-gamma * s);
    }),
  );
  const fit = smoFit(y, K, C, 1e-8, 200000);
  const score = (x: number[]) => {
    let s = fit.b;
    for (let i = 0; i < n; i += 1) {
      if (fit.alpha[i] <= 0) continue;
      let d2 = 0;
      for (let j = 0; j < x.length; j += 1) d2 += (A[i][j] - x[j]) ** 2;
      s += fit.alpha[i] * y[i] * Math.exp(-gamma * d2);
    }
    return s;
  };
  return { ...fit, K, f: A.map((a) => score(a)), score };
}

/**
 * sklearn's LogisticRegression at its defaults: minimise (1/2)|w|^2 + C sum log(1 + e^{-y(w.x+b)})
 * with the intercept unpenalised. Convex and smooth, so Newton's method with a backtracking line
 * search lands on the same optimum lbfgs does, only more exactly.
 */
export function logregFit(A: number[][], y: number[], C = 1) {
  const n = A.length;
  const d = A[0].length;
  const th = new Array(d + 1).fill(0); // w..., b
  const lin = (t: number[], x: number[]) => {
    let s = t[d];
    for (let j = 0; j < d; j += 1) s += t[j] * x[j];
    return s;
  };
  const obj = (t: number[]) => {
    let s = 0;
    for (let j = 0; j < d; j += 1) s += 0.5 * t[j] * t[j];
    for (let i = 0; i < n; i += 1) {
      const m = y[i] * lin(t, A[i]);
      s += C * (m > 0 ? Math.log(1 + Math.exp(-m)) : -m + Math.log(1 + Math.exp(m)));
    }
    return s;
  };
  let F = obj(th);
  for (let it = 0; it < 100; it += 1) {
    const g = new Array(d + 1).fill(0);
    const Hm = Array.from({ length: d + 1 }, () => new Array(d + 1).fill(0));
    for (let j = 0; j < d; j += 1) {
      g[j] = th[j];
      Hm[j][j] = 1;
    }
    for (let i = 0; i < n; i += 1) {
      const x = [...A[i], 1];
      const m = y[i] * lin(th, A[i]);
      const s = 1 / (1 + Math.exp(m)); // sigma(-m)
      for (let a = 0; a <= d; a += 1) {
        g[a] -= C * y[i] * s * x[a];
        for (let b = 0; b <= d; b += 1) Hm[a][b] += C * s * (1 - s) * x[a] * x[b];
      }
    }
    let gn = 0;
    for (const v of g) gn = Math.max(gn, Math.abs(v));
    if (gn < 1e-10) break;
    // solve Hm step = -g by Gaussian elimination with partial pivoting
    const M = Hm.map((r, i) => [...r, -g[i]]);
    const N = d + 1;
    for (let c = 0; c < N; c += 1) {
      let p = c;
      for (let r = c + 1; r < N; r += 1) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
      [M[c], M[p]] = [M[p], M[c]];
      for (let r = c + 1; r < N; r += 1) {
        const q = M[r][c] / M[c][c];
        for (let k = c; k <= N; k += 1) M[r][k] -= q * M[c][k];
      }
    }
    const step = new Array(N).fill(0);
    for (let r = N - 1; r >= 0; r -= 1) {
      let s = M[r][N];
      for (let k = r + 1; k < N; k += 1) s -= M[r][k] * step[k];
      step[r] = s / M[r][r];
    }
    let t = 1;
    let moved = false;
    while (t > 1e-12) {
      const cand = th.map((v, i) => v + t * step[i]);
      const Fc = obj(cand);
      if (Fc <= F) {
        for (let i = 0; i <= d; i += 1) th[i] = cand[i];
        F = Fc;
        moved = true;
        break;
      }
      t /= 2;
    }
    if (!moved) break;
  }
  return { w: th.slice(0, d), b: th[d], score: (x: number[]) => lin(th, x) };
}

type TreeNode = { leaf: true; v: number } | { leaf: false; j: number; t: number; lo: TreeNode; hi: TreeNode };

/**
 * A random forest the way sklearn grows one by default: bootstrap samples, sqrt(d) candidate
 * features per split, Gini impurity, split points halfway between neighbouring values, grown
 * until every leaf is pure. Its randomness is not sklearn's, so it cannot match any one sklearn
 * forest; the guard holds it to the spread of twenty of them instead.
 */
export function forestFit(A: number[][], y: number[], trees = 100, seed = 7) {
  let st = (seed % 2147483646) + 1;
  const u = () => {
    st = (st * 48271) % 2147483647;
    return st / 2147483647;
  };
  const d = A[0].length;
  const mtry = Math.max(1, Math.floor(Math.sqrt(d)));
  const grow = (idx: number[]): TreeNode => {
    let pos = 0;
    for (const i of idx) if (y[i] > 0) pos += 1;
    if (pos === 0 || pos === idx.length) return { leaf: true, v: pos ? 1 : -1 };
    const feats = Array.from({ length: d }, (_, j) => j);
    for (let a = d - 1; a > 0; a -= 1) {
      const b = Math.floor(u() * (a + 1));
      [feats[a], feats[b]] = [feats[b], feats[a]];
    }
    let best = { g: Infinity, j: -1, t: 0 };
    // like sklearn, keep drawing features past mtry until at least one gives a valid split
    for (let fi = 0; fi < d && (fi < mtry || best.j < 0); fi += 1) {
      const j = feats[fi];
      const s = [...idx].sort((p, q) => A[p][j] - A[q][j]);
      let lp = 0;
      for (let r = 0; r < s.length - 1; r += 1) {
        if (y[s[r]] > 0) lp += 1;
        const a = A[s[r]][j];
        const b = A[s[r + 1]][j];
        if (a === b) continue;
        const nl = r + 1;
        const nr = s.length - nl;
        const rp = pos - lp;
        const gl = 1 - (lp / nl) ** 2 - ((nl - lp) / nl) ** 2;
        const gr = 1 - (rp / nr) ** 2 - ((nr - rp) / nr) ** 2;
        const gg = nl * gl + nr * gr;
        if (gg < best.g) best = { g: gg, j, t: (a + b) / 2 };
      }
    }
    if (best.j < 0) return { leaf: true, v: pos * 2 >= idx.length ? 1 : -1 };
    const lo = idx.filter((i) => A[i][best.j] <= best.t);
    const hi = idx.filter((i) => A[i][best.j] > best.t);
    return { leaf: false, j: best.j, t: best.t, lo: grow(lo), hi: grow(hi) };
  };
  const forest: TreeNode[] = [];
  for (let t = 0; t < trees; t += 1) {
    const idx = A.map(() => Math.floor(u() * A.length));
    forest.push(grow(idx));
  }
  const vote = (x: number[]) => {
    let s = 0;
    for (const tr of forest) {
      let nd = tr;
      while (!nd.leaf) nd = x[nd.j] <= nd.t ? nd.lo : nd.hi;
      s += nd.v;
    }
    return s / forest.length;
  };
  return { score: vote };
}

// ---------------------------------------------------------------------------------------------
// Page 20: approximating the kernel with landmarks (Nystroem).

/** LandmarkLab's dial. 0 means the exact SVM. Above 50, K_LL gets too ill-conditioned for a plain solve. */
export const LANDMARKS = [2, 3, 5, 10, 20, 50, 0];
export const LANDMARK_GAMMA = 1;

/** Page 19's moons without the noise: 200 to train on, 400 to check. */
export const landmarkData = () => ({ train: unitsPoints(200, 21), val: unitsPoints(400, 22) });

const rbfAt = (a: Pt, b: Pt, g: number) => Math.exp(-g * ((a.x - b.x) ** 2 + (a.z - b.z) ** 2));

/** Solve S x = r for a symmetric positive-definite S by Cholesky. */
function cholSolve(S: number[][], r: number[]): number[] {
  const n = S.length;
  const L = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j <= i; j += 1) {
      let s = S[i][j];
      for (let k = 0; k < j; k += 1) s -= L[i][k] * L[j][k];
      L[i][j] = i === j ? Math.sqrt(s) : s / L[j][j];
    }
  }
  const y = new Array(n).fill(0);
  for (let i = 0; i < n; i += 1) {
    let s = r[i];
    for (let k = 0; k < i; k += 1) s -= L[i][k] * y[k];
    y[i] = s / L[i][i];
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i -= 1) {
    let s = y[i];
    for (let k = i + 1; k < n; k += 1) s -= L[k][i] * x[k];
    x[i] = s / L[i][i];
  }
  return x;
}

/**
 * An SVM on the kernel m landmarks imply, K~(x, z) = k_L(x)^T K_LL^-1 k_L(z), solved by page 14's
 * smoFit. The landmarks are the first m training points. A prediction needs only the m
 * similarities k_L(z): the fitted model folds into one m-vector v = K_LL^-1 sum a_i y_i k_L(x_i).
 */
export function landmarkFit(train: Pt[], m: number, C = 1) {
  const g = LANDMARK_GAMMA;
  const L = train.slice(0, m);
  const Kll = L.map((a) => L.map((b) => rbfAt(a, b, g)));
  const kL = train.map((p) => L.map((l) => rbfAt(p, l, g)));
  // columns of K_LL^-1 k_L(x_i), one solve per training point
  const W = kL.map((k) => cholSolve(Kll, k));
  const K = kL.map((ki) => W.map((wj) => ki.reduce((s, v, t) => s + v * wj[t], 0)));
  const y = train.map((p) => p.y);
  const fit = smoFit(y, K, C, 1e-8, 200000);
  const v = new Array(m).fill(0);
  fit.alpha.forEach((a, i) => {
    if (a > 0) for (let t = 0; t < m; t += 1) v[t] += a * y[i] * W[i][t];
  });
  const score = (x: number, z: number) => {
    let s = fit.b;
    for (let t = 0; t < m; t += 1) s += v[t] * Math.exp(-g * ((L[t].x - x) ** 2 + (L[t].z - z) ** 2));
    return s;
  };
  return { ...fit, K, f: train.map((p) => score(p.x, p.z)), score, landmarks: L };
}
