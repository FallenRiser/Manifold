import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { Backlinks } from "@/components/Backlinks";

export const metadata = {
  title: "The throughline — Manifold",
  description:
    "The whole MDP track in one arc: from 'learn by acting' to a solvable object and a computable optimal policy. The four assumptions, which tracks drop each, and where reinforcement learning goes next.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function TheThroughline() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Synthesis", color: GOLD }]}
        time="about 6 minutes"
        title={<>The throughline</>}
        intro={<>You arrived thinking reinforcement learning was trial and error with a robot. You leave able to
          write a decision problem as a precise object, say exactly what any way of behaving is worth, and read
          the best possible behaviour straight off a value function — all on a gridworld you can run. Here is the
          whole arc in one view, and the map of where it goes.</>}
      />

      <div className="lesson">
        <h2>The arc, in five moves</h2>
        <ol>
          <li>
            <strong>The problem.</strong> Learning from reward is different — feedback is evaluative, actions
            steer the future, reward is delayed. We tamed the vagueness by writing it as a{" "}
            <strong>Markov decision process</strong> <M>{String.raw`\langle \mathcal{S},\mathcal{A},P,R,\gamma\rangle`}</M>,
            whose one non-negotiable is that the state be a sufficient statistic for the future.
          </li>
          <li>
            <strong>The objective.</strong> Not per-step reward but the <strong>return</strong> — discounted
            cumulative reward — and its recursion <M>{String.raw`G_t = R_{t+1} + \gamma G_{t+1}`}</M>, the seed of
            everything.
          </li>
          <li>
            <strong>Value.</strong> A <strong>policy</strong> is a way of behaving; its <strong>value
            function</strong> <M>{String.raw`V^\pi`}</M> (and <M>{String.raw`Q^\pi`}</M>) is the expected return,
            the bridge from reward to decision. Value obeys the <strong>Bellman expectation equation</strong> — a
            self-referential rule that, for a fixed policy, is a linear system you can solve outright.
          </li>
          <li>
            <strong>Optimality.</strong> Swap the policy-average for a <M>{String.raw`\max`}</M> and you get the
            <strong> Bellman optimality equation</strong> for <M>{String.raw`V^*`}</M>. Acting greedily on{" "}
            <M>{String.raw`V^*`}</M> is optimal; an optimal policy always exists, because the optimality backup is
            a <strong>contraction</strong> with a unique fixed point.
          </li>
          <li>
            <strong>Computation.</strong> <strong>Iterative policy evaluation</strong> reaches{" "}
            <M>{String.raw`V^\pi`}</M> by repeating the backup — value seeping out from reward — converging
            geometrically at rate <M>{String.raw`\gamma`}</M>.
          </li>
        </ol>

        <Callout color={GOLD} title={<>The one sentence to keep</>}>
          An MDP turns &ldquo;learn from reward&rdquo; into a precise object, and the value function is the bridge
          from rewards to decisions: <strong>solve the Bellman equation for value, then act greedily.</strong>{" "}
          Every algorithm in reinforcement learning is a variation on that theme — a different way to get the
          value, or to do it without the model, or without the table.
        </Callout>

        <h2>Four assumptions, four doors</h2>
        <p>
          This track leaned on four simplifications. Naming them <em>is</em> the map of the family, because each
          later track is what happens when you drop one:
        </p>
        <ul>
          <li>
            <strong>We knew the model (<M>P</M>, <M>R</M>).</strong> Drop it and you must learn from experience —{" "}
            <em>TD learning, Q-learning, SARSA</em> (the Learning track).
          </li>
          <li>
            <strong>We only <em>evaluated</em> a given policy here.</strong> Turning evaluation into finding the{" "}
            <em>best</em> policy with a known model is <em>value iteration and policy iteration</em> (the Planning
            track).
          </li>
          <li>
            <strong>We stored one value per state in a table.</strong> Drop that and you must generalise —{" "}
            <em>function approximation</em> and deep RL.
          </li>
          <li>
            <strong>We assumed the state was fully observed and Markov.</strong> Drop it and you are in{" "}
            <em>POMDPs</em>, with memory and belief states.
          </li>
        </ul>

        <Quiz
          accent={GOLD}
          title="Throughline test"
          questions={[
            {
              q: <>What is the single idea that connects reward to good decisions?</>,
              options: [
                "Always take the action with the highest immediate reward",
                "The value function — expected cumulative reward — lets you choose by comparing where actions lead, not just their immediate payoff",
                "Exploration",
              ],
              answer: 1,
              explain: <>Reward is myopic; value looks to the horizon. Comparing the value of where actions lead
                is what &ldquo;playing well&rdquo; means — solve for value, then act greedily.</>,
            },
            {
              q: <>What single change turns the Bellman expectation equation into the optimality equation?</>,
              options: [
                "Setting γ = 1",
                "Replacing the average over the policy's actions with a maximum over actions",
                "Removing the reward term",
              ],
              answer: 1,
              explain: <>Expectation averages over a given policy (linear, one solve); optimality takes the best
                action (a max, nonlinear, needs iteration). That single <M>{String.raw`\max`}</M> is the whole
                difference between evaluating and optimising.</>,
            },
            {
              q: <>Why is an optimal policy guaranteed to exist and be findable?</>,
              options: [
                "Because there are finitely many policies to try",
                "Because the Bellman optimality operator is a γ-contraction, so by Banach it has a unique fixed point V* that iteration reaches",
                "Because the reward is bounded",
              ],
              answer: 1,
              explain: <>The contraction gives a unique fixed point (existence + uniqueness) reachable from any
                start (computability). Greedy on that <M>{String.raw`V^*`}</M> is an optimal policy.</>,
            },
            {
              q: <>Q-learning drops which assumption this track relied on?</>,
              options: [
                "That the state is Markov",
                "That the model P and R is known — it learns Q from sampled experience instead",
                "That values fit in a table",
              ],
              answer: 1,
              explain: <>Q-learning is model-free: it learns <M>{String.raw`Q^*`}</M> from sampled{" "}
                <M>{String.raw`(s,a,r,s')`}</M> transitions, no <M>P</M> or <M>R</M> needed. Function
                approximation is the separate step of dropping the table.</>,
            },
          ]}
        />

        <h2>Where to go next</h2>
        <p>
          You now have the foundation the entire family stands on. The natural next step is <strong>Planning</strong>{" "}
          — value iteration and policy iteration, which turn this track&rsquo;s evaluation into finding the
          optimal policy outright — followed by <strong>model-free learning</strong> (TD, Q-learning, SARSA) and{" "}
          <strong>function approximation</strong>. Each one drops an assumption named above and stays anchored to
          the Bellman equations you now understand from the inside.
        </p>

        <Backlinks
          label="Revisit"
          items={[
            { label: "The Bellman optimality equation", href: "/learn/markov-decision-processes/bellman-optimality" },
            { label: "Iterative policy evaluation", href: "/learn/markov-decision-processes/iterative-policy-evaluation" },
            { label: "Why an optimal policy exists", href: "/learn/markov-decision-processes/why-optimal-exists" },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/markov-decision-processes/model-free-preview", label: <>← What if we don’t know the rules?</> }}
          next={{ href: "/map", label: <>The curriculum map →</> }}
        />
      </div>
    </article>
  );
}
