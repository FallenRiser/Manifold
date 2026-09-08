import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { GRIDWORLD_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "The Bellman expectation equation — Manifold",
  description:
    "The self-referential equation at the heart of RL: a state's value equals the immediate reward plus the discounted value of the next state. The backup diagram, why it's a fixed point, and a numerical check.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function BellmanExpectation() {
  const code = `import numpy as np
gamma = 1.0
# Vpi by iterating the Bellman expectation backup until it stops changing.
V = np.zeros(nS)
for _ in range(2000):
    V = (random_policy * (R + gamma * (P @ V))).sum(axis=1)

# The defining property: plug V into the right-hand side and get V back.
rhs = (random_policy * (R + gamma * (P @ V))).sum(axis=1)
print("max |V - Bellman(V)|:", round(float(np.max(np.abs(V - rhs))), 8))
print("V(6) =", round(V[6], 1), "  check: -1 + mean of neighbour values")
neigh = [V[2], V[7], V[10], V[5]]          # up, right, down, left of cell 6
print("  -1 + mean(neighbours) =", round(-1 + np.mean(neigh), 1))`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Core idea", color: GOLD }]}
        time="about 10 minutes"
        title={<>The Bellman <em>expectation</em> equation</>}
        intro={<>This is the equation the whole field turns on. It says something almost too simple to be
          powerful: the value of a state is this step&rsquo;s reward plus the discounted value of where you go
          next. But because &ldquo;where you go next&rdquo; is another state with its own value, the equation
          defines value in terms of itself — and that self-reference is exactly what makes value computable.</>}
      />

      <div className="lesson">
        <h2>Value, defined in terms of itself</h2>
        <p>
          Take the definition <M>{String.raw`V^\pi(s) = \mathbb{E}_\pi[G_t \mid S_t = s]`}</M> and apply the
          return recursion <M>{String.raw`G_t = R_{t+1} + \gamma G_{t+1}`}</M> inside the expectation. The reward
          term averages to the immediate reward; the future term averages to the value of the next state. Out
          falls the <strong>Bellman expectation equation</strong>:
        </p>
        <MathBlock>{String.raw`V^\pi(s) = \sum_{a}\pi(a\mid s)\left[\, R(s,a) + \gamma\sum_{s'}P(s'\mid s,a)\,V^\pi(s') \,\right].`}</MathBlock>
        <p>
          Read it in plain words: <em>to value a state, average over the actions your policy might take; for
          each, add the reward you&rsquo;d get to the discounted average value of the states it might lead to.</em>{" "}
          The value on the left appears again on the right (as <M>{String.raw`V^\pi(s')`}</M>). That is not
          circular reasoning — it is a system of equations, one per state, that pins all the values down together.
        </p>

        <Callout color={GOLD} title={<>The backup diagram</>}>
          Picture a little tree rooted at <M>s</M>. It branches first by the policy&rsquo;s action choices{" "}
          <M>{String.raw`\pi(a\mid s)`}</M>, then by the environment&rsquo;s transitions{" "}
          <M>{String.raw`P(s'\mid s,a)`}</M>, reaching a row of next states <M>{String.raw`s'`}</M>. The Bellman
          equation <em>backs up</em> the values of those <M>{String.raw`s'`}</M> — one step, weighted by both
          sets of probabilities and discounted by <M>{String.raw`\gamma`}</M> — into the value of <M>s</M>. Every
          algorithm in this family and the next is some way of performing this one-step backup, over and over.
        </Callout>

        <h2>It is a fixed point</h2>
        <p>
          Here is the shift in perspective that unlocks computation. Define an operator{" "}
          <M>{String.raw`T^\pi`}</M> that takes <em>any</em> guess at the value function and applies the
          right-hand side once — one backup at every state. The true <M>{String.raw`V^\pi`}</M> is precisely the
          function that comes back unchanged: <M>{String.raw`T^\pi V^\pi = V^\pi`}</M>. It is a{" "}
          <strong>fixed point</strong> of the backup. That reframing is the key that opens the next two chapters:
          if applying <M>{String.raw`T^\pi`}</M> repeatedly is guaranteed to drag any starting guess toward that
          fixed point, then we can <em>compute</em> value by iterating — which is exactly what the code below
          does, and what the &ldquo;why it converges&rdquo; page will prove.
        </p>

        <CodeBlock setup={GRIDWORLD_SETUP} fromScratch={code} />
        <CodeOutput>{`max |V - Bellman(V)|: 0.0
V(6) = -20.0   check: -1 + mean of neighbour values
  -1 + mean(neighbours) = -20.0`}</CodeOutput>
        <p>
          Two things to see. First, the residual is <strong>0</strong> — the converged <M>V</M> satisfies its
          own Bellman equation exactly; it is the fixed point. Second, the hand-check: at cell 6 the random policy
          picks each of four neighbours equally, so the equation reads{" "}
          <M>{String.raw`V(6) = -1 + \tfrac14\big(V(2)+V(7)+V(10)+V(5)\big)`}</M>, and −1 plus the mean of the
          neighbour values comes to exactly −20. The equation isn&rsquo;t abstract; it is a local averaging rule
          each state obeys.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt="The Bellman expectation equation gives one linear equation per state, with the values as unknowns. For a 16-state gridworld, what does that mean you could do?"
          options={[
            "Only estimate the values approximately by sampling",
            "Solve 16 linear equations in 16 unknowns exactly — no iteration needed",
            "Nothing — the equation is only useful conceptually",
          ]}
          nudge="Locked in. Count the equations and the unknowns."
        />
        <p>
          Because the equation is <em>linear</em> in the values (the policy and dynamics are fixed numbers), the
          whole set of them is a linear system — <M>{String.raw`|\mathcal{S}|`}</M> equations in{" "}
          <M>{String.raw`|\mathcal{S}|`}</M> unknowns. That means we can skip iteration entirely and solve it in
          one shot with linear algebra. That is the next page — and it is the cleanest possible demonstration that
          &ldquo;evaluate a policy&rdquo; is a solved problem.
        </p>

        <Proof title="the full derivation, from the definition of value to the equation" color={GOLD}>
          <p>
            The main text said &ldquo;out falls the equation.&rdquo; Here is every step, starting from nothing but
            the definition of value and three tools: <strong>linearity of expectation</strong>, the{" "}
            <strong>law of total expectation</strong> (average a conditional expectation over the thing you
            conditioned on), and the <strong>Markov property</strong>. Begin with the definition and split the
            return with its recursion <M>{String.raw`G_t = R_{t+1} + \gamma G_{t+1}`}</M>:
          </p>
          <MathBlock>{String.raw`V^\pi(s) = \mathbb{E}_\pi[G_t \mid S_t = s] = \underbrace{\mathbb{E}_\pi[R_{t+1}\mid S_t=s]}_{\text{(A) immediate}} + \gamma\,\underbrace{\mathbb{E}_\pi[G_{t+1}\mid S_t=s]}_{\text{(B) future}},`}</MathBlock>
          <p>
            where the split is just linearity of expectation (<M>{String.raw`\gamma`}</M> is a constant). Now take
            the two pieces in turn. For <strong>(A)</strong>, condition on the action the policy draws — the law of
            total expectation over <M>{String.raw`A_t`}</M>:
          </p>
          <MathBlock>{String.raw`\mathbb{E}_\pi[R_{t+1}\mid S_t=s] = \sum_a \pi(a\mid s)\,\mathbb{E}[R_{t+1}\mid S_t=s, A_t=a] = \sum_a \pi(a\mid s)\,R(s,a).`}</MathBlock>
          <p>
            For <strong>(B)</strong>, condition on <em>both</em> the action and the next state — again the law of
            total expectation, now over <M>{String.raw`A_t`}</M> and <M>{String.raw`S_{t+1}`}</M>, whose
            probabilities are <M>{String.raw`\pi(a\mid s)`}</M> and <M>{String.raw`P(s'\mid s,a)`}</M>:
          </p>
          <MathBlock>{String.raw`\mathbb{E}_\pi[G_{t+1}\mid S_t=s] = \sum_a \pi(a\mid s)\sum_{s'} P(s'\mid s,a)\;\mathbb{E}_\pi[G_{t+1}\mid S_{t+1}=s',\,S_t=s,\,A_t=a].`}</MathBlock>
          <p>
            This is the one step that needs the <strong>Markov property</strong>. The future return{" "}
            <M>{String.raw`G_{t+1}`}</M> depends on the past only through the present state{" "}
            <M>{String.raw`S_{t+1}`}</M>, so the conditioning on <M>{String.raw`S_t`}</M> and{" "}
            <M>{String.raw`A_t`}</M> drops away, and what remains is the definition of value at{" "}
            <M>{String.raw`s'`}</M>:
          </p>
          <MathBlock>{String.raw`\mathbb{E}_\pi[G_{t+1}\mid S_{t+1}=s',\,S_t=s,\,A_t=a] = \mathbb{E}_\pi[G_{t+1}\mid S_{t+1}=s'] = V^\pi(s').`}</MathBlock>
          <p>
            Substitute (A) and (B) back into the split and the Bellman expectation equation assembles itself:
          </p>
          <MathBlock>{String.raw`V^\pi(s) = \sum_a \pi(a\mid s)\Big[\,R(s,a) + \gamma\sum_{s'}P(s'\mid s,a)\,V^\pi(s')\,\Big].`}</MathBlock>
          <p>
            Nothing was assumed but the definition of value and the Markov property — which is exactly why the
            equation fails the moment the state stops being a sufficient statistic (the &ldquo;when Markov
            breaks&rdquo; page). Running the identical argument from{" "}
            <M>{String.raw`Q^\pi(s,a) = \mathbb{E}_\pi[G_t\mid S_t=s,A_t=a]`}</M> — where the first action is
            already fixed, so there is no outer sum over <M>a</M> — gives the action-value twin:
          </p>
          <MathBlock>{String.raw`Q^\pi(s,a) = R(s,a) + \gamma\sum_{s'}P(s'\mid s,a)\sum_{a'}\pi(a'\mid s')\,Q^\pi(s',a').`}</MathBlock>
          <p>
            Its inner sum is just <M>{String.raw`V^\pi(s') = \sum_{a'}\pi(a'\mid s')Q^\pi(s',a')`}</M>, so the V and
            Q equations are one statement told from the state&rsquo;s and the action&rsquo;s point of view.
            Both <em>average</em> over the policy&rsquo;s actions; replace that average with a <em>maximum</em> and
            you get the Bellman <em>optimality</em> equation — the next chapter, and the reason optimal behaviour is
            computable at all.
          </p>
        </Proof>

        <PrevNext
          prev={{ href: "/learn/markov-decision-processes/action-value-function", label: <>← The action-value function</> }}
          next={{ href: "/learn/markov-decision-processes/solving-bellman-exactly", label: <>Next · Solving Bellman exactly →</> }}
        />
      </div>
    </article>
  );
}
