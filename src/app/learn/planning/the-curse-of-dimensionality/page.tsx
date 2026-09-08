import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";

export const metadata = {
  title: "The curse of dimensionality — Manifold",
  description:
    "The number of states grows exponentially in the number of variables describing the world, so the tables that tabular dynamic programming depends on cannot be built. Bellman's own phrase, and why it forces generalisation.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function TheCurseOfDimensionality() {
  const code = `# States are usually described by several variables. If each of d variables can take
# 10 values, the number of joint states is 10^d — exponential in d.
for d in [1, 2, 3, 4, 6, 10]:
    print(f"{d:2d} variables x 10 values each -> {10**d:>15,} states")

print()
# real problems dwarf any table:
print("Backgammon        : ~10^20 states")
print("Rubik's cube      : ~4.3 x 10^19 states")
print("Chess             : ~10^44 states")
print("Go (19x19)        : ~10^170 states  (> atoms in the universe, ~10^80)")
print("Robot joint angles: continuous -> uncountably many states")`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 7 minutes"
        title={<>The curse of dimensionality</>}
        intro={<>Dynamic programming is polynomial in the number of states — and that is exactly why it fails on real
          problems, because the number of states is almost never small. It grows exponentially in the number of
          variables you need to describe the world. The phrase for this is Richard Bellman&rsquo;s own, coined in the
          same work that gave us the Bellman equation: the curse of dimensionality.</>}
      />

      <div className="lesson">
        <h2>Why states explode</h2>
        <p>
          A state is rarely a single index; it is a <em>combination</em> of variables. A robot arm has several joint
          angles; a board game has a piece on each square; an inventory system tracks the stock of every product.
          If there are <M>d</M> variables and each can take <M>v</M> values, the number of joint states is
        </p>
        <MathBlock>{String.raw`|\mathcal{S}| = v^{\,d} \quad\text{— exponential in the number of variables } d.`}</MathBlock>
        <p>
          This is the killer. DP&rsquo;s &ldquo;efficient&rdquo; <M>{String.raw`O(|\mathcal{S}|^2|\mathcal{A}|)`}</M>{" "}
          per sweep is efficient in <M>{String.raw`|\mathcal{S}|`}</M> — but <M>{String.raw`|\mathcal{S}|`}</M> is
          itself <M>{String.raw`v^d`}</M>, so the real cost is exponential in <M>d</M>. Add one variable and the
          whole table multiplies:
        </p>

        <CodeBlock setup={"import numpy as np"} fromScratch={code} />
        <CodeOutput>{` 1 variables x 10 values each ->              10 states
 2 variables x 10 values each ->             100 states
 3 variables x 10 values each ->           1,000 states
 4 variables x 10 values each ->          10,000 states
 6 variables x 10 values each ->       1,000,000 states
10 variables x 10 values each ->  10,000,000,000 states

Backgammon        : ~10^20 states
Rubik's cube      : ~4.3 x 10^19 states
Chess             : ~10^44 states
Go (19x19)        : ~10^170 states  (> atoms in the universe, ~10^80)
Robot joint angles: continuous -> uncountably many states`}</CodeOutput>
        <p>
          Ten variables of ten values each is already ten billion states — a table of that size barely fits in
          memory, and you would need to sweep it many times. Go has more states than there are atoms in the
          observable universe. And a robot&rsquo;s continuous joint angles have <em>no</em> finite table at all.
          Tabular dynamic programming — every method in this track — simply cannot run on any of these. Not slowly:
          not at all.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt="Go has ~10^170 states, most of which will never be visited. So how could an agent ever value a position it has never seen?"
          options={[
            "It can't — planning is impossible on Go",
            "By generalising: learn a function of state features that predicts value, so unseen states inherit estimates from similar seen ones",
            "By visiting states faster",
          ]}
          nudge="Locked in. The escape is a function, not a table — the same trick supervised learning uses for unseen inputs."
        />

        <h2>The two doors out</h2>
        <p>
          The curse forces a choice, and both escapes define whole areas of reinforcement learning:
        </p>
        <ul>
          <li>
            <strong>Don&rsquo;t enumerate — visit.</strong> If you cannot sweep every state, sweep only the states
            you actually reach. Real-time dynamic programming and sampling-based planning (the next two pages) update
            a tiny, relevant subset, guided by where the agent goes.
          </li>
          <li>
            <strong>Don&rsquo;t tabulate — generalise.</strong> Replace the value <em>table</em>{" "}
            <M>{String.raw`V(s)`}</M> with a value <em>function</em> <M>{String.raw`\hat{V}(s;\mathbf{w})`}</M> — a
            linear model on features, or a neural network — with far fewer parameters than there are states. An
            unseen state still gets a value because it resembles states you have seen. This is{" "}
            <strong>function approximation</strong>, its own track in this family, and the engine of deep RL.
          </li>
        </ul>

        <Callout color={GOLD} title={<>The Bellman equation survives; the table doesn&rsquo;t</>}>
          Notice what the curse does and does not break. The <em>ideas</em> of this track — value functions, the
          Bellman equations, evaluate-and-improve — are untouched; they hold for any MDP regardless of size. What
          breaks is the <em>implementation</em> that stores one number per state and sweeps them all. Every advanced
          method keeps the Bellman machinery and swaps out the table: DQN replaces <M>V</M> with a network and turns
          the backup into a training target; AlphaGo plans by sampling instead of enumerating. You have already
          learned the part that lasts.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/planning/the-cost-of-a-sweep", label: <>← The cost of a sweep</> }}
          next={{ href: "/learn/planning/real-time-dynamic-programming", label: <>Next · Real-time dynamic programming →</> }}
        />
      </div>
    </article>
  );
}
