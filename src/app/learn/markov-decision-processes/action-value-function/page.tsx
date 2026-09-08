import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { ActionValueLab } from "@/components/labs/ActionValueLab";
import { GRIDWORLD_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "The action-value function — Manifold",
  description:
    "Qπ(s,a) is the value of taking action a in s, then following π. Why Q is what you act on, how V and Q relate, the advantage function A = Q − V, and the first glimpse of policy improvement.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function ActionValueFunction() {
  const code = `import numpy as np
# First get Vpi for the random policy (iterate the one-step average to convergence).
gamma = 1.0
V = np.zeros(nS)
for _ in range(1000):
    Q_all = R + gamma * (P @ V)               # Q_all[s,a] = R[s,a] + gamma * sum_s' P V
    V = (random_policy * Q_all).sum(axis=1)   # average over actions -> Vpi

# Now read the action-values at cell 6, and see which action looks best.
q6 = R[6] + gamma * (P[6] @ V)                # Q(6, a) for a = up,right,down,left
for a, name in enumerate(ACTIONS):
    print(f"Q(6, {name:<5}) = {q6[a]:6.1f}   advantage = {q6[a] - V[6]:+.1f}")
print("V(6) =", round(V[6], 1), " -> best action(s):", [ACTIONS[a] for a in np.flatnonzero(np.isclose(q6, q6.max()))])`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Core idea", color: GOLD }]}
        time="about 9 minutes"
        title={<>The action-value function</>}
        intro={<>State-value tells you how good it is to <em>be</em> somewhere. But to act, you need something
          finer: how good is it to <em>take a particular action</em> here? That is the action-value function{" "}
          <M>{String.raw`Q^\pi`}</M> — and it is the quantity almost every RL algorithm actually learns, because
          it lets you choose without ever consulting the model.</>}
      />

      <div className="lesson">
        <h2>Value with the first move pinned down</h2>
        <p>
          The <strong>action-value function</strong> <M>{String.raw`Q^\pi(s,a)`}</M> is the expected return if you
          take action <M>a</M> right now in state <M>s</M>, and follow <M>{String.raw`\pi`}</M> forever after:
        </p>
        <MathBlock>{String.raw`Q^\pi(s,a) = \mathbb{E}_\pi\!\left[\, G_t \mid S_t = s,\, A_t = a \,\right].`}</MathBlock>
        <p>
          The only difference from <M>{String.raw`V^\pi`}</M> is that the first action is fixed at <M>a</M>{" "}
          instead of drawn from the policy. That small change is everything, because it lets you <em>compare
          actions</em> at a state directly — and comparing actions is what choosing is.
        </p>

        <h2>How V and Q fit together</h2>
        <p>
          The two are two views of the same thing, linked by a pair of identities you should be able to write
          from memory. Averaging <M>Q</M> over the policy&rsquo;s action choices gives <M>V</M>:
        </p>
        <MathBlock>{String.raw`V^\pi(s) = \sum_{a}\pi(a\mid s)\,Q^\pi(s,a).`}</MathBlock>
        <p>
          And <M>Q</M> is the immediate reward plus the discounted value of wherever the action lands you:
        </p>
        <MathBlock>{String.raw`Q^\pi(s,a) = R(s,a) + \gamma\sum_{s'}P(s'\mid s,a)\,V^\pi(s').`}</MathBlock>
        <p>
          That second identity is the workhorse: given <M>{String.raw`V^\pi`}</M>, a single one-step lookahead
          turns it into <M>{String.raw`Q^\pi`}</M> for every action. Let&rsquo;s do exactly that at cell 6 under
          the random policy:
        </p>

        <CodeBlock setup={GRIDWORLD_SETUP} fromScratch={code} />
        <CodeOutput>{`Q(6, up   ) =  -21.0   advantage = -1.0
Q(6, right) =  -21.0   advantage = -1.0
Q(6, down ) =  -19.0   advantage = +1.0
Q(6, left ) =  -19.0   advantage = +1.0
V(6) = -20.0  -> best action(s): ['down', 'left']`}</CodeOutput>
        <p>
          Under the random policy, <M>{String.raw`V(6) = -20`}</M> — but the four actions are <em>not</em> equally
          good from there. <code>down</code> and <code>left</code> score −19, <code>up</code> and{" "}
          <code>right</code> score −21. The policy is averaging over choices that differ by 2 in value. And notice
          the average of the four <M>Q</M>-values is exactly <M>{String.raw`V(6) = -20`}</M> — the identity above,
          confirmed.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt="At cell 6, the random policy takes each action ¼ of the time, but down/left are worth 2 more than up/right. What should you do with that information?"
          options={[
            "Nothing — the policy is fixed",
            "Build a better policy that always picks the higher-Q action (down or left) at cell 6",
            "Lower the discount factor",
          ]}
          nudge="Locked in. This is the seed of the whole method for finding the best policy."
        />

        <h2>The advantage function</h2>
        <p>
          The gap between an action&rsquo;s value and the state&rsquo;s value has its own name — the{" "}
          <strong>advantage</strong>:
        </p>
        <MathBlock>{String.raw`A^\pi(s,a) = Q^\pi(s,a) - V^\pi(s).`}</MathBlock>
        <p>
          It answers &ldquo;how much better than average is this action, here?&rdquo; At cell 6, <code>down</code>{" "}
          has advantage +1 and <code>up</code> has −1. A positive advantage means an action beats the
          policy&rsquo;s current habit — a direct instruction for how to improve. Advantage shows up all over
          modern RL (it is the signal actor–critic methods learn from) precisely because it strips away the part
          of the value that the action can&rsquo;t change and keeps only the part it can.
        </p>

        <LabFrame
          accent={GOLD}
          tryThis={<>Click <strong>cell 6</strong> and read the four bars against the black <M>{String.raw`V(s)`}</M>{" "}
            line: under the <strong>random policy</strong> the line sits at the <em>average</em> of the bars, and{" "}
            <code>down</code>/<code>left</code> poke past it (advantage +1) while <code>up</code>/<code>right</code>{" "}
            fall short (−1). Now switch to the <strong>optimal policy</strong> — the line jumps to the <em>best</em>{" "}
            bar, so every advantage is ≤ 0 and only the starred action touches it. Click other cells and drag{" "}
            <M>{String.raw`\gamma`}</M> to watch the bars re-rank.</>}
          insight={<>The picture <em>is</em> the two identities. <strong>Random policy:</strong>{" "}
            <M>{String.raw`V = \sum_a \pi(a\mid s)Q`}</M>, an average — the line is the mean of the bars.{" "}
            <strong>Optimal policy:</strong> <M>{String.raw`V = \max_a Q`}</M> — the line is the tallest bar.
            Advantage is the signed gap to the line, and the greedy policy is simply &ldquo;pick the longest
            bar&rdquo; — the <M>{String.raw`\arg\max`}</M> you can read off Q with no model at all.</>}
        >
          <ActionValueLab />
        </LabFrame>

        <Callout color={GOLD} title={<>Why Q is what agents learn</>}>
          To act greedily from <M>{String.raw`V`}</M> you need the model — you must look ahead through{" "}
          <M>P</M> and <M>R</M> to see where each action leads. But if you know <M>{String.raw`Q`}</M> directly,
          you just take <M>{String.raw`\arg\max_a Q(s,a)`}</M> — no model required. That is why model-free
          methods (Q-learning, SARSA, the whole next-but-one track) learn <M>Q</M> rather than <M>V</M>: it puts
          the choice one step closer, right where the decision is made.
        </Callout>

        <Proof title="the two identities, from the definition" color={GOLD}>
          <p>
            Start from <M>{String.raw`Q^\pi(s,a) = \mathbb{E}_\pi[G_t \mid S_t=s, A_t=a]`}</M>. Split the return{" "}
            <M>{String.raw`G_t = R_{t+1} + \gamma G_{t+1}`}</M>. The first term averages to <M>{String.raw`R(s,a)`}</M>.
            For the second, taking action <M>a</M> lands you in <M>{String.raw`s'`}</M> with probability{" "}
            <M>{String.raw`P(s'\mid s,a)`}</M>, and from there you follow <M>{String.raw`\pi`}</M>, so the expected
            future return is <M>{String.raw`V^\pi(s')`}</M> — giving{" "}
            <M>{String.raw`Q^\pi(s,a) = R(s,a) + \gamma\sum_{s'}P(s'\mid s,a)V^\pi(s')`}</M>. And since the policy
            picks <M>a</M> with probability <M>{String.raw`\pi(a\mid s)`}</M>, averaging{" "}
            <M>{String.raw`Q^\pi(s,\cdot)`}</M> over those probabilities recovers{" "}
            <M>{String.raw`V^\pi(s) = \sum_a \pi(a\mid s)Q^\pi(s,a)`}</M>. Substitute one into the other and you
            get a single equation relating <M>{String.raw`V^\pi`}</M> to itself — which is where we go next.
          </p>
        </Proof>

        <PrevNext
          prev={{ href: "/learn/markov-decision-processes/state-value-function", label: <>← The state-value function</> }}
          next={{ href: "/learn/markov-decision-processes/bellman-expectation", label: <>Next · The Bellman expectation equation →</> }}
        />
      </div>
    </article>
  );
}
