import type { TrackChapter } from "@/lib/linearRegressionTrack";

// Mastery-depth track for Boosting — the third track of the Trees & ensembles
// family, and the sequential/bias-reducing counterpart to the random forest's
// parallel/variance-reducing averaging. From weak learners and AdaBoost, through
// the gradient-boosting reframing (fit trees to pseudo-residuals), regularisation
// (shrinkage, subsampling, early stopping), the modern boosters (XGBoost's Newton
// step, LightGBM's histograms, CatBoost's ordered boosting), the functional-
// gradient theory and the bias/variance contrast with bagging, to interpretation
// and two real worked cases. Pages with an href are built.
export const BOOSTING_TRACK: TrackChapter[] = [
  {
    title: "The boosting idea",
    tier: 1,
    pages: [
      { title: "Learning from mistakes", href: "/learn/boosting" },
      { title: "Weak learners & the boosting question", href: "/learn/boosting/weak-learners" },
      { title: "AdaBoost by hand", href: "/learn/boosting/adaboost" },
    ],
  },
  {
    title: "AdaBoost in depth",
    tier: 2,
    pages: [
      { title: "Why AdaBoost works: exponential loss", href: "/learn/boosting/adaboost-exponential-loss" },
      { title: "Margins & resistance to overfitting", href: "/learn/boosting/margins" },
      { title: "Multiclass & real-valued boosting", href: "/learn/boosting/multiclass" },
    ],
  },
  {
    title: "Gradient boosting",
    tier: 1,
    pages: [
      { title: "Boosting as gradient descent", href: "/learn/boosting/gradient-boosting" },
      { title: "Gradient boosting for regression", href: "/learn/boosting/gbm-regression" },
      { title: "Loss functions & robustness", href: "/learn/boosting/loss-functions" },
      { title: "Gradient boosting for classification", href: "/learn/boosting/gbm-classification" },
    ],
  },
  {
    title: "Regularising the ensemble",
    tier: 2,
    pages: [
      { title: "The learning rate & shrinkage", href: "/learn/boosting/shrinkage" },
      { title: "Stochastic gradient boosting", href: "/learn/boosting/stochastic" },
      { title: "Tree structure & the other knobs", href: "/learn/boosting/tree-knobs" },
      { title: "Early stopping & staged prediction", href: "/learn/boosting/early-stopping" },
    ],
  },
  {
    title: "Modern gradient boosting",
    tier: 2,
    pages: [
      { title: "Newton boosting: XGBoost's second-order step", href: "/learn/boosting/newton-boosting" },
      { title: "Histogram boosting: LightGBM & speed", href: "/learn/boosting/histogram" },
      { title: "Categorical features: CatBoost & ordered boosting", href: "/learn/boosting/catboost" },
      { title: "Choosing & tuning a booster", href: "/learn/boosting/tuning" },
    ],
  },
  {
    title: "Theory & interpretation",
    tier: 3,
    pages: [
      { title: "Boosting as functional gradient descent", href: "/learn/boosting/functional-gradient" },
      { title: "Bias, variance & why it isn't bagging", href: "/learn/boosting/bias-variance" },
      { title: "Interpreting a boosted model", href: "/learn/boosting/interpretation" },
    ],
  },
  {
    title: "In the wild",
    tier: 2,
    pages: [
      { title: "Case: boosting beats the forest", href: "/learn/boosting/case-a-tabular" },
      { title: "When to use boosting (and when not)", href: "/learn/boosting/when-to-use" },
    ],
  },
];

export const BOOSTING_TOTAL = BOOSTING_TRACK.reduce((n, c) => n + c.pages.length, 0);
export const BOOSTING_DONE = BOOSTING_TRACK.reduce(
  (n, c) => n + c.pages.filter((p) => p.href).length,
  0,
);
