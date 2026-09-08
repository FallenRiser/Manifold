import type { TrackChapter } from "./linearRegressionTrack";

// Learning (model-free prediction & control) — the THIRD track of the
// Reinforcement learning family. Accent = riso gold --c-rl (shared with the MDP
// and Planning tracks).
//
// The spine: DROP THE MODEL. You can no longer SUM the Bellman backup over a known
// P and R — you must SAMPLE it from experience. Everything in model-free RL divides
// along two axes: how you estimate a value from samples (average whole returns =
// Monte Carlo, or bootstrap off your own estimate one step at a time = temporal
// difference), and whether you evaluate the policy you FOLLOW (on-policy: SARSA) or
// the policy you'd LIKE to follow (off-policy: Q-learning). Control is still
// generalized policy iteration — now driven by samples, and exploration is back.
//
// Deliberate boundaries (respect these when building the rest of the family):
//   • This track drops the KNOWN MODEL (the Planning-track assumption) but keeps
//     the TABLE: one value per state/action, stored exactly. The moment the table
//     is too big to hold is the moment the Function-approximation track begins —
//     we name that door (n-step, traces, the deadly triad) but do not walk through.
//   • Actor-critic and policy gradients belong to a later track: they need a
//     learned critic (this track) AND a parameterised actor (function approx). We
//     seed the "value estimate as a critic" idea and stop.
export const LEARNING_TRACK: TrackChapter[] = [
  {
    title: "Learning without a model",
    tier: 1,
    pages: [
      { title: "Learning from experience", href: "/learn/learning" },
      { title: "The sampled backup", href: "/learn/learning/the-sampled-backup" },
      { title: "Prediction and control, again", href: "/learn/learning/prediction-and-control-again" },
      { title: "Exploration returns", href: "/learn/learning/exploration-returns" },
    ],
  },
  {
    title: "Monte Carlo methods",
    tier: 1,
    pages: [
      { title: "Monte Carlo prediction", href: "/learn/learning/monte-carlo-prediction" },
      { title: "First-visit vs every-visit", href: "/learn/learning/first-visit-vs-every-visit" },
      { title: "Monte Carlo control", href: "/learn/learning/monte-carlo-control" },
      { title: "The trouble with Monte Carlo", href: "/learn/learning/the-trouble-with-monte-carlo" },
    ],
  },
  {
    title: "Temporal-difference learning",
    tier: 1,
    pages: [
      { title: "Learning from one step", href: "/learn/learning/temporal-difference-learning" },
      { title: "TD vs Monte Carlo", href: "/learn/learning/td-vs-monte-carlo" },
      { title: "What TD converges to", href: "/learn/learning/what-td-converges-to" },
      { title: "Batch TD vs MC", href: "/learn/learning/batch-td-vs-mc" },
    ],
  },
  {
    title: "Model-free control",
    tier: 2,
    pages: [
      { title: "SARSA: on-policy control", href: "/learn/learning/sarsa" },
      { title: "Q-learning: off-policy control", href: "/learn/learning/q-learning" },
      { title: "SARSA vs Q-learning: the cliff", href: "/learn/learning/sarsa-vs-q-learning" },
      { title: "Expected SARSA", href: "/learn/learning/expected-sarsa" },
    ],
  },
  {
    title: "On-policy, off-policy & bias",
    tier: 2,
    pages: [
      { title: "On-policy vs off-policy", href: "/learn/learning/on-policy-vs-off-policy" },
      { title: "Importance sampling", href: "/learn/learning/importance-sampling" },
      { title: "Maximization bias", href: "/learn/learning/maximization-bias" },
      { title: "Double Q-learning", href: "/learn/learning/double-q-learning" },
    ],
  },
  {
    title: "Unifying & bridging",
    tier: 2,
    pages: [
      { title: "n-step returns", href: "/learn/learning/n-step-returns" },
      { title: "Eligibility traces", href: "/learn/learning/eligibility-traces" },
      { title: "What learning still assumes", href: "/learn/learning/what-learning-still-assumes" },
      { title: "The throughline", href: "/learn/learning/the-throughline" },
    ],
  },
];

export const LEARNING_TOTAL = LEARNING_TRACK.reduce((n, c) => n + c.pages.length, 0);
export const LEARNING_DONE = LEARNING_TRACK.reduce(
  (n, c) => n + c.pages.filter((p) => p.href).length,
  0,
);
