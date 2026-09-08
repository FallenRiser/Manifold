import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "The return we maximise — Manifold",
  description:
    "The return Gₜ is the actual objective: the discounted sum of future rewards. Its recursive form Gₜ = Rₜ₊₁ + γGₜ₊₁ is the seed of the Bellman equation, and expected return is what every value function averages.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function TheReturn() {
  const code = `import numpy as np
# One episode's rewards, and its return computed two ways.
rewards = [-1, -1, -1, -1, 10]     # four steps, then a +10 finish
gamma = 0.9

# forward: the definition, sum of discounted future rewards from t=0
G_forward = sum(gamma**k * r for k, r in enumerate(rewards))

# backward: the recursion G_t = r_{t+1} + gamma * G_{t+1}, walked right-to-left
G, series = 0.0, []
for r in reversed(rewards):
    G = r + gamma * G
    series.append(round(G, 3))
series.reverse()

print("return G_0 (forward sum) :", round(G_forward, 3))
print("return G_0 (backward rec):", series[0])
print("G_t at each step         :", series)`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Core idea", color: GOLD }]}
        time="about 8 minutes"
        title={<>The return we <em>maximise</em></>}
        intro={<>We finally have a clean statement of the goal. Not &ldquo;get reward&rdquo; — get the most{" "}
          <em>return</em>: the discounted sum of everything you will earn from here on. Written one way it is a
          sum stretching into the future; written another it folds into a tiny recursion that turns out to be the
          single most important equation in the whole field.</>}
      />

      <div className="lesson">
        <h2>The objective, precisely</h2>
        <p>
          The <strong>return</strong> <M>{String.raw`G_t`}</M> is the total discounted reward from step{" "}
          <M>t</M> onward:
        </p>
        <MathBlock>{String.raw`G_t = R_{t+1} + \gamma R_{t+2} + \gamma^2 R_{t+3} + \cdots = \sum_{k=0}^{\infty}\gamma^{k} R_{t+k+1}.`}</MathBlock>
        <p>
          This — not the per-step reward — is what an agent is trying to make large. It is the number the whole
          apparatus of value functions exists to estimate. Note it is a property of a <em>whole future</em>: to
          know <M>{String.raw`G_t`}</M> for certain you would need to see the entire trajectory that unfolds. In
          a stochastic world that future is random, which is why, a chapter from now, value will be defined as
          the <em>expected</em> return — an average over all the futures the world might produce.
        </p>

        <h2>The recursion that changes everything</h2>
        <p>
          Pull the first reward out of the sum and stare at what remains:
        </p>
        <MathBlock>{String.raw`G_t = R_{t+1} + \gamma\underbrace{\left(R_{t+2} + \gamma R_{t+3} + \cdots\right)}_{=\,G_{t+1}} = R_{t+1} + \gamma\,G_{t+1}.`}</MathBlock>
        <p>
          The return at this step is <strong>this step&rsquo;s reward plus the discounted return from the next
          step.</strong> That self-reference — <M>{String.raw`G_t`}</M> defined in terms of{" "}
          <M>{String.raw`G_{t+1}`}</M> — is the seed of the <strong>Bellman equation</strong>, the recursion that
          the rest of this track (and the next two) is built on. Almost every RL algorithm is, at heart, this one
          line applied over and over. Watch it reproduce the forward sum exactly, computed backwards along an
          episode:
        </p>

        <CodeBlock setup={"import numpy as np"} fromScratch={code} />
        <CodeOutput>{`return G_0 (forward sum) : 3.122
return G_0 (backward rec): 3.122
G_t at each step         : [3.122, 4.58, 6.2, 8.0, 10.0]`}</CodeOutput>
        <p>
          Both routes give <M>{String.raw`G_0 = 3.122`}</M>. But look at the per-step series climbing toward the
          finish: the return is <em>higher</em> near the +10, because there is less discounting between you and
          the payoff. That is the value function in embryo — later states, closer to the reward, are worth more.
          Computing this backward pass is not just a trick; it is how every value we compute will be found, by
          propagating reward backward from where it is earned to the states that lead there.
        </p>

        <Callout color={GOLD} title={<>Episodic and continuing, unified</>}>
          The recursion <M>{String.raw`G_t = R_{t+1} + \gamma G_{t+1}`}</M> works for both flavours of task. In an
          episodic task, the return from a terminal state is 0 (nothing follows), and the recursion unwinds a
          finite chain — exactly the backward pass above. In a continuing task it unwinds forever, but{" "}
          <M>{String.raw`\gamma < 1`}</M> keeps the total finite. One definition, both worlds — which is why the
          discount factor and the return are introduced together.
        </Callout>

        <Proof title="the recursion by an index shift, and why the expected return is even well-defined" color={GOLD}>
          <p>
            <strong>1. The recursion, rigorously.</strong> The &ldquo;pull out the first term&rdquo; step is an
            index shift on the sum. Start from the definition and peel off <M>{String.raw`k=0`}</M>:
          </p>
          <MathBlock>{String.raw`G_t = \sum_{k=0}^{\infty}\gamma^{k}R_{t+k+1} = R_{t+1} + \sum_{k=1}^{\infty}\gamma^{k}R_{t+k+1}.`}</MathBlock>
          <p>
            In the remaining sum substitute <M>{String.raw`j = k-1`}</M> (so <M>{String.raw`k=j+1`}</M>, and{" "}
            <M>{String.raw`k=1`}</M> becomes <M>{String.raw`j=0`}</M>), then factor out one <M>{String.raw`\gamma`}</M>:
          </p>
          <MathBlock>{String.raw`\sum_{k=1}^{\infty}\gamma^{k}R_{t+k+1} = \sum_{j=0}^{\infty}\gamma^{\,j+1}R_{t+j+2} = \gamma\sum_{j=0}^{\infty}\gamma^{\,j}R_{(t+1)+j+1} = \gamma\,G_{t+1},`}</MathBlock>
          <p>
            because the last sum is precisely the definition of the return started at time{" "}
            <M>{String.raw`t+1`}</M>. Hence <M>{String.raw`G_t = R_{t+1} + \gamma G_{t+1}`}</M> — the recursion is
            not an approximation or a special case, it is an identity forced by re-indexing an infinite series.
          </p>
          <p>
            <strong>2. Why the series converges at all.</strong> An infinite sum of rewards need not be a number.
            But if rewards are bounded, <M>{String.raw`|R_{t+k+1}| \le R_{\max}`}</M>, then the terms are dominated
            by a geometric series:
          </p>
          <MathBlock>{String.raw`\sum_{k=0}^{\infty}\big|\gamma^{k}R_{t+k+1}\big| \le R_{\max}\sum_{k=0}^{\infty}\gamma^{k} = \frac{R_{\max}}{1-\gamma} < \infty \quad(0\le\gamma<1).`}</MathBlock>
          <p>
            So the return <em>converges absolutely</em> — it is a genuine, finite real number for every trajectory,
            not a formal symbol. (In an episodic task the sum is finite outright, so even{" "}
            <M>{String.raw`\gamma = 1`}</M> is fine.)
          </p>
          <p>
            <strong>3. Why we may define value as <M>{String.raw`\mathbb{E}[G_t]`}</M>.</strong> Value, next
            chapter, will be the <em>expected</em> return. Taking the expectation of an infinite sum means swapping{" "}
            <M>{String.raw`\mathbb{E}`}</M> with <M>{String.raw`\sum`}</M> — a move that is only legal when the sum
            converges absolutely. That is exactly what step 2 established (it is the hypothesis of the dominated
            convergence / Fubini theorem for series). So <M>{String.raw`\mathbb{E}[G_t]`}</M> is well-defined, and
            the recursion of step 1 survives the expectation intact — which is the seed from which the whole Bellman
            equation grows one chapter from now.
          </p>
        </Proof>

        <h2>Where this leaves us</h2>
        <p>
          We now have the full problem: an MDP <M>{String.raw`\langle \mathcal{S},\mathcal{A},P,R,\gamma\rangle`}</M>{" "}
          and a crisp objective, the expected return. What we do <em>not</em> yet have is a way to behave. The
          return depends on the actions taken, and &ldquo;which action, in which state&rdquo; is a{" "}
          <strong>policy</strong> — the subject of the next chapter. Once we can score a policy by the return it
          earns, we can start asking which policy is best, and how to find it.
        </p>

        <Quiz
          accent={GOLD}
          title="Chapter checkpoint"
          questions={[
            {
              q: <>What is the return <M>{String.raw`G_t`}</M>?</>,
              options: [
                "The reward received at step t",
                "The discounted sum of all rewards from step t onward",
                "The average reward per step",
              ],
              answer: 1,
              explain: <>The return is the cumulative, discounted future reward — <M>{String.raw`\sum_k \gamma^k R_{t+k+1}`}</M>.
                It is the actual objective; the per-step reward is just one term of it.</>,
            },
            {
              q: <>Why is the identity <M>{String.raw`G_t = R_{t+1} + \gamma G_{t+1}`}</M> so important?</>,
              options: [
                "It lets you skip computing rewards",
                "It expresses the return self-referentially — the seed of the Bellman equation that all value methods use",
                "It only works when γ = 1",
              ],
              answer: 1,
              explain: <>Splitting off the first reward shows the return obeys a one-step recursion. That
                self-reference is exactly the structure the Bellman equation formalises, and computing it by
                propagating reward backward is how values get found.</>,
            },
            {
              q: <>In the backward pass, why does <M>{String.raw`G_t`}</M> grow as the episode approaches the +10
                finish?</>,
              options: [
                "The rewards get larger each step",
                "There is less discounting between a late state and the payoff, so the future reward is worth more from there",
                "The discount factor increases over time",
              ],
              answer: 1,
              explain: <>Each step closer to the reward means one fewer factor of γ between you and it, so the
                discounted value of that +10 is larger from later states. States nearer the payoff are worth
                more — value in miniature.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/markov-decision-processes/the-discount-factor", label: <>← The discount factor</> }}
          next={{ href: "/learn/markov-decision-processes/policies", label: <>Next chapter · A policy is a way of behaving →</> }}
        />
      </div>
    </article>
  );
}
