import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { Quiz } from "@/components/Quiz";
import { GRIDWORLD_SETUP } from "@/lib/runtimeSetup";
import { PolicyVsValues } from "@/components/figures/planning/PlanningCharts";
import { HOWMANY_OPTIMAL, HOWMANY_VALUE_ERROR } from "@/components/figures/planning/data.generated";

export const metadata = {
  title: "How few iterations it takes — Manifold",
  description:
    "Policy iteration converges in remarkably few steps. The classic Sutton & Barto demonstration that the greedy policy becomes optimal long before the value function does, and the modern strongly-polynomial bounds.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function HowManyIterations() {
  const code = `import numpy as np
# The classic Sutton & Barto Example 4.1 grid (the default P, R, gamma=1 here).
# Iteratively EVALUATE the random policy, and after each sweep check: is the policy
# that's GREEDY w.r.t. the current values already optimal?
Ppi = np.einsum('sa,sat->st', random_policy, P)
Rpi = (random_policy * R).sum(1)

# first compute the true optimal action-set for comparison
Vstar = np.zeros(nS)
for _ in range(1000):
    nV = (R + gamma * (P @ Vstar)).max(1); nV[TERMINALS] = 0.0
    if np.max(np.abs(nV - Vstar)) < 1e-12: break
    Vstar = nV
Qstar = R + gamma * (P @ Vstar)
opt = [set(np.flatnonzero(np.isclose(Qstar[s], Qstar[s].max()))) for s in range(nS)]

V = np.zeros(nS)
for k in range(0, 8):
    greedy_a = (R + gamma * (P @ V)).argmax(1)
    is_opt = all(greedy_a[s] in opt[s] for s in range(nS) if s not in TERMINALS)
    print(f"after {k} evaluation sweeps: greedy policy optimal? {is_opt}")
    V = Rpi + gamma * (Ppi @ V); V[TERMINALS] = 0.0`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Theory", color: GOLD }]}
        time="about 8 minutes"
        title={<>How few iterations it takes</>}
        intro={<>The worst-case bound on policy iteration is a finite but astronomical{" "}
          <M>{String.raw`|\mathcal{A}|^{|\mathcal{S}|}`}</M>. Reality is nothing like that. In practice policy
          iteration finishes in a handful of steps — and there is a beautiful reason, visible in a classic
          experiment: the optimal <em>policy</em> emerges long before the <em>values</em> have finished settling.</>}
      />

      <div className="lesson">
        <h2>The policy is coarser than the values</h2>
        <p>
          A value function is a real number per state — an infinitely fine object that only reaches its exact value
          in the limit. A policy is far coarser: it only needs to get the <em>ranking</em> of actions right, not
          their exact values. And rankings stabilise early. Long before the numbers stop moving, the{" "}
          <em>ordering</em> of a state&rsquo;s actions — which neighbour is best — has locked in, and that is all the
          greedy policy cares about.
        </p>
        <p>
          The most famous illustration is Sutton &amp; Barto&rsquo;s Example 4.1, on the plain{" "}
          <M>{String.raw`4\times4`}</M> grid (two terminal corners, <M>{String.raw`-1`}</M> per step). Evaluate the
          random policy sweep by sweep, and at each step ask: if we acted greedily on the values <em>so far</em>,
          would that policy already be optimal?
        </p>

        <CodeBlock setup={GRIDWORLD_SETUP} fromScratch={code} />
        <CodeOutput>{`after 0 evaluation sweeps: greedy policy optimal? False
after 1 evaluation sweeps: greedy policy optimal? False
after 2 evaluation sweeps: greedy policy optimal? False
after 3 evaluation sweeps: greedy policy optimal? True
after 4 evaluation sweeps: greedy policy optimal? True
after 5 evaluation sweeps: greedy policy optimal? True
after 6 evaluation sweeps: greedy policy optimal? True`}</CodeOutput>
        <p>
          After just <strong>three</strong> sweeps of evaluating the <em>random</em> policy, the greedy policy is
          already optimal — even though the values themselves take on the order of <strong>150 more sweeps</strong>{" "}
          to converge to <M>{String.raw`V^\pi`}</M>. The policy was correct 50&times; earlier than the numbers. This
          is why policy iteration is so fast: each improvement step is drawing on a value function that only needs
          to be roughly right, and &ldquo;roughly right&rdquo; arrives almost immediately.
        </p>

        <Callout color={GOLD} title={<>This is the seed of two later ideas</>}>
          If the greedy policy is optimal long before the values converge, why evaluate to convergence at all?
          That question splits into two of this track&rsquo;s later pages. <strong>Value iteration</strong> takes
          it to the extreme — evaluate for a single sweep, then improve. <strong>Modified policy iteration</strong>{" "}
          sits in between, evaluating a few sweeps per improvement. Both are motivated by exactly the gap you just
          saw between the policy and the values.
        </Callout>

        <PolicyVsValues
          optimal={HOWMANY_OPTIMAL}
          error={HOWMANY_VALUE_ERROR}
          caption={<>The policy is coarser than the values, and this page&rsquo;s grid makes the point
            more sharply than &ldquo;it settles earlier&rdquo;. The strip turns green after three sweeps
            and never turns back. The curve above it is how far the values still are from V*, and it is
            going <em>up</em> — because these sweeps are evaluating the random policy, so they converge
            to Vπ, not to V*. The values are heading somewhere else entirely and the greedy policy on
            top of them is optimal anyway. Only the ordering of the actions matters, and the ordering is
            right long before the numbers are.</>}
        />

        <h2>What the theory says</h2>
        <p>
          The intuition is backed by real bounds. Policy iteration converges at least as fast as value iteration,
          so the number of iterations is <M>{String.raw`O\!\left(\frac{1}{1-\gamma}\log\frac{1}{1-\gamma}\right)`}</M>{" "}
          for a fixed discount — independent of the number of states. More strikingly, Ye (2011) proved policy
          iteration is <strong>strongly polynomial</strong> for a fixed <M>{String.raw`\gamma`}</M>: the number of
          improvement steps is bounded by a polynomial in <M>{String.raw`|\mathcal{S}|`}</M> and{" "}
          <M>{String.raw`|\mathcal{A}|`}</M> alone, with no dependence on the reward magnitudes or the required
          precision. The <M>{String.raw`|\mathcal{A}|^{|\mathcal{S}|}`}</M> ceiling is never remotely approached.
        </p>

        <Proof title="why policy iteration is at least as fast as value iteration" color={GOLD}>
          <p>
            Let <M>{String.raw`\pi_k`}</M> be the policy after <M>k</M> rounds of policy iteration and{" "}
            <M>{String.raw`V_k`}</M> the value after <M>k</M> sweeps of value iteration, both from the same start.
            One can show by induction that <M>{String.raw`V^{\pi_k} \ge V_k`}</M> componentwise: each policy-iteration
            round performs a full evaluation, which is <em>at least</em> as much progress as value iteration&rsquo;s
            single optimality backup. Since value iteration contracts the error by <M>{String.raw`\gamma`}</M> per
            sweep, <M>{String.raw`\lVert V_k - V^*\rVert_\infty \le \gamma^k \lVert V_0 - V^*\rVert_\infty`}</M>, and
            policy iteration&rsquo;s error is no larger. To drive the error below a threshold that distinguishes the
            optimal policy from the next-best (a fixed gap for a finite MDP), you need only{" "}
            <M>{String.raw`k = O\!\big(\frac{1}{1-\gamma}\log\frac{1}{1-\gamma}\big)`}</M> rounds — and typically far
            fewer, because, as the experiment shows, the policy locks in well before the values do. The exact
            stopping test (the policy stopped changing) means policy iteration <em>halts</em> at that point rather
            than merely getting close.
          </p>
        </Proof>

        <Quiz
          accent={GOLD}
          title="Chapter checkpoint"
          questions={[
            {
              q: <>On the Sutton grid, the greedy policy was optimal after 3 evaluation sweeps but the values took ~150 more. Why?</>,
              options: [
                "The values were computed wrong",
                "A policy only needs the correct ranking of actions, which stabilises long before the exact values do",
                "γ was too large",
              ],
              answer: 1,
              explain: <>Greedy improvement depends only on which action ranks highest, not on the precise value.
                Rankings settle early; the fine numerical values take far longer. The policy is the coarser, faster
                object.</>,
            },
            {
              q: <>What is the worst-case ceiling on policy iteration, and how tight is it in practice?</>,
              options: [
                "|A|^|S| — and it is usually reached",
                "|A|^|S| — but it is absurdly loose; real runs finish in a handful of steps (strongly polynomial for fixed γ)",
                "Infinite — it may not terminate",
              ],
              answer: 1,
              explain: <>Finiteness comes from the <M>{String.raw`|\mathcal{A}|^{|\mathcal{S}|}`}</M> policy count,
                but actual convergence is polynomial in the problem size (Ye 2011) and empirically tiny.</>,
            },
            {
              q: <>Why does &ldquo;policy optimal before values converge&rdquo; motivate value iteration?</>,
              options: [
                "It suggests you should evaluate more thoroughly",
                "If a rough value function already yields the optimal policy, there's no need to evaluate fully before improving — so evaluate just one sweep",
                "It proves value iteration is exact",
              ],
              answer: 1,
              explain: <>The gap between policy and values says full evaluation is wasted effort. Value iteration
                takes the hint to its limit: a single evaluation sweep between improvements.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/planning/watching-policy-iteration", label: <>← Watching it run</> }}
          next={{ href: "/learn/planning/value-iteration", label: <>Next chapter · Value iteration →</> }}
        />
      </div>
    </article>
  );
}
