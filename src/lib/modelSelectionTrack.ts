import type { TrackChapter } from "@/lib/linearRegressionTrack";

// Model selection — the practitioner's counterpart to the Learning theory
// track. Learning theory says WHY a held-out score can be trusted; this pillar
// is about actually choosing among models without fooling yourself. Accent =
// gray --c-metrics (the pillar/theory colour, PROJECT.md §10.1).
//
// The spine is the selection trap: every comparison you make spends some of
// your evaluation budget, and almost every bad practice in applied ML is a
// failure to account for that. Pages with an href are built.
export const MS_TRACK: TrackChapter[] = [
  {
    title: "The selection problem",
    tier: 2,
    pages: [
      { title: "Choosing among models", href: "/learn/model-selection" },
      { title: "What you're actually choosing", href: "/learn/model-selection/what-youre-choosing" },
      { title: "Approximation vs estimation, in practice", href: "/learn/model-selection/approximation-vs-estimation" },
      { title: "The selection trap", href: "/learn/model-selection/the-selection-trap" },
    ],
  },
  {
    title: "Validation done right",
    tier: 2,
    pages: [
      { title: "Train, validation, test", href: "/learn/model-selection/train-validation-test" },
      { title: "Cross-validation", href: "/learn/model-selection/cross-validation" },
      { title: "How many folds?", href: "/learn/model-selection/how-many-folds" },
      { title: "Nested cross-validation", href: "/learn/model-selection/nested-cross-validation" },
    ],
  },
  {
    title: "Controlling capacity",
    tier: 2,
    pages: [
      { title: "Structural risk minimization", href: "/learn/model-selection/structural-risk-minimization" },
      { title: "Regularization as capacity control", href: "/learn/model-selection/regularization-as-capacity" },
      { title: "Early stopping", href: "/learn/model-selection/early-stopping" },
      { title: "Information criteria: AIC, BIC & MDL", href: "/learn/model-selection/information-criteria" },
    ],
  },
  {
    title: "Selecting in the real world",
    tier: 2,
    pages: [
      { title: "Reading learning curves", href: "/learn/model-selection/learning-curves" },
      { title: "The one-standard-error rule", href: "/learn/model-selection/one-standard-error-rule" },
      { title: "When your data isn't i.i.d.", href: "/learn/model-selection/when-data-isnt-iid" },
      { title: "The model-selection checklist", href: "/learn/model-selection/the-checklist" },
    ],
  },
];

export const MS_TOTAL = MS_TRACK.reduce((n, c) => n + c.pages.length, 0);
export const MS_DONE = MS_TRACK.reduce(
  (n, c) => n + c.pages.filter((p) => p.href).length,
  0,
);
