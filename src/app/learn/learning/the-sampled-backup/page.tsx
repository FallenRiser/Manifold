import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { BackupDiagramLab } from "@/components/labs/BackupDiagramLab";
import { LEARNING_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "The sampled backup — Manifold",
  description:
    "The single move that turns planning into learning: replace the expectation you cannot compute with an average of samples you can collect. Why the sample mean is an unbiased estimate of the Bellman backup, and watching it converge to the truth.",
};

const GOLD = "var(--c-rl)";

export default function TheSampledBackup() {
  const code = `env = make_goal_env()          # a world you can only SAMPLE — no P, no R to read
gamma = 0.9

# One SAMPLED step: act once, and the world returns ONE reward and ONE next state.
env.seed(0); env.reset(12)
a = int(env.rng.integers(nA))                 # the random policy picks an action
s2, r, done = env.step(a)
print("one step from state 12:", ACTIONS[a], "-> state", s2, " reward", r)

# Estimate V(12) for the random policy by AVERAGING sampled returns from state 12.
def sample_return(env, s0, gamma):
    env.reset(s0); G = 0.0; k = 0; done = False
    while not done and k < 2000:
        a = int(env.rng.integers(nA))          # random policy
        _, r, done = env.step(a)
        G += gamma**k * r; k += 1               # discounted return of this one episode
    return G

env.seed(0)
for N in (10, 100, 1000, 20000):
    est = np.mean([sample_return(env, 12, gamma) for _ in range(N)])
    print(f"N={N:>5}:  V(12) estimate = {est:+.3f}")

# The oracle peeks at the hidden model, just to show us the truth we're chasing.
truth = dp_eval(env, np.full((nS, nA), 1/nA), gamma)[12]
print(f"DP truth V(12) = {truth:+.3f}")`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Intuition", color: GOLD }]}
        time="about 8 minutes"
        title={<>The sampled backup</>}
        intro={<>Here is the entire pivot from planning to learning, in one sentence you can hold in your head:{" "}
          <strong>where you used to sum over the model, you now average over experience.</strong> That swap is so
          small it looks like nothing — and it is the reason an agent can learn a world it was never handed the
          rules to.</>}
      />

      <div className="lesson">
        <h2>The backup you can no longer compute</h2>
        <p>
          The Bellman expectation backup, the backbone of the last two tracks, is an <em>expectation</em>:
        </p>
        <MathBlock>{String.raw`V^\pi(s) = \mathbb{E}\big[\,R_{t+1} + \gamma V^\pi(S_{t+1})\;\big|\;S_t = s\,\big] = \sum_{a}\pi(a\mid s)\Big[R(s,a) + \gamma\sum_{s'}P(s'\mid s,a)\,V^\pi(s')\Big].`}</MathBlock>
        <p>
          Look at what the right-hand side needs: <M>{String.raw`\pi(a\mid s)`}</M> (yours, fine),{" "}
          <M>{String.raw`R(s,a)`}</M>, and <M>{String.raw`P(s'\mid s,a)`}</M> for every next state. Drop the model
          and those last two vanish. You cannot take the weighted sum over next states when you do not know the
          weights. The equation is still <em>true</em> — it just names quantities you can no longer read.
        </p>

        <h2>What you can do instead: sample it</h2>
        <p>
          An expectation is an average over what might happen. And there is a second way to get an average, one that
          needs no probabilities at all: <strong>observe many outcomes and average them.</strong> That is the whole
          idea. The agent takes an action, the world responds with one reward and one next state — a single sample{" "}
          <M>{String.raw`(R_{t+1}, S_{t+1})`}</M> drawn from exactly the distribution <M>P</M> and <M>R</M> describe.
          Collect enough of those samples and their average <em>is</em> the expectation, whether or not you could
          ever have written it down.
        </p>
        <MathBlock>{String.raw`\underbrace{\sum_{s'}P(s'\mid s,a)\,V(s')}_{\text{an expectation you can't compute}}\qquad\approx\qquad\underbrace{\frac{1}{N}\sum_{i=1}^{N} V(s'_i)}_{\substack{\text{an average of next states}\\\text{the world actually gave you}}}\quad\text{where } s'_i \sim P(\cdot\mid s,a).`}</MathBlock>

        <PredictPrompt
          accent={GOLD}
          prompt="You estimate a state's value by averaging the returns of many episodes started there. As you use more and more episodes, what happens to the estimate?"
          options={[
            "It stays biased — you can never recover the true value without the model",
            "It converges to the true Vπ — the sample average of returns is an unbiased estimate of the expected return",
            "It converges, but to the optimal value V*, not Vπ",
          ]}
          nudge="Locked in. Each return is one draw of the random total reward; its expectation IS Vπ(s), so the average closes in on the truth."
        />

        <h2>Watch it happen</h2>
        <p>
          Let&rsquo;s estimate the value of a single state under the random policy the only way a model-free agent
          can — by starting there, rolling out complete episodes, and averaging their discounted returns. No{" "}
          <code>P</code>, no <code>R</code>; only <code>step</code>. Then we peek at the oracle to see how close we
          got.
        </p>

        <CodeBlock setup={LEARNING_SETUP} fromScratch={code} />
        <CodeOutput>{`one step from state 12: left -> state 12  reward -0.04
N=   10:  V(12) estimate = -0.335
N=  100:  V(12) estimate = -0.187
N= 1000:  V(12) estimate = -0.232
N=20000:  V(12) estimate = -0.244
DP truth V(12) = -0.248`}</CodeOutput>
        <p>
          With ten episodes the estimate is jittery and off. By twenty thousand it has closed to{" "}
          <M>{String.raw`-0.244`}</M> against the oracle&rsquo;s <M>{String.raw`-0.248`}</M> — no model ever
          consulted, just experience averaged. (Notice the first sampled step: from the bottom-left corner, moving{" "}
          <em>left</em> bounces off the wall and stays put for its <M>{String.raw`-0.04`}</M> — exactly the kind of
          dynamics the agent has to <em>discover</em> rather than look up.) This is the promise of the whole track,
          in miniature: <strong>the truth is recoverable from samples alone.</strong>
        </p>

        <Proof title="why the average of returns is an unbiased estimate of the value" color={GOLD}>
          <p>
            The state-value function is <em>defined</em> as an expectation of the return:{" "}
            <M>{String.raw`V^\pi(s) = \mathbb{E}_\pi[G_t \mid S_t = s]`}</M>, where{" "}
            <M>{String.raw`G_t = \sum_{k\ge 0}\gamma^k R_{t+k+1}`}</M>. An episode started in <M>s</M> and run under{" "}
            <M>\pi</M> produces one realised return <M>{String.raw`G^{(i)}`}</M> — a single draw of that random
            variable. Run <M>N</M> independent episodes and form the sample mean{" "}
            <M>{String.raw`\hat V_N(s) = \frac1N\sum_{i=1}^N G^{(i)}`}</M>.
          </p>
          <p>
            <strong>Unbiased.</strong> By linearity of expectation,{" "}
            <M>{String.raw`\mathbb{E}[\hat V_N(s)] = \frac1N\sum_{i=1}^N \mathbb{E}[G^{(i)}] = \frac1N\cdot N\cdot V^\pi(s) = V^\pi(s)`}</M>{" "}
            for <em>every</em> <M>N</M>, including <M>N=1</M>. The estimate is centred on the truth from the very
            first episode; it is only <em>noisy</em>, not skewed.
          </p>
          <p>
            <strong>Consistent.</strong> The returns are i.i.d. with mean <M>{String.raw`V^\pi(s)`}</M> and, on a
            grid with bounded rewards and a discount below one, finite variance{" "}
            <M>{String.raw`\sigma^2`}</M>. The strong law of large numbers then gives{" "}
            <M>{String.raw`\hat V_N(s)\to V^\pi(s)`}</M> almost surely, and the variance of the estimate shrinks like{" "}
            <M>{String.raw`\sigma^2/N`}</M> — which is exactly the <M>{String.raw`1/\sqrt N`}</M> tightening you see
            in the numbers above. No model is needed anywhere in this argument: only that each episode is an honest
            sample of the return. That is the licence for everything model-free.
          </p>
          <p>
            The one hidden cost: to average <em>returns</em> you need <em>complete episodes</em>, and their variance
            can be large because a return sums many random rewards. Temporal-difference learning, two chapters on,
            will attack both problems at once — by sampling a single step instead of a whole episode.
          </p>
        </Proof>

        <LabFrame
          accent={GOLD}
          tryThis={<>Flip the two switches. <strong>Width</strong> chooses whether you sample one branch or take the
            full expectation; <strong>depth</strong> chooses whether you bootstrap after one step or run the whole
            return. Land on each of the four corners and read what method you built.</>}
          insight={<>This is the map for the entire track before you have walked it. Sampling instead of expecting is what
            frees you from the model; bootstrapping instead of waiting is what makes learning online. Monte Carlo, TD,
            SARSA, Q-learning and dynamic programming are just the corners — and n-step and TD(λ), later, are the points
            in between.</>}
        >
          <BackupDiagramLab />
        </LabFrame>

        <Callout color={GOLD} title={<>The swap, stated once and for all</>}>
          <MathBlock>{String.raw`\underbrace{V(s)\leftarrow \sum_a\pi(a\mid s)\Big[R(s,a)+\gamma\!\sum_{s'}P(s'\mid s,a)V(s')\Big]}_{\textbf{planning: sum over the known model}}\;\longrightarrow\;\underbrace{V(s)\leftarrow \text{average of returns/targets from real transitions}}_{\textbf{learning: average over experience}}`}</MathBlock>
          Everything in this track — Monte Carlo, TD, SARSA, Q-learning — is a different answer to one question:{" "}
          <em>which samples do I average, and how do I combine them?</em>
        </Callout>

        <PrevNext
          prev={{ href: "/learn/learning", label: <>← Learning from experience</> }}
          next={{ href: "/learn/learning/prediction-and-control-again", label: <>Next · Prediction and control, again →</> }}
        />
      </div>
    </article>
  );
}
