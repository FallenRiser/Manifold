import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { ValueLandscapeLab } from "@/components/labs/ValueLandscapeLab";
import { GRIDWORLD_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "The state-value function — Manifold",
  description:
    "Vπ(s) is the expected return from state s under policy π — a single number per state that captures the whole future. Estimated by Monte-Carlo averaging, visualised as a landscape, and the bridge from reward to decision.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function StateValueFunction() {
  const code = `import numpy as np
rng = np.random.default_rng(0)

# Vpi(s) = expected return from s under the policy. Estimate it the honest way:
# start many episodes at s, follow the policy, average the returns you actually get.
def mc_value(policy, s0, n=4000):
    total = 0.0
    for _ in range(n):
        s, g, steps = s0, 0.0, 0
        while s not in TERMINALS and steps < 500:
            a = rng.choice(nA, p=policy[s])
            g += R[s, a]
            s = rng.choice(nS, p=P[s, a])
            steps += 1
        total += g
    return total / n

for s in (4, 5, 6):
    print(f"V_random({s}) ~ {mc_value(random_policy, s):6.1f}   (exact: see landscape)")`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Core idea", color: GOLD }]}
        time="about 9 minutes"
        title={<>The state-value function</>}
        intro={<>Here is the idea the whole track has been walking toward. Instead of judging a policy by rolling
          it out and squinting at noisy totals, we attach to every state a single number: how much return you can
          expect from here on, if you follow this policy. That number is the value of the state — and once you
          have it for every state, acting well becomes almost mechanical.</>}
      />

      <div className="lesson">
        <h2>Expected return, from here</h2>
        <p>
          The <strong>state-value function</strong> of a policy <M>{String.raw`\pi`}</M> is the expected return
          starting from state <M>s</M> and following <M>{String.raw`\pi`}</M> thereafter:
        </p>
        <MathBlock>{String.raw`V^\pi(s) = \mathbb{E}_\pi\!\left[\, G_t \mid S_t = s \,\right] = \mathbb{E}_\pi\!\left[\, \sum_{k=0}^{\infty}\gamma^{k} R_{t+k+1} \,\middle|\, S_t = s \,\right].`}</MathBlock>
        <p>
          Read every symbol. <M>{String.raw`G_t`}</M> is the return — the discounted future reward. The
          expectation <M>{String.raw`\mathbb{E}_\pi`}</M> averages over all the randomness: the policy&rsquo;s
          action choices and the environment&rsquo;s transitions. And it is conditioned on being in state{" "}
          <M>s</M>. So <M>{String.raw`V^\pi(s)`}</M> answers a very concrete question: <em>if I am here and behave
          this way from now on, how much reward should I expect in total?</em> The Markov property is what makes
          this a function of <M>s</M> alone — the past doesn&rsquo;t enter.
        </p>

        <h2>You can measure it directly</h2>
        <p>
          The definition is not abstract — it is literally an average you can take. Start many episodes in a
          state, follow the policy, record the return each time, and average. That is <strong>Monte-Carlo value
          estimation</strong>, and it makes &ldquo;expected return&rdquo; something you can watch converge:
        </p>

        <CodeBlock setup={GRIDWORLD_SETUP} fromScratch={code} />
        <CodeOutput>{`V_random(4) ~  -14.2   (exact: see landscape)
V_random(5) ~  -18.1   (exact: see landscape)
V_random(6) ~  -20.1   (exact: see landscape)`}</CodeOutput>
        <p>
          Cell 4 sits next to a goal corner, so the random walk escapes fairly quickly — value ≈ −14. Cell 6 is
          buried in the middle, so an aimless walk flails for ~20 steps on average — value ≈ −20. The values
          differ because the <em>situations</em> differ, and that difference is the whole point: value ranks
          states by how promising they are. (These Monte-Carlo estimates hover right around the exact values
          −14, −18, −20 we compute two pages from now — sampling noise is all that separates them.)
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt="In the landscape below, which states have the most negative value under the random policy?"
          options={[
            "The corners next to the goals",
            "The states farthest from any goal corner — deep in the middle / opposite corners",
            "All states have equal value under a random policy",
          ]}
          nudge="Locked in. Value = expected return, and a coin-flip walk takes longest to escape from far away."
        />

        <LabFrame
          accent={GOLD}
          tryThis={<>Keep it on <strong>Random policy</strong> and read the values — this is{" "}
            <M>{String.raw`V^\pi`}</M> for the coin-flip walk. Note which cells are darkest (most negative). Then
            flip to <strong>Optimal policy</strong> and watch every value jump toward 0. Drag <M>{String.raw`\gamma`}</M>{" "}
            down and see the landscape flatten as the agent grows short-sighted.</>}
          insight={<>Under the random policy the far-from-goal cells are deeply negative — an aimless walk is
            expensive. The <em>shape</em> of the landscape is a map of the task: high ground near the goals,
            valleys far away. Switching policy doesn&rsquo;t change the world, only the values — better behaviour
            makes every state worth more.</>}
        >
          <ValueLandscapeLab />
        </LabFrame>

        <Callout color={GOLD} title={<>Value is the bridge from reward to decision</>}>
          Reward is myopic — it scores one step. Value looks all the way to the horizon. That is exactly what you
          need to choose well: to compare two actions, you don&rsquo;t compare their immediate rewards, you
          compare the <em>value of where they lead</em>. A step that costs −1 but moves you to a high-value cell
          beats a step that costs −1 and strands you. Turn that instinct into arithmetic and you have the greedy
          policy — but first we need the value of <em>actions</em>, not just states.
        </Callout>

        <p>
          Monte-Carlo works, but it is slow and noisy, and it needs episodes to finish before it learns anything.
          The definition&rsquo;s recursive structure — return equals reward plus discounted future return — gives
          a far sharper tool. Applied to <M>{String.raw`V^\pi`}</M> it becomes the Bellman expectation equation,
          two pages from now. First, actions.
        </p>

        <PrevNext
          prev={{ href: "/learn/markov-decision-processes/policies", label: <>← A policy is a way of behaving</> }}
          next={{ href: "/learn/markov-decision-processes/action-value-function", label: <>Next · The action-value function →</> }}
        />
      </div>
    </article>
  );
}
