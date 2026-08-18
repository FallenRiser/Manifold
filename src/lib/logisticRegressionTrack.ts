import type { TrackChapter } from "@/lib/linearRegressionTrack";

// Mastery-depth track for logistic regression — the classification family's
// front door. Tiers 1–3: sigmoid & boundary intuition, log loss and the
// (beautiful) gradient, thresholds, interpretation, regularization,
// multi-class, calibration, theory, and cases. Pages with an href are built;
// the rest are the planned roadmap (greyed in the sidebar).
export const LOG_TRACK: TrackChapter[] = [
  {
    title: "The problem & the intuition",
    tier: 1,
    pages: [
      { title: "From numbers to categories", href: "/learn/logistic-regression" },
      { title: "The sigmoid", href: "/learn/logistic-regression/the-sigmoid" },
      { title: "The decision boundary", href: "/learn/logistic-regression/the-decision-boundary" },
    ],
  },
  {
    title: "Loss & training",
    tier: 1,
    pages: [
      { title: "Log loss", href: "/learn/logistic-regression/log-loss" },
      { title: "The beautiful gradient", href: "/learn/logistic-regression/the-beautiful-gradient" },
      { title: "Thresholds & the confusion matrix", href: "/learn/logistic-regression/thresholds-and-the-confusion-matrix" },
    ],
  },
  {
    title: "Reading the model",
    tier: 2,
    pages: [
      { title: "Coefficients, odds ratios & effect size", href: "/learn/logistic-regression/coefficients-odds-ratios-effect-size" },
      { title: "Standardize before you compare", href: "/learn/logistic-regression/standardize-before-you-compare" },
      { title: "Statistical significance of coefficients", href: "/learn/logistic-regression/statistical-significance-of-coefficients" },
    ],
  },
  {
    title: "Making it work in practice",
    tier: 2,
    pages: [
      { title: "Regularized logistic regression", href: "/learn/logistic-regression/regularized-logistic-regression" },
      { title: "Class imbalance & class weights", href: "/learn/logistic-regression/class-imbalance-and-class-weights" },
      { title: "Feature engineering for linear boundaries", href: "/learn/logistic-regression/feature-engineering-for-linear-boundaries" },
      { title: "When perfect separation breaks everything", href: "/learn/logistic-regression/when-perfect-separation-breaks-everything" },
    ],
  },
  {
    title: "Beyond two classes",
    tier: 2,
    pages: [
      { title: "Softmax & multinomial logistic regression", href: "/learn/logistic-regression/softmax-and-multinomial" },
      { title: "One-vs-rest & one-vs-one", href: "/learn/logistic-regression/one-vs-rest-and-one-vs-one" },
    ],
  },
  {
    title: "Probabilities you can trust",
    tier: 2,
    pages: [
      { title: "Calibration: is 0.8 really 80%?", href: "/learn/logistic-regression/calibration" },
      { title: "ROC, AUC & choosing a threshold", href: "/learn/logistic-regression/roc-auc-and-thresholds" },
      { title: "Cost-sensitive decisions", href: "/learn/logistic-regression/cost-sensitive-decisions" },
    ],
  },
  {
    title: "Theory · go deeper",
    tier: 3,
    pages: [
      { title: "Maximum likelihood: where log loss comes from", href: "/learn/logistic-regression/maximum-likelihood" },
      { title: "Convexity of the log-loss objective", href: "/learn/logistic-regression/convexity-of-log-loss" },
      { title: "Logistic regression as a GLM", href: "/learn/logistic-regression/logistic-regression-as-a-glm" },
      { title: "The generative twin: naive Bayes & LDA", href: "/learn/logistic-regression/generative-twin-naive-bayes-lda" },
    ],
  },
  {
    title: "In the wild",
    tier: 2,
    pages: [
      { title: "When to use it (vs trees, SVMs, k-NN)", href: "/learn/logistic-regression/when-to-use-logistic-regression" },
      { title: "Case A: credit default prediction", href: "/learn/logistic-regression/case-credit-default" },
      { title: "Case B: medical screening & thresholds", href: "/learn/logistic-regression/case-medical-screening" },
    ],
  },
];

export const LOG_TOTAL = LOG_TRACK.reduce((n, c) => n + c.pages.length, 0);
export const LOG_DONE = LOG_TRACK.reduce(
  (n, c) => n + c.pages.filter((p) => p.href).length,
  0,
);
