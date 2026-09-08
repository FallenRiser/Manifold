import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { Quiz } from "@/components/Quiz";
import { LEARNING_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "The trouble with Monte Carlo — Manifold",
  description:
    "Monte Carlo is unbiased and model-free — but it must wait for whole episodes to end, its return estimates are punishingly noisy, and it ignores the Markov structure entirely. Three liabilities that motivate temporal-difference learning.",
};

const GOLD = "var(--c-rl)";

export default function TheTroubleWithMonteCarlo() {
  const code = `env = make_goal_env(); gamma = 0.9
env.seed(0); returns = []; lengths = []
for _ in range(20000):
    env.reset(12); G = 0.0; k = 0; done = False     # roll out from the start cell
    while not done and k < 2000:
        a = int(env.rng.integers(nA))               # random policy
        _, r, done = env.step(a); G += gamma**k * r; k += 1
    returns.append(G); lengths.append(k)

returns = np.array(returns); lengths = np.array(lengths)
print(f"return from state 12:  mean {returns.mean():+.3f}   std {returns.std():.3f}")
print(f"episode length:        mean {lengths.mean():.1f}   max {lengths.max()}   95th pct {np.percentile(lengths,95):.0f}")`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Intuition", color: GOLD }]}
        time="about 7 minutes"
        title={<>The trouble with Monte Carlo</>}
        intro={<>Monte Carlo is honest, simple, and model-free — genuinely lovely. It is also, in three specific
          ways, impractical for a lot of real reinforcement learning. Naming those three troubles precisely is the
          best possible setup for the idea that fixes all of them at once.</>}
      />

      <div className="lesson">
        <h2>Trouble 1 — it must wait for the episode to end</h2>
        <p>
          A return is a sum of rewards <em>to the end of the episode</em>, so Monte Carlo cannot form a single update
          until the episode terminates. Three consequences follow. You cannot learn <strong>online</strong>, from
          each step as it happens. You cannot learn from <strong>incomplete</strong> episodes — a game abandoned
          halfway teaches nothing. And you cannot learn at all in <strong>continuing tasks</strong> that never
          terminate: a process-control loop, a server that runs forever, a life. &ldquo;Wait until the end&rdquo; is
          a fine rule when there is an end.
        </p>

        <h2>Trouble 2 — the returns are punishingly noisy</h2>
        <p>
          A return sums many random rewards along a random trajectory, so its variance is large — and every source
          of randomness in the whole rollout piles into that one number. Measure it on our grid:
        </p>

        <CodeBlock setup={LEARNING_SETUP} fromScratch={code} />
        <CodeOutput>{`return from state 12:  mean -0.243   std 0.326
episode length:        mean 29.5   max 227   95th pct 79`}</CodeOutput>
        <p>
          Look at the first line: the quantity we are trying to estimate has mean <M>{String.raw`-0.243`}</M>, and
          the samples we average have standard deviation <M>{String.raw`0.326`}</M> — <strong>the noise is larger
          than the signal.</strong> That is why the previous pages needed tens of thousands of episodes: the
          error of a sample mean shrinks only as <M>{String.raw`1/\sqrt N`}</M>, so cutting the error in half costs
          four times the data. The second line is Trouble&nbsp;1 quantified — episodes average 30 steps and can run
          past 200, and you learn nothing until each one finishes.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt="Where does most of a Monte Carlo return's variance come from?"
          options={[
            "Rounding error in the discount factor",
            "The whole random trajectory — every action choice and every stochastic transition to the end of the episode compounds into that one number",
            "The initial value estimate V(s)",
          ]}
          nudge="Locked in. MC commits to one entire sampled future and scores it. Bootstrapping will replace that long random tail with a single learned estimate — the heart of TD."
        />

        <h2>Trouble 3 — it ignores the Markov structure</h2>
        <p>
          Monte Carlo treats each return as an opaque total. It never uses the fact that the value of a state is tied
          to the value of its <em>successor</em> by the Bellman equation — the self-referential structure that made
          planning so powerful. Two neighbouring states almost always have closely related values, but MC learns
          each one&rsquo;s value from scratch, from its own returns, as if they were unrelated. It leaves the biggest
          hint in the problem — <em>value flows between adjacent states</em> — completely unused.
        </p>
        <p>
          (This same blind spot is occasionally a <em>virtue</em>: when the Markov assumption is violated — states
          aliased, observations partial — MC&rsquo;s refusal to chain estimates makes it robust where bootstrapping
          methods can be led astray. But in a genuinely Markov world, ignoring the structure is leaving free
          accuracy on the table.)
        </p>

        <h2>One idea fixes all three</h2>
        <p>
          Stand back and every trouble points the same way. What if, instead of waiting for the true return{" "}
          <M>{String.raw`G_t`}</M>, we took <em>one</em> real step and then used our current <em>estimate</em> of
          what follows in place of the rest of the episode?
        </p>
        <MathBlock>{String.raw`G_t = R_{t+1} + \gamma R_{t+2} + \gamma^2 R_{t+3} + \cdots \;\approx\; R_{t+1} + \gamma\,V(S_{t+1}).`}</MathBlock>
        <p>
          That single move — <strong>bootstrapping</strong>, replacing the long random tail with a learned estimate
          of the next state&rsquo;s value — cures all three at once. You can update after <em>one step</em> (no
          waiting for the end; works online and on continuing tasks). You replace a high-variance sampled tail with a
          low-variance estimate (far less noise). And you explicitly use the Bellman link between a state and its
          successor (Markov structure, finally exploited). The cost is a new one — the estimate you lean on is itself
          imperfect, so you trade variance for <em>bias</em> — and weighing that trade is exactly the next chapter.
        </p>

        <Callout color={GOLD} title={<>The bridge to temporal-difference learning</>}>
          Monte Carlo answered &ldquo;average complete returns.&rdquo; The next chapter answers &ldquo;bootstrap
          after every step.&rdquo; That is temporal-difference learning — arguably the central idea of reinforcement
          learning, and the engine under SARSA, Q-learning, and everything after. Everything you built here carries
          over; only the <em>target</em> we average toward changes.
        </Callout>

        <Quiz
          accent={GOLD}
          title="Chapter 2 checkpoint"
          questions={[
            {
              q: <>What is Monte Carlo&rsquo;s single hard requirement, and what does it rule out?</>,
              options: [
                "A known model — it can't run without P and R",
                "Complete episodes — so it can't learn online, from partial episodes, or in continuing (non-terminating) tasks",
                "The Markov property — it fails when states are aliased",
              ],
              answer: 1,
              explain: <>A return needs the episode to end. That rules out online updates, incomplete episodes, and
                continuing tasks — and it is exactly what bootstrapping lifts. (MC actually needs <em>no</em> model and
                is unusually robust to broken Markov structure.)</>,
            },
            {
              q: <>Why does Monte Carlo need so many episodes to get an accurate value?</>,
              options: [
                "Because it inverts a large matrix each episode",
                "Because a return sums the whole random trajectory, so its variance is high — often larger than the signal — and a sample mean's error shrinks only as 1/√N",
                "Because ε-greedy exploration adds bias",
              ],
              answer: 1,
              explain: <>On our grid the return had std 0.326 against a mean of −0.243 — noise bigger than signal. The{" "}
                <M>{String.raw`1/\sqrt N`}</M> rate then forces tens of thousands of episodes.</>,
            },
            {
              q: <>What single change does temporal-difference learning make to fix all three MC troubles at once?</>,
              options: [
                "It averages more episodes",
                "It bootstraps: after one real step it uses its current estimate V(S_{t+1}) in place of the rest of the return",
                "It switches from Q back to V",
              ],
              answer: 1,
              explain: <>Replacing the long random tail with a learned next-state value lets you update after one step
                (online, continuing tasks), slashes variance, and finally uses the Bellman link between a state and
                its successor — trading variance for a little bias.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/learning/monte-carlo-control", label: <>← Monte Carlo control</> }}
          next={{ href: "/learn/learning/temporal-difference-learning", label: <>Next · Learning from one step →</> }}
        />
      </div>
    </article>
  );
}
