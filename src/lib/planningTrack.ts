import type { TrackChapter } from "./linearRegressionTrack";

// Planning — the SECOND track of the Reinforcement learning family.
// Accent = riso gold --c-rl (same family as Markov decision processes).
//
// The spine: WITH THE MODEL IN HAND, OPTIMAL BEHAVIOUR IS COMPUTABLE BY DYNAMIC
// PROGRAMMING. POLICY ITERATION AND VALUE ITERATION ARE TWO FACES OF ONE LOOP —
// EVALUATE, THEN IMPROVE — AND EVERY PRACTICAL PLANNER IS A CHEAPER WAY TO RUN IT.
// The MDP track stopped at evaluation (what a fixed policy is worth). This track
// takes the last step of the classical theory: given P and R, FIND the best policy.
//
// Deliberate boundaries (so the family stays a spine, not a heap):
//   • This track owns CONTROL WITH A KNOWN MODEL — dynamic programming. It assumes
//     P and R are known throughout, exactly as the MDP track did. The moment they
//     are NOT is the Learning track (TD, Q-learning, SARSA), which comes next.
//   • It reuses, and does not re-derive, the Bellman machinery from the MDP track
//     (expectation/optimality equations, the contraction, greedy improvement). Those
//     are prerequisites; here they become algorithms.
export const PLANNING_TRACK: TrackChapter[] = [
  {
    title: "The planning problem",
    tier: 1,
    pages: [
      { title: "Planning with a map", href: "/learn/planning" },
      { title: "Prediction vs control", href: "/learn/planning/prediction-vs-control" },
      { title: "Evaluation and improvement", href: "/learn/planning/evaluation-and-improvement" },
      { title: "A world to plan in", href: "/learn/planning/a-world-to-plan-in" },
    ],
  },
  {
    title: "Policy iteration",
    tier: 2,
    pages: [
      { title: "Policy iteration", href: "/learn/planning/policy-iteration" },
      { title: "Why it reaches the optimum", href: "/learn/planning/why-policy-iteration-works" },
      { title: "Watching policy iteration run", href: "/learn/planning/watching-policy-iteration" },
      { title: "How few iterations it takes", href: "/learn/planning/how-many-iterations" },
    ],
  },
  {
    title: "Value iteration",
    tier: 2,
    pages: [
      { title: "Value iteration", href: "/learn/planning/value-iteration" },
      { title: "Truncated policy iteration", href: "/learn/planning/value-iteration-is-truncated-pi" },
      { title: "Knowing when to stop", href: "/learn/planning/knowing-when-to-stop" },
      { title: "From values to a plan", href: "/learn/planning/from-values-to-a-plan" },
    ],
  },
  {
    title: "One loop, many schedules",
    tier: 3,
    pages: [
      { title: "Generalized policy iteration", href: "/learn/planning/generalized-policy-iteration" },
      { title: "Asynchronous dynamic programming", href: "/learn/planning/asynchronous-dp" },
      { title: "Prioritized sweeping", href: "/learn/planning/prioritized-sweeping" },
      { title: "Modified policy iteration", href: "/learn/planning/modified-policy-iteration" },
    ],
  },
  {
    title: "The limits of planning",
    tier: 2,
    pages: [
      { title: "The cost of a sweep", href: "/learn/planning/the-cost-of-a-sweep" },
      { title: "The curse of dimensionality", href: "/learn/planning/the-curse-of-dimensionality" },
      { title: "Real-time dynamic programming", href: "/learn/planning/real-time-dynamic-programming" },
      { title: "Planning by sampling", href: "/learn/planning/planning-by-sampling" },
    ],
  },
  {
    title: "Where planning ends",
    tier: 1,
    pages: [
      { title: "Planning vs learning", href: "/learn/planning/planning-vs-learning" },
      { title: "The throughline", href: "/learn/planning/the-throughline" },
    ],
  },
];

export const PLANNING_TOTAL = PLANNING_TRACK.reduce((n, c) => n + c.pages.length, 0);
export const PLANNING_DONE = PLANNING_TRACK.reduce(
  (n, c) => n + c.pages.filter((p) => p.href).length,
  0,
);
