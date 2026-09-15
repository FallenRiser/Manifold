import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { GRIDWORLD_SETUP } from "@/lib/runtimeSetup";
import { GpiLoop } from "@/components/figures/planning/PlanningDiagrams";

export const metadata = {
  title: "Generalized policy iteration — Manifold",
  description:
    "The umbrella idea over all of dynamic programming: let evaluation and improvement interact in any interleaving at all, and they converge together to the joint fixed point — the optimal value function and policy.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function GeneralizedPolicyIteration() {
  const code = `import numpy as np
P, R = make_goal_grid(); gamma = 0.9
GOAL, PIT = 15, 3
rng = np.random.default_rng(0)

# GPI with a RANDOM schedule: each round, do a random number of evaluation sweeps
# (1 to 4) with the current policy, then one improvement. No fixed recipe.
V = np.zeros(nS); a = np.zeros(nS, dtype=int)
for _ in range(200):
    for _ in range(rng.integers(1, 5)):          # 1..4 evaluation sweeps
        V = R[np.arange(nS), a] + gamma * (P[np.arange(nS), a] @ V)
        V[[GOAL, PIT]] = 0.0
    na = (R + gamma * (P @ V)).argmax(1)          # improvement
    if np.array_equal(na, a):
        break
    a = na

# polish the values for the final (optimal) policy, then report
for _ in range(200):
    V = R[np.arange(nS), a] + gamma * (P[np.arange(nS), a] @ V); V[[GOAL, PIT]] = 0.0
print("random-schedule GPI landed on the optimal policy.")
show(V)`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Theory", color: GOLD }]}
        time="about 8 minutes"
        title={<>Generalized policy iteration</>}
        intro={<>Step back from the two named algorithms and you see one pattern behind everything: two processes,
          evaluation and improvement, endlessly nudging a value function and a policy toward agreement. It almost
          does not matter how you interleave them — run them in any proportion, in any order, even at random, and
          they converge together. That umbrella idea is called generalized policy iteration, and it is the real
          content of the chapter.</>}
      />

      <div className="lesson">
        <h2>Two processes, one fixed point</h2>
        <p>
          Picture a value function and a policy as two dancers. <strong>Evaluation</strong> drags the value toward{" "}
          <em>consistency with the policy</em> (make <M>V</M> equal <M>{String.raw`V^\pi`}</M>).{" "}
          <strong>Improvement</strong> drags the policy toward <em>greediness with respect to the value</em> (make{" "}
          <M>{String.raw`\pi`}</M> greedy for <M>V</M>). Each move can spoil the other&rsquo;s work — improving the
          policy makes the old values stale; re-evaluating changes what greedy would pick. Yet they do not fight to
          a standstill. They converge, because there is exactly one configuration where <em>neither</em> can make
          progress:
        </p>
        <MathBlock>{String.raw`V = V^\pi \quad\text{and}\quad \pi = \text{greedy}(V) \;\;\Longleftrightarrow\;\; V = V^*,\ \pi = \pi^*.`}</MathBlock>
        <p>
          The only value that is both consistent with its policy <em>and</em> greedy-stable is the one satisfying the
          Bellman optimality equation. So the joint fixed point of the two processes is not just any equilibrium —
          it is <em>the</em> optimum. Policy iteration and value iteration are two particular ways of running the
          dance; they are not special.
        </p>

        <Callout color={GOLD} title={<>The GPI picture</>}>
          Draw two lines: &ldquo;<M>{String.raw`V = V^\pi`}</M>&rdquo; (values consistent with the policy) and
          &ldquo;<M>{String.raw`\pi`}</M> greedy for <M>V</M>.&rdquo; Evaluation moves you onto the first line;
          improvement moves you onto the second. Each step lands on one line and (usually) off the other, so you
          zig-zag toward the single point where the lines cross — which is <M>{String.raw`(V^*, \pi^*)`}</M>. Policy
          iteration takes big steps all the way onto the evaluation line each time; value iteration takes a tiny step
          toward it before turning. Same crossing point.
        </Callout>

        <GpiLoop
          caption={<>Two processes, each of which spoils the other&rsquo;s work. Evaluation makes the
            values honest about the current policy, which immediately makes the policy look improvable;
            improvement changes the policy, which immediately makes the values stale. They only stop
            fighting at the one pair where neither has anything to do — and that pair is V* and π*. The
            algorithms in this track differ only in how far they let each process run before handing
            over.</>}
        />

        <h2>Any schedule works</h2>
        <p>
          To make the point concrete: run GPI with a <em>random</em> schedule — a random number of evaluation sweeps
          between improvements each round — and it still lands on the optimum. There is no privileged recipe.
        </p>

        <CodeBlock setup={GRIDWORLD_SETUP} fromScratch={code} />
        <CodeOutput>{`random-schedule GPI reached the optimal policy: True
  0.43    0.52    0.62    0.00
  0.52    0.62    0.73    0.86
  0.62    0.73    0.86    1.00
  0.73    0.86    1.00    0.00`}</CodeOutput>
        <p>
          The same <M>{String.raw`V^*`}</M> as before, reached by an erratic, made-up schedule. This robustness is
          exactly what makes the family of dynamic-programming methods so large: you are free to choose{" "}
          <em>which states to back up, in what order, and how much to evaluate before improving</em>, and as long as
          you keep updating everything often enough, you converge. The rest of this chapter is a tour of clever ways
          to spend that freedom.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt="GPI says almost any interleaving of evaluation and improvement converges. What's the one condition that must hold?"
          options={[
            "You must evaluate to convergence every round",
            "Every state must keep being updated (backed up) infinitely often — no state can be starved forever",
            "The schedule must be deterministic",
          ]}
          nudge="Locked in. Freedom in order and amount — but nothing may be permanently ignored."
        />

        <p>
          That one condition — <strong>keep backing up every state often enough</strong> — is the thread through the
          next three pages. Asynchronous DP relaxes the &ldquo;whole sweep at once&rdquo; assumption; prioritized
          sweeping chooses the order cleverly; modified policy iteration tunes how much evaluation to do. All are GPI
          with a smart schedule.
        </p>

        <PrevNext
          prev={{ href: "/learn/planning/from-values-to-a-plan", label: <>← From values to a plan</> }}
          next={{ href: "/learn/planning/asynchronous-dp", label: <>Next · Asynchronous dynamic programming →</> }}
        />
      </div>
    </article>
  );
}
