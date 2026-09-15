import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { GRIDWORLD_SETUP } from "@/lib/runtimeSetup";
import { GridRow, TERMINALS_ONLY } from "@/components/figures/planning/GridField";
import { RTDP_COUNTS, RTDP_ROUTE } from "@/components/figures/planning/data.generated";

export const metadata = {
  title: "Real-time dynamic programming — Manifold",
  description:
    "You rarely need the value of every state — only the ones on the way to a goal from where you start. Real-time DP interleaves acting and backing up, concentrating computation on the reachable, relevant part of the state space.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function RealTimeDynamicProgramming() {
  const code = `import numpy as np
P, R = make_goal_grid(); gamma = 0.9
GOAL, PIT = 15, 3

# RTDP: from a fixed start, repeatedly (1) back up the CURRENT state, (2) act greedily,
# (3) step to where that lands. Optimistic init (V = 1, an upper bound on V*) keeps the
# agent exploring toward the goal and guarantees convergence.
V = np.ones(nS); V[[GOAL, PIT]] = 0.0
start = 12
for episode in range(400):
    s = start
    while s not in (GOAL, PIT):
        V[s] = (R[s] + gamma * (P[s] @ V)).max()      # back up ONLY this state
        a = (R[s] + gamma * (P[s] @ V)).argmax()      # act greedily
        s = int(np.argmax(P[s, a]))                    # move

# trace the route RTDP settled on, from the start:
s = start; path = []
while s not in (GOAL, PIT):
    path.append(s); a = (R[s] + gamma * (P[s] @ V)).argmax(); s = int(np.argmax(P[s, a]))
print("optimal route from start 12:", path)
print("it visits", len(path), "of", nS - 2, "non-terminal states")`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Theory", color: GOLD }]}
        time="about 8 minutes"
        title={<>Real-time dynamic programming</>}
        intro={<>Full sweeps update every state, but most of them may be irrelevant — a state no good trajectory ever
          reaches does not need an accurate value. Real-time DP takes the curse of dimensionality head-on by refusing
          to enumerate: it backs up only the states the agent actually passes through, interleaving planning with
          acting.</>}
      />

      <div className="lesson">
        <h2>Back up where you stand</h2>
        <p>
          Real-time dynamic programming (RTDP) is the purest asynchronous method. Instead of sweeping the whole state
          space, it follows a trajectory from a start state and, at each step, does one thing: back up the state it is{" "}
          <em>currently in</em>, then act greedily and move on. Formally, at the visited state <M>{String.raw`s_t`}</M>:
        </p>
        <MathBlock>{String.raw`V(s_t) \leftarrow \max_a\Big[R(s_t,a) + \gamma\sum_{s'}P(s'\mid s_t,a)V(s')\Big], \qquad a_t = \arg\max_a[\cdots], \qquad s_{t+1}\sim P(\cdot\mid s_t,a_t).`}</MathBlock>
        <p>
          Because the agent acts greedily on improving values, the trajectories it follows — and the states it backs
          up — cluster around the routes that actually reach the goal from the start. Run it and trace the route it
          settles on:
        </p>

        <CodeBlock setup={GRIDWORLD_SETUP} fromScratch={code} />
        <CodeOutput>{`optimal route from start 12: [12, 13, 14]
it visits 3 of 14 non-terminal states`}</CodeOutput>
        <p>
          The optimal route from the start corner touches just <strong>three</strong> of the fourteen walkable cells
          on its way to the goal. That is the crux of RTDP&rsquo;s bet: the states that <em>matter</em> for behaving
          well from a given start are a thin tube through the space, and everything off that tube can stay vague.
        </p>

        <Callout color={GOLD} title={<>Honest scale note</>}>
          On this 4&times;4 grid RTDP is <em>not</em> actually cheaper than a full sweep — every cell is only a few
          steps from the start, so over many episodes RTDP ends up backing up all 14 states anyway, and it runs more
          backups than plain value iteration would. The saving is entirely asymptotic. On a problem with{" "}
          <M>{String.raw`10^{20}`}</M> states where a single thin tube of a few thousand leads from start to goal,
          RTDP touches that tube and ignores the rest — the difference between feasible and impossible. Small worlds
          hide the win; they don&rsquo;t contradict it.
        </Callout>

        <PredictPrompt
          accent={GOLD}
          prompt="RTDP only backs up states it visits. What makes it provably converge to an optimal policy from the start?"
          options={[
            "Nothing — it's just a heuristic with no guarantee",
            "Optimistic initialization: if V starts as an upper bound on V*, RTDP is proven to converge to optimal over the relevant states (Barto, Bradtke & Singh 1995)",
            "It must eventually visit every state",
          ]}
          nudge="Locked in. Start high (optimistic) and RTDP converges on exactly the states that matter — no full enumeration needed."
        />

        <GridRow
          mode="count"
          grids={[
            {
              values: RTDP_COUNTS,
              policy: TERMINALS_ONLY,
              highlight: RTDP_ROUTE,
              label: "backups per cell over 60 episodes from cell 12",
            },
          ]}
          caption={<>Where the effort went. The ringed cells are the optimal route from the start, and
            they take the overwhelming majority of the backups; the top-right corner, which no good
            policy from cell 12 ever enters, is barely touched. On a 14-state grid that is a curiosity.
            On a board with 10²⁰ states it is the only reason planning is possible at all — you never
            needed the corner to be right, only the states you will actually stand in.</>}
        />

        <h2>Relevance beats completeness</h2>
        <p>
          RTDP embodies the principle that dominates large-scale planning: you do not need the optimal value{" "}
          <em>everywhere</em>, only along the trajectories an optimal agent would follow from the states you actually
          start in. This is why RTDP and its relatives (LRTA*, LAO*, and heuristic search generally) can plan in
          spaces far too large to sweep. Feed RTDP an admissible heuristic as its optimistic initial values and it
          becomes a direct bridge between dynamic programming and classical AI search like A*.
        </p>

        <Callout color={GOLD} title={<>The link to the next track</>}>
          Look again at the RTDP loop: back up the current state, act, move to a sampled next state. It reads almost
          exactly like an online learning algorithm — because it nearly is one. The only thing RTDP still needs that
          a learning agent lacks is the <em>model</em>: it uses <M>P</M> and <M>R</M> to compute the backup and to
          decide where it lands. Take those away — <em>sample</em> the next state by acting, and observe the reward
          rather than reading it from a table — and RTDP turns into temporal-difference learning. That final step is
          the doorway to the Learning track.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/planning/the-curse-of-dimensionality", label: <>← The curse of dimensionality</> }}
          next={{ href: "/learn/planning/planning-by-sampling", label: <>Next · Planning by sampling →</> }}
        />
      </div>
    </article>
  );
}
