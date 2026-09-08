import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { Term } from "@/components/Term";

export const metadata = {
  title: "When the Markov assumption breaks — Manifold",
  description:
    "Real problems are often partially observed: the same observation hides different underlying states (aliasing), so a memoryless policy provably loses. POMDPs, belief states, and fixing the state with memory.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function WhenMarkovBreaks() {
  const code = `import numpy as np
# Two hidden states A and B look IDENTICAL to the agent (same observation "o").
# In A the right move is 0; in B it's 1. Reward +1 for the right move, -1 for wrong.
reward = {("A", 0): +1, ("A", 1): -1, ("B", 0): -1, ("B", 1): +1}

# A memoryless policy sees only "o", so it must commit to one action distribution.
# Best case for a deterministic memoryless policy (states equally likely):
best_memoryless = max(
    np.mean([reward[("A", a)], reward[("B", a)]]) for a in (0, 1)
)
# An agent that could see the TRUE state picks the right move every time:
full_observability = np.mean([reward[("A", 0)], reward[("B", 1)]])

print("best a memoryless policy can do:", best_memoryless)   # 0.0 -- it's stuck
print("what full observability gets   :", full_observability) # 1.0
print("cost of the hidden state       :", full_observability - best_memoryless)`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 8 minutes"
        title={<>When the Markov assumption breaks</>}
        intro={<>Everything so far assumed the state tells the agent everything relevant. Reality rarely obliges:
          a robot sees a camera frame, not its true position; a poker player sees their cards, not yours. When the
          observation hides part of the true state, the Markov property fails on what the agent can see — and, as
          we&rsquo;ll measure, a policy that reacts only to the current observation provably leaves reward on the
          table.</>}
      />

      <div className="lesson">
        <h2>Partial observability and aliasing</h2>
        <p>
          The trouble has a name: <strong>state aliasing</strong>. Two genuinely different underlying states
          produce the <em>same</em> observation, so the agent cannot tell them apart — yet they may demand
          opposite actions. A memoryless policy maps observation to action, so it is forced to do the same thing
          in both, and it cannot be right in both. Here is the smallest possible instance, measured:
        </p>

        <CodeBlock setup={"import numpy as np"} fromScratch={code} />
        <CodeOutput>{`best a memoryless policy can do: 0.0
what full observability gets   : 1.0
cost of the hidden state       : 1.0`}</CodeOutput>
        <p>
          The agent that can see the true state scores <strong>+1</strong> every time. The agent that sees only
          the shared observation is stuck at <strong>0</strong> — whichever action it commits to is right half
          the time and wrong the other half. The full point of return has been lost purely to a hidden state.
          This is why partial observability is not a footnote: it changes what is achievable at all.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt="In that aliased problem, a deterministic memoryless policy scores 0. Could a RANDOM (stochastic) memoryless policy do better?"
          options={[
            "Yes — mixing 50/50 between the two actions beats committing to one",
            "No — any memoryless response to the shared observation averages to 0; only memory or a better observation helps",
            "Only if the discount is high",
          ]}
          nudge="Locked in. Compute the expected reward of a 50/50 policy across both hidden states."
        />
        <p>
          A coin-flip policy also averages to 0 here — randomness explores, but it cannot manufacture the
          information the observation is missing. (In <em>some</em> partially-observed problems a stochastic
          policy genuinely beats every deterministic one, which is why partial observability is the main setting
          where optimal policies are stochastic — but it is never a substitute for the missing state.) The real
          fixes are two.
        </p>

        <h2>Fix one: put the missing information into the state</h2>
        <p>
          The everyday remedy, exactly as with the moving ball three chapters ago: <strong>add memory</strong>.
          Fold recent observations into the state — the last few frames, a running summary, a counter — until the
          augmented state is Markov again. Stack four game frames and velocity becomes visible; keep a history of
          cards seen and the deck becomes predictable. Most practical &ldquo;RL on raw sensors&rdquo; is really
          RL on a hand- or network-designed state that reconstructs enough of the hidden truth to act on.
        </p>

        <h2>Fix two: track a belief over states</h2>
        <p>
          The principled framework is the{" "}
          <Term def="a partially observable MDP: an MDP plus an observation model, where the agent never sees the true state directly, only noisy or partial observations of it" accent={GOLD}>POMDP</Term>{" "}
          (partially observable MDP). Instead of a single state, the agent maintains a <strong>belief state</strong>{" "}
          — a probability distribution over which true state it might be in — and updates it with each observation
          via Bayes&rsquo; rule. The remarkable fact is that <em>the belief state is itself Markov</em>: it
          summarises the entire history sufficiently for optimal action. So a POMDP is, in principle, an MDP over
          belief states — recovering everything in this track — at the cost of a continuous, high-dimensional
          state space that is usually intractable to solve exactly.
        </p>

        <Callout color={GOLD} title={<>The Markov property is a design target, not a given</>}>
          Both fixes say the same thing we said in chapter 2: whether a problem is Markov is a property of your
          <em> state representation</em>, and it is on you to engineer one that is sufficient. Partial
          observability is just the case where the naive observation isn&rsquo;t enough and you must add memory or
          a belief to make it so. Every method in this track still applies — <em>once</em> you have built a state
          worthy of them.
        </Callout>

        <Proof title="why the belief state restores the Markov property" color={GOLD}>
          <p>
            Let <M>{String.raw`b_t(s) = P(S_t = s \mid o_1, a_1, \ldots, o_t)`}</M> be the posterior over true
            states given the whole history. After taking <M>{String.raw`a_t`}</M> and seeing{" "}
            <M>{String.raw`o_{t+1}`}</M>, Bayes&rsquo; rule updates <M>{String.raw`b_{t+1}`}</M> using only{" "}
            <M>{String.raw`b_t`}</M>, <M>{String.raw`a_t`}</M>, and <M>{String.raw`o_{t+1}`}</M> — not the older
            history, because <M>{String.raw`b_t`}</M> already encodes it. That is precisely the Markov property,
            now holding for the belief: <M>{String.raw`b_{t+1}`}</M> depends on the past only through{" "}
            <M>{String.raw`b_t`}</M>. Hence the belief is a sufficient statistic, and value functions, Bellman
            equations, and optimality all transfer to the belief-MDP unchanged. The catch is dimensionality:{" "}
            <M>{String.raw`b`}</M> lives in a continuous simplex, so the next problem — too many states to
            enumerate — arrives with a vengeance.
          </p>
        </Proof>

        <PrevNext
          prev={{ href: "/learn/markov-decision-processes/convergence-rate", label: <>← How fast it converges</> }}
          next={{ href: "/learn/markov-decision-processes/large-state-spaces", label: <>Next · Too many states to enumerate →</> }}
        />
      </div>
    </article>
  );
}
