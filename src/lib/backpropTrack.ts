import type { TrackChapter } from "./linearRegressionTrack";

// Backpropagation & training — the second track of the Neural networks family.
// Accent = coral --c-neural (PROJECT.md §10.1).
//
// The spine: BACKPROPAGATION IS THE CHAIN RULE, ORGANISED SO THAT NOTHING IS
// COMPUTED TWICE. Everything else follows. The algorithm is not deep — a
// first-year calculus identity — and its importance is entirely about cost:
// the naive alternative needs one forward pass per parameter, which for the
// smallest network on this track is already 1,251x slower.
//
// The track's second half is the payoff nobody promises up front: once you can
// see gradients per layer, the training failures stop being mysterious. A
// vanishing gradient is a product of small numbers. An exploding one is the
// same product with a different base. A dead layer is a measurable thing you
// can count, not a metaphor.
//
// Deliberate boundaries: Perceptron → MLP owns the forward pass and what a
// network is. Activation functions owns the zoo and how to choose. Optimizers
// beyond momentum/Adam belong to the Optimization pillar; this track covers
// only what you need to read a training run. Initialisation & normalisation
// owns the fixes for the gradient pathologies chapter 5 diagnoses.
export const BP_TRACK: TrackChapter[] = [
  {
    title: "The problem",
    tier: 1,
    pages: [
      { title: "Why the gradient is the hard part", href: "/learn/backpropagation" },
      { title: "The cost of a gradient", href: "/learn/backpropagation/the-cost-of-a-gradient" },
      { title: "The chain rule, as influence", href: "/learn/backpropagation/the-chain-rule" },
      { title: "The computational graph", href: "/learn/backpropagation/the-computational-graph" },
    ],
  },
  {
    title: "The algorithm",
    tier: 2,
    pages: [
      { title: "The backward pass", href: "/learn/backpropagation/the-backward-pass" },
      { title: "Backprop by hand", href: "/learn/backpropagation/backprop-by-hand" },
      { title: "The four equations", href: "/learn/backpropagation/the-four-equations" },
      { title: "Why it is cheap", href: "/learn/backpropagation/why-it-is-cheap" },
      { title: "The memory bill", href: "/learn/backpropagation/the-memory-bill" },
    ],
  },
  {
    title: "Doing it for real",
    tier: 2,
    pages: [
      { title: "Writing it from scratch", href: "/learn/backpropagation/writing-it-from-scratch" },
      { title: "Gradient checking", href: "/learn/backpropagation/gradient-checking" },
      { title: "Automatic differentiation", href: "/learn/backpropagation/automatic-differentiation" },
      { title: "The bugs you will actually hit", href: "/learn/backpropagation/backprop-bugs" },
    ],
  },
  {
    title: "Training dynamics",
    tier: 2,
    pages: [
      { title: "The learning rate", href: "/learn/backpropagation/the-learning-rate" },
      { title: "Learning-rate schedules", href: "/learn/backpropagation/learning-rate-schedules" },
      { title: "Batch size & gradient noise", href: "/learn/backpropagation/batch-size-and-noise" },
      { title: "Momentum & adaptive methods", href: "/learn/backpropagation/momentum-and-adaptive-methods" },
      { title: "Saddles, plateaus & why noise helps", href: "/learn/backpropagation/saddles-and-plateaus" },
    ],
  },
  {
    title: "When gradients misbehave",
    tier: 2,
    pages: [
      { title: "Vanishing gradients", href: "/learn/backpropagation/vanishing-gradients" },
      { title: "Exploding gradients & clipping", href: "/learn/backpropagation/exploding-gradients" },
      { title: "Why depth was hard for twenty years", href: "/learn/backpropagation/why-depth-was-hard" },
      { title: "The backprop playbook", href: "/learn/backpropagation/the-backprop-playbook" },
    ],
  },
];

export const BP_TOTAL = BP_TRACK.reduce((n, c) => n + c.pages.length, 0);
export const BP_DONE = BP_TRACK.reduce(
  (n, c) => n + c.pages.filter((p) => p.href).length,
  0,
);
