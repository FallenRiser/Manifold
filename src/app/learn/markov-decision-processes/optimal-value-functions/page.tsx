import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { MdpSandboxLab } from "@/components/labs/MdpSandboxLab";
import { GRIDWORLD_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "What “best” means — Manifold",
  description:
    "Defining optimality: V* and Q* are the best value achievable by any policy, state by state. Why a single policy can be best everywhere at once, and the partial order that makes 'best' well-defined.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function OptimalValueFunctions() {
  const code = `import numpy as np
gamma = 1.0
# V*(s) = best achievable value at s. We exhibit it by repeatedly taking the BEST
# action's backup instead of averaging (the Bellman OPTIMALITY backup, next page;
# studied as the "value iteration" algorithm in the Planning track).
V = np.zeros(nS)
for _ in range(200):
    V = np.where(np.isin(np.arange(nS), TERMINALS), 0.0, (R + gamma * (P @ V)).max(axis=1))

# compare against the random policy's value from the last chapter
Vr = np.zeros(nS)
for _ in range(3000):
    Vr = (random_policy * (R + gamma * (P @ Vr))).sum(axis=1)

print("V* (optimal):"); show(V)
print("V*(6) =", round(V[6], 1), "  vs  V_random(6) =", round(Vr[6], 1))
print("biggest gap V* - V_random:", round(float((V - Vr).max()), 1))`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 8 minutes"
        title={<>What &ldquo;<em>best</em>&rdquo; means</>}
        intro={<>We can now score any policy. The obvious next question is: which policy is the <em>best</em>? To
          answer it we need to say precisely what &ldquo;best&rdquo; means when there are many policies and many
          states — and then confront a small miracle, that in an MDP a single policy can be best in every state
          at once.</>}
      />

      <div className="lesson">
        <h2>The optimal value functions</h2>
        <p>
          Define the <strong>optimal state-value function</strong> as the best value any policy can achieve, at
          each state:
        </p>
        <MathBlock>{String.raw`V^*(s) = \max_{\pi} V^\pi(s), \qquad Q^*(s,a) = \max_{\pi} Q^\pi(s,a).`}</MathBlock>
        <p>
          <M>{String.raw`V^*(s)`}</M> is the most total reward you could possibly expect starting from <M>s</M>,
          if you played perfectly. <M>{String.raw`Q^*(s,a)`}</M> is the best you could do having committed to
          action <M>a</M> first. An <strong>optimal policy</strong> <M>{String.raw`\pi^*`}</M> is any policy that
          attains these values. Let&rsquo;s look at <M>{String.raw`V^*`}</M> on the gridworld and set it beside
          the random policy&rsquo;s values from the last chapter:
        </p>

        <CodeBlock setup={GRIDWORLD_SETUP} fromScratch={code} />
        <CodeOutput>{`V* (optimal):
  0.00   -1.00   -2.00   -3.00
 -1.00   -2.00   -3.00   -2.00
 -2.00   -3.00   -2.00   -1.00
 -3.00   -2.00   -1.00    0.00
V*(6) = -3.0   vs  V_random(6) = -20.0
biggest gap V* - V_random: 19.0`}</CodeOutput>
        <p>
          Every cell&rsquo;s optimal value is just the negative of the shortest distance to a goal — of course,
          since each step costs −1 and the best you can do is take the fewest steps. Cell 6 is worth{" "}
          <strong>−3</strong> under optimal play versus <strong>−20</strong> under the random walk: the same
          state, valued nearly seven times better, purely by acting well. The largest gap between playing
          perfectly and flailing is a full <strong>19</strong> points of return.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt="Could it happen that policy A is best for state 6 while a different policy B is best for state 9 — so no single policy is best everywhere?"
          options={[
            "Yes — different states can require different, conflicting policies",
            "No — in an MDP there is always a single policy that is optimal in every state simultaneously",
            "Only if the MDP is deterministic",
          ]}
          nudge="Locked in. This is the fact that makes 'the optimal policy' a sensible phrase at all."
        />

        <h2>Why one policy can win everywhere</h2>
        <p>
          It is not obvious that a single policy can be optimal in <em>every</em> state at once — you might fear a
          tug-of-war, where being best at one state forces you to be worse at another. The remarkable theorem is
          that this never happens in an MDP. Define a partial order on policies:{" "}
          <M>{String.raw`\pi \ge \pi'`}</M> if <M>{String.raw`V^\pi(s) \ge V^{\pi'}(s)`}</M> for{" "}
          <em>every</em> state <M>s</M>. Then:
        </p>
        <Callout color={GOLD} title={<>The optimal-policy theorem</>}>
          For any MDP, there exists at least one policy <M>{String.raw`\pi^*`}</M> that is better than or equal
          to every other policy — <M>{String.raw`\pi^* \ge \pi`}</M> for all <M>{String.raw`\pi`}</M>. All optimal
          policies share the same optimal value functions <M>{String.raw`V^*`}</M> and <M>{String.raw`Q^*`}</M>.
          And there is always an optimal policy that is <strong>deterministic</strong>. So &ldquo;the optimal
          policy&rdquo; is a legitimate phrase — you never have to choose which state to be good at.
        </Callout>
        <p>
          The reason, which the last page of this chapter makes rigorous, is that value at a state already folds
          in everything that happens downstream. Acting to maximise <M>{String.raw`V^*`}</M> locally — always
          stepping toward the highest-valued next state — turns out to maximise it globally, with no conflict
          between states. That is why we can hunt for <em>one</em> best policy rather than a patchwork.
        </p>

        <LabFrame
          accent={GOLD}
          tryThis={<>Build your own world. Paint a <strong>goal</strong> somewhere new and watch every arrow re-point at
            it. Drop a <strong>wall</strong> across the short path and see the policy route around it. Then raise the{" "}
            <strong>slip</strong> and drag the <strong>discount γ</strong> — the whole optimal policy shifts under your
            hands.</>}
          insight={<>&ldquo;The optimal policy&rdquo; is not a fixed object — it is a property of the world, the rewards
            and the discount together. Value iteration (the algorithm quietly re-solving on every edit here) recovers it
            for <em>any</em> MDP you draw, which is exactly why we chase <M>{String.raw`V^*`}</M> rather than enumerate
            policies.</>}
        >
          <MdpSandboxLab />
        </LabFrame>

        <h2>How we&rsquo;ll actually find it</h2>
        <p>
          Notice the code found <M>{String.raw`V^*`}</M> without ever enumerating policies — it couldn&rsquo;t,
          since there are <M>{String.raw`4^{14}`}</M> deterministic ones on this grid alone. Instead it iterated a
          backup that takes the <em>best</em> action at each step rather than averaging over the policy. That one
          change — <M>{String.raw`\max`}</M> in place of the policy average — is the <strong>Bellman optimality
          equation</strong>, the equation <M>{String.raw`V^*`}</M> secretly satisfies and the subject of the next
          page. Once we have it, computing optimal behaviour is within reach.
        </p>

        <PrevNext
          prev={{ href: "/learn/markov-decision-processes/solving-bellman-exactly", label: <>← Solving Bellman exactly</> }}
          next={{ href: "/learn/markov-decision-processes/bellman-optimality", label: <>Next · The Bellman optimality equation →</> }}
        />
      </div>
    </article>
  );
}
