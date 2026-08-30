import type { TrackChapter } from "./linearRegressionTrack";

// From the perceptron to the multilayer perceptron — the first track of the
// Neural networks family. Accent = coral --c-neural (PROJECT.md §10.1).
//
// The spine: A NEURON IS A LINEAR MODEL WITH A SWITCH, AND STACKING THEM BUYS
// FEATURES YOU DID NOT DESIGN. Every page either builds that sentence or tests
// it. The track deliberately arrives at the same place twice — once
// geometrically (XOR needs a bend) and once algebraically (without a
// non-linearity the whole stack collapses to one matrix) — because those are
// the same fact and most readers only believe it after seeing both.
//
// Deliberate boundaries: this track owns the UNIT, the STACK and the FORWARD
// pass. Backpropagation owns how the gradient is actually computed; Activation
// functions owns the zoo and how to choose between them; Architecture design
// owns how wide and how deep. Here a network is trained the way the reader
// already knows how to train things — a loss and gradient descent — and the
// machinery is named, not opened.
export const PM_TRACK: TrackChapter[] = [
  {
    title: "The unit",
    tier: 1,
    pages: [
      { title: "A neuron is a linear model with a switch", href: "/learn/perceptron-to-mlp" },
      { title: "The perceptron", href: "/learn/perceptron-to-mlp/the-perceptron" },
      { title: "The perceptron learning rule", href: "/learn/perceptron-to-mlp/the-learning-rule" },
      { title: "What the guarantee does not cover", href: "/learn/perceptron-to-mlp/what-the-guarantee-misses" },
    ],
  },
  {
    title: "One neuron is not enough",
    tier: 1,
    pages: [
      { title: "The XOR problem", href: "/learn/perceptron-to-mlp/the-xor-problem" },
      { title: "Two layers, and the bend", href: "/learn/perceptron-to-mlp/two-layers-and-the-bend" },
      { title: "Hidden units are learned features", href: "/learn/perceptron-to-mlp/hidden-units-are-features" },
      { title: "Why non-linearity is non-negotiable", href: "/learn/perceptron-to-mlp/why-non-linearity" },
    ],
  },
  {
    title: "The forward pass",
    tier: 1,
    pages: [
      { title: "A layer is a matrix multiply", href: "/learn/perceptron-to-mlp/a-layer-is-a-matrix-multiply" },
      { title: "Shapes, and how to keep them straight", href: "/learn/perceptron-to-mlp/shapes" },
      { title: "The output layer is chosen by the task", href: "/learn/perceptron-to-mlp/the-output-layer" },
      { title: "A forward pass by hand", href: "/learn/perceptron-to-mlp/a-forward-pass-by-hand" },
    ],
  },
  {
    title: "Making it learn",
    tier: 2,
    pages: [
      { title: "From the rule to a loss", href: "/learn/perceptron-to-mlp/from-the-rule-to-a-loss" },
      { title: "The training loop", href: "/learn/perceptron-to-mlp/the-training-loop" },
      { title: "Capacity you can see", href: "/learn/perceptron-to-mlp/capacity-you-can-see" },
      { title: "What can go wrong", href: "/learn/perceptron-to-mlp/what-can-go-wrong" },
    ],
  },
  {
    title: "What networks are and are not",
    tier: 2,
    pages: [
      { title: "Universal approximation", href: "/learn/perceptron-to-mlp/universal-approximation" },
      { title: "Where an MLP wins", href: "/learn/perceptron-to-mlp/where-an-mlp-wins" },
      { title: "Where an MLP loses", href: "/learn/perceptron-to-mlp/where-an-mlp-loses" },
      { title: "When to reach for a network", href: "/learn/perceptron-to-mlp/when-to-reach-for-a-network" },
    ],
  },
];

export const PM_TOTAL = PM_TRACK.reduce((n, c) => n + c.pages.length, 0);
export const PM_DONE = PM_TRACK.reduce(
  (n, c) => n + c.pages.filter((p) => p.href).length,
  0,
);
