import type { TrackChapter } from "./linearRegressionTrack";

// Markov Decision Processes — the FIRST track of the Reinforcement learning family.
// Accent = riso gold --c-rl (curriculum-map §2, globals.css).
//
// The spine: AN MDP TURNS "LEARNING FROM REWARD" INTO A PRECISE OBJECT YOU CAN
// SOLVE — AND THE VALUE FUNCTION IS THE BRIDGE FROM REWARDS TO DECISIONS.
// A learner arrives thinking RL is "trial and error with a robot". They leave
// able to write down an MDP, define what a policy is worth, and read the optimal
// behaviour straight off a value function — all on a gridworld they can run.
//
// Deliberate boundaries (so the family stays a spine, not a heap):
//   • This track owns the PROBLEM (MDPs) and EVALUATION (what a fixed policy is
//     worth, computed exactly and iteratively). Planning (value iteration, policy
//     iteration) is the NEXT track — we seed policy improvement here but stop at
//     the door. Model-free learning (TD, Q-learning, SARSA) assumes P and R are
//     unknown; we make that assumption explicit here and hand it off.
//   • We assume the dynamics P and reward R are KNOWN throughout. The moment they
//     are not is the moment the Learning track begins.
export const MDP_TRACK: TrackChapter[] = [
  {
    title: "The reinforcement learning problem",
    tier: 1,
    pages: [
      { title: "Learning by acting", href: "/learn/markov-decision-processes" },
      { title: "Reward is the only signal", href: "/learn/markov-decision-processes/reward-is-the-signal" },
      { title: "The agent–environment loop", href: "/learn/markov-decision-processes/the-agent-environment-loop" },
      { title: "Exploration vs exploitation", href: "/learn/markov-decision-processes/exploration-vs-exploitation" },
    ],
  },
  {
    title: "The Markov Decision Process",
    tier: 1,
    pages: [
      { title: "The Markov property", href: "/learn/markov-decision-processes/the-markov-property" },
      { title: "Anatomy of an MDP", href: "/learn/markov-decision-processes/anatomy-of-an-mdp" },
      { title: "The discount factor", href: "/learn/markov-decision-processes/the-discount-factor" },
      { title: "The return: what we maximise", href: "/learn/markov-decision-processes/the-return" },
    ],
  },
  {
    title: "Policies and value functions",
    tier: 1,
    pages: [
      { title: "A policy is a way of behaving", href: "/learn/markov-decision-processes/policies" },
      { title: "The state-value function", href: "/learn/markov-decision-processes/state-value-function" },
      { title: "The action-value function", href: "/learn/markov-decision-processes/action-value-function" },
      { title: "The Bellman expectation equation", href: "/learn/markov-decision-processes/bellman-expectation" },
      { title: "Solving Bellman exactly", href: "/learn/markov-decision-processes/solving-bellman-exactly" },
    ],
  },
  {
    title: "Optimality",
    tier: 2,
    pages: [
      { title: "What “best” means", href: "/learn/markov-decision-processes/optimal-value-functions" },
      { title: "The Bellman optimality equation", href: "/learn/markov-decision-processes/bellman-optimality" },
      { title: "From values to a policy", href: "/learn/markov-decision-processes/greedy-policies" },
      { title: "Why an optimal policy exists", href: "/learn/markov-decision-processes/why-optimal-exists" },
    ],
  },
  {
    title: "Solving for values",
    tier: 2,
    pages: [
      { title: "Iterative policy evaluation", href: "/learn/markov-decision-processes/iterative-policy-evaluation" },
      { title: "Reading a value landscape", href: "/learn/markov-decision-processes/reading-a-value-landscape" },
      { title: "How fast it converges", href: "/learn/markov-decision-processes/convergence-rate" },
    ],
  },
  {
    title: "Where the model ends",
    tier: 2,
    pages: [
      { title: "When the Markov assumption breaks", href: "/learn/markov-decision-processes/when-markov-breaks" },
      { title: "Too many states to enumerate", href: "/learn/markov-decision-processes/large-state-spaces" },
      { title: "What if we don’t know the rules?", href: "/learn/markov-decision-processes/model-free-preview" },
      { title: "The throughline", href: "/learn/markov-decision-processes/the-throughline" },
    ],
  },
];

export const MDP_TOTAL = MDP_TRACK.reduce((n, c) => n + c.pages.length, 0);
export const MDP_DONE = MDP_TRACK.reduce(
  (n, c) => n + c.pages.filter((p) => p.href).length,
  0,
);
