import type { TrackChapter } from "@/lib/linearRegressionTrack";

// Flagship end-to-end capstone: California housing price prediction, worked the way
// a senior data scientist actually works it — framing, EDA, data quality, a linear
// baseline, then three diagnostic-driven upgrades (spatial features, a censored/Tobit
// model, gradient boosting), final model selection, and delivery. Every number and
// plot is computed from the real estate_train.csv / estate_test.csv.
export const CAP_TRACK: TrackChapter[] = [
  {
    title: "The project",
    pages: [
      { title: "Overview & goal", href: "/learn/california-housing-capstone" },
      { title: "Framing the problem", href: "/learn/california-housing-capstone/framing" },
    ],
  },
  {
    title: "Understand the data",
    pages: [
      { title: "EDA: distributions & signal", href: "/learn/california-housing-capstone/eda" },
      { title: "Data quality & cleaning", href: "/learn/california-housing-capstone/data-quality" },
    ],
  },
  {
    title: "The linear baseline",
    pages: [
      { title: "Preprocessing pipeline", href: "/learn/california-housing-capstone/preprocessing" },
      { title: "Baseline & regularized models", href: "/learn/california-housing-capstone/linear-models" },
      { title: "Diagnostics: what it misses", href: "/learn/california-housing-capstone/diagnostics" },
    ],
  },
  {
    title: "Upgrade 1 · Geography",
    pages: [
      { title: "Spatial feature engineering", href: "/learn/california-housing-capstone/spatial-features" },
    ],
  },
  {
    title: "Upgrade 2 · Censored target",
    pages: [
      { title: "Tobit & censored regression", href: "/learn/california-housing-capstone/censored-regression" },
    ],
  },
  {
    title: "Upgrade 3 · Nonlinear",
    pages: [
      { title: "Gradient boosting", href: "/learn/california-housing-capstone/gradient-boosting" },
    ],
  },
  {
    title: "Decision & delivery",
    pages: [
      { title: "Final model selection", href: "/learn/california-housing-capstone/model-selection" },
      { title: "Predictions & takeaways", href: "/learn/california-housing-capstone/takeaways" },
    ],
  },
];

export const CAP_TOTAL = CAP_TRACK.reduce((n, c) => n + c.pages.length, 0);
export const CAP_DONE = CAP_TRACK.reduce(
  (n, c) => n + c.pages.filter((p) => p.href).length,
  0,
);
