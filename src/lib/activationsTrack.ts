import type { TrackChapter } from "./linearRegressionTrack";

// Activation functions — the third track of the Neural networks family.
// Accent = coral --c-neural (PROJECT.md §10.1).
//
// The spine: AN ACTIVATION IS A DERIVATIVE YOU ARE CHOOSING. The curve is what
// gets drawn in every textbook and it is the less interesting half; the slope
// is what backpropagation multiplies, so the slope is what decides whether the
// network learns. Every named function in the zoo is a different answer to
// "where should the slope be allowed to be zero, and how large may it get".
//
// The goal is not a lookup table. It is a reader who can look at a stuck run
// and name which property of their activation caused it — and who could
// justify a new one, because they know what the properties are for.
//
// Deliberate boundaries: Backpropagation owns the chain-rule product and the
// gradient pathologies as pathologies; this track owns the factor of that
// product that you choose. Initialisation & normalisation owns the OTHER
// factor — and the honest finding measured here is that it is at least as
// large. Architecture owns width and depth. Softmax and the output layer are
// treated here only as a choice determined by the loss, not as a zoo entry.
export const ACT_TRACK: TrackChapter[] = [
  {
    title: "What an activation is for",
    tier: 1,
    pages: [
      { title: "The curve is a design decision", href: "/learn/activation-functions" },
      { title: "Non-linear, or nothing", href: "/learn/activation-functions/the-non-negotiable" },
      { title: "The derivative is the point", href: "/learn/activation-functions/the-derivative-is-the-point" },
      { title: "Saturation", href: "/learn/activation-functions/saturation" },
    ],
  },
  {
    title: "The squashing era",
    tier: 1,
    pages: [
      { title: "The step, and why it could not be trained", href: "/learn/activation-functions/the-step" },
      { title: "Sigmoid", href: "/learn/activation-functions/sigmoid" },
      { title: "tanh & zero-centring", href: "/learn/activation-functions/tanh-and-zero-centring" },
      { title: "What depth did to both", href: "/learn/activation-functions/what-depth-did" },
    ],
  },
  {
    title: "The ReLU family",
    tier: 2,
    pages: [
      { title: "ReLU, and what it bought", href: "/learn/activation-functions/relu" },
      { title: "Dying ReLU", href: "/learn/activation-functions/dying-relu" },
      { title: "The leaky answers", href: "/learn/activation-functions/the-leaky-answers" },
      { title: "SELU & self-normalising nets", href: "/learn/activation-functions/selu" },
    ],
  },
  {
    title: "The smooth moderns",
    tier: 2,
    pages: [
      { title: "GELU & Swish", href: "/learn/activation-functions/gelu-and-swish" },
      { title: "What smoothness actually buys", href: "/learn/activation-functions/what-smoothness-buys" },
      { title: "The rest of the zoo", href: "/learn/activation-functions/the-rest-of-the-zoo" },
      { title: "The bakeoff", href: "/learn/activation-functions/the-bakeoff" },
    ],
  },
  {
    title: "Choosing & designing",
    tier: 2,
    pages: [
      { title: "The property space", href: "/learn/activation-functions/the-property-space" },
      { title: "The output layer is a different question", href: "/learn/activation-functions/the-output-layer" },
      { title: "Designing a new one", href: "/learn/activation-functions/designing-a-new-one" },
      { title: "The activation playbook", href: "/learn/activation-functions/the-activation-playbook" },
    ],
  },
];

export const ACT_TOTAL = ACT_TRACK.reduce((n, c) => n + c.pages.length, 0);
export const ACT_DONE = ACT_TRACK.reduce(
  (n, c) => n + c.pages.filter((p) => p.href).length,
  0,
);
