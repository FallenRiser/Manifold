import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { GRIDWORLD_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "The agent–environment loop — Manifold",
  description:
    "The closed loop at the heart of RL: the agent observes a state, takes an action, and the environment returns a reward and a next state. Trajectories, episodes vs continuing tasks, and the strict information boundary.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function AgentEnvironmentLoop() {
  const code = `import numpy as np
rng = np.random.default_rng(2)

# walk the loop explicitly: observe s -> choose a -> receive (r, s') -> repeat
s, steps = 6, 0
print(f"{'t':>2}  {'state':>5}  {'action':>6}  {'reward':>6}  next")
while s not in TERMINALS and steps < 8:
    a = rng.choice(nA, p=random_policy[s])   # the agent's move
    s_next = rng.choice(nS, p=P[s, a])        # the environment's response
    r = R[s, a]
    print(f"{steps:>2}  {s:>5}  {ACTIONS[a]:>6}  {r:>6.0f}  {s_next}")
    s, steps = s_next, steps + 1`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Intuition", color: GOLD }]}
        time="about 7 minutes"
        title={<>The agent–environment loop</>}
        intro={<>Reinforcement learning has exactly one moving part, and it is a loop. The agent looks at where
          it is, picks an action, and the world answers with a reward and a new situation. Repeat forever. Every
          concept in this track — states, policies, value, optimality — is a way of reasoning about this one
          turning wheel, so it is worth drawing precisely before we formalise anything.</>}
      />

      <div className="lesson">
        <h2>One turn of the wheel</h2>
        <p>
          Split the world into two pieces: the <strong>agent</strong> (the decision-maker) and the{" "}
          <strong>environment</strong> (everything else). They take turns. At time step <M>t</M>:
        </p>
        <ol>
          <li>The agent observes the current <strong>state</strong> <M>{String.raw`S_t`}</M>.</li>
          <li>It chooses an <strong>action</strong> <M>{String.raw`A_t`}</M> from those available.</li>
          <li>The environment responds with a <strong>reward</strong> <M>{String.raw`R_{t+1}`}</M> and a new
            <strong> state</strong> <M>{String.raw`S_{t+1}`}</M>.</li>
        </ol>
        <p>
          Then the loop turns again from <M>{String.raw`S_{t+1}`}</M>. That is the entire interface. Notice the
          reward is indexed <M>{String.raw`R_{t+1}`}</M>, not <M>{String.raw`R_t`}</M> — it is part of the
          environment&rsquo;s <em>response</em> to the action, arriving together with the next state. (Some books
          write <M>{String.raw`R_t`}</M>; the arithmetic is identical, but this indexing keeps &ldquo;what the
          environment returned&rdquo; in one bundle.)
        </p>

        <Callout color={GOLD} title={<>The information boundary is strict</>}>
          The agent only ever sees the state and the reward. It does not see the environment&rsquo;s inner
          workings — the transition probabilities, the reward rule, the machinery that produced them. Anything
          the agent should be allowed to condition on must be <em>in the state</em>. Drawing that boundary in the
          right place — deciding what counts as the state — is one of the most consequential modelling choices in
          all of RL, and we give it a whole page later.
        </Callout>

        <h2>The trajectory is the record of the loop</h2>
        <p>
          Run the loop and it leaves a trail — the <strong>trajectory</strong> (or history), the alternating
          sequence of states, actions and rewards:
        </p>
        <MathBlock>{String.raw`S_0,\, A_0,\, R_1,\, S_1,\, A_1,\, R_2,\, S_2,\, A_2,\, R_3,\, \ldots`}</MathBlock>
        <p>
          Everything the agent could ever learn from is in trajectories like this. Let us print one on the
          gridworld, showing each turn of the wheel explicitly — the agent&rsquo;s action, then the
          environment&rsquo;s reply:
        </p>

        <CodeBlock setup={GRIDWORLD_SETUP} fromScratch={code} />
        <CodeOutput>{` t  state  action  reward  next
 0      6   right      -1  7
 1      7    left      -1  6
 2      6    down      -1  10
 3     10      up      -1  6
 4      6   right      -1  7
 5      7    down      -1  11
 6     11   right      -1  11
 7     11   right      -1  11`}</CodeOutput>
        <p>
          Each row is one turn of the loop; the <code>next</code> column becomes the following row&rsquo;s{" "}
          <code>state</code>. This walker dithers — right, left, back to 6 — and at steps 6–7 it keeps choosing{" "}
          <code>right</code> from state 11 on the grid&rsquo;s edge, where the move bumps the wall and leaves it
          put. Eight steps in, it still hasn&rsquo;t found a corner. That is what a policy with no sense of value
          looks like. Re-run with another seed and the path is completely different — the environment&rsquo;s
          responses are random, so no two trajectories match. That randomness is exactly what the value function
          will have to average over.
        </p>

        <h2>Episodic vs continuing tasks</h2>
        <p>
          Some loops end. A game finishes, a robot reaches the goal, an episode of driving concludes — these are
          <strong> episodic tasks</strong>, and the special states that end them are <strong>terminal
          states</strong> (our two shaded corners). After a terminal, the world resets and a fresh episode
          begins. Other loops never stop: a server balancing load, a thermostat holding a room, a market-maker
          quoting prices — these are <strong>continuing tasks</strong>, an unbroken stream with no reset.
        </p>
        <p>
          The distinction matters because it changes how we add up reward. In an episodic task you can sum the
          rewards to the end and be done. In a continuing task the sum runs forever and could be infinite — so
          we need a way to keep the total finite and meaningful. That device is the <em>discount factor</em>, and
          it is where the next chapter begins. First, though, one tension the loop creates all on its own:
          because the agent only learns by acting, it faces a genuine dilemma every single step.
        </p>

        <PrevNext
          prev={{ href: "/learn/markov-decision-processes/reward-is-the-signal", label: <>← Reward is the only signal</> }}
          next={{ href: "/learn/markov-decision-processes/exploration-vs-exploitation", label: <>Next · Exploration vs exploitation →</> }}
        />
      </div>
    </article>
  );
}
