import type { TrackChapter } from "./linearRegressionTrack";

// The Data Workflow pillar — the work that happens around fitting, which is
// where nearly all of a project's outcome is actually decided. Accent = gray
// --c-metrics (the pillar colour, PROJECT.md §10.1).
//
// The spine: MODEL QUALITY IS DECIDED BEFORE THE MODEL. Each chapter is one
// class of decision the reader makes before `.fit()` is ever called, and each
// one has a wrong default that feels right. The pillar teaches the decisions
// and the diagnosis, not a checklist — the checklist is only the last page,
// and it earns its authority from the 27 pages of reasoning in front of it.
//
// Deliberate boundaries: Evaluation & Metrics owns WHICH metric; Model
// selection owns splits-as-capacity-control and CV mechanics; the capstones
// own the end-to-end walkthrough. This pillar owns framing, data quality,
// leakage, features, error analysis and life after deployment.
export const DW_TRACK: TrackChapter[] = [
  {
    title: "Before you model",
    tier: 1,
    pages: [
      { title: "What you actually do with data", href: "/learn/data-workflow" },
      { title: "The workflow is a loop", href: "/learn/data-workflow/the-loop" },
      { title: "What question are you answering?", href: "/learn/data-workflow/what-question-are-you-answering" },
      { title: "What is one row?", href: "/learn/data-workflow/the-unit-of-analysis" },
    ],
  },
  {
    title: "Framing",
    tier: 1,
    pages: [
      { title: "Designing the label", href: "/learn/data-workflow/designing-the-label" },
      { title: "What you know at prediction time", href: "/learn/data-workflow/what-you-know-at-prediction-time" },
      { title: "Regression, classification or ranking?", href: "/learn/data-workflow/regression-classification-or-ranking" },
      { title: "The framing contract", href: "/learn/data-workflow/the-framing-contract" },
    ],
  },
  {
    title: "Meeting the data",
    tier: 1,
    pages: [
      { title: "EDA with a purpose", href: "/learn/data-workflow/eda-with-a-purpose" },
      { title: "One variable at a time", href: "/learn/data-workflow/one-variable-at-a-time" },
      { title: "Relationships & confounds", href: "/learn/data-workflow/relationships-and-confounds" },
      { title: "Sanity checks that catch disasters", href: "/learn/data-workflow/sanity-checks" },
    ],
  },
  {
    title: "Data quality & leakage",
    tier: 2,
    pages: [
      { title: "Missing data", href: "/learn/data-workflow/missing-data" },
      { title: "Outliers & influence", href: "/learn/data-workflow/outliers-and-influence" },
      { title: "The many faces of leakage", href: "/learn/data-workflow/the-many-faces-of-leakage" },
      { title: "Pipelines & the fold", href: "/learn/data-workflow/pipelines-and-the-fold" },
    ],
  },
  {
    title: "Preparing features",
    tier: 2,
    pages: [
      { title: "Preprocessing is modelling", href: "/learn/data-workflow/preprocessing-is-modelling" },
      { title: "Encoding categoricals", href: "/learn/data-workflow/encoding-categoricals" },
      { title: "Scaling & transforms", href: "/learn/data-workflow/scaling-and-transforms" },
      { title: "Feature engineering", href: "/learn/data-workflow/feature-engineering" },
    ],
  },
  {
    title: "From baseline to better",
    tier: 2,
    pages: [
      { title: "Start with a baseline", href: "/learn/data-workflow/start-with-a-baseline" },
      { title: "The first real model", href: "/learn/data-workflow/the-first-real-model" },
      { title: "Error analysis", href: "/learn/data-workflow/error-analysis" },
      { title: "What to do next", href: "/learn/data-workflow/what-to-do-next" },
    ],
  },
  {
    title: "Beyond the notebook",
    tier: 2,
    pages: [
      { title: "Reproducibility", href: "/learn/data-workflow/reproducibility" },
      { title: "Drift & monitoring", href: "/learn/data-workflow/drift-and-monitoring" },
      { title: "Feedback loops", href: "/learn/data-workflow/feedback-loops" },
      { title: "The workflow playbook", href: "/learn/data-workflow/the-workflow-playbook" },
    ],
  },
];

export const DW_TOTAL = DW_TRACK.reduce((n, c) => n + c.pages.length, 0);
export const DW_DONE = DW_TRACK.reduce(
  (n, c) => n + c.pages.filter((p) => p.href).length,
  0,
);
