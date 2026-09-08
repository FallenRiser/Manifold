import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { MDP_DONE, MDP_TOTAL } from "@/lib/mdpTrack";

export const metadata = {
  title: "Markov Decision Processes — Manifold",
  description:
    "Reinforcement learning, from the ground up. An MDP turns 'learn by trial and error' into a precise object you can solve — and the value function is the bridge from rewards to decisions. Built on a gridworld you can run.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function MdpHub() {
  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Reinforcement learning", color: GOLD },
          {
            label: MDP_DONE >= MDP_TOTAL ? `Complete · ${MDP_TOTAL} pages` : `${MDP_DONE} of ${MDP_TOTAL} pages`,
            color: GOLD,
          },
        ]}
        time="the RL front door"
        title={<>Learning by <em>acting</em></>}
        intro={<>Every other family on this site learns from a stack of answered examples — here is an input,
          here is its label, find the pattern. Reinforcement learning throws that away. There is no answer key.
          There is a world, a set of actions, and a trickle of reward, and the agent has to discover for itself
          which actions are worth taking — often long before the reward that justifies them ever arrives. This
          track builds the object that makes that learnable: <strong>the Markov decision process.</strong></>}
        titleSize={44}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>A different kind of problem</h2>
        <p>
          Think about learning to ride a bike, or play chess, or manage a cache. Nobody hands you a labelled
          dataset of &ldquo;correct handlebar angles.&rdquo; You <em>act</em>, the world responds, and
          occasionally something good or bad happens — you stay upright, you lose your queen, the page loads
          fast. From that thin stream of consequences you have to work out a whole <em>way of behaving</em>.
          That is the reinforcement-learning problem, and three things make it genuinely harder than supervised
          learning:
        </p>
        <ul>
          <li>
            <strong>The feedback is evaluative, not instructive.</strong> A label tells you the right answer.
            A reward only tells you how good the action you <em>took</em> was — never what you should have done
            instead. You have to try things to find out.
          </li>
          <li>
            <strong>Your actions change the data you see next.</strong> A classifier&rsquo;s prediction never
            alters the next image. An agent&rsquo;s action moves it to a new state, so the distribution of what
            it experiences is its own doing. Learning and acting are tangled together.
          </li>
          <li>
            <strong>Reward is delayed.</strong> The move that lost the game may have been ten moves ago. Tying a
            faint, late reward back to the action that truly earned it — the <em>credit-assignment
            problem</em> — is the knot the whole field is built to untie.
          </li>
        </ul>

        <h2>The idea this track rests on</h2>
        <p>
          &ldquo;Trial and error with a robot&rdquo; is a vibe, not something you can compute with. The first
          real move in reinforcement learning is to pin that vibe down into a precise mathematical object: a
          set of <strong>states</strong>, the <strong>actions</strong> available in each, the
          <strong> dynamics</strong> that say where an action lands you, and the <strong>reward</strong> that
          scores it. That object is the Markov decision process, and once you have it, a vague aspiration
          (&ldquo;behave well&rdquo;) becomes a concrete question with a real answer: <strong>which action, in
          which state, and why.</strong>
        </p>
        <p>
          The bridge between the rewards you get and the decisions you make is one idea we will build carefully
          and return to on almost every page — the <strong>value function</strong>. It answers &ldquo;how good
          is it to be here?&rdquo; in a way that already accounts for everything that could happen next. Get the
          value function and the best behaviour falls out of it almost for free. Most of this track is learning
          what the value function is, why it obeys a beautiful self-referential equation, and how to actually
          compute it.
        </p>

        <Callout color={GOLD} title={<>Everything here runs on a gridworld you can touch</>}>
          We teach the whole track on one small world: a 4&times;4 grid an agent walks around. It is tiny enough
          that every number — every transition probability, every value, every optimal move — can be written
          down, printed, and checked by hand. The code samples are real: they build the world in a few lines of
          NumPy and solve it in front of you, and the numbers they print are the same ones the figures show.
          When we reach iterative policy evaluation, your own run will reproduce the classic textbook value
          function to the digit.
        </Callout>

        <h2>What this track is — and is not</h2>
        <p>
          This first RL track owns two things: <strong>the problem</strong> (how to write a decision problem as
          an MDP) and <strong>evaluation</strong> (what a fixed way of behaving is actually worth, computed both
          exactly and by iteration). It deliberately stops at the door of two big neighbours. Finding the
          <em> optimal</em> policy by dynamic programming — value iteration and policy iteration — is the next
          track, <em>Planning</em>. And the case where you <em>don&rsquo;t know the rules of the world</em> in
          advance and must learn purely from experience — TD learning, Q-learning, SARSA — is the track after
          that. Throughout here, we assume the dynamics and rewards are known. The moment they are not is exactly
          where the learning tracks begin.
        </p>

        <h2>What you should already have</h2>
        <p>
          Very little, and all of it is one click away.{" "}
          <Link href="/learn/math-foundations/random-variables" style={link}>Expectation</Link> — a value
          function is an expected total reward, so being comfortable with &ldquo;average over what might
          happen&rdquo; is the one real prerequisite.{" "}
          <Link href="/learn/math-foundations/vectors" style={link}>Vectors and matrices</Link> help, because the
          cleanest way to state and solve the Bellman equations is a little linear algebra. No prior RL, and no
          neural networks — tabular gridworlds need none of it.
        </p>

        <PrevNext
          prev={{ href: "/map", label: <>← The map</> }}
          next={{ href: "/learn/markov-decision-processes/reward-is-the-signal", label: <>Start · Reward is the only signal →</> }}
        />
      </div>
    </article>
  );
}
