import type { TrackChapter } from "@/lib/linearRegressionTrack";

// Math Foundations — the Tier-0 track underneath everything else. The five
// strands from the curriculum map (linear algebra, calculus & optimization,
// probability, concentration, information theory), each built up from scratch
// with intuition + a visual + an interactive, so any prerequisite a later track
// leans on can be linked here inline. Accent = warm amber --c-fundamentals
// (this IS the fundamentals strand). Pages with an href are built.
export const MF_TRACK: TrackChapter[] = [
  {
    title: "Linear algebra",
    pages: [
      { title: "Why the math, and how to read this", href: "/learn/math-foundations" },
      { title: "Vectors & vector spaces", href: "/learn/math-foundations/vectors" },
      { title: "Norms & distance", href: "/learn/math-foundations/norms" },
      { title: "The dot product & projection", href: "/learn/math-foundations/dot-product" },
      { title: "Matrices as transformations", href: "/learn/math-foundations/matrices" },
      { title: "Matrix multiplication & composition", href: "/learn/math-foundations/matrix-multiplication" },
      { title: "Rank, inverses & linear systems", href: "/learn/math-foundations/rank-and-systems" },
      { title: "Eigenvectors & eigenvalues", href: "/learn/math-foundations/eigenvectors" },
      { title: "The singular value decomposition", href: "/learn/math-foundations/svd" },
      { title: "Symmetric positive-definite matrices", href: "/learn/math-foundations/spd-matrices" },
    ],
  },
  {
    title: "Calculus & optimization",
    pages: [
      { title: "Derivatives: the rate of change", href: "/learn/math-foundations/derivatives" },
      { title: "Gradients & partial derivatives", href: "/learn/math-foundations/gradients" },
      { title: "The chain rule", href: "/learn/math-foundations/chain-rule" },
      { title: "Convex sets & convex functions", href: "/learn/math-foundations/convexity" },
      { title: "Gradient descent", href: "/learn/math-foundations/gradient-descent" },
      { title: "Constrained optimization & Lagrange multipliers", href: "/learn/math-foundations/lagrange-multipliers" },
      { title: "Duality, in one page", href: "/learn/math-foundations/duality" },
      { title: "Subgradients & non-smooth objectives", href: "/learn/math-foundations/subgradients" },
    ],
  },
  {
    title: "Probability",
    pages: [
      { title: "Random variables & sample spaces", href: "/learn/math-foundations/random-variables" },
      { title: "Distributions you'll actually meet", href: "/learn/math-foundations/distributions" },
      { title: "Expectation & variance", href: "/learn/math-foundations/expectation-and-variance" },
      { title: "Conditional probability & Bayes' rule", href: "/learn/math-foundations/bayes" },
      { title: "Independence, covariance & correlation", href: "/learn/math-foundations/independence" },
      { title: "The Gaussian, up close", href: "/learn/math-foundations/gaussian" },
      { title: "Moment-generating functions", href: "/learn/math-foundations/mgf" },
      { title: "The law of large numbers & the CLT", href: "/learn/math-foundations/lln-and-clt" },
    ],
  },
  {
    title: "Concentration inequalities",
    tier: 3,
    pages: [
      { title: "Markov & Chebyshev", href: "/learn/math-foundations/markov-chebyshev" },
      { title: "Hoeffding's inequality", href: "/learn/math-foundations/hoeffding" },
      { title: "Chernoff bounds", href: "/learn/math-foundations/chernoff" },
      { title: "Azuma & McDiarmid", href: "/learn/math-foundations/azuma-mcdiarmid" },
    ],
  },
  {
    title: "Information theory",
    pages: [
      { title: "Entropy: measuring surprise", href: "/learn/math-foundations/entropy" },
      { title: "Cross-entropy & KL divergence", href: "/learn/math-foundations/kl-divergence" },
      { title: "Mutual information", href: "/learn/math-foundations/mutual-information" },
      { title: "Bregman divergences", href: "/learn/math-foundations/bregman" },
    ],
  },
];

export const MF_TOTAL = MF_TRACK.reduce((n, c) => n + c.pages.length, 0);
export const MF_DONE = MF_TRACK.reduce(
  (n, c) => n + c.pages.filter((p) => p.href).length,
  0,
);
