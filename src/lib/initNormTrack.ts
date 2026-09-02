import type { TrackChapter } from "./linearRegressionTrack";

// Initialisation & normalisation — the fifth track of the Neural networks
// family. Accent = coral --c-neural (PROJECT.md §10.1).
//
// The spine: THE STARTING POINT DETERMINES WHETHER THE NETWORK CAN LEARN, AND
// NORMALISATION IS THE TECHNIQUE THAT MAKES THAT STARTING POINT LESS FRAGILE.
// All three previous tracks defer to this one by name: backprop measured
// 2.9e7 gradient ratios, the activation track measured 0% vs 30% saturation
// at init, and the architecture track showed depth 20 failing despite okay
// gradient ratios. This track pays those debts.
//
// Deliberate boundaries: Backpropagation owns the chain-rule product.
// Activation functions owns the zoo. Architecture design owns how much
// network. This track owns the OTHER factor of the gradient product — the
// one you set by initialising, and the one you stabilise by normalising.
// Regularisation owns dropout, weight decay and early stopping.
export const INIT_TRACK: TrackChapter[] = [
  {
    title: "The starting point matters",
    tier: 1,
    pages: [
      { title: "The starting point determines everything", href: "/learn/initialisation-and-normalisation" },
      { title: "What bad init looks like", href: "/learn/initialisation-and-normalisation/what-bad-init-looks-like" },
      { title: "The variance argument", href: "/learn/initialisation-and-normalisation/the-variance-argument" },
      { title: "Breaking symmetry", href: "/learn/initialisation-and-normalisation/breaking-symmetry" },
    ],
  },
  {
    title: "The named initialisations",
    tier: 1,
    pages: [
      { title: "Xavier / Glorot", href: "/learn/initialisation-and-normalisation/xavier" },
      { title: "He / Kaiming", href: "/learn/initialisation-and-normalisation/he" },
      { title: "Xavier vs He, measured", href: "/learn/initialisation-and-normalisation/xavier-vs-he" },
      { title: "Other schemes", href: "/learn/initialisation-and-normalisation/other-schemes" },
    ],
  },
  {
    title: "Batch normalisation",
    tier: 2,
    pages: [
      { title: "The internal covariate shift story", href: "/learn/initialisation-and-normalisation/covariate-shift" },
      { title: "What BatchNorm actually does", href: "/learn/initialisation-and-normalisation/what-batchnorm-does" },
      { title: "The learned affine parameters", href: "/learn/initialisation-and-normalisation/learned-affine" },
      { title: "BatchNorm at test time", href: "/learn/initialisation-and-normalisation/batchnorm-at-test" },
      { title: "When BatchNorm helps, and when it does not", href: "/learn/initialisation-and-normalisation/when-batchnorm-helps" },
    ],
  },
  {
    title: "Beyond batch normalisation",
    tier: 2,
    pages: [
      { title: "Layer normalisation", href: "/learn/initialisation-and-normalisation/layer-norm" },
      { title: "Group and instance normalisation", href: "/learn/initialisation-and-normalisation/group-and-instance" },
      { title: "RMSNorm", href: "/learn/initialisation-and-normalisation/rmsnorm" },
      { title: "Which normalisation when", href: "/learn/initialisation-and-normalisation/which-norm-when" },
    ],
  },
  {
    title: "The interaction",
    tier: 2,
    pages: [
      { title: "Init × activation × normalisation", href: "/learn/initialisation-and-normalisation/the-interaction" },
      { title: "Why normalisation reduces init sensitivity", href: "/learn/initialisation-and-normalisation/why-norm-reduces-sensitivity" },
      { title: "The modern default and when to deviate", href: "/learn/initialisation-and-normalisation/modern-defaults" },
      { title: "The init & norm playbook", href: "/learn/initialisation-and-normalisation/the-playbook" },
    ],
  },
];

export const INIT_TOTAL = INIT_TRACK.reduce((n, c) => n + c.pages.length, 0);
export const INIT_DONE = INIT_TRACK.reduce(
  (n, c) => n + c.pages.filter((p) => p.href).length,
  0,
);
