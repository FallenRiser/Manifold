import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { GRIDWORLD_SETUP } from "@/lib/runtimeSetup";
import { GridRow, TERMINALS_ONLY } from "@/components/figures/planning/GridField";
import { TotalsBar } from "@/components/figures/planning/PlanningCharts";
import { PRIO_ORDER, BACKUP_COUNTS, PRIO_WASTED } from "@/components/figures/planning/data.generated";

export const metadata = {
  title: "Prioritized sweeping — Manifold",
  description:
    "If you can update states in any order, update the ones that matter most first. Prioritized sweeping keeps a queue ordered by Bellman error and propagates changes backward to predecessors — reaching the optimum with fewer backups.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function PrioritizedSweeping() {
  const code = `import numpy as np, heapq
P, R = build_gridworld(step_reward=-0.04, terminals=(15, 3), terminal_reward={15: 1.0, 3: -1.0})
gamma = 0.9; TERMS = [15, 3]
bell_err = lambda V, s: abs((R[s] + gamma * (P[s] @ V)).max() - V[s])

# predecessors: which states can reach s in one step (so a change at s affects them)
pred = {s: set() for s in range(nS)}
for s in range(nS):
    for a in range(nA):
        for s2 in np.flatnonzero(P[s, a]): pred[int(s2)].add(s)

def uniform():                              # in-place sweeps, counting single-state backups
    V = np.zeros(nS); backups = 0
    for _ in range(10000):
        d = 0.0
        for s in range(nS):
            if s in TERMS: continue
            q = (R[s] + gamma * (P[s] @ V)).max(); d = max(d, abs(q - V[s])); V[s] = q; backups += 1
        if d < 1e-9: return backups

def prioritized(theta=1e-9):                # back up the highest-error state first
    V = np.zeros(nS); backups = 0; pq = []; pending = {}

    def push(s):                             # keep only the LARGEST pending priority per state
        e = bell_err(V, s)
        if e > theta and e > pending.get(s, 0.0):
            pending[s] = e; heapq.heappush(pq, (-e, s))

    for s in range(nS):
        if s not in TERMS: push(s)
    while pq:
        negp, s = heapq.heappop(pq)
        if pending.get(s) is None or -negp < pending[s] - 1e-15: continue  # a stale entry
        del pending[s]
        old = V[s]
        V[s] = (R[s] + gamma * (P[s] @ V)).max(); backups += 1
        if abs(V[s] - old) <= theta: continue     # nothing moved, so nothing depends on it
        for p in pred[s]:                         # only NOW are predecessors worth revisiting
            if p not in TERMS: push(p)
    return backups

print("uniform in-place backups   :", uniform())
print("prioritized-sweeping backups:", prioritized())`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 8 minutes"
        title={<>Prioritized sweeping</>}
        intro={<>Asynchronous DP gave you permission to update states in any order. Prioritized sweeping asks the
          obvious follow-up: which order is best? Answer — update the state whose value is currently most wrong, then
          propagate that correction backward to the states that depend on it. Effort flows to where it changes the
          most, and the total work drops.</>}
      />

      <div className="lesson">
        <h2>Spend backups where they matter</h2>
        <p>
          A uniform sweep wastes effort: most states, on most sweeps, barely change — re-backing them up does almost
          nothing. The quantity that says whether a backup is worthwhile is the <strong>Bellman error</strong> at a
          state — how much its value would move if you updated it now:
        </p>
        <MathBlock>{String.raw`e(s) = \Big|\, \max_a\big[R(s,a) + \gamma\sum_{s'}P(s'\mid s,a)V(s')\big] - V(s) \,\Big|.`}</MathBlock>
        <p>
          Prioritized sweeping keeps a priority queue of states ordered by <M>{String.raw`e(s)`}</M>. It repeatedly
          pops the most-wrong state, backs it up, and then — the clever part — checks that state&rsquo;s{" "}
          <strong>predecessors</strong> (the states that can reach it in one step). If backing up <M>s</M> changed
          its value, the states that lead into <M>s</M> now have larger Bellman error, so they get pushed onto the
          queue. Corrections ripple backward along the paths that carry value, exactly where they are needed:
        </p>

        <CodeBlock setup={GRIDWORLD_SETUP} fromScratch={code} />
        <CodeOutput>{`uniform in-place backups   : 98
prioritized-sweeping backups: 14`}</CodeOutput>
        <p>
          Fourteen single-state backups against 98, for the same optimum — and 14 is not an arbitrary number.
          This grid has exactly 14 non-terminal states, so the queue has spent <em>one</em> backup on each,
          in an order it worked out for itself. There was no wasted work left to remove. Prioritized sweeping
          never touches a state that is already correct, and the moment a reward or a change appears, it
          focuses all its effort on the region that change actually affects.
        </p>

        <Callout color={GOLD} title={<>The version this page used to print</>}>
          This page shipped, for a while, with a queue that pushed every predecessor back on after{" "}
          <em>every</em> pop — without checking whether the backup had moved the value, and without
          replacing a state&rsquo;s stale priority when a better one arrived. It reached the same V*, which
          is exactly why nobody noticed: the only symptom was the headline number, which came out at 76
          instead of 14. Sixty-two of those 76 backups recomputed a value that did not change. A scheduling
          idea whose entire claim is &ldquo;don&rsquo;t do unnecessary work&rdquo; was quietly doing five
          times the necessary work, and still looked like a modest success. The two guards added above —{" "}
          <code>if abs(V[s] - old) &lt;= theta: continue</code> and the <code>pending</code> dictionary —
          are the whole difference.
        </Callout>

        <PredictPrompt
          accent={GOLD}
          prompt="Why push a state's PREDECESSORS onto the queue after backing it up (rather than its successors)?"
          options={[
            "Successors are already correct",
            "A change in V(s) alters the backup value of states that transition INTO s — those are its predecessors, so their Bellman error just grew",
            "It's arbitrary — either works",
          ]}
          nudge="Locked in. Value flows backward through the Bellman equation: s's new value changes who depends on s."
        />

        <GridRow
          mode="count"
          scale={14}
          grids={[
            { values: BACKUP_COUNTS[0].counts, policy: TERMINALS_ONLY, label: "uniform: backups per cell", scale: 7 },
            { values: PRIO_ORDER, policy: TERMINALS_ONLY, label: "prioritized: the order cells are backed up" },
          ]}
          caption={<>Left, the uniform schedule spends exactly seven backups on every cell, including the
            ones that were already correct after the first. Right, the priority queue visits each cell
            once, numbered in the order it is popped: 1 and 2 are the goal&rsquo;s two neighbours, and
            the numbers spread outward from there in rings. The queue has reconstructed the reverse
            sweep of the previous page without being told the geometry — it inferred it from where the
            Bellman error was.</>}
        />

        <TotalsBar
          unit=" backups"
          rows={[
            { label: "uniform sweeps", value: PRIO_WASTED.uniform, color: "var(--muted)" },
            { label: "prioritized, as first written", value: PRIO_WASTED.pageTotal, color: "var(--bad)", note: `${PRIO_WASTED.wasted} of these changed nothing` },
            { label: "prioritized, with the queue fixed", value: PRIO_WASTED.textbook, color: "var(--good)", note: "one backup per non-terminal state" },
          ]}
          caption={<>The middle bar is the version this page shipped with, and it is a cautionary tale
            worth keeping. It re-queues every predecessor after every pop, never checks whether the
            backup actually moved the value, and never updates a stale priority — so{" "}
            {PRIO_WASTED.wasted} of its {PRIO_WASTED.pageTotal} backups recompute a number that does not
            change. It still converges, which is exactly why the bug survived: the only symptom is that
            the method appears to save 22% when it in fact saves 86%.</>}
        />

        <h2>Where the idea leads</h2>
        <p>
          Prioritized sweeping is the sharpest expression of the GPI freedom: not just <em>any</em> order, but the{" "}
          <em>best</em> order, chosen on the fly from the Bellman error. It matters most in two settings you will
          meet soon. In <Link href="/learn/planning/real-time-dynamic-programming" style={link}>real-time DP</Link>,
          an agent prioritizes the states it actually encounters. And in model-free learning (the next track),
          prioritized replay — replaying the transitions with the largest TD error first — is this exact idea applied
          to sampled experience, and is a standard ingredient of deep RL systems like DQN.
        </p>

        <Callout color={GOLD} title={<>A hierarchy of schedules</>}>
          Trace the chapter&rsquo;s arc. <strong>Synchronous sweeps</strong> update everything, blindly.{" "}
          <strong>Asynchronous / in-place</strong> updates one state at a time and lets order help.{" "}
          <strong>Prioritized sweeping</strong> chooses that order optimally from the Bellman error, and propagates
          corrections only where they are felt. Each step spends the same kind of backup more wisely — all of it the
          same generalized policy iteration, just with an ever-smarter schedule.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/planning/asynchronous-dp", label: <>← Asynchronous dynamic programming</> }}
          next={{ href: "/learn/planning/modified-policy-iteration", label: <>Next · Modified policy iteration →</> }}
        />
      </div>
    </article>
  );
}
