import type { TrackChapter } from "./linearRegressionTrack";

// Regularisation — the sixth and final track of the Neural networks family.
// Accent = coral --c-neural (PROJECT.md §10.1).
//
// The spine: REGULARISATION IS THE TOOL THAT CLOSES THE GAP BETWEEN TRAINING
// AND TEST PERFORMANCE, ONCE YOU HAVE VERIFIED THAT THE GAP IS THE PROBLEM.
// The architecture track's diagnostic loop tells you WHEN to regularise
// (train-test gap is large, model can overfit). This track tells you HOW.
//
// Deliberate boundaries: Architecture design owns how much network to use and
// the diagnostic loop. Init & norm owns BatchNorm (which also regularises,
// and this track says so). The regression tracks own L1/L2 on linear models.
// This track owns the neural-network-specific tools: dropout, weight decay
// as applied to deep nets, early stopping, data augmentation, and the
// interaction between them.
export const REG_NN_TRACK: TrackChapter[] = [
  {
    title: "The gap",
    tier: 1,
    pages: [
      { title: "What regularisation is for", href: "/learn/nn-regularisation" },
      { title: "The train-test gap, revisited", href: "/learn/nn-regularisation/the-gap-revisited" },
      { title: "Capacity, complexity, and generalisation", href: "/learn/nn-regularisation/capacity-and-generalisation" },
      { title: "When to regularise and when not to", href: "/learn/nn-regularisation/when-to-regularise" },
    ],
  },
  {
    title: "Weight decay",
    tier: 1,
    pages: [
      { title: "L2 penalty on weights", href: "/learn/nn-regularisation/l2-penalty" },
      { title: "Weight decay is not L2 regularisation", href: "/learn/nn-regularisation/weight-decay-vs-l2" },
      { title: "How much decay", href: "/learn/nn-regularisation/how-much-decay" },
      { title: "The effect on the loss landscape", href: "/learn/nn-regularisation/landscape-effect" },
    ],
  },
  {
    title: "Dropout",
    tier: 2,
    pages: [
      { title: "Randomly removing units", href: "/learn/nn-regularisation/randomly-removing-units" },
      { title: "Why dropout works", href: "/learn/nn-regularisation/why-dropout-works" },
      { title: "Dropout rate and where to apply it", href: "/learn/nn-regularisation/dropout-rate" },
      { title: "Dropout at test time", href: "/learn/nn-regularisation/dropout-at-test" },
      { title: "The ensemble interpretation", href: "/learn/nn-regularisation/ensemble-interpretation" },
    ],
  },
  {
    title: "Early stopping and data augmentation",
    tier: 2,
    pages: [
      { title: "Early stopping", href: "/learn/nn-regularisation/early-stopping" },
      { title: "Patience and the validation curve", href: "/learn/nn-regularisation/patience" },
      { title: "Data augmentation", href: "/learn/nn-regularisation/data-augmentation" },
      { title: "Label smoothing and mixup", href: "/learn/nn-regularisation/label-smoothing" },
    ],
  },
  {
    title: "Combining regularisers",
    tier: 2,
    pages: [
      { title: "The interaction between techniques", href: "/learn/nn-regularisation/interactions" },
      { title: "BatchNorm as implicit regularisation", href: "/learn/nn-regularisation/batchnorm-as-reg" },
      { title: "The regularisation playbook", href: "/learn/nn-regularisation/the-playbook" },
      { title: "The neural networks family: what you now have", href: "/learn/nn-regularisation/family-summary" },
    ],
  },
];

export const REG_NN_TOTAL = REG_NN_TRACK.reduce((n, c) => n + c.pages.length, 0);
export const REG_NN_DONE = REG_NN_TRACK.reduce(
  (n, c) => n + c.pages.filter((p) => p.href).length,
  0,
);
