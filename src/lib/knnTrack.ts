import type { TrackChapter } from "@/lib/linearRegressionTrack";

// Mastery-depth track for k-Nearest Neighbors, parity with Linear Regression and
// k-Means: Tiers 1–3, from intuition through the algorithm, choosing k, distance &
// scaling, efficient search structures, regression, theory, and a 3-case capstone.
// Pages with an href are built; the rest are the planned roadmap (greyed in sidebar).
export const KNN_TRACK: TrackChapter[] = [
  {
    title: "The problem & the intuition",
    tier: 1,
    pages: [
      { title: "What is k-NN?", href: "/learn/k-nearest-neighbors" },
      { title: "The classification landscape", href: "/learn/k-nearest-neighbors/the-classification-landscape" },
      { title: "Similarity & distance", href: "/learn/k-nearest-neighbors/similarity-and-distance" },
      { title: "From 1-NN to k-NN", href: "/learn/k-nearest-neighbors/from-1-nn-to-k-nn" },
    ],
  },
  {
    title: "How k-NN predicts",
    tier: 1,
    pages: [
      { title: "The algorithm, end to end", href: "/learn/k-nearest-neighbors/the-algorithm-end-to-end" },
      { title: "Classification by majority vote", href: "/learn/k-nearest-neighbors/classification-by-majority-vote" },
      { title: "Regression by averaging", href: "/learn/k-nearest-neighbors/regression-by-averaging" },
      { title: "Decision boundaries", href: "/learn/k-nearest-neighbors/decision-boundaries" },
    ],
  },
  {
    title: "Choosing k",
    tier: 2,
    pages: [
      { title: "The role of k", href: "/learn/k-nearest-neighbors/the-role-of-k" },
      { title: "Bias & variance in k-NN", href: "/learn/k-nearest-neighbors/bias-and-variance-in-k-nn" },
      { title: "Choosing k by cross-validation", href: "/learn/k-nearest-neighbors/choosing-k-by-cross-validation" },
    ],
  },
  {
    title: "Distance & weighting",
    tier: 2,
    pages: [
      { title: "Distance metrics for k-NN", href: "/learn/k-nearest-neighbors/distance-metrics-for-k-nn" },
      { title: "Why feature scaling matters", href: "/learn/k-nearest-neighbors/why-feature-scaling-matters" },
      { title: "Distance-weighted voting", href: "/learn/k-nearest-neighbors/distance-weighted-voting" },
      { title: "The curse of dimensionality", href: "/learn/k-nearest-neighbors/the-curse-of-dimensionality" },
    ],
  },
  {
    title: "Making it work in practice",
    tier: 2,
    pages: [
      { title: "Preprocessing & encoding", href: "/learn/k-nearest-neighbors/preprocessing-and-encoding" },
      { title: "Ties & class imbalance", href: "/learn/k-nearest-neighbors/ties-and-class-imbalance" },
      { title: "Choosing the right metric", href: "/learn/k-nearest-neighbors/choosing-the-right-metric" },
      { title: "Feature selection & weighting", href: "/learn/k-nearest-neighbors/feature-selection-and-weighting" },
    ],
  },
  {
    title: "Scaling k-NN: the search problem",
    tier: 2,
    pages: [
      { title: "The brute-force cost", href: "/learn/k-nearest-neighbors/the-brute-force-cost" },
      { title: "k-d trees", href: "/learn/k-nearest-neighbors/k-d-trees" },
      { title: "Ball trees", href: "/learn/k-nearest-neighbors/ball-trees" },
      { title: "Approximate nearest neighbors", href: "/learn/k-nearest-neighbors/approximate-nearest-neighbors" },
    ],
  },
  {
    title: "Regression & other uses",
    tier: 2,
    pages: [
      { title: "k-NN regression in depth", href: "/learn/k-nearest-neighbors/k-nn-regression-in-depth" },
      { title: "Local weighted regression", href: "/learn/k-nearest-neighbors/local-weighted-regression" },
      { title: "k-NN for imputation & anomaly detection", href: "/learn/k-nearest-neighbors/k-nn-for-imputation-and-anomaly-detection" },
    ],
  },
  {
    title: "Theory · go deeper",
    tier: 3,
    pages: [
      { title: "The Bayes classifier & Bayes error", href: "/learn/k-nearest-neighbors/the-bayes-classifier-and-bayes-error" },
      { title: "The 1-NN error bound (Cover & Hart)", href: "/learn/k-nearest-neighbors/the-1-nn-error-bound" },
      { title: "Consistency of k-NN", href: "/learn/k-nearest-neighbors/consistency-of-k-nn" },
      { title: "k-NN as non-parametric estimation", href: "/learn/k-nearest-neighbors/k-nn-as-non-parametric-estimation" },
    ],
  },
  {
    title: "Strengths, weaknesses & kin",
    tier: 2,
    pages: [
      { title: "When to use k-NN", href: "/learn/k-nearest-neighbors/when-to-use-k-nn" },
      { title: "k-NN vs logistic regression, SVM, trees", href: "/learn/k-nearest-neighbors/k-nn-vs-logistic-regression-svm-trees" },
      { title: "k-NN vs k-means (the name trap)", href: "/learn/k-nearest-neighbors/k-nn-vs-k-means" },
    ],
  },
  {
    title: "In the wild",
    tier: 2,
    pages: [
      { title: "Case A: handwritten digit recognition", href: "/learn/k-nearest-neighbors/case-a-digit-recognition" },
      { title: "Case B: recommendation & collaborative filtering", href: "/learn/k-nearest-neighbors/case-b-recommendation" },
      { title: "Case C: similarity search & anomaly detection", href: "/learn/k-nearest-neighbors/case-c-similarity-and-anomaly" },
    ],
  },
];

export const KNN_TOTAL = KNN_TRACK.reduce((n, c) => n + c.pages.length, 0);
export const KNN_DONE = KNN_TRACK.reduce(
  (n, c) => n + c.pages.filter((p) => p.href).length,
  0,
);
