import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { GRIDWORLD_SETUP } from "@/lib/runtimeSetup";
import { GridRow, TERMINALS_ONLY } from "@/components/figures/planning/GridField";
import { SWEEP_SCHEDULES } from "@/components/figures/planning/data.generated";

export const metadata = {
  title: "Asynchronous dynamic programming — Manifold",
  description:
    "You don't have to update every state in lockstep. In-place (Gauss-Seidel) updates use fresh values immediately, and a good sweep order can converge dramatically faster — as long as every state keeps being visited.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function AsynchronousDP() {
  const code = `import numpy as np
P, R = build_gridworld(step_reward=-0.04, terminals=(15, 3), terminal_reward={15: 1.0, 3: -1.0})
gamma = 0.9; TERMS = [15, 3]

def jacobi():                              # classic sweep: all states from OLD values
    V = np.zeros(nS)
    for k in range(1, 10000):
        nV = (R + gamma * (P @ V)).max(1); nV[TERMS] = 0.0
        if np.max(np.abs(nV - V)) < 1e-9: return k
        V = nV

def in_place(order):                       # update states one at a time, using fresh values
    V = np.zeros(nS)
    for k in range(1, 10000):
        delta = 0.0
        for s in order:
            if s in TERMS: continue
            q = (R[s] + gamma * (P[s] @ V)).max()   # reads already-updated neighbours
            delta = max(delta, abs(q - V[s])); V[s] = q
        if delta < 1e-9: return k

print("Jacobi (all at once)      :", jacobi(), "sweeps")
print("in-place, forward 0..15   :", in_place(range(nS)), "sweeps")
print("in-place, reverse 15..0   :", in_place(range(nS - 1, -1, -1)), "sweeps")`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 8 minutes"
        title={<>Asynchronous dynamic programming</>}
        intro={<>Every algorithm so far updated all states together, each sweep reading only the <em>previous</em>{" "}
          sweep&rsquo;s values. That lockstep is a convenience, not a requirement. If you update states one at a time
          and let each read the freshest values available, information races across the grid far faster — and the
          order you choose can make the difference between seven sweeps and two.</>}
      />

      <div className="lesson">
        <h2>Lockstep is optional</h2>
        <p>
          The standard sweep is <strong>Jacobi-style</strong>: compute all new values from the old array, then swap.
          The alternative is <strong>in-place</strong> (Gauss-Seidel): overwrite each state&rsquo;s value the moment
          you compute it, so later states in the same sweep already see the updates. Same backup, same fixed point —
          but freshly-updated neighbours mean information propagates <em>within</em> a sweep, not just between sweeps.
          And once updates are in-place, the <em>order</em> starts to matter:
        </p>

        <CodeBlock setup={GRIDWORLD_SETUP} fromScratch={code} />
        <CodeOutput>{`Jacobi (all at once)      : 7 sweeps
in-place, forward 0..15   : 7 sweeps
in-place, reverse 15..0   : 2 sweeps`}</CodeOutput>
        <p>
          Sweeping <em>backward</em> from the goal converges in <strong>two</strong> sweeps instead of seven. The
          reason is beautiful: value flows <em>outward</em> from the goal at cell 15, so if you update in the order
          15, 14, 13, … each state is backed up right after the neighbour it depends on has already been updated —
          one pass carries the goal&rsquo;s value almost all the way across the grid. Forward order fights the flow
          and gains nothing over Jacobi. The backup is identical; only the schedule changed.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt="Reverse order converged in 2 sweeps here. Would the same order be best on a different world?"
          options={[
            "Yes — reverse order is always fastest",
            "No — the best order follows each problem's value flow (from goals outward); there's no universally best order",
            "Order never matters for correctness",
          ]}
          nudge="Locked in. The win came from matching the order to where value originates — that's problem-specific."
        />

        <GridRow
          mode="count"
          scale={7}
          grids={SWEEP_SCHEDULES.map((s) => ({
            values: s.settled.map((v) => (v < 0 ? 0 : v)),
            policy: TERMINALS_ONLY,
            label: `${s.name} · ${s.sweeps} sweeps`,
          }))}
          caption={<>The same backups in three orders, with each cell labelled by the sweep on which its
            value last moved. Jacobi and forward in-place both crawl: information leaves the goal one
            ring per sweep, so the far corner is still changing on sweep 6. Reverse order sweeps{" "}
            <em>from</em> the goal, so a single pass carries the goal&rsquo;s value all the way across the
            board and every cell is finished at 1. Same arithmetic, same answer, one third of the
            work — and nothing about the order was allowed to change the fixed point.</>}
        />

        <h2>The freedom, and its one rule</h2>
        <p>
          Asynchronous DP takes generalized policy iteration to its logical end: you may back up{" "}
          <em>any single state at any time</em>, in any order, using whatever values are currently stored — no full
          sweeps required. This is what makes DP practical at scale, because you can focus computation on the states
          that matter and skip re-touching states that have already settled. The one non-negotiable condition is the
          one GPI already told us:
        </p>
        <MathBlock>{String.raw`\text{convergence to } V^* \iff \text{every state is backed up infinitely often (none starved forever).}`}</MathBlock>
        <p>
          As long as you keep coming back to every state, you can be as opportunistic as you like about order and
          frequency. That freedom is precisely what the next page — prioritized sweeping — exploits, by spending
          updates where they do the most good.
        </p>

        <Callout color={GOLD} title={<>Why this matters beyond gridworlds</>}>
          On large problems you never want to sweep all states blindly — most are already correct on any given pass.
          Asynchronous DP lets you update a handful of relevant states, interleave planning with acting (the agent
          backs up the states it is actually visiting), and parallelise across machines that each own a slice of the
          state space. Every scalable planner — and much of model-free RL, which backs up one visited state per
          step — is asynchronous DP underneath.
        </Callout>

        <Proof title="why in-place converges, and why order changes the speed but not the answer" color={GOLD}>
          <p>
            <strong>Correctness.</strong> Each in-place backup is an application of the (monotone,{" "}
            <M>{String.raw`\gamma`}</M>-contraction) Bellman operator to one coordinate, using current values.
            Gauss-Seidel iterations of a contraction still converge to the same unique fixed point{" "}
            <M>{String.raw`V^*`}</M> provided every coordinate is updated infinitely often — the fixed point is the
            only value invariant under the backup, regardless of update order, so wherever the process settles must
            be <M>{String.raw`V^*`}</M>.
          </p>
          <p>
            <strong>Speed.</strong> In-place updates can only help: a coordinate that reads an already-improved
            neighbour makes at least as much progress as it would reading the stale value (by monotonicity of the
            backup). The gain is largest when the order follows the dependency structure — here, value originates at
            the goal and propagates to neighbours, so updating from the goal outward means each state sees an
            already-updated successor. A single reverse pass then carries the <M>{String.raw`+1`}</M> across a chain
            of length <M>{String.raw`d`}</M> in one sweep, versus <M>d</M> sweeps for Jacobi. The <em>answer</em> is
            unchanged (same fixed point); only the number of backups to reach it differs.
          </p>
        </Proof>

        <PrevNext
          prev={{ href: "/learn/planning/generalized-policy-iteration", label: <>← Generalized policy iteration</> }}
          next={{ href: "/learn/planning/prioritized-sweeping", label: <>Next · Prioritized sweeping →</> }}
        />
      </div>
    </article>
  );
}
