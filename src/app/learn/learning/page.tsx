import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { LEARNING_DONE, LEARNING_TOTAL } from "@/lib/learningTrack";

export const metadata = {
  title: "Learning (model-free RL) — Manifold",
  description:
    "Drop the one assumption planning relied on: a known model. When you cannot read P and R, you cannot sum the Bellman backup — you must sample it from experience. Monte Carlo, temporal-difference learning, SARSA and Q-learning, all on a gridworld you can only act in.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function LearningHub() {
  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Reinforcement learning", color: GOLD },
          {
            label: LEARNING_DONE >= LEARNING_TOTAL ? `Complete · ${LEARNING_TOTAL} pages` : `${LEARNING_DONE} of ${LEARNING_TOTAL} pages`,
            color: GOLD,
          },
        ]}
        time="the model-free turn"
        title={<>Learning from <em>experience</em></>}
        intro={<>The last two tracks handed you a superpower and a catch. The superpower: given a world&rsquo;s
          rules — its dynamics <M>P</M> and rewards <M>R</M> — you can compute the optimal policy exactly, by
          dynamic programming. The catch: <strong>you almost never have the rules.</strong> A robot is not handed
          the physics of its motors; a game agent is not told what each move leads to. This track drops that single
          assumption, and everything changes.</>}
        titleSize={44}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>The assumption we are dropping</h2>
        <p>
          Every algorithm in the <Link href="/learn/planning" style={link}>Planning</Link> track read the model
          directly. The optimality backup{" "}
          <M>{String.raw`\max_a\big[R(s,a)+\gamma\sum_{s'}P(s'\mid s,a)V(s')\big]`}</M> <em>sums over</em>{" "}
          <M>P</M> and looks <M>R</M> up in a table. That sum is the whole trick — and it is exactly what you can
          no longer compute when the model is unknown. You cannot average over next states whose probabilities you
          do not have.
        </p>
        <p>
          What you <em>can</em> do is <strong>act, and watch what happens.</strong> Take an action, and the world
          hands you one reward and one next state — a single sample from the very distribution you cannot see. The
          entire field of model-free reinforcement learning grows from one move: <strong>replace the expectation you
          can&rsquo;t compute with an average of samples you can collect.</strong>
        </p>

        <Callout color={GOLD} title={<>The one idea this track rests on</>}>
          Planning <em>sums</em> the Bellman backup over a known model. Learning <em>samples</em> it from
          experience. Same Bellman equations, same value functions, same evaluate-then-improve loop — but the exact
          sum over <M>P</M> and <M>R</M> becomes an average over transitions the agent actually lived through.
          Get comfortable with that swap and the whole track unfolds from it.
        </Callout>

        <h2>Two questions organise everything</h2>
        <p>
          Once you are learning from samples, every method in this track is a choice on two axes:
        </p>
        <ul>
          <li>
            <strong>How do you turn samples into a value?</strong> Wait for the episode to end and average the whole
            <em> return</em> (<strong>Monte Carlo</strong>), or update after every single step using your own
            current estimate of what comes next (<strong>temporal-difference learning</strong>). The first is
            unbiased but high-variance and needs complete episodes; the second bootstraps, learns online, and is the
            workhorse of modern RL.
          </li>
          <li>
            <strong>Which policy are you evaluating — the one you follow, or the one you wish you followed?</strong>{" "}
            Evaluate the behaviour you actually use, exploration and all (<strong>on-policy</strong>, e.g. SARSA), or
            learn the value of the greedy policy while behaving more adventurously (<strong>off-policy</strong>, e.g.
            Q-learning). This one distinction decides how an agent behaves near a cliff, and we will make it vivid.
          </li>
        </ul>

        <h2>And one old problem comes roaring back</h2>
        <p>
          In planning you never had to <em>try</em> anything — you read the consequences of every action off the
          model. Strip the model away and an agent can only learn about actions it actually takes. So it must
          deliberately try things that look suboptimal, in case they are secretly better — the{" "}
          <strong>exploration&ndash;exploitation dilemma</strong> from the very first RL chapter, which planning let
          us ignore and learning cannot. Chapter&nbsp;1 puts it back at the centre.
        </p>

        <Callout color={GOLD} title={<>You will only ever sample the world</>}>
          The whole track runs on a gridworld you can <em>act in but not read</em>: a small environment exposing
          just <code>reset()</code> and <code>step(a)</code> — take an action, get back one reward and one next
          state. That is deliberate. Where the MDP and Planning tracks summed over the <code>P</code> and{" "}
          <code>R</code> tables, here your code may only call <code>step</code>, exactly like a real agent. When a
          page checks an answer against &ldquo;the truth,&rdquo; it peeks at the hidden model with a clearly labelled
          oracle — precisely to show how close learning from samples alone can get.
        </Callout>

        <h2>What this track is — and is not</h2>
        <p>
          This track drops the <strong>known model</strong> but keeps the <strong>table</strong>: one value stored
          per state (or per state&ndash;action pair), held exactly. That is enough for Monte Carlo, TD learning,
          SARSA, Q-learning, and the ideas that unify them (n-step returns, eligibility traces). It stops at the
          door of the next track: when the state space is too large to tabulate and values must be{" "}
          <em>approximated</em> by a parametric function — <em>function approximation</em> and deep RL. We name that
          door clearly; we do not walk through it here.
        </p>

        <h2>What you should already have</h2>
        <p>
          The two tracks before this one.{" "}
          <Link href="/learn/markov-decision-processes" style={link}>Markov decision processes</Link> gave you value
          functions, returns, and the Bellman equations;{" "}
          <Link href="/learn/planning" style={link}>Planning</Link> gave you generalized policy iteration and the
          evaluate-then-improve loop. This track keeps every one of those ideas and swaps a single ingredient — the
          model — for experience. If &ldquo;<M>{String.raw`V^\pi`}</M> is an expected return&rdquo; and
          &ldquo;act greedily with respect to values&rdquo; feel solid, you are ready.
        </p>

        <PrevNext
          prev={{ href: "/learn/planning/the-throughline", label: <>← Planning: the throughline</> }}
          next={{ href: "/learn/learning/the-sampled-backup", label: <>Start · The sampled backup →</> }}
        />
      </div>
    </article>
  );
}
