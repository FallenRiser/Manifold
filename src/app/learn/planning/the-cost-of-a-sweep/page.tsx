import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";

export const metadata = {
  title: "The cost of a sweep — Manifold",
  description:
    "What a dynamic-programming sweep actually costs: O(|S|²|A|) per sweep for a dense model, O(|S|³) for an exact policy solve. Why DP is polynomial in the size of the state table — and why that is both a triumph and a trap.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function TheCostOfASweep() {
  const code = `# One value-iteration sweep backs up every state, trying every action, summing over
# every possible next state: |S| x |A| x |S| = |S|^2 |A| operations for a dense model.
for nstates in [16, 100, 10_000, 1_000_000]:
    ops = nstates**2 * 4                      # |A| = 4
    print(f"|S|={nstates:>9,}: one sweep ~ |S|^2 * |A| = {ops:>20,} operations")

# An exact policy-evaluation solve is even steeper: inverting |S| x |S| is |S|^3.
print()
for nstates in [16, 100, 10_000, 1_000_000]:
    print(f"|S|={nstates:>9,}: one exact solve ~ |S|^3 = {nstates**3:>25,} operations")`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 7 minutes"
        title={<>The cost of a sweep</>}
        intro={<>Everything in this track has run in a blink, because the world has 16 states. To understand where
          dynamic programming stops working, you have to count what a single sweep costs — and see how that cost
          scales. The news is mixed: DP is efficient in the number of states, which is a real triumph, and useless
          when the number of states is itself enormous, which is the trap the rest of the field is built to escape.</>}
      />

      <div className="lesson">
        <h2>Counting a backup</h2>
        <p>
          One value-iteration backup at a single state <M>s</M> tries every action (<M>{String.raw`|\mathcal{A}|`}</M>{" "}
          of them), and for each action sums over every possible next state (<M>{String.raw`|\mathcal{S}|`}</M> of
          them). A full sweep does this for all <M>{String.raw`|\mathcal{S}|`}</M> states, so
        </p>
        <MathBlock>{String.raw`\text{cost per sweep} = O\big(|\mathcal{S}|^2\,|\mathcal{A}|\big) \quad\text{(dense model)}, \qquad \text{exact policy solve} = O\big(|\mathcal{S}|^3\big).`}</MathBlock>
        <p>
          The <M>{String.raw`|\mathcal{S}|^2`}</M> comes from &ldquo;each state sums over all next states&rdquo;; in
          practice transitions are usually <em>sparse</em> (each state reaches only a few others), which drops the
          per-sweep cost toward <M>{String.raw`O(|\mathcal{S}|\,|\mathcal{A}|\,b)`}</M> with <M>b</M> the branching
          factor. Watch both costs climb:
        </p>

        <CodeBlock setup={"import numpy as np"} fromScratch={code} />
        <CodeOutput>{`|S|=       16: one sweep ~ |S|^2 * |A| =                1,024 operations
|S|=      100: one sweep ~ |S|^2 * |A| =               40,000 operations
|S|=   10,000: one sweep ~ |S|^2 * |A| =          400,000,000 operations
|S|=1,000,000: one sweep ~ |S|^2 * |A| =    4,000,000,000,000 operations

|S|=       16: one exact solve ~ |S|^3 =                     4,096 operations
|S|=      100: one exact solve ~ |S|^3 =                 1,000,000 operations
|S|=   10,000: one exact solve ~ |S|^3 =         1,000,000,000,000 operations
|S|=1,000,000: one exact solve ~ |S|^3 = 1,000,000,000,000,000,000 operations`}</CodeOutput>
        <p>
          At a million states — still a <em>small</em> problem by real standards — a single dense sweep is already
          trillions of operations, and an exact solve is a quintillion. The many-sweeps-times-cost-per-sweep product
          is what decides whether planning is feasible.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt="DP costs a polynomial in |S| per sweep. Is that good or bad news?"
          options={[
            "Purely good — polynomial is efficient",
            "Both: polynomial in |S| is a genuine efficiency win, BUT |S| itself can be astronomically large, so 'polynomial in |S|' can still be hopeless",
            "Purely bad — polynomial is always too slow",
          ]}
          nudge="Locked in. The efficiency is real; the problem is the size of |S|, which the next page attacks."
        />

        <h2>The triumph, stated fairly</h2>
        <p>
          It is worth pausing on what DP <em>does</em> achieve. The naive route to control — enumerate all{" "}
          <M>{String.raw`|\mathcal{A}|^{|\mathcal{S}|}`}</M> policies — is exponential and utterly hopeless. Dynamic
          programming replaces that with something <strong>polynomial in the number of states and actions</strong>:
          a handful of sweeps, each cheap in <M>{String.raw`|\mathcal{S}|`}</M>. Turning an exponential search into a
          polynomial computation is a genuine algorithmic triumph, and it is why the Bellman equation is one of the
          great ideas of the twentieth century.
        </p>

        <Callout color={GOLD} title={<>The trap hiding in &ldquo;polynomial in |S|&rdquo;</>}>
          The catch is the phrase itself. &ldquo;Polynomial in <M>{String.raw`|\mathcal{S}|`}</M>&rdquo; is only
          efficient if <M>{String.raw`|\mathcal{S}|`}</M> is manageable. But the number of states in a real problem
          is usually itself exponential in the number of variables that describe the world — a robot&rsquo;s joint
          angles, a board&rsquo;s pieces, a game&rsquo;s configuration. So &ldquo;polynomial in a number that is
          exponentially large&rdquo; is exponential in disguise. That collision — DP&rsquo;s efficiency meeting the
          explosion of the state count — is the <em>curse of dimensionality</em>, and it is the whole subject of the
          next page.
        </Callout>

        <p>
          Everything after this in reinforcement learning is, in one way or another, a response to this cost. If you
          cannot afford to sweep every state, you must either <em>avoid</em> most of them (real-time DP, sampling) or
          <em>generalise</em> across them (function approximation). The remaining pages of this track open both doors.
        </p>

        <PrevNext
          prev={{ href: "/learn/planning/modified-policy-iteration", label: <>← Modified policy iteration</> }}
          next={{ href: "/learn/planning/the-curse-of-dimensionality", label: <>Next · The curse of dimensionality →</> }}
        />
      </div>
    </article>
  );
}
