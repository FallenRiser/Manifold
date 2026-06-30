import type { TrackChapter } from "@/lib/linearRegressionTrack";

// Mastery-depth track for regularized regression — Ridge, Lasso & Elastic-net as
// one family, parity with the Linear Regression and k-Means tracks. Tiers 1–3:
// from the overfitting problem through L2/L1 penalties, the sparsity geometry,
// elastic-net, practical tuning, the Bayesian/theory view, and a capstone.
// Pages with an href are built; the rest are the planned roadmap (greyed).
export const REG_TRACK: TrackChapter[] = [
  {
    title: "Why regularize",
    pages: [
      { title: "Why regularize?", href: "/learn/regularized-regression" },
      { title: "Overfitting & the bias–variance tradeoff", href: "/learn/regularized-regression/overfitting-and-bias-variance" },
      { title: "Shrinkage: the core idea", href: "/learn/regularized-regression/shrinkage-the-core-idea" },
      { title: "Penalty vs constraint: two views", href: "/learn/regularized-regression/penalty-vs-constraint" },
    ],
  },
  {
    title: "Ridge regression · L2",
    pages: [
      { title: "Ridge regression", href: "/learn/regularized-regression/ridge-regression" },
      { title: "The closed-form solution", href: "/learn/regularized-regression/the-closed-form-solution" },
      { title: "The shrinkage effect & coefficient paths", href: "/learn/regularized-regression/shrinkage-effect-and-paths" },
      { title: "Ridge & multicollinearity", href: "/learn/regularized-regression/ridge-and-multicollinearity" },
      { title: "Choosing λ", href: "/learn/regularized-regression/choosing-lambda" },
    ],
  },
  {
    title: "The Lasso · L1",
    pages: [
      { title: "The Lasso", href: "/learn/regularized-regression/the-lasso" },
      { title: "Why L1 creates sparsity", href: "/learn/regularized-regression/why-l1-creates-sparsity" },
      { title: "The regularization path", href: "/learn/regularized-regression/the-regularization-path" },
      { title: "Lasso for feature selection", href: "/learn/regularized-regression/lasso-for-feature-selection" },
      { title: "Solving the Lasso", href: "/learn/regularized-regression/solving-the-lasso" },
    ],
  },
  {
    title: "Elastic-net",
    pages: [
      { title: "When the Lasso struggles", href: "/learn/regularized-regression/when-the-lasso-struggles" },
      { title: "Elastic-net: blending L1 & L2", href: "/learn/regularized-regression/elastic-net" },
      { title: "Tuning the mix", href: "/learn/regularized-regression/tuning-the-mix" },
    ],
  },
  {
    title: "Using it in practice",
    pages: [
      { title: "Standardize first", href: "/learn/regularized-regression/standardize-first" },
      { title: "Cross-validating the penalty", href: "/learn/regularized-regression/cross-validating-the-penalty" },
      { title: "The full path & warm starts", href: "/learn/regularized-regression/the-full-path-and-warm-starts" },
      { title: "Ridge vs Lasso vs Elastic-net: which when", href: "/learn/regularized-regression/which-when" },
    ],
  },
  {
    title: "Theory · go deeper",
    pages: [
      { title: "Ridge as a Gaussian prior (MAP)", href: "/learn/regularized-regression/ridge-as-a-gaussian-prior" },
      { title: "Lasso as a Laplace prior (MAP)", href: "/learn/regularized-regression/lasso-as-a-laplace-prior" },
      { title: "Degrees of freedom & effective complexity", href: "/learn/regularized-regression/degrees-of-freedom" },
      { title: "Why shrinkage beats OLS (James–Stein)", href: "/learn/regularized-regression/why-shrinkage-beats-ols" },
    ],
  },
  {
    title: "Apply it",
    pages: [
      { title: "Capstone: California housing →", href: "/learn/california-housing-capstone" },
    ],
  },
];

export const REG_TOTAL = REG_TRACK.reduce((n, c) => n + c.pages.length, 0);
export const REG_DONE = REG_TRACK.reduce(
  (n, c) => n + c.pages.filter((p) => p.href).length,
  0,
);
