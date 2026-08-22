import type { TrackChapter } from "@/lib/linearRegressionTrack";

// Mastery-depth track for Decision Trees — the foundation of the Trees &
// ensembles family. From the twenty-questions intuition through impurity,
// regression trees, missing values, pruning, the wider algorithm family
// (ID3/C4.5/CHAID), oblique trees, cost-sensitive learning, the theory of
// greedy growth and high variance, interpretability and calibration, and two
// real worked cases. Pages with an href are built.
export const DECISION_TREES_TRACK: TrackChapter[] = [
  {
    title: "Twenty questions",
    tier: 1,
    pages: [
      { title: "Splitting the space", href: "/learn/decision-trees" },
      { title: "What makes a good split?", href: "/learn/decision-trees/what-makes-a-good-split" },
      { title: "Growing the whole tree", href: "/learn/decision-trees/growing-the-tree" },
    ],
  },
  {
    title: "Choosing a split",
    tier: 2,
    pages: [
      { title: "Gini, entropy & information gain", href: "/learn/decision-trees/impurity-measures" },
      { title: "Regression trees", href: "/learn/decision-trees/regression-trees" },
      { title: "Numeric & categorical splits", href: "/learn/decision-trees/numeric-and-categorical-splits" },
      { title: "Missing values & surrogate splits", href: "/learn/decision-trees/missing-values-and-surrogate-splits" },
    ],
  },
  {
    title: "Controlling complexity",
    tier: 2,
    pages: [
      { title: "How a tree overfits", href: "/learn/decision-trees/how-trees-overfit" },
      { title: "Pre-pruning: the stopping knobs", href: "/learn/decision-trees/pre-pruning" },
      { title: "Cost-complexity pruning", href: "/learn/decision-trees/cost-complexity-pruning" },
    ],
  },
  {
    title: "Beyond CART",
    tier: 2,
    pages: [
      { title: "The algorithm family: ID3, C4.5, CHAID", href: "/learn/decision-trees/the-algorithm-family" },
      { title: "Oblique & multivariate trees", href: "/learn/decision-trees/oblique-and-multivariate-trees" },
      { title: "Class weights & cost-sensitive trees", href: "/learn/decision-trees/class-weights-and-cost-sensitive" },
    ],
  },
  {
    title: "Theory · go deeper",
    tier: 3,
    pages: [
      { title: "Why greedy?", href: "/learn/decision-trees/why-greedy" },
      { title: "The bias–variance profile", href: "/learn/decision-trees/bias-and-variance-of-trees" },
    ],
  },
  {
    title: "Strengths, weaknesses & kin",
    tier: 2,
    pages: [
      { title: "Feature importance & reading a tree", href: "/learn/decision-trees/feature-importance" },
      { title: "Probabilities & calibration", href: "/learn/decision-trees/probabilities-and-calibration" },
      { title: "When to use a single tree", href: "/learn/decision-trees/when-to-use-a-tree" },
    ],
  },
  {
    title: "In the wild",
    tier: 2,
    pages: [
      { title: "Case: predicting who survived", href: "/learn/decision-trees/case-a-titanic" },
      { title: "Case: a regression tree, end to end", href: "/learn/decision-trees/case-b-regression" },
    ],
  },
];

export const DECISION_TREES_TOTAL = DECISION_TREES_TRACK.reduce((n, c) => n + c.pages.length, 0);
export const DECISION_TREES_DONE = DECISION_TREES_TRACK.reduce(
  (n, c) => n + c.pages.filter((p) => p.href).length,
  0,
);
