import type { TrackChapter } from "@/lib/linearRegressionTrack";

// Third flagship capstone — and the first CONTROL one: a warehouse delivery robot
// solved end-to-end with tabular reinforcement learning. Caps the three built RL
// tracks (MDPs · Planning · Learning) the way the housing/NEO capstones cap the
// supervised families. See docs/rl-capstone-plan.md.
//
// Taught for TRANSFER, per the NEO pedagogical contract: every page opens with the
// reusable question an RL engineer asks, teaches the general move, applies it to the
// warehouse, then hands the reader a transfer prompt + one Playbook rule.
//
// The spine (two hard truths the reader discovers personally):
//   T1  The hardest part of an RL problem is not the algorithm — it is DEFINING THE
//       STATE. A position-only agent is provably unable to solve this task; adding one
//       bit ("am I carrying?") makes it solvable.
//   T2  Off-policy Q-learning learns the risky-optimal route; on-policy SARSA learns
//       the safe one. Which is "right" is a decision about the cost of exploring.
//
// Every published number comes from scripts/rl_capstone_cases.py.
export const RL_CAP_TRACK: TrackChapter[] = [
  {
    title: "Frame it as an MDP",
    pages: [
      { title: "Overview & the goal", href: "/learn/warehouse-robot-capstone" },
      { title: "From a task to an MDP", href: "/learn/warehouse-robot-capstone/from-task-to-mdp" },
      { title: "Designing the state", href: "/learn/warehouse-robot-capstone/designing-the-state" },
      { title: "Designing the reward", href: "/learn/warehouse-robot-capstone/designing-the-reward" },
      { title: "Choosing the discount", href: "/learn/warehouse-robot-capstone/choosing-the-discount" },
    ],
  },
  {
    title: "Lock the harness before learning",
    pages: [
      { title: "The warehouse field guide", href: "/learn/warehouse-robot-capstone/the-warehouse" },
      { title: "What counts as success?", href: "/learn/warehouse-robot-capstone/what-success-means" },
      { title: "Baselines: the number to beat", href: "/learn/warehouse-robot-capstone/baselines" },
      { title: "The oracle: knowing your ceiling", href: "/learn/warehouse-robot-capstone/the-oracle" },
    ],
  },
  {
    title: "Learn it, algorithm by algorithm",
    pages: [
      { title: "The first agent: Q-learning", href: "/learn/warehouse-robot-capstone/q-learning" },
      { title: "SARSA: valuing the policy you run", href: "/learn/warehouse-robot-capstone/sarsa" },
      { title: "Expected SARSA", href: "/learn/warehouse-robot-capstone/expected-sarsa" },
      { title: "The safety trade-off", href: "/learn/warehouse-robot-capstone/the-safety-tradeoff" },
      { title: "Algorithm comparison", href: "/learn/warehouse-robot-capstone/algorithm-comparison" },
    ],
  },
  {
    title: "Make it work: tuning",
    pages: [
      { title: "The step size α", href: "/learn/warehouse-robot-capstone/the-step-size" },
      { title: "The exploration schedule", href: "/learn/warehouse-robot-capstone/exploration-schedule" },
      { title: "Optimism and initialisation", href: "/learn/warehouse-robot-capstone/optimism-and-initialisation" },
      { title: "Tuning without fooling yourself", href: "/learn/warehouse-robot-capstone/tuning-protocol" },
    ],
  },
  {
    title: "Evaluate, interpret, stress-test",
    pages: [
      { title: "Reading the learned policy", href: "/learn/warehouse-robot-capstone/reading-the-policy" },
      { title: "Failure modes", href: "/learn/warehouse-robot-capstone/failure-modes" },
      { title: "Limits: what it can never know", href: "/learn/warehouse-robot-capstone/limits" },
    ],
  },
  {
    title: "Conclude & transfer",
    pages: [
      { title: "Verdict, playbook & notebook", href: "/learn/warehouse-robot-capstone/takeaways" },
      { title: "Transfer test I · A new warehouse (near)", href: "/learn/warehouse-robot-capstone/transfer-near" },
      { title: "Transfer test II · Inventory control (far)", href: "/learn/warehouse-robot-capstone/transfer-far" },
    ],
  },
];

export const RL_CAP_TOTAL = RL_CAP_TRACK.reduce((n, c) => n + c.pages.length, 0);
export const RL_CAP_DONE = RL_CAP_TRACK.reduce(
  (n, c) => n + c.pages.filter((p) => p.href).length,
  0,
);
