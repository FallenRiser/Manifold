import type { TrackChapter } from "@/lib/linearRegressionTrack";

// Mastery-depth track for Kernel Ridge Regression — the bridge from linear/ridge
// regression to nonlinear kernel methods. Tiers 2–3: the kernel trick, the dual
// form of ridge, kernels as similarity, the closed-form KRR solution, tuning and
// cost, then the theory (representer theorem, Gaussian-process link) and a worked
// example. Companion to the Support Vector Regression track. Pages with an href
// are built; the rest are the planned roadmap (greyed in the sidebar).
export const KRR_TRACK: TrackChapter[] = [
  {
    title: "From ridge to kernels",
    tier: 2,
    pages: [
      { title: "Bending ridge regression", href: "/learn/kernel-ridge-regression" },
      { title: "The kernel trick", href: "/learn/kernel-ridge-regression/the-kernel-trick" },
      { title: "The dual form of ridge", href: "/learn/kernel-ridge-regression/the-dual-form-of-ridge" },
      { title: "Kernels as similarity", href: "/learn/kernel-ridge-regression/kernels-as-similarity" },
    ],
  },
  {
    title: "Kernel ridge in depth",
    tier: 2,
    pages: [
      { title: "The kernel ridge solution", href: "/learn/kernel-ridge-regression/the-kernel-ridge-solution" },
      { title: "Choosing the kernel", href: "/learn/kernel-ridge-regression/choosing-the-kernel" },
      { title: "Tuning λ and γ", href: "/learn/kernel-ridge-regression/tuning-lambda-and-gamma" },
      { title: "The computational cost", href: "/learn/kernel-ridge-regression/the-computational-cost" },
    ],
  },
  {
    title: "Theory & connections",
    tier: 3,
    pages: [
      { title: "The representer theorem", href: "/learn/kernel-ridge-regression/the-representer-theorem" },
      { title: "Kernel ridge & Gaussian processes", href: "/learn/kernel-ridge-regression/kernel-ridge-and-gaussian-processes" },
      { title: "Kernel ridge vs SVR vs linear", href: "/learn/kernel-ridge-regression/kernel-ridge-vs-svr-vs-linear" },
    ],
  },
  {
    title: "Apply it",
    tier: 2,
    pages: [
      { title: "A worked example", href: "/learn/kernel-ridge-regression/worked-example" },
    ],
  },
];

export const KRR_TOTAL = KRR_TRACK.reduce((n, c) => n + c.pages.length, 0);
export const KRR_DONE = KRR_TRACK.reduce(
  (n, c) => n + c.pages.filter((p) => p.href).length,
  0,
);
