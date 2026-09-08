import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { GRIDWORLD_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "The Bellman optimality equation — Manifold",
  description:
    "Replace the policy average with a max and the Bellman expectation equation becomes the optimality equation. Why the max makes it nonlinear (no matrix inverse), the Q* form, and a numerical check that V* satisfies it.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function BellmanOptimality() {
  const code = `import numpy as np
gamma = 1.0
# get V* (best-action backup to convergence)
V = np.zeros(nS)
for _ in range(200):
    V = np.where(np.isin(np.arange(nS), TERMINALS), 0.0, (R + gamma * (P @ V)).max(axis=1))

# Bellman OPTIMALITY check: V*(s) should equal max_a [ R(s,a) + gamma * sum P V*(s') ]
backup = (R + gamma * (P @ V)).max(axis=1)
backup[TERMINALS] = 0.0
print("max |V* - optimality-backup(V*)|:", round(float(np.max(np.abs(V - backup))), 8))

# and it is NOT linear: the argmax action per state (the greedy policy hiding inside)
greedy = (R + gamma * (P @ V)).argmax(axis=1)
print("greedy action per state:", [ACTIONS[a][0] for a in greedy])`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Theory", color: GOLD }]}
        time="about 9 minutes"
        title={<>The Bellman <em>optimality</em> equation</>}
        intro={<>One symbol separates &ldquo;the value of my policy&rdquo; from &ldquo;the value of playing
          perfectly.&rdquo; Swap the average-over-my-actions for a maximum-over-all-actions and the Bellman
          expectation equation becomes the Bellman optimality equation. That single <M>{String.raw`\max`}</M>{" "}
          encodes optimal behaviour — and it also breaks the linear algebra, which is the whole reason the next
          chapters need iteration.</>}
      />

      <div className="lesson">
        <h2>From averaging to maximising</h2>
        <p>
          The expectation equation valued a <em>given</em> policy by averaging over the actions it chooses. But
          an optimal agent doesn&rsquo;t average — it picks the best action. So <M>{String.raw`V^*`}</M> satisfies
          the same equation with the policy average replaced by a maximum:
        </p>
        <MathBlock>{String.raw`V^*(s) = \max_{a}\left[\, R(s,a) + \gamma\sum_{s'}P(s'\mid s,a)\,V^*(s') \,\right].`}</MathBlock>
        <p>
          In words: <em>the value of playing perfectly from <M>s</M> is the value of the single best action —
          its reward plus the discounted optimal value of where it leads.</em> The action-value form is even
          cleaner, and it is the one control algorithms learn:
        </p>
        <MathBlock>{String.raw`Q^*(s,a) = R(s,a) + \gamma\sum_{s'}P(s'\mid s,a)\,\max_{a'}Q^*(s',a').`}</MathBlock>
        <p>
          The nesting is the whole story: <M>{String.raw`Q^*`}</M> at this step depends on the{" "}
          <em>best</em> <M>{String.raw`Q^*`}</M> at the next. Optimal play assumes optimal play thereafter — the
          principle of optimality, made into an equation.
        </p>

        <CodeBlock setup={GRIDWORLD_SETUP} fromScratch={code} />
        <CodeOutput>{`max |V* - optimality-backup(V*)|: 0.0
greedy action per state: ['u', 'l', 'l', 'd', 'u', 'u', 'u', 'd', 'u', 'u', 'r', 'd', 'u', 'r', 'r', 'u']`}</CodeOutput>
        <p>
          The residual is <strong>0</strong>: <M>{String.raw`V^*`}</M> is the fixed point of the optimality
          backup, just as <M>{String.raw`V^\pi`}</M> was the fixed point of the expectation backup. And notice
          what the <M>{String.raw`\arg\max`}</M> quietly produced — one best action per state. That is a policy,
          hiding inside the value function, and reading it out is the next page. (Terminal cells 0 and 15 have no
          real action; ignore their entries.)
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt="For a fixed policy we solved Vπ = (I − γPπ)⁻¹Rπ in one matrix step. Can we do the same one-shot solve for V*?"
          options={[
            "Yes — it's the same equation with π = optimal",
            "No — the max makes the equation nonlinear, so there's no matrix to invert; we must iterate or use LP",
            "Yes, but only for deterministic MDPs",
          ]}
          nudge="Locked in. Look at what the max does to linearity."
        />

        <h2>The max is what breaks linearity</h2>
        <p>
          The expectation equation was linear in the values, so a matrix inverse solved it outright. The{" "}
          <M>{String.raw`\max`}</M> destroys that: <M>{String.raw`\max(a x + b, c x + d)`}</M> is not a linear
          function of <M>x</M> — it bends. So there is <strong>no</strong> closed-form{" "}
          <M>{String.raw`(I - \gamma P)^{-1}`}</M> for <M>{String.raw`V^*`}</M>. This is not a minor technicality;
          it is <em>the</em> reason the next chapter exists. To solve a nonlinear fixed-point equation we
          iterate the backup (value iteration) or alternate evaluation and improvement (policy iteration), and we
          rely on a convergence guarantee — the contraction argument — to know the iteration lands on{" "}
          <M>{String.raw`V^*`}</M>. There is also an exact route via linear programming, which turns the{" "}
          <M>{String.raw`\max`}</M> into a set of inequalities; the Planning track covers all three.
        </p>

        <Callout color={GOLD} title={<>Two equations, one difference</>}>
          Keep the pair side by side. <strong>Expectation:</strong>{" "}
          <M>{String.raw`V^\pi(s) = \sum_a \pi(a\mid s)[\,R + \gamma\sum P\,V^\pi\,]`}</M> — averages over a given
          policy&rsquo;s actions, linear, one matrix solve. <strong>Optimality:</strong>{" "}
          <M>{String.raw`V^*(s) = \max_a[\,R + \gamma\sum P\,V^*\,]`}</M> — takes the best action, nonlinear,
          needs iteration. Every method in reinforcement learning is built on one of these two backups; knowing
          which one you&rsquo;re applying tells you whether you&rsquo;re <em>evaluating</em> a policy or{" "}
          <em>improving</em> toward the best one.
        </Callout>

        <Proof title="why V* must satisfy this equation" color={GOLD}>
          <p>
            Suppose <M>{String.raw`V^*`}</M> is the optimal value function. First,{" "}
            <M>{String.raw`V^*(s) \ge R(s,a) + \gamma\sum_{s'}P(s'\mid s,a)V^*(s')`}</M> for every action{" "}
            <M>a</M>: taking <M>a</M> and then playing optimally is <em>a</em> way to behave, and{" "}
            <M>{String.raw`V^*`}</M> is the best, so it can&rsquo;t be beaten by any specific first action. Hence{" "}
            <M>{String.raw`V^*(s) \ge \max_a[\cdots]`}</M>. Second, <M>{String.raw`V^*(s) \le \max_a[\cdots]`}</M>:
            whatever an optimal policy does first, it picks some action, and behaving optimally afterward gives at
            most the best-action value. The two inequalities force equality — <M>{String.raw`V^*`}</M> satisfies
            the optimality equation. That the equation has a <em>unique</em> solution (so satisfying it means
            being <M>{String.raw`V^*`}</M>) is the contraction result, two pages on.
          </p>
        </Proof>

        <PrevNext
          prev={{ href: "/learn/markov-decision-processes/optimal-value-functions", label: <>← What “best” means</> }}
          next={{ href: "/learn/markov-decision-processes/greedy-policies", label: <>Next · From values to a policy →</> }}
        />
      </div>
    </article>
  );
}
