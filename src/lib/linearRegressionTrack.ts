export type TrackPage = { title: string; href?: string };
// tier: the depth band this chapter belongs to (siteMap TIERS) — 1 intuition,
// 2 practitioner, 3 theory. Rendered as a small badge on the sidebar chapter
// header so the four-depth promise is visible inside a track, not just on /map.
export type TrackChapter = { title: string; pages: TrackPage[]; tier?: 1 | 2 | 3 };

export const LR_TRACK: TrackChapter[] = [
  {
    title: "The problem & the intuition",
    tier: 1,
    pages: [
      { title: "Why predict at all?", href: "/learn/linear-regression/why-predict-at-all" },
      { title: "What a model really is", href: "/learn/linear-regression/what-a-model-really-is" },
      { title: "The line of best fit", href: "/learn/linear-regression" },
      { title: "What is error?", href: "/learn/linear-regression/what-is-error" },
    ],
  },
  {
    title: "Turning wrong into a number",
    tier: 1,
    pages: [
      { title: "The cost function", href: "/learn/linear-regression/the-cost-function" },
      { title: "Why squared error?", href: "/learn/linear-regression/why-squared-error" },
      { title: "The loss surface", href: "/learn/linear-regression/the-loss-surface" },
      { title: "What best means", href: "/learn/linear-regression/what-best-means" },
    ],
  },
  {
    title: "Gradient descent",
    tier: 1,
    pages: [
      { title: "Roll downhill", href: "/learn/linear-regression/roll-downhill" },
      { title: "What is a gradient?", href: "/learn/linear-regression/what-is-a-gradient" },
      { title: "The update rule", href: "/learn/linear-regression/the-update-rule" },
      { title: "Learning rate", href: "/learn/linear-regression/learning-rate" },
      { title: "Descent on the surface", href: "/learn/linear-regression/descent-on-the-surface" },
      { title: "Batch, stochastic, mini-batch", href: "/learn/linear-regression/batch-vs-sgd" },
      { title: "When do we stop?", href: "/learn/linear-regression/when-do-we-stop" },
    ],
  },
  {
    title: "The direct solution",
    tier: 2,
    pages: [
      { title: "The normal equation", href: "/learn/linear-regression/the-normal-equation" },
      { title: "Closed-form vs gradient descent", href: "/learn/linear-regression/closed-form-vs-gradient-descent" },
    ],
  },
  {
    title: "From one feature to many",
    tier: 2,
    pages: [
      { title: "Multiple linear regression", href: "/learn/linear-regression/multiple-linear-regression" },
      { title: "Feature scaling", href: "/learn/linear-regression/feature-scaling" },
      { title: "Categorical features", href: "/learn/linear-regression/categorical-features" },
      { title: "Polynomial & interaction terms", href: "/learn/linear-regression/polynomial-and-interaction-terms" },
    ],
  },
  {
    title: "The assumptions",
    tier: 2,
    pages: [
      { title: "The five assumptions", href: "/learn/linear-regression/the-five-assumptions" },
      { title: "Linearity", href: "/learn/linear-regression/linearity" },
      { title: "Independence of errors", href: "/learn/linear-regression/independence-of-errors" },
      { title: "Homoscedasticity", href: "/learn/linear-regression/homoscedasticity" },
      { title: "Normality of residuals", href: "/learn/linear-regression/normality-of-residuals" },
      { title: "Multicollinearity", href: "/learn/linear-regression/multicollinearity" },
    ],
  },
  {
    title: "Diagnostics",
    tier: 2,
    pages: [
      { title: "Residual-vs-fitted", href: "/learn/linear-regression/residual-vs-fitted" },
      { title: "Heteroscedasticity in depth", href: "/learn/linear-regression/heteroscedasticity-in-depth" },
      { title: "Outliers, leverage & influence", href: "/learn/linear-regression/outliers-leverage-influence" },
      { title: "Detecting non-normality", href: "/learn/linear-regression/detecting-non-normality" },
    ],
  },
  {
    title: "Evaluation",
    tier: 2,
    pages: [
      { title: "R² and adjusted R²", href: "/learn/linear-regression/r-squared-and-adjusted" },
      { title: "RMSE vs MAE", href: "/learn/linear-regression/rmse-vs-mae" },
      { title: "Cross-validation & bias–variance", href: "/learn/linear-regression/cross-validation-bias-variance" },
    ],
  },
  {
    title: "Fixing & optimizing",
    tier: 2,
    pages: [
      { title: "Transformations", href: "/learn/linear-regression/transformations" },
      { title: "Weighted least squares", href: "/learn/linear-regression/weighted-least-squares" },
      { title: "Regularization", href: "/learn/linear-regression/regularization" },
      { title: "Bias–variance, revisited", href: "/learn/linear-regression/bias-variance-revisited" },
    ],
  },
  {
    title: "Inference",
    tier: 3,
    pages: [
      { title: "Confidence intervals", href: "/learn/linear-regression/confidence-intervals" },
      { title: "Hypothesis tests & p-values", href: "/learn/linear-regression/hypothesis-tests-and-p-values" },
      { title: "Prediction intervals", href: "/learn/linear-regression/prediction-intervals" },
    ],
  },
  {
    title: "In the wild",
    tier: 2,
    pages: [
      { title: "When to use it (vs trees, GLMs)", href: "/learn/linear-regression/when-to-use-it" },
      { title: "Failure-mode gallery", href: "/learn/linear-regression/failure-mode-gallery" },
      { title: "End-to-end: Overview", href: "/learn/linear-regression/end-to-end-worked-case" },
      { title: "Case A: Startup Revenue", href: "/learn/linear-regression/end-to-end-worked-case/startup-revenue" },
      { title: "Case B: House Prices", href: "/learn/linear-regression/end-to-end-worked-case/house-prices" },
      { title: "Case C: Medical Costs", href: "/learn/linear-regression/end-to-end-worked-case/medical-costs" },
    ],
  },
];

export const LR_TOTAL = LR_TRACK.reduce((n, c) => n + c.pages.length, 0);
export const LR_DONE = LR_TRACK.reduce(
  (n, c) => n + c.pages.filter((p) => p.href).length,
  0,
);
