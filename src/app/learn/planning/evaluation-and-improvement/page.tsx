import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { GRIDWORLD_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "Evaluation and improvement — Manifold",
  description:
    "The two levers of all dynamic programming: policy evaluation (make the value consistent with the policy) and policy improvement (make the policy greedy w.r.t. the value). The policy improvement theorem, and why the two together climb to the optimum.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function EvaluationAndImprovement() {
  const code = `import numpy as np
P, R = make_goal_grid(); gamma = 0.9
GOAL, PIT = 15, 3
nonterm = [s for s in range(nS) if s not in (GOAL, PIT)]

def evaluate(pi):                       # EVALUATION: make V consistent with pi
    Ppi = np.einsum('sa,sat->st', pi, P); Rpi = (pi * R).sum(1)
    V = np.zeros(nS)
    V[nonterm] = np.linalg.solve(np.eye(len(nonterm)) - gamma * Ppi[np.ix_(nonterm, nonterm)], Rpi[nonterm])
    return V

def improve(V):                         # IMPROVEMENT: make pi greedy w.r.t. V
    a = (R + gamma * (P @ V)).argmax(1)
    pi = np.zeros((nS, nA)); pi[np.arange(nS), a] = 1.0
    return pi

pi0 = np.full((nS, nA), 1.0 / nA)       # start: the random policy
V0 = evaluate(pi0)
pi1 = improve(V0)                        # ONE improvement step
V1 = evaluate(pi1)
print("sum of values, random policy   :", round(V0[nonterm].sum(), 3))
print("sum of values, one step better :", round(V1[nonterm].sum(), 3))
print("improved value >= old, everywhere:", bool(np.all(V1 >= V0 - 1e-9)))`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Core idea", color: GOLD }]}
        time="about 9 minutes"
        title={<>Evaluation and improvement</>}
        intro={<>Every dynamic-programming method in this track is built from exactly two operations. One makes the
          values honest about the policy; the other makes the policy greedy about the values. Apply them in turn and
          something remarkable happens: the policy can only get better, and it climbs until it cannot improve at
          all — which turns out to mean it is optimal.</>}
      />

      <div className="lesson">
        <h2>The two levers</h2>
        <p>
          Hold a policy <M>{String.raw`\pi`}</M> and its value <M>{String.raw`V`}</M> in your mind as two objects
          that ought to agree. There are two ways to make them agree, and they pull in opposite directions:
        </p>
        <ul>
          <li>
            <strong>Policy evaluation</strong> changes <M>V</M> to match <M>{String.raw`\pi`}</M>: given the policy,
            recompute the values it actually earns (solve the Bellman expectation equation). After it, <M>V</M> is
            honest — it is <M>{String.raw`V^\pi`}</M>.
          </li>
          <li>
            <strong>Policy improvement</strong> changes <M>{String.raw`\pi`}</M> to match <M>V</M>: given the
            values, make the policy greedy — in each state pick the action with the best one-step lookahead. After
            it, the policy is the best <em>response</em> to those values.
          </li>
        </ul>
        <MathBlock>{String.raw`\pi'(s) = \arg\max_a \Big[\, R(s,a) + \gamma\sum_{s'}P(s'\mid s,a)\,V^\pi(s') \,\Big] = \arg\max_a Q^\pi(s,a).`}</MathBlock>
        <p>
          Neither operation alone solves control. Evaluate and the policy is unchanged; improve and the values are
          now stale. But <em>alternate</em> them and each chases the other upward.
        </p>

        <h2>Improvement never hurts</h2>
        <p>
          The reason the loop works is a guarantee you first met in the MDP track — the{" "}
          <Link href="/learn/markov-decision-processes/greedy-policies" style={link}>policy improvement theorem</Link>.
          Making a policy greedy with respect to its own value function produces a policy that is at least as good in
          every state, and strictly better in at least one unless it was already optimal. Watch a single turn of the
          loop on the goal world:
        </p>

        <CodeBlock setup={GRIDWORLD_SETUP} fromScratch={code} />
        <CodeOutput>{`sum of values, random policy   : -3.652
sum of values, one step better : 10.108
improved value >= old, everywhere: True`}</CodeOutput>
        <p>
          One improvement step turned a policy worth <M>{String.raw`-3.65`}</M> (summed over the walkable cells)
          into one worth <M>{String.raw`+10.1`}</M> — and, exactly as the theorem promises, not a single state got
          worse. That is the entire engine. Repeat and you climb.
        </p>

        <Callout color={GOLD} title={<>Why &ldquo;can&rsquo;t improve&rdquo; means &ldquo;optimal&rdquo;</>}>
          Suppose an improvement step changes nothing — the greedy policy is the one you already had. Then for every
          state, <M>{String.raw`\pi(s)`}</M> already achieves <M>{String.raw`\max_a Q^\pi(s,a)`}</M>, which is
          precisely the Bellman <em>optimality</em> equation. A policy that cannot be improved satisfies the
          optimality equation, and (by the contraction result) the only value function that does is{" "}
          <M>{String.raw`V^*`}</M>. So the loop&rsquo;s fixed point is not just &ldquo;stuck&rdquo; — it is the best
          policy there is.
        </Callout>

        <PredictPrompt
          accent={GOLD}
          prompt="Alternating evaluation and improvement produces a sequence of policies. What do we know about that sequence?"
          options={[
            "It may cycle forever between good and bad policies",
            "It improves monotonically and, because there are finitely many deterministic policies, must reach the optimum in finite steps",
            "It converges only if γ is small enough",
          ]}
          nudge="Locked in. Monotone + finite = you can't climb forever."
        />

        <p>
          That is the plan for the next two chapters. <strong>Policy iteration</strong> runs evaluation all the way
          to <M>{String.raw`V^\pi`}</M> before each improvement. <strong>Value iteration</strong> does the barest
          sliver of evaluation — one sweep — before improving again. Both are just this two-lever loop, and both
          land at <M>{String.raw`\pi^*`}</M>.
        </p>

        <Proof title="the policy improvement theorem, restated for the loop" color={GOLD}>
          <p>
            Let <M>{String.raw`\pi'`}</M> be greedy with respect to <M>{String.raw`V^\pi`}</M>. Then by definition
            of greedy, for every state <M>{String.raw`Q^\pi(s,\pi'(s)) = \max_a Q^\pi(s,a) \ge Q^\pi(s,\pi(s)) = V^\pi(s)`}</M>.
            Expanding <M>{String.raw`V^\pi(s) \le Q^\pi(s,\pi'(s)) = \mathbb{E}[R_{t+1} + \gamma V^\pi(S_{t+1}) \mid S_t=s, A_t=\pi'(s)]`}</M>{" "}
            and applying the same inequality to the future value repeatedly telescopes into
          </p>
          <MathBlock>{String.raw`V^\pi(s) \le \mathbb{E}_{\pi'}\big[R_{t+1} + \gamma R_{t+2} + \cdots \mid S_t=s\big] = V^{\pi'}(s),`}</MathBlock>
          <p>
            so <M>{String.raw`V^{\pi'} \ge V^\pi`}</M> everywhere. If the greedy step changes no action, equality
            holds and <M>{String.raw`V^\pi`}</M> satisfies the Bellman optimality equation — meaning{" "}
            <M>{String.raw`\pi`}</M> is already optimal. Each round therefore <em>strictly</em> improves the policy
            or halts at the optimum; since there are only finitely many deterministic policies, it must halt in
            finitely many rounds. The next page turns exactly this argument into the policy-iteration algorithm.
          </p>
        </Proof>

        <PrevNext
          prev={{ href: "/learn/planning/prediction-vs-control", label: <>← Prediction vs control</> }}
          next={{ href: "/learn/planning/a-world-to-plan-in", label: <>Next · A world to plan in →</> }}
        />
      </div>
    </article>
  );
}
