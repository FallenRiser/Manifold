import type { TrackChapter } from "./linearRegressionTrack";

// Building environments from scratch — an RL-family track. Accent = riso gold --c-rl.
//
// The spine: every earlier track HANDED the reader a world. This one makes three,
// at rising ambition, each taken through the same pipeline:
//   plan → parameterise → code → test → train.
//   World 1  Beat to windward — a sailboat that must invent tacking (fully in-browser)
//   World 2  Wildfire command — coupled fire / weather / logistics systems
//   World 3  Boss fight — a Soulslike duel simulator, trained on the reader's own PC
//
// Plan + gating experiments: docs/env-building-plan.md. No page states an effect
// that the plan does not mark verified. Unbuilt pages stay href-less.
export const ENV_TRACK: TrackChapter[] = [
  {
    title: "What an environment is",
    tier: 1,
    pages: [
      { title: "Every track handed you a world", href: "/learn/building-environments" },
      { title: "The reset/step contract", href: "/learn/building-environments/the-reset-step-contract" },
      { title: "Terminated vs truncated", href: "/learn/building-environments/terminated-vs-truncated" },
      { title: "Plan, parameterise, code, test, train", href: "/learn/building-environments/plan-parameterise-code-test-train" },
    ],
  },
  {
    title: "World 1 · Beat to windward: plan & build",
    tier: 1,
    pages: [
      { title: "The brief: reach an upwind mark", href: "/learn/building-environments/the-brief" },
      { title: "Parameterising a boat: the polar diagram", href: "/learn/building-environments/parameterising-a-boat" },
      { title: "Writing step()", href: "/learn/building-environments/writing-step" },
      { title: "Where the course ends", href: "/learn/building-environments/where-the-course-ends" },
    ],
  },
  {
    title: "World 1 · test & train",
    tier: 2,
    pages: [
      { title: "Sanity agents, and a sailor who can't lose", href: "/learn/building-environments/sanity-agents" },
      { title: "Paying the boat: −1 per second, investigated", href: "/learn/building-environments/paying-the-boat" },
      { title: "Designing what the boat sees", href: "/learn/building-environments/what-the-boat-sees" },
      { title: "The agent invents tacking", href: "/learn/building-environments/the-agent-invents-tacking" },
      { title: "Pay for speed, get a boat that circles", href: "/learn/building-environments/pay-for-speed" },
      { title: "Training ground: train the fleet yourself", href: "/learn/building-environments/training-ground" },
    ],
  },
  {
    title: "World 2 · Wildfire command: plan & build",
    tier: 2,
    pages: [
      { title: "The brief: one helicopter, one village", href: "/learn/building-environments/wildfire-brief" },
      { title: "Fire as a cellular automaton", href: "/learn/building-environments/fire-as-a-cellular-automaton" },
      { title: "Wind, moisture and slope", href: "/learn/building-environments/wind-moisture-and-slope" },
      { title: "The helicopter: logistics as a system", href: "/learn/building-environments/the-helicopter" },
      { title: "Coupled clocks", href: "/learn/building-environments/coupled-clocks" },
      { title: "A grid you can vectorise", href: "/learn/building-environments/a-grid-you-can-vectorise" },
      { title: "Invariants and property tests", href: "/learn/building-environments/invariants-and-property-tests" },
    ],
  },
  {
    title: "World 2 · test & train",
    tier: 2,
    pages: [
      { title: "Baselines a fire chief would try", href: "/learn/building-environments/baselines" },
      { title: "The crew that learned nothing", href: "/learn/building-environments/the-crew-that-learned-nothing" },
      { title: "Pilot or commander: choosing the action", href: "/learn/building-environments/pilot-or-commander" },
      { title: "Reward is a values decision", href: "/learn/building-environments/reward-is-a-values-decision" },
      { title: "Training the crew: DQN vs PPO", href: "/learn/building-environments/training-the-crew" },
      { title: "The cobra effect: pay per fire put out", href: "/learn/building-environments/the-cobra-effect" },
      { title: "What the crew learned", href: "/learn/building-environments/what-the-crew-learned" },
    ],
  },
  {
    title: "World 3 · Boss fight: plan & build",
    tier: 3,
    pages: [
      { title: "The brief: thirty seconds, one boss", href: "/learn/building-environments/the-duel-brief" },
      { title: "A moveset as a state machine", href: "/learn/building-environments/a-moveset-as-a-state-machine" },
      { title: "Frames, hitboxes and i-frames", href: "/learn/building-environments/frames-hitboxes-and-i-frames" },
      { title: "Stamina and the perfect-guard window", href: "/learn/building-environments/stamina-and-the-perfect-guard-window" },
      { title: "Writing step(), section by section", href: "/learn/building-environments/writing-the-duel" },
      { title: "What the agent sees: vectors or pixels", href: "/learn/building-environments/what-the-agent-sees" },
      { title: "Thousands of duels at once", href: "/learn/building-environments/thousands-of-duels-at-once" },
    ],
  },
  {
    title: "World 3 · test & train",
    tier: 3,
    pages: [
      { title: "Scripted players and a difficulty dial", href: "/learn/building-environments/scripted-players-and-a-difficulty-dial" },
      { title: "Curriculum: one move, then the set", href: "/learn/building-environments/curriculum-one-move-then-the-set" },
      { title: "The training loop, line by line", href: "/learn/building-environments/the-training-loop" },
      { title: "Training the duellist", href: "/learn/building-environments/training-the-duellist" },
      { title: "The turtle: reward hacking a duel", href: "/learn/building-environments/the-turtle" },
      { title: "What it learned about delayed attacks", href: "/learn/building-environments/what-it-learned-about-delayed-attacks" },
      { title: "Watch it fight", href: "/learn/building-environments/watch-it-fight" },
      { title: "A harder fight", href: "/learn/building-environments/a-harder-fight" },
      { title: "Coding the harder fight", href: "/learn/building-environments/coding-the-harder-fight" },
      { title: "Reading a policy off its buttons", href: "/learn/building-environments/reading-a-policy" },
      { title: "Sim vs the real game", href: "/learn/building-environments/sim-vs-the-real-game" },
    ],
  },
  {
    title: "The throughline",
    tier: 2,
    pages: [{ title: "Three worlds, one pipeline", href: "/learn/building-environments/three-worlds-one-pipeline" }],
  },
];

export const ENV_TOTAL = ENV_TRACK.reduce((n, c) => n + c.pages.length, 0);
export const ENV_DONE = ENV_TRACK.reduce((n, c) => n + c.pages.filter((p) => p.href).length, 0);
