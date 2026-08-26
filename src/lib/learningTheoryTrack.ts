import type { TrackChapter } from "@/lib/linearRegressionTrack";

// Learning theory — the Tier-3 foundation that answers "why does any of this
// work?". Built directly on the concentration strand of the Math Foundations
// track (Hoeffding → union bound → uniform convergence), which was written as
// the machinery for exactly these pages. Accent = gray --c-metrics (the
// theory/pillar colour, PROJECT.md §10.1).
//
// Doctrine for this track: theory is opt-in and never a gate (§1). Each page's
// main flow carries the precise statement, the intuition, and the single
// load-bearing step; the FULL derivation lives in a <Proof> "Go deeper" aside.
// Pages with an href are built.
export const LT_TRACK: TrackChapter[] = [
  {
    title: "Generalization: the central question",
    tier: 3,
    pages: [
      { title: "Why does learning work at all?", href: "/learn/learning-theory" },
      { title: "Risk, empirical risk & the gap", href: "/learn/learning-theory/risk-and-empirical-risk" },
      { title: "No free lunch", href: "/learn/learning-theory/no-free-lunch" },
      { title: "The union bound argument", href: "/learn/learning-theory/the-union-bound-argument" },
      { title: "Finite hypothesis classes", href: "/learn/learning-theory/finite-hypothesis-classes" },
    ],
  },
  {
    title: "The PAC framework",
    tier: 3,
    pages: [
      { title: "Probably approximately correct", href: "/learn/learning-theory/pac-learnability" },
      { title: "Sample complexity", href: "/learn/learning-theory/sample-complexity" },
      { title: "Agnostic PAC & the Bayes floor", href: "/learn/learning-theory/agnostic-pac" },
      { title: "Empirical risk minimization", href: "/learn/learning-theory/empirical-risk-minimization" },
    ],
  },
  {
    title: "Measuring capacity",
    tier: 3,
    pages: [
      { title: "When counting hypotheses fails", href: "/learn/learning-theory/when-counting-fails" },
      { title: "Shattering & VC dimension", href: "/learn/learning-theory/vc-dimension" },
      { title: "The growth function & Sauer's lemma", href: "/learn/learning-theory/growth-function" },
      { title: "The VC generalization bound", href: "/learn/learning-theory/the-vc-bound" },
      { title: "Rademacher complexity", href: "/learn/learning-theory/rademacher-complexity" },
    ],
  },
  {
    title: "Margins: capacity you can control",
    tier: 3,
    pages: [
      { title: "The margin, and why it buys confidence", href: "/learn/learning-theory/margins" },
      { title: "Margin-based bounds", href: "/learn/learning-theory/margin-bounds" },
      { title: "Why boosting doesn't overfit (usually)", href: "/learn/learning-theory/boosting-and-margins" },
    ],
  },
  {
    title: "Stability & where the theory ends",
    tier: 3,
    pages: [
      { title: "Algorithmic stability", href: "/learn/learning-theory/algorithmic-stability" },
      { title: "Stability implies generalization", href: "/learn/learning-theory/stability-implies-generalization" },
      { title: "When the bounds break", href: "/learn/learning-theory/when-the-bounds-break" },
    ],
  },
];

export const LT_TOTAL = LT_TRACK.reduce((n, c) => n + c.pages.length, 0);
export const LT_DONE = LT_TRACK.reduce(
  (n, c) => n + c.pages.filter((p) => p.href).length,
  0,
);
