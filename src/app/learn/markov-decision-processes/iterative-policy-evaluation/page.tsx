import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { PolicyEvaluationLab } from "@/components/labs/PolicyEvaluationLab";
import { GRIDWORLD_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "Iterative policy evaluation — Manifold",
  description:
    "Compute Vπ without inverting a matrix: start at zero and apply the Bellman backup until it stops changing. Why value seeps out from the terminals, why it converges, and the full loop in a few lines.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function IterativePolicyEvaluation() {
  const code = `import numpy as np
gamma = 1.0
V = np.zeros(nS)                     # start every value at 0
for sweep in range(1, 400):
    V_new = (random_policy * (R + gamma * (P @ V))).sum(axis=1)  # one full backup
    V_new[TERMINALS] = 0.0
    delta = np.max(np.abs(V_new - V))                            # largest change
    V = V_new
    if sweep <= 3 or delta < 1e-4:
        print(f"sweep {sweep:>3}:  max change = {delta:8.4f}")
    if delta < 1e-4:
        break
print("converged Vπ:"); show(V)`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 9 minutes"
        title={<>Iterative policy evaluation</>}
        intro={<>We can already solve for <M>{String.raw`V^\pi`}</M> exactly with a matrix inverse — but that
          doesn&rsquo;t scale, and it doesn&rsquo;t generalise. The method that does is almost embarrassingly
          simple: guess all zeros, apply the Bellman backup once to every state, and repeat until nothing moves.
          This is the workhorse the rest of RL is built on, and it is worth watching it converge with your own
          hands.</>}
      />

      <div className="lesson">
        <h2>The algorithm, in one sentence</h2>
        <p>
          <strong>Start with any guess (zeros are fine) and repeatedly replace every state&rsquo;s value with its
          Bellman backup, until the values stop changing.</strong> Each pass over all states is a{" "}
          <em>sweep</em>:
        </p>
        <MathBlock>{String.raw`V_{k+1}(s) \leftarrow \sum_{a}\pi(a\mid s)\left[\,R(s,a) + \gamma\sum_{s'}P(s'\mid s,a)\,V_k(s')\,\right].`}</MathBlock>
        <p>
          That is the Bellman expectation operator <M>{String.raw`T^\pi`}</M> from two chapters ago, applied over
          and over. We proved <M>{String.raw`T^\pi`}</M> is a contraction, so the sequence{" "}
          <M>{String.raw`V_0, V_1, V_2, \ldots`}</M> is guaranteed to converge to the one fixed point,{" "}
          <M>{String.raw`V^\pi`}</M>, from <em>any</em> start. No inverse, no solve — just repeated averaging.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt="You start all values at 0 and do ONE sweep of the random policy on the gridworld. Which cells will have changed from 0?"
          options={[
            "All non-terminal cells change at once",
            "Only the cells adjacent to a terminal — the rest still average four zeros and stay at −1",
            "No cells change on the first sweep",
          ]}
          nudge="Locked in. On sweep 1 every cell's neighbours are still 0. Then watch it in the lab."
        />

        <LabFrame
          accent={GOLD}
          tryThis={<>Press <strong>Sweep once</strong> and watch which cells light up (change) each pass — start
            slow, one sweep at a time, and see value <em>spread</em> from the goal corners inward. Watch the{" "}
            <em>max change</em> Δ shrink toward 0. Then hit <strong>Run to convergence</strong>. Switch to the{" "}
            <strong>toward-goal policy</strong> and drag <M>{String.raw`\gamma`}</M> down — both change the final
            landscape and how many sweeps it takes.</>}
          insight={<>On sweep 1 only cells touching a goal move; each later sweep pushes the frontier one ring
            outward, because a cell can&rsquo;t know its value until its neighbours do. Value literally
            propagates from where reward is. The grid freezes when Δ hits ~0 — that frozen state is{" "}
            <M>{String.raw`V^\pi`}</M>, the same numbers the exact solve produced.</>}
        >
          <PolicyEvaluationLab />
        </LabFrame>

        <h2>The same thing, in code</h2>
        <p>
          The lab is doing exactly this loop — and here it is printing how the largest change per sweep collapses
          toward zero:
        </p>

        <CodeBlock setup={GRIDWORLD_SETUP} fromScratch={code} />
        <CodeOutput>{`sweep   1:  max change =   1.0000
sweep   2:  max change =   1.0000
sweep   3:  max change =   1.0000
sweep 173:  max change =   0.0001
converged Vπ:
  0.00  -14.00  -20.00  -22.00
-14.00  -18.00  -20.00  -20.00
-20.00  -20.00  -18.00  -14.00
-22.00  -20.00  -14.00    0.00`}</CodeOutput>
        <p>
          It lands on the exact same values as the matrix solve — <M>{String.raw`V^\pi`}</M> is{" "}
          <M>{String.raw`V^\pi`}</M> however you find it. Two details worth noticing. The change per sweep{" "}
          <em>holds near 1.0</em> for the first several sweeps — while the frontier of non-zero values is still
          marching out to the farthest cells — and only then settles into its long geometric decay toward zero.
          And with <M>{String.raw`\gamma = 1`}</M> it takes 173 sweeps to squeeze out the last drops; a discount
          below 1 would converge in a fraction of that, which is the next page.
        </p>

        <Callout color={GOLD} title={<>Why this, and not the matrix solve?</>}>
          Three reasons iterative evaluation is the method that matters. It is <strong>cheap per step</strong> —{" "}
          <M>{String.raw`O(|\mathcal{S}|^2)`}</M> a sweep, or far less when transitions are sparse, versus{" "}
          <M>{String.raw`O(|\mathcal{S}|^3)`}</M> to invert. It <strong>never forms the matrix</strong>, so it
          runs where the matrix wouldn&rsquo;t fit in memory. And it is the <strong>template for everything
          ahead</strong>: swap the policy-average for a max and it becomes value iteration; interleave it with
          greedy improvement and it becomes policy iteration; replace the exact backup with sampled experience
          and it becomes temporal-difference learning. Learn this loop and you have the skeleton of the whole
          field.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/markov-decision-processes/why-optimal-exists", label: <>← Why an optimal policy exists</> }}
          next={{ href: "/learn/markov-decision-processes/reading-a-value-landscape", label: <>Next · Reading a value landscape →</> }}
        />
      </div>
    </article>
  );
}
