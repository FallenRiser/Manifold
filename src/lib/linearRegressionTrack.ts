export type TrackPage = { title: string; href?: string };
export type TrackChapter = { title: string; pages: TrackPage[] };

export const LR_TRACK: TrackChapter[] = [
  {
    title: "The problem & the intuition",
    pages: [
      { title: "Why predict at all?", href: "/learn/linear-regression/why-predict-at-all" },
      { title: "What a model really is", href: "/learn/linear-regression/what-a-model-really-is" },
      { title: "The line of best fit", href: "/learn/linear-regression" },
      { title: "What is error?", href: "/learn/linear-regression/what-is-error" },
    ],
  },
  {
    title: "Turning wrong into a number",
    pages: [
      { title: "The cost function", href: "/learn/linear-regression/the-cost-function" },
      { title: "Why squared error?", href: "/learn/linear-regression/why-squared-error" },
      { title: "The loss surface", href: "/learn/linear-regression/the-loss-surface" },
      { title: "What best means", href: "/learn/linear-regression/what-best-means" },
    ],
  },
  {
    title: "Gradient descent",
    pages: [
      { title: "Roll downhill" },
      { title: "What is a gradient?", href: "/learn/linear-regression/what-is-a-gradient" },
      { title: "The update rule" },
      { title: "Learning rate" },
      { title: "Descent on the surface" },
      { title: "Batch, stochastic, mini-batch", href: "/learn/linear-regression/batch-vs-sgd" },
      { title: "When do we stop?" },
    ],
  },
  {
    title: "The direct solution",
    pages: [
      { title: "The normal equation" },
      { title: "Closed-form vs gradient descent" },
    ],
  },
  {
    title: "From one feature to many",
    pages: [
      { title: "Multiple linear regression" },
      { title: "Feature scaling" },
      { title: "Categorical features" },
      { title: "Polynomial & interaction terms" },
    ],
  },
  {
    title: "The assumptions",
    pages: [
      { title: "The five assumptions" },
      { title: "Linearity" },
      { title: "Independence of errors" },
      { title: "Homoscedasticity" },
      { title: "Normality of residuals" },
      { title: "Multicollinearity" },
    ],
  },
  {
    title: "Diagnostics",
    pages: [
      { title: "Residual-vs-fitted" },
      { title: "Heteroscedasticity in depth" },
      { title: "Outliers, leverage & influence" },
      { title: "Detecting non-normality" },
    ],
  },
  {
    title: "Evaluation",
    pages: [
      { title: "R² and adjusted R²" },
      { title: "RMSE vs MAE" },
      { title: "Cross-validation & bias–variance" },
    ],
  },
  {
    title: "Fixing & optimizing",
    pages: [
      { title: "Transformations" },
      { title: "Weighted least squares" },
      { title: "Regularization" },
      { title: "Bias–variance, revisited" },
    ],
  },
  {
    title: "Inference",
    pages: [
      { title: "Confidence intervals" },
      { title: "Hypothesis tests & p-values" },
      { title: "Prediction intervals" },
    ],
  },
  {
    title: "In the wild",
    pages: [
      { title: "When to use it (vs trees, GLMs)" },
      { title: "Failure-mode gallery" },
      { title: "End-to-end worked case" },
    ],
  },
];

export const LR_TOTAL = LR_TRACK.reduce((n, c) => n + c.pages.length, 0);
export const LR_DONE = LR_TRACK.reduce(
  (n, c) => n + c.pages.filter((p) => p.href).length,
  0,
);
