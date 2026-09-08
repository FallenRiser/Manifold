import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { Term } from "@/components/Term";
import { GRIDWORLD_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "A policy is a way of behaving — Manifold",
  description:
    "A policy π maps states to a distribution over actions — the agent's whole strategy in one object. Deterministic vs stochastic policies, why stochasticity can be necessary, and how a policy turns an MDP into a Markov chain.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function Policies() {
  const code = `import numpy as np
rng = np.random.default_rng(0)

# a policy maps each state to a distribution over actions. Here: head toward the
# nearest goal corner (a hand-crafted DETERMINISTIC policy), vs the random walk.
def toward_goal(s):
    r, c = divmod(s, 4)
    goal_r, goal_c = (3, 3) if (r + c) >= 3 else (0, 0)   # nearest corner
    if r != goal_r: return 2 if goal_r > r else 0          # down / up
    return 1 if goal_c > c else 3                          # right / left

smart = np.zeros((nS, nA))
for s in range(nS):
    smart[s, toward_goal(s)] = 1.0        # all probability on one action
smart[0] = smart[15] = 0.25               # terminals: irrelevant

def avg_return(policy, n=3000):
    tot = 0.0
    for _ in range(n):
        s, g, steps = 6, 0.0, 0
        while s not in TERMINALS and steps < 200:
            a = rng.choice(nA, p=policy[s])
            g += R[s, a]                       # reward for the step just taken
            s = rng.choice(nS, p=P[s, a])
            steps += 1
        tot += g
    return tot / n

print("random policy  avg return:", round(avg_return(random_policy), 1))
print("toward-goal    avg return:", round(avg_return(smart), 1))`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Core idea", color: GOLD }]}
        time="about 8 minutes"
        title={<>A policy is a way of <em>behaving</em></>}
        intro={<>We have the world and the goal; what we still lack is the agent&rsquo;s side of the loop — how it
          actually decides. That is the policy. It is the whole strategy of the agent condensed into a single
          object: for every situation it might find itself in, what will it do? Everything we compute from here —
          values, optimality — is a statement <em>about a policy</em>.</>}
      />

      <div className="lesson">
        <h2>The definition</h2>
        <p>
          A <strong>policy</strong> <M>{String.raw`\pi`}</M> maps each state to a probability distribution over
          actions:
        </p>
        <MathBlock>{String.raw`\pi(a \mid s) = P(A_t = a \mid S_t = s).`}</MathBlock>
        <p>
          That is all it is — a rule for choosing, possibly a randomised one. Because the state is Markov, the
          policy only needs the current state; it need not remember the past. A policy that puts all its
          probability on one action per state is <strong>deterministic</strong> (write{" "}
          <M>{String.raw`\pi(s) = a`}</M>); one that spreads probability across actions is{" "}
          <strong>stochastic</strong>. The random walk we have been abusing is the maximally stochastic policy:{" "}
          <M>{String.raw`\pi(a\mid s) = \tfrac14`}</M> for all four moves.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt="We replace the coin-flip random policy with a deterministic one that always steps toward the nearest goal corner. Roughly what happens to the average total reward from the centre?"
          options={[
            "It barely changes — the grid is small either way",
            "It improves dramatically — a direct march reaches a corner in a few steps instead of dozens",
            "It gets worse — deterministic policies are more fragile",
          ]}
          nudge="Locked in. Recall the random walk averaged around −20 from cell 6."
        />

        <CodeBlock setup={GRIDWORLD_SETUP} fromScratch={code} />
        <CodeOutput>{`random policy  avg return: -20.4
toward-goal    avg return: -3.0`}</CodeOutput>
        <p>
          The hand-crafted policy earns <strong>−3.0</strong> against the random walk&rsquo;s{" "}
          <strong>−20.4</strong> — the same world, the same rewards, a completely different outcome, purely
          because the agent chooses better. This is the entire game in one comparison: <em>the MDP fixes what is
          possible; the policy decides what actually happens.</em> The rest of the track is about finding the
          policy that does best, and proving no other can beat it.
        </p>

        <h2>Why would you ever want randomness?</h2>
        <p>
          A deterministic policy feels obviously better — why leave anything to chance? Two reasons.{" "}
          <strong>While learning</strong>, stochasticity is how you explore: an agent that always picks its
          current best never discovers a better one (the dilemma from the last chapter). And in some problems the
          <em> optimal</em> policy is genuinely stochastic — most famously when the state isn&rsquo;t fully
          Markov (partial observability), where committing to one action per observation can be exploited, and
          mixing is provably better. In a fully-observed MDP, though, there is a comforting theorem waiting for
          us: <strong>some deterministic policy is optimal.</strong> You never <em>need</em> randomness to act
          best in an MDP — only to <em>find</em> how.
        </p>

        <Callout color={GOLD} title={<>A policy turns an MDP into a Markov chain</>}>
          Fix a policy and the agent stops choosing — at each state it draws its action from{" "}
          <M>{String.raw`\pi(\cdot\mid s)`}</M>, so the state now evolves on its own with transition
          probabilities <M>{String.raw`P^\pi(s'\mid s) = \sum_a \pi(a\mid s)\,P(s'\mid s,a)`}</M>. The
          decision problem collapses into a plain <Term def="a random process that hops between states with fixed probabilities, with no choices to make" accent={GOLD}>Markov chain</Term> with rewards. That collapse is
          precisely what makes a policy <em>evaluable</em>: once behaviour is fixed, &ldquo;how good is this
          policy?&rdquo; is a question about a chain, and the next pages answer it.
        </Callout>

        <p>
          So we can already <em>compare</em> policies by rolling them out and averaging — but sampling thousands
          of episodes is slow and noisy. There is a far better way to say how good a policy is, one that assigns
          a precise number to every state at once. That number is the value function.
        </p>

        <PrevNext
          prev={{ href: "/learn/markov-decision-processes/the-return", label: <>← The return we maximise</> }}
          next={{ href: "/learn/markov-decision-processes/state-value-function", label: <>Next · The state-value function →</> }}
        />
      </div>
    </article>
  );
}
