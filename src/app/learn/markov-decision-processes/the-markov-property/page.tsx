import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { Term } from "@/components/Term";
import { GRIDWORLD_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "The Markov property — Manifold",
  description:
    "The assumption that makes everything tractable: the present state is a sufficient statistic for the future. What it means formally, the moving-ball example of when it breaks, and how state design restores it.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function TheMarkovProperty() {
  const code = `import numpy as np
# The Markov property in the gridworld: where you go next depends ONLY on your
# current cell and action -- never on the path that brought you there.
s, a = 6, 1                       # in cell 6, choosing "right"
print("P(s' | s=6, a=right):", P[6, 1][P[6, 1] > 0])   # a single next state, prob 1

# arrive at cell 6 two different ways -- the future is identical either way,
# because the state, not the history, is what P conditions on.
print("next-state dist is a property of (s, a), shape:", P[6, 1].shape)
print("it sums to 1:", P[6, 1].sum())`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Core idea", color: GOLD }]}
        time="about 8 minutes"
        title={<>The Markov property</>}
        intro={<>Everything in this track rests on a single, powerful assumption — powerful enough that the whole
          object is named after it. The claim is that to predict and control the future, the present is all you
          need: the current state already contains everything relevant that the entire past could tell you. When
          that is true, the problem becomes solvable. When it isn&rsquo;t, you fix the state until it is.</>}
      />

      <div className="lesson">
        <h2>&ldquo;The state is enough&rdquo;</h2>
        <p>
          A state has the <strong>Markov property</strong> if the distribution of what happens next depends only
          on the current state and action — not on the sequence of states and actions that led there. Formally,
          the history collapses:
        </p>
        <MathBlock>{String.raw`P\!\left(S_{t+1}\mid S_t, A_t\right) \;=\; P\!\left(S_{t+1}\mid S_0, A_0, S_1, A_1, \ldots, S_t, A_t\right).`}</MathBlock>
        <p>
          Read it as a promise: <em>knowing how you got here tells you nothing extra about where you go next.</em>
          The state is a <Term def="a summary of the past that captures everything relevant for predicting the future — no further detail from the history would improve the prediction" accent={GOLD}>sufficient statistic</Term>{" "}
          for the future. This is exactly what lets us define the value of a <em>state</em> at all: if the future
          depended on the whole messy history, &ldquo;the value of being here&rdquo; wouldn&rsquo;t be
          well-defined, because &ldquo;here&rdquo; would mean something different every time.
        </p>

        <CodeBlock setup={GRIDWORLD_SETUP} fromScratch={code} />
        <CodeOutput>{`P(s' | s=6, a=right): [1.]
next-state dist is a property of (s, a), shape: (16,)
it sums to 1: 1.0`}</CodeOutput>
        <p>
          In our gridworld the transition table <M>P</M> is indexed by <em>state and action only</em>. There is
          no slot for history — the design bakes the Markov property in. Whether you reached cell 6 by a direct
          march or a long wander, <M>{String.raw`P(\cdot \mid 6, \text{right})`}</M> is the same distribution.
        </p>

        <h2>When it breaks: the moving ball</h2>
        <p>
          Imagine tracking a ball and letting the state be its <em>position</em>. Is that Markov? No — from a
          single snapshot you cannot say where the ball goes next, because you don&rsquo;t know which way it is
          moving. The future genuinely depends on the past (the previous position told you the velocity). The
          position alone is <strong>not</strong> a sufficient statistic.
        </p>
        <p>
          The fix is not to abandon the framework — it is to <strong>redesign the state</strong>. Let the state
          be <em>(position, velocity)</em> and the Markov property returns: those two numbers together do predict
          the next position. This is the everyday craft of applied RL: when your state isn&rsquo;t Markov, you
          usually don&rsquo;t need a fancier algorithm, you need a better state — add the missing history as
          explicit features (the last few frames, an average, a count) until the present is genuinely enough.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt="You model a card game with the state = 'the card currently on top of the deck'. Cards are drawn without replacement. Is this state Markov?"
          options={[
            "Yes — the top card fully determines the game",
            "No — what's already been drawn changes what can come next, and that history isn't in the state",
            "Only if the deck is shuffled",
          ]}
          nudge="Locked in. Ask: does the past (cards already seen) tell you anything the current state doesn't?"
        />
        <p>
          It is <strong>not</strong> Markov: the cards already drawn change the distribution of what remains, and
          that information isn&rsquo;t in &ldquo;the top card.&rdquo; To restore the property you&rsquo;d fold the
          set of remaining cards into the state. That larger state <em>is</em> Markov — at the cost of being
          enormous, a tension we return to when tabular methods hit their ceiling.
        </p>

        <Callout color={GOLD} title={<>Markov is a property of the state, not the world</>}>
          Nothing forces a world to be Markov. What you control is the <em>state representation</em>. &ldquo;Is
          this Markov?&rdquo; really means &ldquo;does my chosen state carry enough?&rdquo; — and the answer is a
          modelling decision with real consequences. Choose too little and your values are ill-defined; choose
          too much and the state space explodes. Almost every hard RL problem is, underneath, a fight to design a
          state that is Markov <em>and</em> small enough to work with.
        </Callout>

        <Proof title="why the Markov property makes value well-defined" color={GOLD}>
          <p>
            The value we will define is the expected future return from a state. That expectation is only
            meaningful if &ldquo;from this state&rdquo; pins down a single distribution over futures. The Markov
            property is exactly that guarantee: given <M>{String.raw`S_t = s`}</M> (and the policy), the whole
            future <M>{String.raw`S_{t+1}, R_{t+1}, S_{t+2}, \ldots`}</M> has one fixed distribution, independent
            of how <M>s</M> was reached. Drop the property and <M>{String.raw`V(s)`}</M> would depend on the path
            taken to <M>s</M> — it would not be a function of <M>s</M> at all, and the self-referential Bellman
            equation at the heart of the next chapter simply could not be written down. Tractability and the
            Markov property are the same fact seen twice.
          </p>
        </Proof>

        <PrevNext
          prev={{ href: "/learn/markov-decision-processes/exploration-vs-exploitation", label: <>← Exploration vs exploitation</> }}
          next={{ href: "/learn/markov-decision-processes/anatomy-of-an-mdp", label: <>Next · Anatomy of an MDP →</> }}
        />
      </div>
    </article>
  );
}
