import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { Quiz } from "@/components/Quiz";
import { LabFrame } from "@/components/LabFrame";
import { ExplorationBanditLab } from "@/components/labs/ExplorationBanditLab";
import { LEARNING_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "Exploration returns — Manifold",
  description:
    "Without a model, an agent can only learn about actions it actually tries — so it must deliberately try ones that look worse, in case they're secretly better. ε-greedy, ε-soft policies, and the GLIE conditions that make model-free control provably converge.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function ExplorationReturns() {
  const code = `env = make_goal_env()
Q = np.zeros((nS, nA)); Q[6] = [0.1, 0.9, -0.2, 0.0]   # pretend estimates at state 6 (greedy = 'right')

# eps-greedy: with prob eps act at random, else take the greedy action.
for eps in (0.0, 0.1, 0.5):
    r = np.random.default_rng(0)
    picks = [eps_greedy(Q, 6, eps, r) for _ in range(4000)]
    frac = np.mean([p == 1 for p in picks])                 # how often we took 'right'
    print(f"eps={eps}:  chose greedy 'right' {frac*100:4.1f}% of the time")`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Intuition", color: GOLD }]}
        time="about 8 minutes"
        title={<>Exploration <em>returns</em></>}
        intro={<>Planning let us ignore a problem that reinforcement learning was born to solve. With the model
          gone, an agent can only ever learn about actions it <em>takes</em> — so if it always takes what currently
          looks best, it may never discover that something else was better all along. Acting well and learning well
          pull in opposite directions, and that tension is back at the centre.</>}
      />

      <div className="lesson">
        <h2>Why exploration is now mandatory</h2>
        <p>
          Cast your mind back to the <Link href="/learn/markov-decision-processes/exploration-vs-exploitation" style={link}>
          explore&ndash;exploit dilemma</Link> from the first RL chapter. In planning it evaporated: with the model
          in hand you could evaluate <em>every</em> action in every state without lifting a finger, so there was
          nothing to explore. Model-free, that free lunch is gone. The only way to find out what an action is worth
          is to <strong>take it and see</strong> — and an agent that always exploits its current best guess will
          keep collecting evidence for actions it already favours while staying blind to the ones it has starved of
          data.
        </p>
        <p>
          This is fatal for control specifically. Greedy improvement compares <M>Q(s,a)</M> across actions — but if
          some action has never been tried, its estimate is just whatever you initialised it to, and the{" "}
          <M>{String.raw`\arg\max`}</M> can lock onto a mirage forever. <strong>You cannot improve away from a
          policy that never gathers the evidence to contradict itself.</strong> Learning must build its own
          exploration in.
        </p>

        <h2>ε-greedy: the simplest honest answer</h2>
        <p>
          The workhorse fix is almost embarrassingly plain. Most of the time, act greedily. But with a small
          probability <M>\varepsilon</M>, throw the greedy choice away and pick an action uniformly at random:
        </p>
        <MathBlock>{String.raw`\pi(a\mid s) = \begin{cases} 1 - \varepsilon + \dfrac{\varepsilon}{|\mathcal{A}|} & a = \arg\max_{a'} Q(s,a') \\[2mm] \dfrac{\varepsilon}{|\mathcal{A}|} & \text{otherwise.} \end{cases}`}</MathBlock>
        <p>
          Every action keeps a floor probability of <M>{String.raw`\varepsilon/|\mathcal{A}|`}</M>, so nothing is
          ever permanently starved, yet the agent still spends the bulk of its time doing what looks best. Turn the
          dial and watch how much exploration <M>\varepsilon</M> actually buys:
        </p>

        <CodeBlock setup={LEARNING_SETUP} fromScratch={code} />
        <CodeOutput>{`eps=0.0:  chose greedy 'right' 100.0% of the time
eps=0.1:  chose greedy 'right' 92.2% of the time
eps=0.5:  chose greedy 'right' 61.2% of the time`}</CodeOutput>
        <p>
          At <M>{String.raw`\varepsilon = 0`}</M> the policy is pure greedy — 100% &ldquo;right,&rdquo; and utterly
          blind to whatever it hasn&rsquo;t tried. At <M>{String.raw`\varepsilon = 0.1`}</M> it still exploits 92% of
          the time (the greedy action can also come up <em>during</em> a random pick, which is why it&rsquo;s 92% and
          not 90%), while the other three actions each get a steady trickle of data. Crank it to{" "}
          <M>{String.raw`\varepsilon = 0.5`}</M> and it is exploring aggressively — great for learning fast, bad for
          collecting reward. That trade is the whole game.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt="You want to end up with the OPTIMAL (deterministic greedy) policy, but you need exploration to find it. How do you get both?"
          options={[
            "Keep ε fixed at a small constant forever",
            "Decay ε toward 0 over time — explore a lot early, then exploit the well-learned values later",
            "Set ε = 1 so you explore as much as possible",
          ]}
          nudge="Locked in. A constant ε never stops acting randomly, so it can't converge to the greedy optimum. Shrinking ε is how you explore now and exploit later."
        />

        <LabFrame
          accent={GOLD}
          tryThis={<>Press <strong>Run</strong> and read the four regret curves — regret is the reward you gave up by
            not always pulling the best arm, so lower and flatter is better. Which strategy&rsquo;s curve keeps climbing
            in a straight line, and which ones bend toward flat? Now push <M>\varepsilon</M> up and rerun.</>}
          insight={<>ε-greedy explores at a <em>fixed</em> rate forever, so it keeps paying the exploration tax every
            step — linear regret that never levels off. Optimistic initialisation and UCB <em>front-load</em> their
            exploration and then taper, which is the whole reason a decaying schedule (the GLIE idea below) beats a
            constant one.</>}
        >
          <ExplorationBanditLab />
        </LabFrame>

        <h2>ε-soft policies and the GLIE conditions</h2>
        <p>
          ε-greedy is one member of a family: an <strong>ε-soft</strong> policy is any policy that gives{" "}
          <em>every</em> action in every state at least probability{" "}
          <M>{String.raw`\varepsilon/|\mathcal{A}|`}</M>. That floor is what guarantees endless exploration. But a
          fixed floor has a downside the prediction above flagged: a policy that keeps acting randomly forever can
          never <em>become</em> the deterministic optimal policy — it will always fritter a slice of its actions
          away.
        </p>
        <p>
          The resolution is a pair of conditions with an unlovely name and a lovely guarantee — <strong>GLIE</strong>,
          Greedy in the Limit with Infinite Exploration:
        </p>
        <ul>
          <li>
            <strong>Infinite exploration:</strong> every state&ndash;action pair is tried infinitely often as
            learning goes on — so no value estimate is ever starved.
          </li>
          <li>
            <strong>Greedy in the limit:</strong> the policy converges on the greedy policy — so exploration is
            eventually switched off and the agent cashes in what it learned.
          </li>
        </ul>
        <p>
          ε-greedy with <M>\varepsilon</M> decayed to zero at the right rate — for instance{" "}
          <M>{String.raw`\varepsilon_k = 1/k`}</M> — satisfies both, and it is precisely under GLIE that model-free
          control (the SARSA of two chapters on) is guaranteed to converge to <M>{String.raw`Q^*`}</M> and{" "}
          <M>{String.raw`\pi^*`}</M>.
        </p>

        <Proof title="why ε = 1/k explores infinitely yet still goes greedy in the limit" color={GOLD}>
          <p>
            The two GLIE requirements look like they might conflict — how can you explore <em>forever</em> and yet
            <em> stop</em> exploring? The resolution is that &ldquo;infinitely often&rdquo; and &ldquo;fraction going
            to zero&rdquo; are compatible, and the harmonic schedule <M>{String.raw`\varepsilon_k = 1/k`}</M> threads
            exactly between them.
          </p>
          <p>
            <strong>Greedy in the limit.</strong> The probability of an exploratory (non-greedy) action at step{" "}
            <M>k</M> is at most <M>{String.raw`\varepsilon_k = 1/k \to 0`}</M>. So the policy&rsquo;s deviation from
            pure greedy vanishes, and in the limit it <em>is</em> greedy with respect to its final values.
          </p>
          <p>
            <strong>Infinite exploration.</strong> Fix any state&ndash;action pair and suppose the state is visited
            infinitely often. Each visit tries this action with probability at least{" "}
            <M>{String.raw`\varepsilon_k/|\mathcal{A}|`}</M>. The expected number of times it is ever tried is then at
            least <M>{String.raw`\sum_{k} \varepsilon_k/|\mathcal{A}| = \tfrac{1}{|\mathcal{A}|}\sum_k 1/k`}</M>, and
            the harmonic series <M>{String.raw`\sum_k 1/k`}</M> <em>diverges.</em> By the second Borel&ndash;Cantelli
            lemma (the trials are conditionally independent given the visits), a divergent sum of probabilities forces
            the event to occur infinitely often, almost surely. Every action is tried without end.
          </p>
          <p>
            The magic is entirely in the harmonic series sitting on the knife&rsquo;s edge: <M>{String.raw`1/k`}</M>{" "}
            shrinks to zero (greedy in the limit) yet sums to infinity (infinite exploration). A faster decay like{" "}
            <M>{String.raw`1/k^2`}</M> converges, and exploration would stop too soon — possibly before every action
            was ever tried, breaking the convergence guarantee. That is the whole reason the rate matters.
          </p>
        </Proof>

        <Callout color={GOLD} title={<>The cost of not having a model, stated plainly</>}>
          A planner evaluates every action for free. A learner pays for each action&rsquo;s value in{" "}
          <em>experience</em>, and experience only comes from taking the action. Exploration is that bill. The whole
          craft is paying it cheaply: enough randomness to keep learning, decayed fast enough to eventually behave
          optimally. Keep this in view — it is why SARSA and Q-learning, coming up, differ at all.
        </Callout>

        <Quiz
          accent={GOLD}
          title="Chapter 1 checkpoint"
          questions={[
            {
              q: <>What single change turns a planning (dynamic-programming) backup into a model-free learning update?</>,
              options: [
                "Adding a discount factor γ",
                "Replacing the exact sum over the known model P, R with an average of sampled transitions",
                "Switching from V to Q",
              ],
              answer: 1,
              explain: <>Planning sums the Bellman backup over a known model; learning samples it. The expectation you
                can&rsquo;t compute becomes an average of transitions you actually experienced — the one move the whole
                track is built on.</>,
            },
            {
              q: <>Why does model-free <em>control</em> learn action values Q instead of state values V?</>,
              options: [
                "Q is always smaller and easier to store",
                "Greedy improvement on V requires a one-step lookahead through the model (P and R), which you don't have; argmax over Q needs no model",
                "V can't represent stochastic policies",
              ],
              answer: 1,
              explain: <>A state value tells you how good a place is, not which action gets you there — that link is the
                model. Q bakes the lookahead in, so improvement is a bare <M>{String.raw`\arg\max_a Q(s,a)`}</M>.</>,
            },
            {
              q: <>What do the GLIE conditions guarantee, and how does ε-greedy meet them?</>,
              options: [
                "Fastest possible learning, by keeping ε large",
                "Convergence to Q* and π*: explore every (s,a) infinitely often, yet become greedy in the limit — met by decaying ε toward 0 (e.g. ε = 1/k)",
                "That the value estimates stay unbiased",
              ],
              answer: 1,
              explain: <>Infinite exploration keeps every estimate fed; greedy-in-the-limit cashes in what was learned.
                A harmonic ε = 1/k shrinks to zero yet sums to infinity, satisfying both at once.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/learning/prediction-and-control-again", label: <>← Prediction and control, again</> }}
          next={{ href: "/learn/learning/monte-carlo-prediction", label: <>Next · Monte Carlo prediction →</> }}
        />
      </div>
    </article>
  );
}
