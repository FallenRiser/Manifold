import type { TrackChapter } from "./linearRegressionTrack";

// Architecture design — the fourth track of the Neural networks family.
// Accent = coral --c-neural (PROJECT.md §10.1).
//
// The spine: ARCHITECTURE IS A SEARCH PROCEDURE WITH PRIORS, NOT A NUMBER.
// Every learner asks "how many layers, how many neurons?" first; this track
// teaches them to treat that question as a measurement rather than a guess,
// and to recognise the symptoms that tell you which knob to turn.
//
// Deliberate boundaries: Perceptron → MLP owns the unit and the forward pass.
// Backpropagation owns how ∇L is computed and the gradient pathologies this
// track refers back to. Activation functions owns the zoo. Initialisation &
// normalisation owns the fixes (BatchNorm, skip connections at the init
// level). Regularisation owns dropout, weight decay and early stopping.
// This track owns the question of HOW MUCH network to use.
export const ARCH_TRACK: TrackChapter[] = [
  {
    title: "The question everyone asks first",
    tier: 1,
    pages: [
      { title: "Architecture is a search, not a guess", href: "/learn/architecture-design" },
      { title: "What you are actually choosing", href: "/learn/architecture-design/what-you-are-choosing" },
      { title: "Parameters, and what they cost", href: "/learn/architecture-design/parameters-and-cost" },
      { title: "The capacity intuition", href: "/learn/architecture-design/the-capacity-intuition" },
    ],
  },
  {
    title: "Width",
    tier: 1,
    pages: [
      { title: "What width buys", href: "/learn/architecture-design/what-width-buys" },
      { title: "Universal approximation, honestly", href: "/learn/architecture-design/universal-approximation" },
      { title: "The width plateau", href: "/learn/architecture-design/the-width-plateau" },
      { title: "When to go wider", href: "/learn/architecture-design/when-to-go-wider" },
    ],
  },
  {
    title: "Depth",
    tier: 1,
    pages: [
      { title: "What depth buys", href: "/learn/architecture-design/what-depth-buys" },
      { title: "Composition and feature hierarchy", href: "/learn/architecture-design/composition-and-hierarchy" },
      { title: "The depth tax", href: "/learn/architecture-design/the-depth-tax" },
      { title: "When depth hurts", href: "/learn/architecture-design/when-depth-hurts" },
    ],
  },
  {
    title: "Spending a parameter budget",
    tier: 2,
    pages: [
      { title: "Wide-shallow vs deep-narrow", href: "/learn/architecture-design/wide-vs-deep" },
      { title: "The depth × width grid", href: "/learn/architecture-design/the-grid" },
      { title: "Funnel, constant, or inverted?", href: "/learn/architecture-design/width-schedules" },
      { title: "Memory and compute budgets", href: "/learn/architecture-design/memory-and-compute" },
    ],
  },
  {
    title: "Fixing depth: skip connections",
    tier: 2,
    pages: [
      { title: "The gradient problem, revisited", href: "/learn/architecture-design/the-gradient-problem" },
      { title: "Skip connections", href: "/learn/architecture-design/skip-connections" },
      { title: "Why F(x) + x changes everything", href: "/learn/architecture-design/why-skip-works" },
      { title: "Residual blocks in practice", href: "/learn/architecture-design/residual-blocks" },
    ],
  },
  {
    title: "The diagnostic loop",
    tier: 2,
    pages: [
      { title: "Reading the learning curve", href: "/learn/architecture-design/reading-the-curve" },
      { title: "Underfit, fit, overfit", href: "/learn/architecture-design/underfit-fit-overfit" },
      { title: "The order of operations", href: "/learn/architecture-design/the-order-of-operations" },
      { title: "Sensible starting points", href: "/learn/architecture-design/sensible-defaults" },
    ],
  },
  {
    title: "Putting it together",
    tier: 2,
    pages: [
      { title: "The architecture playbook", href: "/learn/architecture-design/the-playbook" },
      { title: "When the architecture is not the problem", href: "/learn/architecture-design/when-its-not-architecture" },
      { title: "The architecture checklist", href: "/learn/architecture-design/the-checklist" },
    ],
  },
];

export const ARCH_TOTAL = ARCH_TRACK.reduce((n, c) => n + c.pages.length, 0);
export const ARCH_DONE = ARCH_TRACK.reduce(
  (n, c) => n + c.pages.filter((p) => p.href).length,
  0,
);
