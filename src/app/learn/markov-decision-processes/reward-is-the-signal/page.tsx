import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { Backlinks } from "@/components/Backlinks";
import { GRIDWORLD_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "Reward is the only signal — Manifold",
  description:
    "The reward hypothesis: every goal can be cast as maximising expected cumulative reward. Why a single scalar is enough, why delayed and sparse reward makes credit assignment hard, and the difference between reward and value.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function RewardIsTheSignal() {
  const code = `import numpy as np
rng = np.random.default_rng(0)

# a random walker on the gridworld: reward is -1 every step until it stumbles
# into a terminal corner. The reward stream says nothing about which turns helped.
def rollout(policy, start=6, max_steps=200):
    s, total, steps = start, 0.0, 0
    while s not in TERMINALS and steps < max_steps:
        a = rng.choice(nA, p=policy[s])
        s_next = rng.choice(nS, p=P[s, a])
        total += R[s, a]          # the ONLY feedback the agent ever receives
        s, steps = s_next, steps + 1
    return total, steps

returns = [rollout(random_policy)[0] for _ in range(2000)]
print("avg total reward (random policy):", round(np.mean(returns), 1))
print("best / worst episode:", max(returns), "/", min(returns))`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Intuition", color: GOLD }]}
        time="about 8 minutes"
        title={<>Reward is the <em>only</em> signal</>}
        intro={<>Before we can talk about states, policies, or value, we have to be honest about how little the
          agent is actually told. It does not receive corrections, gradients, or advice. It receives a single
          number after each step — the reward — and everything it ever learns must be squeezed out of that thin
          stream. The surprising claim of the field is that this is <em>enough</em>.</>}
      />

      <div className="lesson">
        <Backlinks items={[{ label: "Expectation", href: "/learn/math-foundations/random-variables" }]} />

        <h2>One number, and the whole goal inside it</h2>
        <p>
          At each step the environment hands the agent a scalar reward{" "}
          <M>{String.raw`R_t \in \mathbb{R}`}</M>. Not a label, not &ldquo;you should have gone left&rdquo; —
          just a number, larger when things went well. The entire ambition of reinforcement learning is stated
          in one sentence, usually called the <strong>reward hypothesis</strong>:
        </p>
        <Callout color={GOLD} title={<>The reward hypothesis</>}>
          Every goal we care about can be captured as the maximisation of the <em>expected value of the
          cumulative sum of a received scalar reward.</em> Winning a game, controlling a robot, minimising
          latency, keeping a portfolio solvent — each becomes a choice of what to reward, and then the single
          objective of getting as much of it as possible over time.
        </Callout>
        <p>
          It sounds almost too austere. A whole goal, compressed into one number per step? But the compression
          is the point: it forces you to <em>say what you actually want</em>. If you cannot write your goal as a
          reward, you have not yet made it precise. And once it is a reward, the problem has a single, comparable
          objective — you can always ask whether one way of behaving earned more than another.
        </p>

        <h2>Reward is evaluative, and that changes everything</h2>
        <p>
          A supervised label is <em>instructive</em>: it names the correct output, so the gap between your guess
          and the truth points straight at the fix. A reward is only <em>evaluative</em>: it scores the action
          you took and stays silent about the ones you didn&rsquo;t. Score a 3 — was 3 good? Compared to what?
          The only way to find out what the other actions would have paid is to try them. That single difference
          is why exploration is unavoidable in RL and absent from supervised learning, and it is the subject of
          the page after next.
        </p>

        <h2>Delayed reward, and the credit-assignment problem</h2>
        <p>
          Worse, the reward that justifies an action often arrives much later. The chess move that won the game
          looked identical to a dozen ordinary moves when you made it; the payoff came twenty moves on. So when
          reward finally lands, <strong>which of the many earlier actions deserves the credit?</strong> This is
          the <strong>credit-assignment problem</strong>, and it is the central difficulty of the whole field.
          Watch how little the raw reward stream tells you: send a purely random walker across our gridworld and
          add up what it collects.
        </p>

        <CodeBlock setup={GRIDWORLD_SETUP} fromScratch={code} />
        <CodeOutput>{`avg total reward (random policy): -20.3
best / worst episode: -3.0 / -155.0`}</CodeOutput>

        <p>
          The stream is punishing and uninformative: −1, −1, −1, … until the walk happens to end. Two episodes
          starting from the same square can score −3 or −155 purely on luck. Nowhere does the feedback say
          &ldquo;that left turn was the good one.&rdquo; Extracting a sensible way of behaving from this noise is
          exactly what the value function — the next chapter&rsquo;s work — is built to do.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt="To make an agent reach the goal faster, you cut the per-step reward from −1 to −5 (keeping the terminal at 0). What happens to the behaviour that maximises total reward?"
          options={[
            "Nothing — scaling every step reward equally leaves the best path unchanged",
            "It still prefers the shortest path — only now the incentive to end quickly is even stronger",
            "It becomes reckless and ignores the goal",
          ]}
          nudge="Locked in. The key is what the agent is comparing: total reward across whole paths."
        />
        <p>
          Because every non-terminal step costs the same, total reward is just{" "}
          <M>{String.raw`-c \times (\text{steps to a terminal})`}</M>. Making <M>c</M> larger scales every path
          by the same factor, so the <em>ranking</em> of paths — and therefore the best behaviour — is
          unchanged; the shortest route still wins. This is your first taste of a theme: behaviour depends on
          the <em>structure</em> of the reward, not its units. Designing that structure well (&ldquo;reward
          shaping&rdquo;) is a craft in itself, and an easy way to accidentally reward the wrong thing.
        </p>

        <h2>Reward is not value</h2>
        <p>
          Hold onto one distinction, because it is the hinge of everything that follows.{" "}
          <strong>Reward is immediate; value is cumulative.</strong> Reward is what you get right now for a
          single step. <em>Value</em> is how good a situation is <em>in the long run</em> — the total reward you
          can expect to accumulate starting from here. A square might pay a painful −1 this step yet have high
          value because it sits one move from the goal. Acting on reward alone is greedy and short-sighted;
          acting on value is what &ldquo;playing well&rdquo; means. Turning the raw reward signal into a value we
          can act on is the project of this entire track.
        </p>

        <Proof title="why a scalar reward, and not a vector of objectives?" color={GOLD}>
          <p>
            Real goals often have several axes — speed <em>and</em> safety <em>and</em> cost. Why insist on a
            single number? Because to <em>choose</em>, you must be able to compare, and comparing requires a
            total order. Any consistent set of preferences over outcomes that satisfies mild rationality axioms
            can be represented by a scalar utility (the von Neumann–Morgenstern theorem). So a vector of
            objectives, once you decide how to trade them off, collapses to one scalar anyway — and RL asks you
            to make that trade-off explicit up front rather than smuggling it in later. The cost is real: pick
            the weighting badly and you have precisely specified the wrong goal.
          </p>
        </Proof>

        <PrevNext
          prev={{ href: "/learn/markov-decision-processes", label: <>← Learning by acting</> }}
          next={{ href: "/learn/markov-decision-processes/the-agent-environment-loop", label: <>Next · The agent–environment loop →</> }}
        />
      </div>
    </article>
  );
}
