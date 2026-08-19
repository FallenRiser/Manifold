import type { TrackChapter } from "@/lib/linearRegressionTrack";

// Mastery-depth track for Decision Trees — the foundation of the Trees &
// ensembles family. A tree is a sequence of yes/no questions that carve the
// feature space into boxes. Tiers 1–3: the twenty-questions intuition, impurity
// and how a split is chosen, regression trees, controlling complexity by
// pruning, the theory of why greedy growth is used and why trees are
// high-variance (which motivates the ensembles that follow), interpretability,
// and a real worked case. Pages with an href are built.
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
      { title: "When to use a single tree", href: "/learn/decision-trees/when-to-use-a-tree" },
    ],
  },
  {
    title: "In the wild",
    tier: 2,
    pages: [
      { title: "Case: predicting who survived", href: "/learn/decision-trees/case-a-titanic" },
    ],
  },
];

export const DECISION_TREES_TOTAL = DECISION_TREES_TRACK.reduce((n, c) => n + c.pages.length, 0);
export const DECISION_TREES_DONE = DECISION_TREES_TRACK.reduce(
  (n, c) => n + c.pages.filter((p) => p.href).length,
  0,
);
