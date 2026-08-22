import type { TrackChapter } from "@/lib/linearRegressionTrack";

// Mastery-depth track for Bagging & Random Forests — the second track of the
// Trees & ensembles family. From bagging and out-of-bag error, through the
// random-subspace decorrelation trick, imbalanced-data handling, regression and
// quantile forests (prediction intervals), the variance-of-a-correlated-mean and
// strength–correlation theory, isolation forests and forest proximities, to two
// real worked cases. Pages with an href are built.
export const RANDOM_FORESTS_TRACK: TrackChapter[] = [
  {
    title: "The wisdom of many trees",
    tier: 1,
    pages: [
      { title: "Averaging trees", href: "/learn/random-forests" },
      { title: "Bagging: training on bootstraps", href: "/learn/random-forests/bagging" },
      { title: "Out-of-bag error", href: "/learn/random-forests/out-of-bag-error" },
    ],
  },
  {
    title: "What makes it a forest",
    tier: 2,
    pages: [
      { title: "Decorrelating the trees", href: "/learn/random-forests/decorrelating-the-trees" },
      { title: "The random forest algorithm", href: "/learn/random-forests/the-algorithm" },
      { title: "Feature importance in a forest", href: "/learn/random-forests/feature-importance" },
    ],
  },
  {
    title: "Tuning & variants",
    tier: 2,
    pages: [
      { title: "The hyperparameters", href: "/learn/random-forests/hyperparameters" },
      { title: "Extremely randomized trees", href: "/learn/random-forests/extra-trees" },
      { title: "Imbalanced & weighted forests", href: "/learn/random-forests/imbalanced-forests" },
      { title: "Forest vs tree vs boosting", href: "/learn/random-forests/forest-vs-tree-vs-boosting" },
    ],
  },
  {
    title: "Forests for regression",
    tier: 2,
    pages: [
      { title: "Regression forests", href: "/learn/random-forests/regression-forests" },
      { title: "Quantile forests & prediction intervals", href: "/learn/random-forests/quantile-regression-forests" },
    ],
  },
  {
    title: "Theory · go deeper",
    tier: 3,
    pages: [
      { title: "Why averaging works", href: "/learn/random-forests/why-averaging-works" },
      { title: "Strength & correlation: Breiman's bound", href: "/learn/random-forests/strength-and-correlation" },
      { title: "Bias & the limits of forests", href: "/learn/random-forests/limits-of-forests" },
    ],
  },
  {
    title: "Beyond prediction",
    tier: 2,
    pages: [
      { title: "Proximities, outliers & missing data", href: "/learn/random-forests/proximities" },
      { title: "Isolation forests: anomaly detection", href: "/learn/random-forests/isolation-forests" },
      { title: "Importance for correlated features", href: "/learn/random-forests/importance-for-correlated-features" },
      { title: "When to use a random forest", href: "/learn/random-forests/when-to-use" },
    ],
  },
  {
    title: "In the wild",
    tier: 2,
    pages: [
      { title: "Case: the forest as a default", href: "/learn/random-forests/case-a-covertype" },
      { title: "Case: prediction intervals on housing", href: "/learn/random-forests/case-b-intervals" },
    ],
  },
];

export const RANDOM_FORESTS_TOTAL = RANDOM_FORESTS_TRACK.reduce((n, c) => n + c.pages.length, 0);
export const RANDOM_FORESTS_DONE = RANDOM_FORESTS_TRACK.reduce(
  (n, c) => n + c.pages.filter((p) => p.href).length,
  0,
);
