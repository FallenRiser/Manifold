import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { PLANNING_DONE, PLANNING_TOTAL } from "@/lib/planningTrack";

export const metadata = {
  title: "Planning — Manifold",
  description:
    "Dynamic programming for reinforcement learning. With the model in hand, optimal behaviour is computable: policy iteration and value iteration are two faces of one loop — evaluate, then improve. Built on a gridworld you can run.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function PlanningHub() {
  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Reinforcement learning", color: GOLD },
          {
            label: PLANNING_DONE >= PLANNING_TOTAL ? `Complete · ${PLANNING_TOTAL} pages` : `${PLANNING_DONE} of ${PLANNING_TOTAL} pages`,
            color: GOLD,
          },
        ]}
        time="the second RL track"
        title={<>Planning with a <em>map</em></>}
        intro={<>The last track handed you a superpower and stopped short of using it. You can now say exactly what
          any way of behaving is worth — but not yet how to find the <em>best</em> way. This track takes that final
          step of the classical theory: given a full model of the world, <strong>compute the optimal policy</strong>.
          It is called planning, and it is where the Bellman equations stop being descriptions and become
          algorithms.</>}
        titleSize={44}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>You already have half of it</h2>
        <p>
          In the <Link href="/learn/markov-decision-processes" style={link}>Markov decision processes</Link> track
          you built two things: the <strong>problem</strong> (an MDP{" "}
          <M>{String.raw`\langle \mathcal{S},\mathcal{A},P,R,\gamma\rangle`}</M>) and the tool to{" "}
          <strong>evaluate</strong> a fixed policy — solve the Bellman expectation equation and you know{" "}
          <M>{String.raw`V^\pi`}</M> for every state. You also saw the seed of something more: acting{" "}
          <em>greedily</em> on a value function gives a new policy that is never worse. Planning is what happens
          when you take that seed seriously and run it to its conclusion.
        </p>
        <p>
          The whole track turns on a single loop. <strong>Evaluate</strong> a policy to find its values, then{" "}
          <strong>improve</strong> the policy by acting greedily on those values, then evaluate again — and repeat.
          Each turn of the loop produces a strictly better policy, and because there are only finitely many
          policies, you reach the best one in finite time. That loop, in its two famous forms, is the entire
          content of classical reinforcement learning.
        </p>

        <Callout color={GOLD} title={<>Two algorithms, one idea</>}>
          <strong>Policy iteration</strong> evaluates each policy fully before improving it — big, careful steps.
          <strong> Value iteration</strong> improves after just a single sweep of evaluation — small, cheap steps.
          They look different and cost differently, but this track&rsquo;s central claim is that they are two
          settings of one dial (&ldquo;how much do you evaluate before you improve?&rdquo;), both converging to the
          same optimal value function <M>{String.raw`V^*`}</M> and the same optimal policy{" "}
          <M>{String.raw`\pi^*`}</M>. Understand the dial and you understand every dynamic-programming method there is.
        </Callout>

        <h2>What &ldquo;planning&rdquo; means here</h2>
        <p>
          A word of precision, because it separates this track from the next. <strong>Planning</strong> means
          computing good behaviour from a <em>known</em> model — you have <M>P</M> and <M>R</M> in hand and reason
          over them, without ever taking a real action. <strong>Learning</strong> means discovering good behaviour
          from <em>experience</em>, when the model is unknown and all you get is the stream of states, actions and
          rewards that acting produces. This track is entirely about planning; every method here reads the model
          directly. The moment you cannot — the moment the world is a black box — is exactly where the{" "}
          <em>Learning</em> track (TD, Q-learning, SARSA) begins.
        </p>

        <h2>The map of the track</h2>
        <ul>
          <li><strong>The planning problem</strong> — prediction versus control, and the two levers (evaluation and improvement) the whole track pulls.</li>
          <li><strong>Policy iteration</strong> — the evaluate-then-improve loop, why it must reach the optimum, and how astonishingly few steps it takes.</li>
          <li><strong>Value iteration</strong> — collapse evaluation to a single sweep, know when to stop, and read the plan off the values.</li>
          <li><strong>One loop, many schedules</strong> — generalized policy iteration, asynchronous updates, prioritized sweeping, and the dial between the two algorithms.</li>
          <li><strong>The limits of planning</strong> — the cost of a sweep, the curse of dimensionality, and the ideas (real-time DP, sampling) that lead out of the table.</li>
        </ul>

        <Callout color={GOLD} title={<>Everything runs on a gridworld you can touch</>}>
          As in the MDP track, the whole story lives on a 4&times;4 grid — this time with a{" "}
          <strong>goal</strong> to reach and a <strong>pit</strong> to avoid. Tiny enough that every value and every
          optimal move can be printed and checked by hand; real enough that you can watch a policy learn to walk to
          the goal and refuse to step in the pit. The code is genuine NumPy, and the numbers it prints are the ones
          the figures and labs show.
        </Callout>

        <h2>What you should already have</h2>
        <p>
          The MDP track, essentially. You need to be comfortable with the{" "}
          <Link href="/learn/markov-decision-processes/bellman-expectation" style={link}>Bellman expectation equation</Link>,{" "}
          <Link href="/learn/markov-decision-processes/bellman-optimality" style={link}>the optimality equation</Link>,
          and the idea that a <Link href="/learn/markov-decision-processes/greedy-policies" style={link}>greedy policy</Link>{" "}
          reads a decision off a value function. If those phrases feel solid, you are ready; this track turns them
          into working algorithms.
        </p>

        <PrevNext
          prev={{ href: "/learn/markov-decision-processes/the-throughline", label: <>← Finish: the MDP throughline</> }}
          next={{ href: "/learn/planning/prediction-vs-control", label: <>Start · Prediction vs control →</> }}
        />
      </div>
    </article>
  );
}
