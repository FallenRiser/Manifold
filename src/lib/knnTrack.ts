import type { TrackChapter } from "@/lib/linearRegressionTrack";

// Mastery-depth track for k-Nearest Neighbors, parity with Linear Regression and
// k-Means: Tiers 1–3, from intuition through the algorithm, choosing k, distance &
// scaling, efficient search structures, regression, theory, and a 3-case capstone.
// Pages with an href are built; the rest are the planned roadmap (greyed in sidebar).
export const KNN_TRACK: TrackChapter[] = [
  {
    title: "The problem & the intuition",
    pages: [
      { title: "What is k-NN?", href: "/learn/k-nearest-neighbors" },
      { title: "The classification landscape", href: "/learn/k-nearest-neighbors/the-classification-landscape" },
      { title: "Similarity & distance", href: "/learn/k-nearest-neighbors/similarity-and-distance" },
      { title: "From 1-NN to k-NN", href: "/learn/k-nearest-neighbors/from-1-nn-to-k-nn" },
    ],
  },
  {
    title: "How k-NN predicts",
    pages: [
      { title: "The algorithm, end to end", href: "/learn/k-nearest-neighbors/the-algorithm-end-to-end" },
      { title: "Classification by majority vote", href: "/learn/k-nearest-neighbors/classification-by-majority-vote" },
      { title: "Regression by averaging", href: "/learn/k-nearest-neighbors/regression-by-averaging" },
      { title: "Decision boundaries", href: "/learn/k-nearest-neighbors/decision-boundaries" },
    ],
  },
  {
    title: "Choosing k",
    pages: [
      { title: "The role of k" },
      { title: "Bias & variance in k-NN" },
      { title: "Choosing k by cross-validation" },
    ],
  },
  {
    title: "Distance & weighting",
    pages: [
      { title: "Distance metrics for k-NN" },
      { title: "Why feature scaling matters" },
      { title: "Distance-weighted voting" },
      { title: "The curse of dimensionality" },
    ],
  },
  {
    title: "Making it work in practice",
    pages: [
      { title: "Preprocessing & encoding" },
      { title: "Ties & class imbalance" },
      { title: "Choosing the right metric" },
      { title: "Feature selection & weighting" },
    ],
  },
  {
    title: "Scaling k-NN: the search problem",
    pages: [
      { title: "The brute-force cost" },
      { title: "k-d trees" },
      { title: "Ball trees" },
      { title: "Approximate nearest neighbors" },
    ],
  },
  {
    title: "Regression & other uses",
    pages: [
      { title: "k-NN regression in depth" },
      { title: "Local weighted regression" },
      { title: "k-NN for imputation & anomaly detection" },
    ],
  },
  {
    title: "Theory · go deeper",
    pages: [
      { title: "The Bayes classifier & Bayes error" },
      { title: "The 1-NN error bound (Cover & Hart)" },
      { title: "Consistency of k-NN" },
      { title: "k-NN as non-parametric estimation" },
    ],
  },
  {
    title: "Strengths, weaknesses & kin",
    pages: [
      { title: "When to use k-NN" },
      { title: "k-NN vs logistic regression, SVM, trees" },
      { title: "k-NN vs k-means (the name trap)" },
    ],
  },
  {
    title: "In the wild",
    pages: [
      { title: "Case A: handwritten digit recognition" },
      { title: "Case B: recommendation & collaborative filtering" },
      { title: "Case C: similarity search & anomaly detection" },
    ],
  },
];

export const KNN_TOTAL = KNN_TRACK.reduce((n, c) => n + c.pages.length, 0);
export const KNN_DONE = KNN_TRACK.reduce(
  (n, c) => n + c.pages.filter((p) => p.href).length,
  0,
);
