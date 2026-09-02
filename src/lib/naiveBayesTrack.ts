import type { TrackChapter } from "./linearRegressionTrack";

// Naive Bayes — the generative front of the Classification family. Accent
// var(--c-classification). The logistic-regression track names naive Bayes as
// its "generative twin"; this track owns the full treatment.
//
// The spine: NAIVE BAYES IS A GENERATIVE CLASSIFIER WHOSE ABSURD INDEPENDENCE
// ASSUMPTION BREAKS ITS PROBABILITIES BUT USUALLY NOT ITS DECISIONS. Zero-one
// loss only needs the argmax, so the model can be badly wrong about P(y|x) and
// still classify well — measured in scripts/naive_bayes_cases.py.
//
// Deliberate boundaries: Logistic regression owns the discriminative twin (and
// this track measures the crossover against it). Evaluation owns calibration in
// general; this track shows the specific way NB miscalibrates. k-NN and SVM own
// their own geometry.
export const NB_TRACK: TrackChapter[] = [
  {
    title: "The generative idea",
    tier: 1,
    pages: [
      { title: "What Naive Bayes is", href: "/learn/naive-bayes" },
      { title: "Bayes' rule as a classifier", href: "/learn/naive-bayes/bayes-rule-as-a-classifier" },
      { title: "Prior, likelihood, posterior", href: "/learn/naive-bayes/prior-likelihood-posterior" },
      { title: "Generative vs discriminative", href: "/learn/naive-bayes/generative-vs-discriminative" },
    ],
  },
  {
    title: "The naive assumption",
    tier: 1,
    pages: [
      { title: "The conditional independence assumption", href: "/learn/naive-bayes/conditional-independence" },
      { title: "Why it is called naive", href: "/learn/naive-bayes/why-naive" },
      { title: "Probabilities break, decisions survive", href: "/learn/naive-bayes/probabilities-break-decisions-survive" },
      { title: "The decision boundary", href: "/learn/naive-bayes/the-decision-boundary" },
    ],
  },
  {
    title: "The three flavours",
    tier: 2,
    pages: [
      { title: "Gaussian Naive Bayes", href: "/learn/naive-bayes/gaussian-nb" },
      { title: "Multinomial Naive Bayes", href: "/learn/naive-bayes/multinomial-nb" },
      { title: "Bernoulli Naive Bayes", href: "/learn/naive-bayes/bernoulli-nb" },
      { title: "Choosing the flavour", href: "/learn/naive-bayes/choosing-the-flavour" },
    ],
  },
  {
    title: "Making it work",
    tier: 2,
    pages: [
      { title: "Laplace smoothing & the zero-frequency problem", href: "/learn/naive-bayes/laplace-smoothing" },
      { title: "Working in log-space", href: "/learn/naive-bayes/log-space" },
      { title: "Naive Bayes for text", href: "/learn/naive-bayes/naive-bayes-for-text" },
      { title: "Calibration: probabilities you cannot trust", href: "/learn/naive-bayes/calibration" },
    ],
  },
  {
    title: "Where it stands",
    tier: 2,
    pages: [
      { title: "Naive Bayes vs logistic regression", href: "/learn/naive-bayes/vs-logistic-regression" },
      { title: "The hidden linear classifier", href: "/learn/naive-bayes/hidden-linear-classifier" },
      { title: "When to reach for Naive Bayes", href: "/learn/naive-bayes/when-to-use-it" },
      { title: "The Naive Bayes playbook", href: "/learn/naive-bayes/the-playbook" },
    ],
  },
];

export const NB_TOTAL = NB_TRACK.reduce((n, c) => n + c.pages.length, 0);
export const NB_DONE = NB_TRACK.reduce(
  (n, c) => n + c.pages.filter((p) => p.href).length,
  0,
);
