import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { GRIDWORLD_SETUP } from "@/lib/runtimeSetup";
import { SweepSpectrum } from "@/components/figures/planning/PlanningDiagrams";
import { MPI_DIAL } from "@/components/figures/planning/data.generated";

export const metadata = {
  title: "Value iteration is truncated policy iteration — Manifold",
  description:
    "The unifying view: value iteration is policy iteration with the evaluation phase cut short to a single sweep. One max backup = one evaluation sweep + one improvement, fused. Why the two algorithms are the same idea.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function ValueIterationIsTruncatedPI() {
  const code = `import numpy as np
P, R = make_goal_grid(); gamma = 0.9
GOAL, PIT = 15, 3

# Version A: one Bellman OPTIMALITY backup (this is value iteration's sweep).
def vi_sweep(V):
    nV = (R + gamma * (P @ V)).max(1); nV[[GOAL, PIT]] = 0.0
    return nV

# Version B: make the policy greedy, then do ONE expectation sweep with it.
def truncated_pi_sweep(V):
    a = (R + gamma * (P @ V)).argmax(1)              # improve: greedy policy
    q = R[np.arange(nS), a] + gamma * (P[np.arange(nS), a] @ V)  # evaluate: 1 sweep
    nV = q.copy(); nV[[GOAL, PIT]] = 0.0
    return nV

# run both from the same random start and compare, sweep for sweep
Va = np.random.default_rng(0).normal(size=nS); Vb = Va.copy()
for _ in range(30):
    Va = vi_sweep(Va); Vb = truncated_pi_sweep(Vb)
print("value iteration and 1-sweep policy iteration agree:", np.allclose(Va, Vb))`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Theory", color: GOLD }]}
        time="about 7 minutes"
        title={<>Value iteration is <em>truncated</em> policy iteration</>}
        intro={<>The two algorithms look like rivals — one solves a linear system each round, the other just takes a
          max. But they are the same algorithm seen at two settings. Value iteration is exactly policy iteration with
          the evaluation phase cut down to a single sweep. Seeing why collapses the whole chapter into one idea.</>}
      />

      <div className="lesson">
        <h2>Unfold one value-iteration sweep</h2>
        <p>
          Take a single value-iteration backup and split the <M>{String.raw`\max`}</M> into the two things it
          secretly does:
        </p>
        <MathBlock>{String.raw`V_{k+1}(s) = \max_a\Big[R(s,a) + \gamma\!\sum_{s'}\!P(s'\mid s,a)V_k(s')\Big] = \underbrace{R(s,\pi'(s)) + \gamma\!\sum_{s'}\!P(s'\mid s,\pi'(s))V_k(s')}_{\text{one evaluation sweep of }\pi'},\quad \pi'(s) = \underbrace{\arg\max_a[\cdots]}_{\text{improvement}}.`}</MathBlock>
        <p>
          Read right to left: the <M>{String.raw`\arg\max`}</M> is a <strong>policy improvement</strong> — it picks
          the greedy action <M>{String.raw`\pi'(s)`}</M>. Then plugging that action back in and evaluating it for{" "}
          <em>one</em> step is a single sweep of <strong>policy evaluation</strong>. A value-iteration backup is an
          improvement and a one-sweep evaluation, fused into a single <M>{String.raw`\max`}</M>. Confirm the two are
          identical sweep for sweep:
        </p>

        <CodeBlock setup={GRIDWORLD_SETUP} fromScratch={code} />
        <CodeOutput>{`value iteration and 1-sweep policy iteration agree: True`}</CodeOutput>
        <p>
          Bit for bit the same. So the difference between the two headline algorithms is <em>not</em> what they do —
          it is <strong>how many evaluation sweeps they run between improvements</strong>. Policy iteration runs
          evaluation to convergence (infinitely many sweeps, in effect); value iteration runs exactly one. Everything
          in between is a valid algorithm too — the subject of{" "}
          <Link href="/learn/planning/modified-policy-iteration" style={link}>modified policy iteration</Link>.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt="If value iteration = policy iteration with 1 evaluation sweep, why does value iteration need MORE total sweeps to converge?"
          options={[
            "It doesn't — it always needs fewer",
            "Each round it improves on a barely-evaluated (rough) value function, so each improvement is less informed and it takes more rounds",
            "Because it uses a max instead of an average",
          ]}
          nudge="Locked in. Cheaper per step, but each step carries less information — the classic trade."
        />

        <h2>The spectrum, named</h2>
        <p>
          One picture now organises the whole track. On a dial labelled &ldquo;evaluation sweeps per
          improvement,&rdquo; <M>k=1</M> is value iteration and <M>{String.raw`k=\infty`}</M> is policy iteration:
        </p>
        <SweepSpectrum
          caption={<>One dial, not two algorithms. The measured cost of each setting on this grid, from{" "}
            <code>scripts/planning_cases.py</code>: at k = 1 the run takes {MPI_DIAL[0].rounds} rounds and{" "}
            {MPI_DIAL[0].sweeps} sweeps; at k = {MPI_DIAL[3].k} it takes {MPI_DIAL[3].rounds} rounds but{" "}
            {MPI_DIAL[3].sweeps} sweeps; at k = {MPI_DIAL[6].k} it is down to {MPI_DIAL[6].rounds} rounds
            and up to {MPI_DIAL[6].sweeps} sweeps. Turning the dial right buys fewer, better-informed
            rounds at a steadily worse total, which is the trade the spectrum is made of.</>}
        />

        <MathBlock>{String.raw`\underbrace{k=1}_{\text{value iteration}} \;\longleftrightarrow\; k=2,3,\dots \;\longleftrightarrow\; \underbrace{k=\infty}_{\text{policy iteration}}.`}</MathBlock>
        <p>
          Small <M>k</M> means cheap, less-informed steps and more of them; large <M>k</M> means expensive,
          well-informed steps and fewer of them. Both ends — and everywhere between — converge to the same{" "}
          <M>{String.raw`V^*`}</M>. Which point on the dial is fastest depends on how expensive an evaluation sweep
          is relative to an improvement, a genuinely practical question we return to.
        </p>

        <Callout color={GOLD} title={<>Why this unification matters</>}>
          Once you see value iteration and policy iteration as one algorithm at two settings, you stop memorising two
          methods and start reasoning about one trade-off. Every dynamic-programming variant — asynchronous updates,
          prioritized sweeping, modified policy iteration, even the model-free methods of the next track — is a
          choice about <em>which states to back up, in what order, and how thoroughly before improving.</em> That is
          the single lens the rest of the track uses.
        </Callout>

        <Proof title="the two sweeps are literally the same operator" color={GOLD}>
          <p>
            Define the improvement map <M>{String.raw`\pi' = \mathcal{G}(V)`}</M> (greedy w.r.t. <M>V</M>) and the
            one-step evaluation operator <M>{String.raw`T^{\pi'}V`}</M> (one Bellman expectation backup under{" "}
            <M>{String.raw`\pi'`}</M>). The value-iteration operator is{" "}
            <M>{String.raw`TV(s) = \max_a[R(s,a)+\gamma\sum_{s'}P(s'\mid s,a)V(s')]`}</M>. For each state the{" "}
            <M>{String.raw`\max`}</M> is attained at <M>{String.raw`\pi'(s) = \mathcal{G}(V)(s)`}</M>, so{" "}
            <M>{String.raw`TV(s) = R(s,\pi'(s)) + \gamma\sum_{s'}P(s'\mid s,\pi'(s))V(s') = (T^{\pi'}V)(s)`}</M>.
            Hence <M>{String.raw`T = T^{\mathcal{G}(V)}`}</M> applied once: value iteration <em>is</em> &ldquo;improve,
            then evaluate one sweep.&rdquo; Iterating <M>{String.raw`T^{\pi'}`}</M> to convergence before
            re-improving instead is policy iteration; stopping the inner loop at <M>k</M> sweeps is modified policy
            iteration. All three are the same two operators, composed in different proportions — which is why they
            share the fixed point <M>{String.raw`V^*`}</M>.
          </p>
        </Proof>

        <PrevNext
          prev={{ href: "/learn/planning/value-iteration", label: <>← Value iteration</> }}
          next={{ href: "/learn/planning/knowing-when-to-stop", label: <>Next · Knowing when to stop →</> }}
        />
      </div>
    </article>
  );
}
