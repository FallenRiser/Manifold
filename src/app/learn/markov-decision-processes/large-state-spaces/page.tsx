import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";

export const metadata = {
  title: "Too many states to enumerate — Manifold",
  description:
    "Tabular methods store one number per state — impossible when states are astronomically many or continuous. The combinatorial explosion, why we must generalise across states, and function approximation as the answer.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function LargeStateSpaces() {
  const code = `import numpy as np
# Everything so far kept one number per state in an array. How far does that go?
for n in (4, 10, 100):
    print(f"{n}x{n} gridworld: {n*n:>8} states  (a table fits easily)")

# now the real world:
print("Tic-tac-toe      :        ~5,478 states")
print("Rubik's cube     : ~43,000,000,000,000,000,000 states")
print("Chess            : ~10^44 states")
print("Go (19x19)       : ~10^170 states  (more than atoms in the universe)")
print("A camera image   :  256^(H*W*3) -- effectively continuous, uncountable")`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 7 minutes"
        title={<>Too many states to enumerate</>}
        intro={<>Every method in this track shares a quiet assumption: that you can keep a number for each state
          in a table. On a 16-cell grid that is trivially true. On almost any real problem it is wildly false —
          and the moment the table won&rsquo;t fit, the whole tabular toolkit stops working. This is the wall
          that the rest of reinforcement learning is built to climb.</>}
      />

      <div className="lesson">
        <h2>The table always wins — until it doesn&rsquo;t</h2>
        <p>
          Iterative evaluation, value iteration, policy iteration — all of them store <M>{String.raw`V`}</M> or{" "}
          <M>{String.raw`Q`}</M> as an array indexed by state, and sweep over every entry. The cost, in both
          memory and time per sweep, scales with the number of states. That is fine while the number of states is
          small. Watch how quickly &ldquo;small&rdquo; runs out:
        </p>

        <CodeBlock setup={"import numpy as np"} fromScratch={code} />
        <CodeOutput>{`4x4 gridworld:       16 states  (a table fits easily)
10x10 gridworld:      100 states  (a table fits easily)
100x100 gridworld:    10000 states  (a table fits easily)
Tic-tac-toe      :        ~5,478 states
Rubik's cube     : ~43,000,000,000,000,000,000 states
Chess            : ~10^44 states
Go (19x19)       : ~10^170 states  (more than atoms in the universe)
A camera image   :  256^(H*W*3) -- effectively continuous, uncountable`}</CodeOutput>
        <p>
          A table with <M>{String.raw`10^{170}`}</M> entries cannot be written down, let alone swept — there are
          only about <M>{String.raw`10^{80}`}</M> atoms in the observable universe. And a robot&rsquo;s camera
          image or a joint angle is <em>continuous</em>: there is no finite table at all. Tabular RL, for all its
          clean guarantees, simply does not run here.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt="Go has ~10^170 states — you can never visit, let alone store, most of them. So how could an agent ever value a position it has never seen?"
          options={[
            "It can't — RL is impossible on Go",
            "By generalising: learn a function of state features that predicts value, so unseen states inherit estimates from similar seen ones",
            "By visiting all states faster",
          ]}
          nudge="Locked in. Think about how a supervised model handles inputs it never trained on."
        />

        <h2>The way through: generalise, don&rsquo;t enumerate</h2>
        <p>
          The escape is to stop treating states as unrelated table rows and start treating them as points with{" "}
          <strong>features</strong> that similar states share. Instead of storing{" "}
          <M>{String.raw`V(s)`}</M> for every <M>s</M>, learn a <em>function</em>{" "}
          <M>{String.raw`\hat{V}(s; \mathbf{w}) \approx V(s)`}</M> with a manageable number of parameters{" "}
          <M>{String.raw`\mathbf{w}`}</M> — a linear model on features, or a neural network on raw input. Now a
          state you have never visited still gets a value, because it resembles states you have, and the
          parameters carry what was learned from one to the other. This is exactly the generalisation that makes
          supervised learning work, brought to bear on value.
        </p>

        <Callout color={GOLD} title={<>This is where deep RL lives</>}>
          Replace the value table with a neural network and value iteration&rsquo;s backup becomes a training
          target — the idea behind Deep Q-Networks, which learned to play Atari from pixels, and the value and
          policy networks inside AlphaGo. The Bellman equations you learned here do not change; what changes is
          that <M>{String.raw`V`}</M> and <M>{String.raw`Q`}</M> become <em>approximators</em> fit to data rather
          than tables filled in exactly. Function approximation is its own track in this family — and it is what
          turns the theory of this one into agents that act in the real world.
        </Callout>

        <p>
          Generalisation buys scale but costs guarantees: an approximate value function can be wrong in ways a
          table never is, and the tidy convergence proofs of this track weaken or fail. Managing that trade — the
          stability of learning with approximation — is much of what makes deep RL hard, and is the subject of
          the function-approximation track. First, though, one last assumption to drop.
        </p>

        <PrevNext
          prev={{ href: "/learn/markov-decision-processes/when-markov-breaks", label: <>← When the Markov assumption breaks</> }}
          next={{ href: "/learn/markov-decision-processes/model-free-preview", label: <>Next · What if we don’t know the rules? →</> }}
        />
      </div>
    </article>
  );
}
