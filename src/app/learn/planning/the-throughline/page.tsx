import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { Backlinks } from "@/components/Backlinks";

export const metadata = {
  title: "The throughline — Manifold",
  description:
    "The whole Planning track in one arc: from a known model to a computable optimal policy. Policy iteration and value iteration as two ends of one dial, the schedules in between, the limits of the table, and where reinforcement learning goes next.",
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
        intro={<>You arrived able to say what any policy is worth. You leave able to <em>find</em> the best one — to
          turn a known model into an optimal policy by dynamic programming, and to see the whole family of methods as
          one loop run at different settings. Here is the arc in a single view, and the door it opens.</>}
      />

      <div className="lesson">
        <h2>The arc, in five moves</h2>
        <ol>
          <li>
            <strong>The problem.</strong> Planning is <em>control with a known model</em>: compute the optimal
            policy from <M>P</M> and <M>R</M> without acting. It splits into <strong>prediction</strong> (evaluate a
            given policy — the MDP track&rsquo;s tool) and <strong>control</strong> (find the best policy — this
            track&rsquo;s goal).
          </li>
          <li>
            <strong>The two levers.</strong> <strong>Evaluation</strong> makes the values consistent with the policy;
            <strong> improvement</strong> makes the policy greedy for the values. The policy improvement theorem
            guarantees improvement never hurts, and their only joint fixed point is the optimum.
          </li>
          <li>
            <strong>Two algorithms.</strong> <strong>Policy iteration</strong> evaluates fully before improving —
            few, expensive rounds, exact termination. <strong>Value iteration</strong> improves after a single sweep
            — many cheap sweeps, needing a stopping rule. Both reach <M>{String.raw`V^*`}</M> and{" "}
            <M>{String.raw`\pi^*`}</M>.
          </li>
          <li>
            <strong>One dial.</strong> They are the ends of a spectrum — <em>evaluation sweeps per improvement</em>,{" "}
            <M>k=1</M> to <M>{String.raw`k=\infty`}</M> (modified policy iteration). Generalized policy iteration says
            almost any schedule converges; asynchronous DP and prioritized sweeping just choose <em>which states to
            back up, in what order.</em>
          </li>
          <li>
            <strong>The limits.</strong> A sweep costs <M>{String.raw`O(|\mathcal{S}|^2|\mathcal{A}|)`}</M>, and{" "}
            <M>{String.raw`|\mathcal{S}|`}</M> explodes exponentially with the number of state variables — the curse
            of dimensionality. The escapes: <em>don&rsquo;t enumerate</em> (real-time DP, sampling / MCTS) and{" "}
            <em>don&rsquo;t tabulate</em> (function approximation).
          </li>
        </ol>

        <Callout color={GOLD} title={<>The one sentence to keep</>}>
          With the model in hand, optimal behaviour is computable by dynamic programming — and{" "}
          <strong>every method is the same evaluate-then-improve loop, differing only in how thoroughly it evaluates,
          which states it backs up, and in what order.</strong> Policy iteration and value iteration are not rivals;
          they are two settings of one dial.
        </Callout>

        <h2>What this track assumed — and what comes next</h2>
        <p>
          Every algorithm here read the model directly. That is the assumption the family now drops, one track at a
          time:
        </p>
        <ul>
          <li>
            <strong>The model is known.</strong> Drop it and you must learn from experience — sample the Bellman
            backup instead of summing it. That is <em>TD learning, Q-learning, and SARSA</em>: the Learning track,
            and the return of exploration.
          </li>
          <li>
            <strong>Values fit in a table.</strong> Drop it and you must generalise across states with a parametric
            value function — <em>function approximation</em> and deep RL.
          </li>
        </ul>
        <p>
          Both keep everything you built here — value functions, the Bellman equations, generalized policy iteration,
          the contraction — and swap out one implementation detail. You have the foundation; the rest of the family
          is this loop, unplugged from the blueprint.
        </p>

        <Quiz
          accent={GOLD}
          title="Throughline test"
          questions={[
            {
              q: <>What single idea unifies policy iteration, value iteration, and everything between?</>,
              options: [
                "They all invert a matrix",
                "They are the same evaluate-then-improve loop (generalized policy iteration), differing only in how much they evaluate before improving",
                "They all require γ < 1",
              ],
              answer: 1,
              explain: <>Evaluation and improvement chasing each other to their joint fixed point is the whole family.
                The algorithms differ only in the schedule — how thoroughly, which states, in what order.</>,
            },
            {
              q: <>What is the difference in how policy iteration and value iteration stop?</>,
              options: [
                "They stop identically",
                "Policy iteration halts exactly when the policy stops changing; value iteration only approaches V* and needs a stopping rule (the γδ/(1−γ) bound)",
                "Value iteration halts exactly; policy iteration never terminates",
              ],
              answer: 1,
              explain: <>Policy iteration stores the policy and stops at the exact optimum; value iteration converges
                in the limit, so you certify closeness with the Bellman-error bound or stop when the greedy policy
                stabilises.</>,
            },
            {
              q: <>Why does tabular dynamic programming fail on real problems, given it&rsquo;s polynomial in |S|?</>,
              options: [
                "It isn't polynomial",
                "|S| itself is exponential in the number of state variables (the curse of dimensionality), so 'polynomial in |S|' is still intractable",
                "Because γ is too large",
              ],
              answer: 1,
              explain: <>Efficiency in <M>{String.raw`|\mathcal{S}|`}</M> is real, but{" "}
                <M>{String.raw`|\mathcal{S}| = v^d`}</M> explodes with the number of variables — forcing sampling and
                function approximation.</>,
            },
            {
              q: <>What is the single change that turns a planning (DP) backup into a learning (TD) update?</>,
              options: [
                "Adding a discount factor",
                "Replacing the exact sum over the known model with a single sampled transition (observed reward and next state)",
                "Removing the max over actions",
              ],
              answer: 1,
              explain: <>Planning sums over <M>P</M> and reads <M>R</M>; learning samples one transition and nudges
                toward it. Same Bellman idea, model swapped for experience — the doorway to the Learning track.</>,
            },
          ]}
        />

        <h2>Where to go next</h2>
        <p>
          You now hold the classical theory of solving a known MDP whole. The natural next step is{" "}
          <strong>model-free learning</strong> — TD learning, Q-learning, and SARSA — which drops the model and
          learns to act from experience alone, followed by <strong>function approximation</strong>, which drops the
          table. Each keeps the Bellman machinery you built across this track and the last, and stays anchored to the
          evaluate-and-improve loop you now understand from the inside.
        </p>

        <Backlinks
          label="Revisit"
          items={[
            { label: "Policy iteration", href: "/learn/planning/policy-iteration" },
            { label: "Value iteration", href: "/learn/planning/value-iteration" },
            { label: "Modified policy iteration (the dial)", href: "/learn/planning/modified-policy-iteration" },
            { label: "Planning vs learning", href: "/learn/planning/planning-vs-learning" },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/planning/planning-vs-learning", label: <>← Planning vs learning</> }}
          next={{ href: "/map", label: <>The curriculum map →</> }}
        />
      </div>
    </article>
  );
}
