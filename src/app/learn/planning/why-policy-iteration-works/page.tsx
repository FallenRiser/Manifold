import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { GRIDWORLD_SETUP } from "@/lib/runtimeSetup";
import { ValueStaircase } from "@/components/figures/planning/PlanningCharts";
import { PI_TOTALS } from "@/components/figures/planning/data.generated";

export const metadata = {
  title: "Why policy iteration reaches the optimum — Manifold",
  description:
    "Policy iteration is guaranteed to terminate at the optimal policy: each step strictly improves the policy (monotone), and there are only finitely many deterministic policies, so it cannot climb forever. The full argument, and a numerical check of monotonicity.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function WhyPolicyIterationWorks() {
  const code = `import numpy as np
P, R = make_goal_grid(); gamma = 0.9
GOAL, PIT = 15, 3
nonterm = [s for s in range(nS) if s not in (GOAL, PIT)]
def evaluate(pi):
    Ppi = np.einsum('sa,sat->st', pi, P); Rpi = (pi * R).sum(1)
    V = np.zeros(nS)
    V[nonterm] = np.linalg.solve(np.eye(len(nonterm)) - gamma * Ppi[np.ix_(nonterm, nonterm)], Rpi[nonterm])
    return V
def greedy(V):
    a = (R + gamma * (P @ V)).argmax(1)
    pi = np.zeros((nS, nA)); pi[np.arange(nS), a] = 1.0
    return pi, a

# Track the total value each round — it must never go down.
pi = np.full((nS, nA), 1.0 / nA); prev_a = None
for i in range(1, 8):
    V = evaluate(pi)
    print(f"round {i}: sum of state-values = {round(float(V[nonterm].sum()), 3)}")
    pi, a = greedy(V)
    if prev_a is not None and np.array_equal(prev_a, a):
        break
    prev_a = a`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Theory", color: GOLD }]}
        time="about 8 minutes"
        title={<>Why it reaches the <em>optimum</em></>}
        intro={<>Policy iteration does not merely tend toward good policies or converge in the limit — it lands
          exactly on the optimal policy, in a finite number of steps, guaranteed. The proof is short and worth
          holding onto, because it rests on two facts that are each easy to see: every step goes uphill, and there
          are only so many hills.</>}
      />

      <div className="lesson">
        <h2>Two facts, one conclusion</h2>
        <p>
          The guarantee stands on a pair of observations:
        </p>
        <ul>
          <li>
            <strong>Monotone improvement.</strong> By the policy improvement theorem, each round produces{" "}
            <M>{String.raw`V^{\pi_{k+1}} \ge V^{\pi_k}`}</M> in every state — and <em>strictly</em> greater in at
            least one, unless the policy didn&rsquo;t change. The sequence of policies climbs.
          </li>
          <li>
            <strong>A finite ceiling.</strong> A deterministic policy is a choice of one action per state, so there
            are only <M>{String.raw`|\mathcal{A}|^{|\mathcal{S}|}`}</M> of them — a huge number, but finite. You
            cannot strictly improve forever within a finite set.
          </li>
        </ul>
        <p>
          Put them together: the policies strictly improve until they can&rsquo;t, and &ldquo;can&rsquo;t
          improve&rdquo; is exactly the condition <M>{String.raw`\pi_{k+1} = \pi_k`}</M>, which means the greedy
          policy equals the current one, which means the Bellman optimality equation holds, which means the policy
          is optimal. Termination and optimality are the same event.
        </p>

        <CodeBlock setup={GRIDWORLD_SETUP} fromScratch={code} />
        <CodeOutput>{`round 1: sum of state-values = -3.652
round 2: sum of state-values = 10.108
round 3: sum of state-values = 10.108`}</CodeOutput>
        <p>
          The total value leaps from <M>{String.raw`-3.65`}</M> to <M>{String.raw`10.11`}</M> and then holds — round
          3 is identical to round 2, the tell that the policy has stopped changing and the optimum is reached. The
          climb is monotone (it never dips) and it halts the instant improvement stalls.
        </p>

        <Callout color={GOLD} title={<>No local optima to get stuck in</>}>
          This is the quiet miracle of dynamic programming. In most of optimisation, &ldquo;always go uphill&rdquo;
          strands you at a local peak. Here, the only policy that greedy improvement cannot escape is the{" "}
          <em>global</em> optimum — because being un-improvable is identical to satisfying the Bellman optimality
          equation, whose unique solution is <M>{String.raw`V^*`}</M>. The structure of the problem rules local
          optima out entirely.
        </Callout>

        <ValueStaircase
          totals={PI_TOTALS}
          caption={<>The monotone climb the proof guarantees, drawn. The bar for round 1 is the random
            policy and it is below zero; round 2 is above it everywhere; round 3 is the same bar again,
            drawn hollow — no change, which is precisely the termination condition. &ldquo;The sequence
            climbs and there are finitely many hills&rdquo; is this picture, and the flat top is the
            algorithm stopping.</>}
        />

        <h2>How high can the ceiling actually bite?</h2>
        <p>
          The <M>{String.raw`|\mathcal{A}|^{|\mathcal{S}|}`}</M> bound guarantees <em>finiteness</em> but is
          absurdly loose — it would allow hundreds of millions of steps on our 14-cell grid, and we saw{" "}
          <strong>three</strong>. That gap between the worst-case bound and reality is the subject of the next page,
          and it turns out policy iteration is dramatically faster than &ldquo;finite&rdquo; suggests.
        </p>

        <Proof title="the full termination argument" color={GOLD}>
          <p>
            Let <M>{String.raw`\pi_{k+1}`}</M> be greedy w.r.t. <M>{String.raw`V^{\pi_k}`}</M>. The policy
            improvement theorem gives <M>{String.raw`V^{\pi_{k+1}} \ge V^{\pi_k}`}</M> componentwise. Two cases:
          </p>
          <p>
            <strong>Case 1 — the policy changed.</strong> Then in some state <M>s</M> the greedy action strictly
            beats the old one, <M>{String.raw`\max_a Q^{\pi_k}(s,a) > V^{\pi_k}(s)`}</M>, and the telescoping
            argument makes this a <em>strict</em> increase: <M>{String.raw`V^{\pi_{k+1}}(s) > V^{\pi_k}(s)`}</M>. So
            a distinct, better policy is produced. Since the values strictly increase, no policy can ever repeat —
            you never revisit one you have left.
          </p>
          <p>
            <strong>Case 2 — the policy did not change.</strong> Then <M>{String.raw`\pi_k(s) = \arg\max_a Q^{\pi_k}(s,a)`}</M>{" "}
            for all <M>s</M>, so <M>{String.raw`V^{\pi_k}(s) = \max_a [R(s,a) + \gamma\sum_{s'}P(s'\mid s,a)V^{\pi_k}(s')]`}</M>{" "}
            — this is the Bellman optimality equation. Its unique solution is <M>{String.raw`V^*`}</M>, so{" "}
            <M>{String.raw`V^{\pi_k} = V^*`}</M> and <M>{String.raw`\pi_k`}</M> is optimal.
          </p>
          <p>
            Because there are only finitely many deterministic policies and none can repeat (Case 1), Case 2 must
            occur after finitely many rounds. At that point the algorithm halts, having found the exact optimum —
            not an approximation. That last point is worth savouring: unlike value iteration, policy iteration
            reaches <M>{String.raw`\pi^*`}</M> <em>exactly</em>, in finite time, with a clean stopping test (the
            policy stopped changing).
          </p>
        </Proof>

        <PrevNext
          prev={{ href: "/learn/planning/policy-iteration", label: <>← Policy iteration</> }}
          next={{ href: "/learn/planning/watching-policy-iteration", label: <>Next · Watching it run →</> }}
        />
      </div>
    </article>
  );
}
