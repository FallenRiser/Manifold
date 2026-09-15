import type { TrackChapter } from "./linearRegressionTrack";

// Function approximation — the FOURTH track of the Reinforcement learning family.
// Accent = riso gold --c-rl (shared with MDPs, Planning and Learning).
//
// The spine: DROP THE TABLE. The Learning track dropped the model but kept one
// number per state. Here even that is impossible — the state space is too big to
// enumerate, or continuous, so there are no cells to fill. Values become a
// PARAMETERISED FUNCTION v(s,w) whose parameters are shared across states, which
// buys generalisation (experience in one state moves nearby estimates) and costs
// you the guarantees (the same update that provably converged with a table can
// now diverge — and we build the counterexample that does it).
//
// This is also the site's value-based DEEP RL track: DQN is not a separate
// subject, it is this track's final chapter once v(s,w) is a neural network.
//
// Deliberate boundaries (respect these when building the rest of the family):
//   • Values only. The policy is still derived by argmax over actions, which is
//     exactly what breaks for CONTINUOUS actions — that door opens the
//     policy-gradient track, and the last chapter names it without walking through.
//   • Learned MODELS and planning (Dyna, MCTS) belong to the model-based track.
//   • Every number comes from scripts/fa_cases.py, run against FA_SETUP.
export const FA_TRACK: TrackChapter[] = [
  {
    title: "Why the table has to go",
    tier: 1,
    pages: [
      { title: "When you can't store a value per state", href: "/learn/function-approximation" },
      { title: "Generalisation, not storage", href: "/learn/function-approximation/generalisation-not-storage" },
      { title: "What 'best fit' means now", href: "/learn/function-approximation/what-best-fit-means" },
      { title: "Gradient descent on values", href: "/learn/function-approximation/gradient-descent-on-values" },
    ],
  },
  {
    title: "Linear methods & features",
    tier: 1,
    pages: [
      { title: "Linear function approximation", href: "/learn/function-approximation/linear-function-approximation" },
      { title: "The resolution dial", href: "/learn/function-approximation/state-aggregation" },
      { title: "Coarse coding & tile coding", href: "/learn/function-approximation/tile-coding" },
      { title: "Semi-gradient TD(0)", href: "/learn/function-approximation/semi-gradient-td" },
    ],
  },
  {
    title: "Control with approximation",
    tier: 2,
    pages: [
      { title: "Semi-gradient SARSA", href: "/learn/function-approximation/semi-gradient-sarsa" },
      { title: "Mountain Car: what it actually learned", href: "/learn/function-approximation/mountain-car" },
      { title: "The width dial: how far should experience spread?", href: "/learn/function-approximation/the-width-dial" },
      { title: "What generalisation costs you", href: "/learn/function-approximation/what-generalisation-costs" },
    ],
  },
  {
    title: "The deadly triad",
    tier: 3,
    pages: [
      { title: "When TD diverges", href: "/learn/function-approximation/when-td-diverges" },
      { title: "Baird's counterexample", href: "/learn/function-approximation/bairds-counterexample" },
      { title: "The three ingredients", href: "/learn/function-approximation/the-three-ingredients" },
      { title: "What's safe, and what you do about it", href: "/learn/function-approximation/whats-safe" },
    ],
  },
  {
    title: "Deep Q-Networks",
    tier: 2,
    pages: [
      { title: "From linear to a neural network", href: "/learn/function-approximation/from-linear-to-a-network" },
      { title: "Experience replay", href: "/learn/function-approximation/experience-replay" },
      { title: "Target networks", href: "/learn/function-approximation/target-networks" },
      { title: "DQN, assembled", href: "/learn/function-approximation/dqn-assembled" },
      { title: "Double DQN", href: "/learn/function-approximation/double-dqn" },
    ],
  },
  {
    title: "Practice & limits",
    tier: 2,
    pages: [
      { title: "Reading a learning curve that lies", href: "/learn/function-approximation/reading-a-learning-curve" },
      { title: "What approximation still can't do", href: "/learn/function-approximation/what-approximation-cant-do" },
      { title: "The throughline", href: "/learn/function-approximation/the-throughline" },
    ],
  },
];

export const FA_TOTAL = FA_TRACK.reduce((n, c) => n + c.pages.length, 0);
export const FA_DONE = FA_TRACK.reduce((n, c) => n + c.pages.filter((p) => p.href).length, 0);
