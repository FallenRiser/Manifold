import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LabFrame } from "@/components/LabFrame";
import { Quiz } from "@/components/Quiz";
import { GpiDialLab } from "@/components/labs/GpiDialLab";
import { GRIDWORLD_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "Modified policy iteration — Manifold",
  description:
    "The dial that spans value iteration and policy iteration: run k evaluation sweeps between improvements. k = 1 is value iteration, k → ∞ is policy iteration, and every k in between is a valid, convergent algorithm.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function ModifiedPolicyIteration() {
  const code = `import numpy as np
P, R = make_goal_grid(); gamma = 0.9
GOAL, PIT = 15, 3

def modified_pi(k_eval):
    "k_eval evaluation sweeps between each greedy improvement."
    V = np.zeros(nS); a = np.zeros(nS, dtype=int)
    rounds = total_sweeps = 0
    for _ in range(500):
        for _ in range(k_eval):                       # partial evaluation
            V = R[np.arange(nS), a] + gamma * (P[np.arange(nS), a] @ V)
            V[[GOAL, PIT]] = 0.0; total_sweeps += 1
        na = (R + gamma * (P @ V)).argmax(1)          # improvement
        rounds += 1
        if np.array_equal(na, a): break
        a = na
    return rounds, total_sweeps

for k in [1, 2, 3, 5, 10, 20]:
    r, s = modified_pi(k)
    tag = " (= value iteration)" if k == 1 else ""
    print(f"k={k:<2} eval sweeps/round -> {r} improvement rounds, {s} eval sweeps total{tag}")`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Interactive", color: GOLD }]}
        time="about 9 minutes"
        title={<>Modified policy iteration</>}
        intro={<>Here is the page that ties the chapter together. Policy iteration and value iteration are not two
          algorithms — they are the two ends of a single dial, and everything in between is a legitimate method of
          its own. Modified policy iteration is that dial made explicit: choose how many evaluation sweeps to run
          before each improvement, and watch value iteration and policy iteration fall out as the extreme settings.</>}
      />

      <div className="lesson">
        <h2>Turn evaluation up or down</h2>
        <p>
          The algorithm is policy iteration with one knob: instead of evaluating the current policy to convergence,
          run exactly <M>k</M> sweeps of the Bellman expectation backup, then improve. The parameter <M>k</M> is the
          dial:
        </p>
        <MathBlock>{String.raw`\underbrace{k=1}_{\text{value iteration}} \quad\longleftrightarrow\quad k = 2, 3, 5, \dots \quad\longleftrightarrow\quad \underbrace{k=\infty}_{\text{policy iteration}}.`}</MathBlock>
        <p>
          At <M>k=1</M> a single evaluation sweep followed by an improvement is exactly one value-iteration backup
          (we proved this two pages ago). At <M>{String.raw`k=\infty`}</M> you evaluate fully before improving —
          policy iteration. Every finite <M>k</M> in between converges to the same <M>{String.raw`V^*`}</M>. Count
          the work at each setting:
        </p>

        <CodeBlock setup={GRIDWORLD_SETUP} fromScratch={code} />
        <CodeOutput>{`k=1  eval sweeps/round -> 7 improvement rounds, 7 eval sweeps total (= value iteration)
k=2  eval sweeps/round -> 7 improvement rounds, 14 eval sweeps total
k=3  eval sweeps/round -> 7 improvement rounds, 20 eval sweeps total
k=5  eval sweeps/round -> 7 improvement rounds, 32 eval sweeps total
k=10 eval sweeps/round -> 7 improvement rounds, 62 eval sweeps total
k=20 eval sweeps/round -> 7 improvement rounds, 122 eval sweeps total`}</CodeOutput>
        <p>
          Read the table carefully, because it holds a genuine surprise. The number of <strong>improvement
          rounds</strong> is <em>the same — 7 — for every <M>k</M></em>. The problem decides how many
          improvements are needed; evaluating more thoroughly between them does not reduce that count. All the extra{" "}
          <M>k</M> buys is more <strong>evaluation sweeps</strong> — pure additional work. On this world, then, the
          leanest setting, <M>k=1</M> (value iteration), reaches the optimum for the least total effort.
        </p>

        <LabFrame
          accent={GOLD}
          tryThis={<>Click along the dial from <M>k=1</M> to <M>k=20</M>. Watch the <em>rounds</em> figure stay
            pinned while the <em>total sweeps</em> bar grows. The far end of the dial — evaluate to convergence — is
            policy iteration; the near end, a single sweep, is value iteration. Same destination, wildly different
            total work.</>}
          insight={<>The improvement count is a property of the <em>problem</em>, not of how hard you evaluate. So
            evaluation beyond &ldquo;enough to get the rankings right&rdquo; is wasted here — which is exactly why
            value iteration (the minimum evaluation) is the practical default. The value of intermediate <M>k</M>{" "}
            shows up on harder problems, where a little extra evaluation genuinely cuts the number of rounds and the
            per-sweep cost of exact evaluation is prohibitive.</>}
        >
          <GpiDialLab />
        </LabFrame>

        <Callout color={GOLD} title={<>When intermediate k wins</>}>
          Don&rsquo;t over-learn the gridworld&rsquo;s lesson that <M>k=1</M> is best. On large problems the
          calculus changes: full evaluation (policy iteration) means an <M>{String.raw`O(|\mathcal{S}|^3)`}</M>
          solve per round — often impossible — while pure value iteration can need many rounds when rewards are
          sparse and the horizon is long. A moderate <M>k</M> (a handful of sweeps) frequently gives the best of
          both: informed improvements without the cost of exact evaluation. The dial exists because the sweet spot
          is problem-dependent.
        </Callout>

        <h2>The chapter, in one sentence</h2>
        <p>
          Generalized policy iteration says evaluation and improvement converge under almost any schedule;
          asynchronous DP frees you from full sweeps; prioritized sweeping picks the best order; and modified policy
          iteration tunes how much to evaluate. Every dynamic-programming method is a point in this space of
          schedules — <em>which states to back up, in what order, and how thoroughly before improving.</em> That is
          the whole design space, and you now hold all of its axes.
        </p>

        <Quiz
          accent={GOLD}
          title="Chapter checkpoint"
          questions={[
            {
              q: <>What does the parameter k in modified policy iteration control?</>,
              options: [
                "The discount factor",
                "How many evaluation sweeps run between each greedy improvement — k=1 is value iteration, k=∞ is policy iteration",
                "The number of states updated per sweep",
              ],
              answer: 1,
              explain: <>k is the evaluation depth per round. One sweep recovers value iteration; evaluating to
                convergence recovers policy iteration; everything between is a valid method.</>,
            },
            {
              q: <>On the gridworld, every k gave the same 7 improvement rounds. What does that reveal?</>,
              options: [
                "The code has a bug",
                "The number of improvement rounds is set by the problem, not by evaluation depth — so extra evaluation is wasted work here",
                "k=20 is always fastest",
              ],
              answer: 1,
              explain: <>Improvements are governed by the problem&rsquo;s structure. Evaluating more per round only
                adds sweeps without cutting rounds, so on this world the minimal k=1 (value iteration) is cheapest.</>,
            },
            {
              q: <>When is an intermediate k (not 1, not ∞) the best choice in practice?</>,
              options: [
                "Never — always use value iteration",
                "On large problems where exact evaluation is too expensive but a few sweeps per round cut the number of rounds",
                "Only when γ = 1",
              ],
              answer: 1,
              explain: <>Full evaluation costs <M>{String.raw`O(|\mathcal{S}|^3)`}</M> and pure value iteration can
                need many rounds on hard problems; a moderate k balances informed improvements against evaluation
                cost.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/planning/prioritized-sweeping", label: <>← Prioritized sweeping</> }}
          next={{ href: "/learn/planning/the-cost-of-a-sweep", label: <>Next chapter · The cost of a sweep →</> }}
        />
      </div>
    </article>
  );
}
