import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { Quiz } from "@/components/Quiz";
import { GRIDWORLD_SETUP } from "@/lib/runtimeSetup";
import { RewardBoard } from "@/components/figures/planning/PlanningDiagrams";
import { REWARDS } from "@/components/figures/planning/data.generated";
import { GridRow } from "@/components/figures/planning/GridField";
import { V_STAR, PI_STAR } from "@/components/figures/planning/data.generated";

export const metadata = {
  title: "A world to plan in — Manifold",
  description:
    "The goal-and-pit gridworld the Planning track uses: reach the goal (+1), avoid the pit (−1), pay a small cost per step, and discount the future. Why this world makes optimal behaviour visible and non-trivial.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function AWorldToPlanIn() {
  const code = `import numpy as np
# The planning world: a 4x4 grid with a goal at cell 15 (+1) and a pit at cell 3 (-1).
# Every step costs 0.04, and the future is discounted at gamma = 0.9 so a longer path
# is genuinely worse than a short one.
P, R = make_goal_grid(step_reward=-0.04, goal=15, pit=3)
gamma = 0.9

# The reward is paid on ENTERING a special cell. From cell 11, moving 'down' enters
# the goal; from cell 2, moving 'right' enters the pit:
print("reward for entering the goal (cell 11, down) :", R[11, 2])
print("reward for entering the pit  (cell 2,  right):", R[2, 1])
print("reward for an ordinary step                  :", R[6, 1])

# a quick map of the layout (G = goal, P = pit, . = walkable)
layout = np.array(["."] * nS, dtype=object)
layout[15] = "G"; layout[3] = "P"
show(layout)`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Setup", color: GOLD }]}
        time="about 6 minutes"
        title={<>A world to plan in</>}
        intro={<>Before we solve anything, meet the world we will solve. It is small enough to hold in your head and
          just rich enough that the best behaviour is not obvious — there is a prize to reach, a hazard to avoid,
          and a running cost that makes dawdling expensive. Every algorithm in this track will be judged by whether
          it finds the plan you can almost, but not quite, see by eye.</>}
      />

      <div className="lesson">
        <h2>The goal-and-pit grid</h2>
        <p>
          The agent lives on a 4&times;4 grid. One corner, cell 15, is a <strong>goal</strong>: entering it pays{" "}
          <M>{String.raw`+1`}</M> and ends the episode. Nearby, cell 3 is a <strong>pit</strong>: entering it pays{" "}
          <M>{String.raw`-1`}</M> and ends the episode. Every ordinary step costs a small{" "}
          <M>{String.raw`-0.04`}</M>, and moves that would leave the grid bounce off the wall. The future is
          discounted at <M>{String.raw`\gamma = 0.9`}</M>.
        </p>

        <CodeBlock setup={GRIDWORLD_SETUP} fromScratch={code} />
        <CodeOutput>{`reward for entering the goal (cell 11, down) : 1.0
reward for entering the pit  (cell 2,  right): -1.0
reward for an ordinary step                  : -0.04
   .     .     .     P
   .     .     .     .
   .     .     .     .
   .     .     .     G`}</CodeOutput>
        <p>
          Notice the tension baked into these numbers. The step cost is small but relentless, so the agent wants a{" "}
          <em>short</em> path. The discount <M>{String.raw`\gamma = 0.9`}</M> adds a second pressure in the same
          direction: a <M>{String.raw`+1`}</M> collected in <M>k</M> steps is only worth{" "}
          <M>{String.raw`0.9^{k}`}</M> now, so distant rewards fade. And the pit sits right next to the top row, so
          the shortest route is not always the safest-looking one. This is a genuine little planning problem.
        </p>

        <RewardBoard
          step={REWARDS.step}
          goal={REWARDS.goal}
          pit={REWARDS.pit}
          gamma={REWARDS.gamma}
          caption={<>Sixteen cells, four moves, two ways to finish. The numbers in the corners are state
            indices, which every code block on this track uses to refer to cells. Nothing here is a value
            yet — this is only the board and its payouts, the raw material every algorithm in the track
            is handed.</>}
        />

        <h2>Why not just walk toward the goal?</h2>
        <p>
          Because &ldquo;toward the goal&rdquo; is only obvious once you have the values. From the far corner, which
          way is toward the goal — and does the answer change near the pit? The point of dynamic programming is that
          you do <em>not</em> reason geometrically; you let the Bellman equation propagate the goal&rsquo;s{" "}
          <M>{String.raw`+1`}</M> and the pit&rsquo;s <M>{String.raw`-1`}</M> outward through the value function
          until every cell knows, from its number alone, which neighbour is best. To set a baseline, here is what{" "}
          <em>aimless</em> behaviour is worth — the equiprobable random policy, evaluated exactly:
        </p>
        <MathBlock>{String.raw`V^{\text{random}}:\quad \begin{array}{cccc} -0.40 & -0.45 & -0.60 & \cdot \\ -0.36 & -0.36 & -0.38 & -0.43 \\ -0.30 & -0.24 & -0.10 & 0.13 \\ -0.25 & -0.13 & 0.22 & \cdot \end{array}`}</MathBlock>
        <p>
          A random walker is worth <em>negative</em> value across most of the grid: it drifts, pays the step cost,
          and stumbles into the pit about as readily as the goal. Only the cells hugging the goal come out positive.
          The whole job of this track is to replace that aimless drift with a policy that walks the grid like it has
          a map — because, with the model in hand, it does.
        </p>

        <Callout color={GOLD} title={<>What optimal will look like</>}>
          By the end of the next chapter the value function will rise smoothly from about{" "}
          <M>{String.raw`0.43`}</M> in the far corner to <M>{String.raw`+1`}</M> beside the goal, and the optimal
          policy will be a field of arrows all flowing to cell 15 — routing <em>around</em> the pit, never toward
          it. You will have computed it two different ways (policy iteration and value iteration) and watched a lab
          build it sweep by sweep. Keep this baseline picture in mind; the contrast is the payoff.
        </Callout>

        <GridRow
          grids={[
            { values: V_STAR, label: "V*: what each cell is worth" },
            { policy: PI_STAR, label: "π*: the move that achieves it" },
          ]}
          caption={<>The answer, shown now so you know what you are working toward. Notice that cell 2 —
            directly left of the pit — is still worth a positive 0.62: the optimal policy simply goes
            down and around, and the pit costs it nothing but a detour. Reading a plan off the right-hand
            grid is a matter of following arrows; producing the left-hand grid is the rest of this
            track.</>}
        />

        <Quiz
          accent={GOLD}
          title="Chapter checkpoint"
          questions={[
            {
              q: <>What are the two pressures that push the optimal policy toward short paths?</>,
              options: [
                "The wall bounces and the grid size",
                "The per-step cost (−0.04 each step) and the discount γ = 0.9, which shrinks a reward collected later",
                "The pit and the goal being in corners",
              ],
              answer: 1,
              explain: <>Each step subtracts 0.04, so more steps cost more; and discounting makes a{" "}
                <M>{String.raw`+1`}</M> reached in <M>k</M> steps worth only <M>{String.raw`0.9^k`}</M>. Both reward
                brevity.</>,
            },
            {
              q: <>Why is the random policy worth negative value across most of the grid?</>,
              options: [
                "Because the goal reward is too small",
                "A coin-flip walk wanders, paying the step cost repeatedly and falling into the pit about as often as reaching the goal",
                "Because γ is less than 1",
              ],
              answer: 1,
              explain: <>Aimless motion accumulates step costs and has no bias toward the goal over the pit, so its
                expected return is negative except right next to the goal.</>,
            },
            {
              q: <>What does dynamic programming use instead of geometric reasoning about &ldquo;toward the goal&rdquo;?</>,
              options: [
                "It measures straight-line distance to cell 15",
                "It propagates the goal's +1 and pit's −1 through the value function via the Bellman equation, until each cell's number reveals its best neighbour",
                "It tries every path and picks the shortest",
              ],
              answer: 1,
              explain: <>The value function carries the consequences of the whole future into a single number per
                state; acting greedily on it is what &ldquo;toward the goal&rdquo; really means.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/planning/evaluation-and-improvement", label: <>← Evaluation and improvement</> }}
          next={{ href: "/learn/planning/policy-iteration", label: <>Next chapter · Policy iteration →</> }}
        />
      </div>
    </article>
  );
}
