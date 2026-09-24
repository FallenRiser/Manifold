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
