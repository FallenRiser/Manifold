import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { DiscountLab } from "@/components/labs/DiscountLab";

export const metadata = {
  title: "The discount factor — Manifold",
  description:
    "Why γ exists: it keeps an infinite stream of rewards finite, and it tunes how far-sighted the agent is. The geometric-series bound, the effective horizon 1/(1−γ), and the near-vs-far reward crossover.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function TheDiscountFactor() {
  const code = `import numpy as np
# One reward stream, three temperaments. Discount a stream of +1's per step by gamma.
stream = np.ones(50)                 # +1 every step for 50 steps
for g in (0.0, 0.5, 0.9, 0.99):
    G = sum(g**k * r for k, r in enumerate(stream))
    horizon = np.inf if g == 1 else 1 / (1 - g)
    print(f"gamma={g:<5}  return={G:6.2f}   effective horizon 1/(1-g) = {horizon:.1f}")

# a bounded reward => a bounded return, even for an INFINITE stream (geometric series)
print("infinite +1 stream at gamma=0.9 ->", 1 / (1 - 0.9))   # 10.0`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Core idea", color: GOLD }]}
        time="about 9 minutes"
        title={<>The discount factor</>}
        intro={<>We keep saying the agent maximises total reward — but if the task never ends, that total is an
          infinite sum, and &ldquo;maximise infinity&rdquo; is meaningless. The discount factor <M>γ</M> fixes
          this with one small idea: a reward is worth a little less the longer you have to wait for it. That
          single knob both tames the infinity and sets how far ahead the agent bothers to look.</>}
      />

      <div className="lesson">
        <h2>Two problems, one fix</h2>
        <p>
          <strong>Problem one: infinite sums.</strong> In a continuing task the reward stream never stops, so the
          naive total <M>{String.raw`R_1 + R_2 + R_3 + \cdots`}</M> can diverge. You cannot compare two policies
          that both earn &ldquo;infinity.&rdquo; <strong>Problem two: impatience.</strong> A reward now really is
          worth more than the same reward in a thousand steps — because of uncertainty, because of opportunity
          cost, because the far future is less under your control. Both are solved by weighting a reward{" "}
          <M>k</M> steps away by <M>{String.raw`\gamma^k`}</M> with <M>{String.raw`0 \le \gamma < 1`}</M>:
        </p>
        <MathBlock>{String.raw`G_t = R_{t+1} + \gamma R_{t+2} + \gamma^2 R_{t+3} + \cdots = \sum_{k=0}^{\infty} \gamma^{k} R_{t+k+1}.`}</MathBlock>
        <p>
          Because the weights shrink geometrically, the sum converges as long as the rewards are bounded — the
          infinity is tamed. And the <em>rate</em> of shrinking is a dial on the agent&rsquo;s personality.
        </p>

        <LabFrame
          accent={GOLD}
          tryThis={<>Drag <M>{String.raw`\gamma`}</M> from 0 to nearly 1 and watch the bars — each is <M>{String.raw`\gamma^k`}</M>, the
            weight on a reward <M>k</M> steps out. Read the <em>effective horizon</em>. Then watch the contest on
            the right: a <strong>+1 now</strong> versus a <strong>+2 in 5 steps</strong>. Find the <M>γ</M> where
            the winner flips.</>}
          insight={<>At <M>γ = 0</M> only the very next reward matters — a purely myopic agent — and the horizon
            is a single step. As <M>γ → 1</M> distant rewards count almost as much as immediate ones and the
            horizon <M>1/(1-γ)</M> blows up. The delayed +2 only beats the immediate +1 once <M>γ</M> passes
            ≈ 0.87; below that, waiting isn&rsquo;t worth it. Patience is a number.</>}
        >
          <DiscountLab />
        </LabFrame>

        <h2>The effective horizon</h2>
        <p>
          There is a clean way to read <M>γ</M> as &ldquo;how many steps ahead the agent effectively
          plans&rdquo;: the quantity <M>{String.raw`\tfrac{1}{1-\gamma}`}</M>. At{" "}
          <M>{String.raw`\gamma = 0.9`}</M> that is 10 steps; at <M>{String.raw`\gamma = 0.99`}</M>, 100 steps.
          It comes straight from the geometric series — it is the sum of all the discount weights — and it is the
          single most useful intuition for choosing <M>γ</M>: pick it so the horizon comfortably exceeds the
          number of steps between an action and the reward it is meant to earn. Set <M>γ</M> too low and the agent
          is blind to delayed payoffs it needs to plan for.
        </p>

        <CodeBlock setup={"import numpy as np"} fromScratch={code} />
        <CodeOutput>{`gamma=0.0    return=  1.00   effective horizon 1/(1-g) = 1.0
gamma=0.5    return=  2.00   effective horizon 1/(1-g) = 2.0
gamma=0.9    return=  9.95   effective horizon 1/(1-g) = 10.0
gamma=0.99   return= 39.50   effective horizon 1/(1-g) = 100.0
infinite +1 stream at gamma=0.9 -> 10.000000000000002`}</CodeOutput>

        <PredictPrompt
          accent={GOLD}
          prompt="In our gridworld every step costs −1 and it always ends at a corner (an episodic task). Do we actually need γ < 1 there?"
          options={[
            "Yes — without discounting the return is always infinite",
            "No — the episode is guaranteed to end, so the sum is finite; γ = 1 is fine and even natural here",
            "Only if the grid is large",
          ]}
          nudge="Locked in. The reason γ was introduced was infinite sums — does that apply when the task ends?"
        />
        <p>
          The honest answer is <strong>no</strong>. When every episode is guaranteed to terminate, the reward sum
          is already finite, so <M>{String.raw`\gamma = 1`}</M> is perfectly well-defined — and it is what the
          canonical gridworld uses. Discounting is <em>essential</em> for continuing tasks and <em>optional</em>
          for episodic ones, where it still often helps as a mild pressure toward finishing sooner. This is a
          common point of confusion worth getting straight: <M>γ</M> is a modelling choice, not a law.
        </p>

        <Proof title="the geometric-series bound — why a bounded reward gives a bounded return" color={GOLD}>
          <p>
            Suppose every reward satisfies <M>{String.raw`|R| \le R_{\max}`}</M>. Then
          </p>
          <MathBlock>{String.raw`|G_t| \le \sum_{k=0}^{\infty} \gamma^{k} R_{\max} = \frac{R_{\max}}{1-\gamma},`}</MathBlock>
          <p>
            using the geometric series <M>{String.raw`\sum_{k\ge 0}\gamma^k = \frac{1}{1-\gamma}`}</M>, valid for{" "}
            <M>{String.raw`|\gamma| < 1`}</M>. So no matter how long the stream, the discounted return is trapped
            in a finite band — which is precisely what makes value functions finite numbers we can compute and
            compare. The same <M>{String.raw`\tfrac{1}{1-\gamma}`}</M> that bounds the return is the effective
            horizon; the bound and the intuition are the same algebra.
          </p>
        </Proof>

        <PrevNext
          prev={{ href: "/learn/markov-decision-processes/anatomy-of-an-mdp", label: <>← Anatomy of an MDP</> }}
          next={{ href: "/learn/markov-decision-processes/the-return", label: <>Next · The return we maximise →</> }}
        />
      </div>
    </article>
  );
}
