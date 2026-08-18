import type { TrackChapter } from "@/lib/linearRegressionTrack";

// Mastery-depth track for Support Vector Regression — the sparse, tube-based
// kernel regressor, companion to Kernel Ridge Regression. Tiers 2–3: the
// epsilon-insensitive loss and the tube, support vectors, the soft-margin C, the
// primal and dual problems, kernelisation, hyperparameters, the KRR-vs-SVR
// comparison, when to use it, and a worked example. Pages with an href are built.
export const SVR_TRACK: TrackChapter[] = [
  {
    title: "The ε-insensitive idea",
    tier: 2,
    pages: [
      { title: "Regression with a tube", href: "/learn/support-vector-regression" },
      { title: "The ε-insensitive loss", href: "/learn/support-vector-regression/the-epsilon-insensitive-loss" },
      { title: "The tube & support vectors", href: "/learn/support-vector-regression/the-tube-and-support-vectors" },
      { title: "Soft margin: C & slack", href: "/learn/support-vector-regression/soft-margin-c-and-slack" },
    ],
  },
  {
    title: "The mechanics",
    tier: 2,
    pages: [
      { title: "The primal problem", href: "/learn/support-vector-regression/the-primal-problem" },
      { title: "The dual & the kernel trick", href: "/learn/support-vector-regression/the-dual-and-the-kernel-trick" },
      { title: "Solving the QP: SMO", href: "/learn/support-vector-regression/solving-the-qp-smo" },
      { title: "Kernels for SVR", href: "/learn/support-vector-regression/kernels-for-svr" },
      { title: "Hyperparameters: C, ε, γ", href: "/learn/support-vector-regression/hyperparameters-c-epsilon-gamma" },
      { title: "ν-SVR: controlling the support vectors", href: "/learn/support-vector-regression/nu-svr" },
    ],
  },
  {
    title: "In practice",
    tier: 2,
    pages: [
      { title: "Kernel ridge vs SVR", href: "/learn/support-vector-regression/kernel-ridge-vs-svr" },
      { title: "Scaling SVR to large n", href: "/learn/support-vector-regression/scaling-svr-to-large-n" },
      { title: "When to use SVR", href: "/learn/support-vector-regression/when-to-use-svr" },
      { title: "A worked example", href: "/learn/support-vector-regression/worked-example" },
    ],
  },
  {
    title: "In the wild",
    tier: 2,
    pages: [
      { title: "Case A: forecasting a chaotic series", href: "/learn/support-vector-regression/case-a-forecasting" },
      { title: "Case B: robustness to outliers", href: "/learn/support-vector-regression/case-b-robustness" },
    ],
  },
];

export const SVR_TOTAL = SVR_TRACK.reduce((n, c) => n + c.pages.length, 0);
export const SVR_DONE = SVR_TRACK.reduce(
  (n, c) => n + c.pages.filter((p) => p.href).length,
  0,
);
