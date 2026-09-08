import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { Quiz } from "@/components/Quiz";
import { Backlinks } from "@/components/Backlinks";
import { LabFrame } from "@/components/LabFrame";
import { ContractionFlowLab } from "@/components/labs/ContractionFlowLab";
import { GRIDWORLD_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "Why an optimal policy exists — Manifold",
  description:
    "The Bellman optimality operator is a γ-contraction in the sup-norm, so by the Banach fixed-point theorem V* exists, is unique, and any starting guess converges to it. The proof, and a numerical demonstration.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function WhyOptimalExists() {
  const code = `import numpy as np
gamma = 0.9
def T(V):                            # the Bellman OPTIMALITY operator
    b = (R + gamma * (P @ V)).max(axis=1); b[TERMINALS] = 0.0; return b

rng = np.random.default_rng(0)
V1, V2 = rng.normal(size=nS) * 10, rng.normal(size=nS) * 10
before = np.max(np.abs(V1 - V2))     # sup-norm distance before a backup
after  = np.max(np.abs(T(V1) - T(V2)))# ...and after
print("||V1 - V2||    =", round(before, 3))
print("||TV1 - TV2||  =", round(after, 3))
print("contraction ratio:", round(after / before, 3), "<= gamma =", gamma)

# consequence: ANY starting guess converges to the one fixed point
A, B = np.zeros(nS), np.ones(nS) * 50
for _ in range(300): A, B = T(A), T(B)
print("different starts -> same V*:", bool(np.allclose(A, B)))`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Theory", color: GOLD }]}
        time="about 10 minutes"
        title={<>Why an optimal policy <em>exists</em></>}
        intro={<>We have leaned on a promise for two pages: that <M>{String.raw`V^*`}</M> exists, is unique, and
          can be reached by iterating a backup. That promise is not wishful — it is a theorem, and a beautiful
          one. The Bellman optimality backup is a <em>contraction</em>, and a single classical result then hands
          us existence, uniqueness, and convergence all at once.</>}
      />

      <div className="lesson">
        <Backlinks items={[{ label: "Convexity & fixed points", href: "/learn/math-foundations/convexity" }]} />

        <h2>The backup is a contraction</h2>
        <p>
          Write the Bellman optimality backup as an operator <M>{String.raw`T`}</M> acting on value functions:{" "}
          <M>{String.raw`(TV)(s) = \max_a[R(s,a) + \gamma\sum_{s'}P(s'\mid s,a)V(s')]`}</M>. Measure the distance
          between two value functions by the <strong>sup-norm</strong> — the largest gap at any single state,{" "}
          <M>{String.raw`\lVert U - V\rVert_\infty = \max_s |U(s) - V(s)|`}</M>. The central fact is:
        </p>
        <MathBlock>{String.raw`\lVert TU - TV\rVert_\infty \;\le\; \gamma\,\lVert U - V\rVert_\infty.`}</MathBlock>
        <p>
          Applying the backup pulls any two value functions <strong>closer together</strong> by a factor of at
          least <M>{String.raw`\gamma`}</M>. It is a <em>γ-contraction</em>. Watch it happen — two random value
          vectors, one backup, and the sup-norm distance shrinks by more than <M>{String.raw`\gamma`}</M>:
        </p>

        <CodeBlock setup={GRIDWORLD_SETUP} fromScratch={code} />
        <CodeOutput>{`||V1 - V2||    = 19.692
||TV1 - TV2||  = 12.952
contraction ratio: 0.658 <= gamma = 0.9
different starts -> same V*: True`}</CodeOutput>
        <p>
          The distance fell from 19.69 to 12.95 — a ratio of 0.658, comfortably under{" "}
          <M>{String.raw`\gamma = 0.9`}</M>. And the punchline: two wildly different starting guesses, iterated
          under the same backup, land on the <em>identical</em> value function. That is not a coincidence of this
          grid; it is forced by the contraction, via the theorem below.
        </p>

        <LabFrame
          accent={GOLD}
          tryThis={<>Six random value functions sit scattered on the plane. Press <strong>▶ Contract</strong> and watch
            every backup reel them toward the same star <M>{String.raw`V^*`}</M>. Keep an eye on the ratio readout — it
            never exceeds <M>\gamma</M>. Then drag <M>\gamma</M> down and rerun: the pull gets fiercer.</>}
          insight={<>This is the whole Banach argument in one picture. A contraction shrinks every distance, so no matter
            where you start you are pulled to the <em>one</em> fixed point — that is existence, uniqueness, and
            convergence at once. A smaller <M>\gamma</M> is a stronger contraction (faster), a larger one the price of
            foresight (slower).</>}
        >
          <ContractionFlowLab />
        </LabFrame>

        <h2>Banach does the rest</h2>
        <Callout color={GOLD} title={<>The Banach fixed-point theorem</>}>
          A contraction mapping on a complete metric space has <strong>exactly one</strong> fixed point, and
          iterating the map from <em>any</em> starting point converges to it (geometrically, at rate{" "}
          <M>{String.raw`\gamma`}</M>). Value functions with the sup-norm form such a space, and <M>{String.raw`T`}</M>{" "}
          is a contraction — so a unique <M>{String.raw`V^*`}</M> exists, it is the one function satisfying{" "}
          <M>{String.raw`TV^* = V^*`}</M> (the Bellman optimality equation), and repeatedly applying{" "}
          <M>{String.raw`T`}</M> reaches it no matter where you start.
        </Callout>
        <p>
          This one theorem closes every open promise in the chapter. <strong>Existence</strong>:{" "}
          <M>{String.raw`V^*`}</M> is the guaranteed fixed point. <strong>Uniqueness</strong>: a contraction has
          only one, so the optimal value function is unambiguous and all optimal policies share it.{" "}
          <strong>Computability</strong>: iterating the backup converges from any initial guess — which is the
          value-iteration algorithm the next track opens with, now resting on solid ground. And because a greedy
          policy on <M>{String.raw`V^*`}</M> is optimal (last page), an optimal <em>policy</em> exists too.
        </p>

        <p>
          The convergence is fast in a precise sense: after <M>k</M> backups the error is at most{" "}
          <M>{String.raw`\gamma^k`}</M> times the starting error, so the number of iterations to a target accuracy
          grows only with <M>{String.raw`\frac{1}{1-\gamma}`}</M> — the effective horizon again. A discount close
          to 1 buys foresight but costs iterations; the same constant governs both, a theme you will meet
          repeatedly.
        </p>

        <Proof title="proof that T is a γ-contraction in the sup-norm" color={GOLD}>
          <p>
            Fix a state <M>s</M> and let <M>{String.raw`a^*`}</M> achieve the max in{" "}
            <M>{String.raw`(TU)(s)`}</M>. Then
          </p>
          <MathBlock>{String.raw`(TU)(s) - (TV)(s) \le \big[R(s,a^*) + \gamma\textstyle\sum_{s'}P(s'\mid s,a^*)U(s')\big] - \big[R(s,a^*) + \gamma\sum_{s'}P(s'\mid s,a^*)V(s')\big]`}</MathBlock>
          <p>
            because <M>{String.raw`(TV)(s)`}</M> is a max, hence at least the value of action{" "}
            <M>{String.raw`a^*`}</M>. The reward terms cancel, leaving{" "}
            <M>{String.raw`\gamma\sum_{s'}P(s'\mid s,a^*)\,[U(s') - V(s')] \le \gamma\sum_{s'}P(s'\mid s,a^*)\lVert U - V\rVert_\infty = \gamma\lVert U - V\rVert_\infty`}</M>,
            using that the transition probabilities are non-negative and sum to 1. By symmetry the same bound
            holds for <M>{String.raw`(TV)(s) - (TU)(s)`}</M>, so <M>{String.raw`|(TU)(s) - (TV)(s)| \le \gamma\lVert U - V\rVert_\infty`}</M>{" "}
            for every <M>s</M>. Taking the max over <M>s</M> gives{" "}
            <M>{String.raw`\lVert TU - TV\rVert_\infty \le \gamma\lVert U - V\rVert_\infty`}</M>. The one place{" "}
            <M>{String.raw`\gamma < 1`}</M> is used is here — it is what makes the map a <em>strict</em>
            contraction. (For an undiscounted episodic task the same conclusion holds under a weighted sup-norm,
            because a proper policy reaches a terminal with probability 1.)
          </p>
        </Proof>

        <Quiz
          accent={GOLD}
          title="Chapter checkpoint"
          questions={[
            {
              q: <>What does it mean that the Bellman optimality operator <M>{String.raw`T`}</M> is a γ-contraction?</>,
              options: [
                "It makes value functions larger each step",
                "Applying it brings any two value functions closer in sup-norm by a factor ≤ γ",
                "It only works on the optimal value function",
              ],
              answer: 1,
              explain: <>A contraction shrinks distances: <M>{String.raw`\lVert TU - TV\rVert_\infty \le \gamma\lVert U - V\rVert_\infty`}</M>.
                Every backup pulls any two guesses closer together, which is what forces convergence to a single
                point.</>,
            },
            {
              q: <>Which guarantees follow from Banach&rsquo;s fixed-point theorem here?</>,
              options: [
                "Only that a fixed point exists",
                "That V* exists, is unique, and iterating the backup from any start converges to it",
                "That the optimal policy is always stochastic",
              ],
              answer: 1,
              explain: <>A contraction on a complete space has exactly one fixed point, reached from any starting
                guess. So <M>{String.raw`V^*`}</M> exists and is unique, and value iteration converges — existence,
                uniqueness, and computability in one theorem.</>,
            },
            {
              q: <>Where exactly is <M>{String.raw`\gamma < 1`}</M> used in the contraction proof?</>,
              options: [
                "In the reward terms",
                "In the discount multiplying the transition-weighted value difference, which is what makes the shrink factor strictly below 1",
                "It isn't used at all",
              ],
              answer: 1,
              explain: <>After the rewards cancel, the difference is <M>{String.raw`\gamma`}</M> times a
                probability-weighted average of value gaps, bounded by <M>{String.raw`\gamma\lVert U-V\rVert_\infty`}</M>.
                The factor <M>{String.raw`\gamma < 1`}</M> is precisely what makes it a strict contraction.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/markov-decision-processes/greedy-policies", label: <>← From values to a policy</> }}
          next={{ href: "/learn/markov-decision-processes/iterative-policy-evaluation", label: <>Next chapter · Iterative policy evaluation →</> }}
        />
      </div>
    </article>
  );
}
