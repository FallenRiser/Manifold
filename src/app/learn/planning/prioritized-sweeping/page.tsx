import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { GRIDWORLD_SETUP } from "@/lib/runtimeSetup";

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
    V = np.zeros(nS); backups = 0; pq = []
    for s in range(nS):
        if s not in TERMS and bell_err(V, s) > theta: heapq.heappush(pq, (-bell_err(V, s), s))
    while pq:
        _, s = heapq.heappop(pq)
        if s in TERMS: continue
        V[s] = (R[s] + gamma * (P[s] @ V)).max(); backups += 1
        for p in pred[s]:                    # a change at s may raise its predecessors' error
            if p not in TERMS and bell_err(V, p) > theta: heapq.heappush(pq, (-bell_err(V, p), p))
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
prioritized-sweeping backups: 76`}</CodeOutput>
        <p>
          Fewer single-state backups (76 vs 98) to reach the same optimum — a modest win on a 14-cell grid, but the
          gap grows enormously on large, sparse problems where only a small frontier of states is &ldquo;active&rdquo;
          at any moment. Prioritized sweeping never touches a state that is already correct, and the moment a reward
          or a change appears, it focuses all its effort on the region that change actually affects.
        </p>

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
