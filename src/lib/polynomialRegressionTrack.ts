import type { TrackChapter } from "@/lib/linearRegressionTrack";

// Mastery-depth track for polynomial & basis-function regression — the bridge from
// straight-line linear models to flexible non-linear curves, without leaving the
// comfort of least squares. The throughline: a non-linear fit is still *linear in the
// parameters* once you expand the features through a basis. Pages with an href are
// built; the rest are the planned roadmap (greyed in the sidebar).
export const POLY_TRACK: TrackChapter[] = [
  {
    title: "Bending the line",
    pages: [
      { title: "Why straight lines fail", href: "/learn/polynomial-regression" },
      { title: "Polynomial regression", href: "/learn/polynomial-regression/polynomial-features" },
      { title: "Still linear in the parameters", href: "/learn/polynomial-regression/linear-in-parameters" },
    ],
  },
  {
    title: "The basis-function view",
    pages: [
      { title: "Basis functions: the big idea", href: "/learn/polynomial-regression/basis-functions" },
      { title: "The trouble with high degrees", href: "/learn/polynomial-regression/runge-and-instability" },
      { title: "Radial basis functions" },
      { title: "Piecewise: splines" },
      { title: "Natural & smoothing splines" },
    ],
  },
  {
    title: "Controlling flexibility",
    pages: [
      { title: "Bias–variance & the degree" },
      { title: "Choosing the number of bases" },
      { title: "Regularizing the basis" },
    ],
  },
  {
    title: "In the wild",
    pages: [
      { title: "Pipelines, scaling & leakage" },
      { title: "When to use it (vs kernels, trees)" },
      { title: "A worked example" },
    ],
  },
];

export const POLY_TOTAL = POLY_TRACK.reduce((n, c) => n + c.pages.length, 0);
export const POLY_DONE = POLY_TRACK.reduce(
  (n, c) => n + c.pages.filter((p) => p.href).length,
  0,
);
