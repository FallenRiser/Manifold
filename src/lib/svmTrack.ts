import type { TrackChapter } from "@/lib/linearRegressionTrack";

// Mastery-depth track for Support Vector MACHINES — the classifier. Accent = riso pink
// --c-classification.
//
// This track exists because the site taught the derived form before the canonical one: the
// Support Vector Regression track already covers the primal, the dual, slack, SMO and the kernel
// trick, but aimed at regression, and `maximum margin` returned zero hits sitewide. See
// docs/syllabus-gap-plan.md (P1).
//
// So this track does NOT re-derive duality from scratch in a way that could contradict SVR's
// pages; it owns the classification-specific material — functional vs geometric margin, the
// margin-generalisation argument, hinge loss, multi-class — and cross-links for the shared
// machinery.
//
// Every number is reproduced by scripts/svm_cases.py. Pages with an href are built.
export const SVM_TRACK: TrackChapter[] = [
  {
    title: "The margin idea",
    tier: 2,
    pages: [
      { title: "A boundary with room to spare", href: "/learn/support-vector-machines" },
      { title: "Functional & geometric margin",
        href: "/learn/support-vector-machines/functional-and-geometric-margin" },
      { title: "The maximum-margin hyperplane",
        href: "/learn/support-vector-machines/the-maximum-margin-hyperplane" },
      { title: "Does a wider margin actually help?",
        href: "/learn/support-vector-machines/does-a-wider-margin-help" },
    ],
  },
  {
    title: "When the data overlaps",
    tier: 2,
    pages: [
      { title: "Soft margin: slack & C",
        href: "/learn/support-vector-machines/soft-margin-slack-and-c" },
      { title: "The hinge loss",
        href: "/learn/support-vector-machines/the-hinge-loss" },
      { title: "Hinge vs log loss, and where sparsity comes from",
        href: "/learn/support-vector-machines/hinge-vs-log-loss-and-sparsity" },
    ],
  },
  {
    title: "The mechanics",
    tier: 3,
    pages: [
      { title: "The primal problem",
        href: "/learn/support-vector-machines/the-primal-problem" },
      { title: "Lagrangian duality & the KKT conditions",
        href: "/learn/support-vector-machines/lagrangian-duality-and-kkt" },
      { title: "The dual problem",
        href: "/learn/support-vector-machines/the-dual-problem" },
      { title: "Support vectors, exactly",
        href: "/learn/support-vector-machines/support-vectors-exactly" },
      { title: "The kernel trick",
        href: "/learn/support-vector-machines/the-kernel-trick" },
      { title: "Kernels you'll actually use",
        href: "/learn/support-vector-machines/kernels-you-will-actually-use" },
      { title: "Solving it: SMO",
        href: "/learn/support-vector-machines/solving-it-smo" },
    ],
  },
  {
    title: "In practice",
    tier: 2,
    pages: [
      { title: "Scaling, and why an SVM can't skip it",
        href: "/learn/support-vector-machines/scaling-and-why-an-svm-cannot-skip-it" },
      { title: "Choosing C and gamma",
        href: "/learn/support-vector-machines/choosing-c-and-gamma" },
      { title: "Multi-class: one-vs-one & one-vs-rest",
        href: "/learn/support-vector-machines/multi-class-one-vs-one-and-one-vs-rest" },
      { title: "Probabilities from an SVM",
        href: "/learn/support-vector-machines/probabilities-from-an-svm" },
      { title: "SVM vs logistic regression vs forest",
        href: "/learn/support-vector-machines/svm-vs-logistic-regression-vs-forest" },
    ],
  },
  {
    title: "In the wild",
    tier: 2,
    pages: [{ title: "When to use an SVM", href: "/learn/support-vector-machines/when-to-use-an-svm" }],
  },
];

export const SVM_TOTAL = SVM_TRACK.reduce((n, c) => n + c.pages.length, 0);
export const SVM_DONE = SVM_TRACK.reduce((n, c) => n + c.pages.filter((p) => p.href).length, 0);
