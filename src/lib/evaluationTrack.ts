import type { TrackChapter } from "@/lib/linearRegressionTrack";

// The Evaluation & Metrics pillar (PROJECT.md §10.6) — classification's missing
// ending. Cross-cutting, model-agnostic: it teaches the *judgement* of which
// metric to trust, case by case, using the interactive labs seeded by the
// logistic track (ThresholdLab, ImbalanceLab, RocLab, CalibrationLab, CostLab).
// Pages with an href are built; the rest are the planned roadmap (greyed).
export const EVAL_TRACK: TrackChapter[] = [
  {
    title: "When one number lies",
    tier: 1,
    pages: [
      { title: "Accuracy is a trap", href: "/learn/evaluation" },
      { title: "The confusion matrix", href: "/learn/evaluation/the-confusion-matrix" },
      { title: "Precision, recall & F1", href: "/learn/evaluation/precision-recall-and-f1" },
    ],
  },
  {
    title: "Grading the whole model",
    tier: 2,
    pages: [
      { title: "ROC, AUC & precision–recall curves", href: "/learn/evaluation/roc-auc-and-pr-curves" },
      { title: "Calibration: is 0.8 really 80%?", href: "/learn/evaluation/calibration" },
      { title: "Cost-sensitive thresholds", href: "/learn/evaluation/cost-sensitive-thresholds" },
    ],
  },
  {
    title: "Measuring a regressor",
    tier: 2,
    pages: [
      { title: "RMSE vs MAE: which error?", href: "/learn/evaluation/rmse-vs-mae" },
      { title: "R² & adjusted R²", href: "/learn/evaluation/r-squared" },
    ],
  },
  {
    title: "Trusting the estimate",
    tier: 2,
    pages: [
      { title: "One split isn't enough: cross-validation", href: "/learn/evaluation/cross-validation" },
      { title: "The evaluation checklist", href: "/learn/evaluation/the-evaluation-checklist" },
    ],
  },
];

export const EVAL_TOTAL = EVAL_TRACK.reduce((n, c) => n + c.pages.length, 0);
export const EVAL_DONE = EVAL_TRACK.reduce(
  (n, c) => n + c.pages.filter((p) => p.href).length,
  0,
);
