import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { Quiz } from "@/components/Quiz";
import { PredictPrompt } from "@/components/PredictPrompt";
import { GRIDWORLD_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "Planning by sampling — Manifold",
  description:
    "When you can't sum over every next state, sample instead. Using the model as a simulator, a rollout estimates a value by averaging simulated returns — the idea behind Monte-Carlo tree search and the bridge to model-free learning.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function PlanningBySampling() {
  const code = `import numpy as np
# The Bellman backup sums over ALL next states. When that sum is intractable, sample:
# use the model as a SIMULATOR and average the returns of simulated trajectories.
rng = np.random.default_rng(0)

def rollout(s, a):
    "Take action a, then act randomly, following the model as a simulator."
    g, first, steps = 0.0, True, 0
    while s not in TERMINALS and steps < 500:
        act = a if first else rng.integers(nA); first = False
        s2 = np.argmax(P[s, act])                  # ask the model where we land
        g += R[s, act]; s = s2; steps += 1
    return g

# Estimate Q(6, a) for each action by averaging 2000 rollouts — no sweep, no solve.
for a in range(nA):
    est = np.mean([rollout(6, a) for _ in range(2000)])
    print(f"rollout Q(6, {ACTIONS[a]:<5}) ~ {est:6.1f}")`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Theory", color: GOLD }]}
        time="about 8 minutes"
        title={<>Planning by sampling</>}
        intro={<>Every backup so far has <em>summed</em> over all next states — fine when there are sixteen, hopeless
          when there are astronomically many or the dynamics are only available as a simulator. The escape is the
          oldest trick in probability: when you cannot compute an expectation, sample it. This turns planning into
          simulation, and it is the idea that powers the strongest game-playing agents ever built.</>}
      />

      <div className="lesson">
        <h2>Replace the sum with an average</h2>
        <p>
          A value is an expected return, <M>{String.raw`V^\pi(s) = \mathbb{E}_\pi[G_t \mid S_t = s]`}</M>, and the
          Bellman backup computes the expectation exactly by summing over <M>P</M>. But an expectation can also be
          <em>estimated</em> — run the policy from <M>s</M> many times using the model as a simulator, and average
          the returns:
        </p>
        <MathBlock>{String.raw`V^\pi(s) \approx \frac{1}{N}\sum_{i=1}^{N} G^{(i)}, \qquad G^{(i)} = \text{return of the } i\text{-th simulated trajectory from } s.`}</MathBlock>
        <p>
          This is a <strong>rollout</strong>. It never forms the transition matrix and never sweeps the state space;
          it only needs to be able to <em>step</em> the model forward from wherever it currently is. Estimate the
          action-values at a state this way (using the plain Sutton grid, and a random rollout policy):
        </p>

        <CodeBlock setup={GRIDWORLD_SETUP} fromScratch={code} />
        <CodeOutput>{`rollout Q(6, up   ) ~  -20.7
rollout Q(6, right) ~  -19.6
rollout Q(6, down ) ~  -19.2
rollout Q(6, left ) ~  -19.2`}</CodeOutput>
        <p>
          Compare these to the exact action-values from the MDP track — <M>{String.raw`Q(6,\cdot)`}</M> was{" "}
          <M>{String.raw`-21, -21, -19, -19`}</M> for up/right/down/left. The sampled estimates land right on top of
          them (down and left best), with a little Monte-Carlo noise from the finite 2000 trajectories. No sum over
          next states was ever formed — just simulated experience, averaged.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt="A rollout estimate has sampling error. How do you make it more accurate?"
          options={[
            "Lower the discount factor",
            "Average more trajectories — the error shrinks like 1/√N, the standard Monte-Carlo rate",
            "Use a shorter horizon",
          ]}
          nudge="Locked in. It's plain Monte-Carlo: quadruple the rollouts to halve the error."
        />

        <h2>From rollouts to tree search</h2>
        <p>
          A single rollout estimates one action&rsquo;s value. Do it for every action and pick the best and you have
          a one-step planner that needs no sweep. Do it <em>recursively</em> — expand the most promising actions into
          a search tree, using rollouts to estimate the leaves and concentrating simulations on the branches that
          look good — and you have <strong>Monte-Carlo tree search (MCTS)</strong>. Balancing which branches to
          explore is the exploration&ndash;exploitation problem from the MDP track, solved here with the UCB rule
          (UCT). MCTS is dynamic programming&rsquo;s sampled cousin: it plans with a known model, but by simulating
          forward instead of sweeping backward.
        </p>

        <Callout color={GOLD} title={<>This is how AlphaGo and AlphaZero plan</>}>
          The strongest game-playing systems ever built plan by sampling. AlphaZero runs MCTS over a known model of
          the game (the rules), using a neural network to guide which branches to simulate and to value leaf
          positions — sampling to sidestep Go&rsquo;s <M>{String.raw`10^{170}`}</M> states, and function
          approximation to generalise across them. Both escapes from this chapter, combined. The Bellman backup you
          learned on a 16-state grid is still in there, now sampled and approximated.
        </Callout>

        <Proof title="why the sample average is a valid estimate of the value" color={GOLD}>
          <p>
            The return <M>{String.raw`G^{(i)}`}</M> of a trajectory simulated under <M>{String.raw`\pi`}</M> from{" "}
            <M>s</M> is, by construction, a draw from the distribution whose mean is{" "}
            <M>{String.raw`V^\pi(s) = \mathbb{E}_\pi[G_t\mid S_t=s]`}</M>. The trajectories are independent, so the
            sample mean <M>{String.raw`\hat V = \frac1N\sum_i G^{(i)}`}</M> is an <em>unbiased</em> estimator:{" "}
            <M>{String.raw`\mathbb{E}[\hat V] = V^\pi(s)`}</M>. By the law of large numbers it converges to{" "}
            <M>{String.raw`V^\pi(s)`}</M> as <M>{String.raw`N\to\infty`}</M>, and by the central limit theorem its
            error shrinks as <M>{String.raw`\sigma/\sqrt{N}`}</M>, where <M>{String.raw`\sigma`}</M> is the standard
            deviation of the return. Two things follow. First, accuracy is governed by the number of samples, not by{" "}
            <M>{String.raw`|\mathcal{S}|`}</M> — which is exactly why sampling beats summing on enormous state
            spaces. Second, discounting or a finite horizon bounds <M>{String.raw`\sigma`}</M> (returns can&rsquo;t be
            arbitrarily large), keeping the estimator well-behaved. This is the same Monte-Carlo estimator you met in
            the MDP value chapter — here repurposed as a <em>planning</em> tool because it reads the model only as a
            simulator, never as a table.
          </p>
        </Proof>

        <Quiz
          accent={GOLD}
          title="Chapter checkpoint"
          questions={[
            {
              q: <>What does a rollout replace, and why does that help at scale?</>,
              options: [
                "It replaces the discount factor with a sampled one",
                "It replaces the exact sum over all next states with an average of simulated trajectories — whose accuracy depends on the sample count, not on |S|",
                "It replaces rewards with random numbers",
              ],
              answer: 1,
              explain: <>The Bellman sum over next states is intractable when <M>{String.raw`|\mathcal{S}|`}</M> is
                huge. A rollout estimates the same expectation by averaging returns, at a cost set by N, not by the
                state count.</>,
            },
            {
              q: <>How does rollout error shrink with the number of trajectories N?</>,
              options: ["Like 1/N", "Like 1/√N — the Monte-Carlo rate", "It doesn't shrink"],
              answer: 1,
              explain: <>By the central limit theorem the standard error is <M>{String.raw`\sigma/\sqrt{N}`}</M>, so
                you quadruple the samples to halve the error — independent of the size of the state space.</>,
            },
            {
              q: <>What are the two ideas from this chapter that AlphaZero combines?</>,
              options: [
                "Policy iteration and value iteration",
                "Sampling (MCTS, to avoid enumerating states) and function approximation (a network, to generalise across them)",
                "Jacobi and Gauss-Seidel sweeps",
              ],
              answer: 1,
              explain: <>It sidesteps the curse of dimensionality by sampling forward with MCTS and by generalising
                across positions with a neural network — the two doors out of tabular planning, used together.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/planning/real-time-dynamic-programming", label: <>← Real-time dynamic programming</> }}
          next={{ href: "/learn/planning/planning-vs-learning", label: <>Next chapter · Planning vs learning →</> }}
        />
      </div>
    </article>
  );
}
