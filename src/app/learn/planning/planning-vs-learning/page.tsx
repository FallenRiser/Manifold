import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { GRIDWORLD_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "Planning vs learning — Manifold",
  description:
    "The one assumption this whole track relied on: a known model P and R. Drop it and every backup that summed over the model must be replaced by a sampled one — the step from dynamic programming to model-free learning.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function PlanningVsLearning() {
  const code = `import numpy as np
gamma = 1.0
rng = np.random.default_rng(0)

# A DP backup READS the model: it sums over P and reads R directly.
def dp_backup(V, s):
    return (R[s] + gamma * (P[s] @ V)).max()          # needs P, R

# A LEARNING backup SAMPLES the world: take an action, observe ONE reward and next
# state, and nudge the estimate toward that sample. No P, no R table.
def td_backup(V, s, alpha=0.1):
    a = rng.integers(nA)
    s2 = rng.choice(nS, p=P[s, a])                     # the world responds (a sample)
    r  = R[s, a]                                        # a sampled reward
    return V[s] + alpha * (r + gamma * V[s2] - V[s])   # move toward the sample

# Same state, same Bellman idea — one computes the expectation, one estimates it.
V = np.zeros(nS)
print("DP backup at state 6 (uses the model):   ", round(dp_backup(V, 6), 2))
print("TD backup at state 6 (uses one sample):  ", round(td_backup(V, 6), 2))`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Synthesis", color: GOLD }]}
        time="about 7 minutes"
        title={<>Planning vs <em>learning</em></>}
        intro={<>One assumption has silently underwritten this entire track: that we <em>have</em> the model — that{" "}
          <M>P</M> and <M>R</M> are tables we can read and sum over. Every algorithm here, from policy iteration to
          MCTS, used them. Drop that single assumption and you step out of planning and into learning — the subject
          of the next track, and where reinforcement learning meets the real world.</>}
      />

      <div className="lesson">
        <h2>The assumption, made visible</h2>
        <p>
          Go back through the track and every backup reads the model. The optimality backup{" "}
          <M>{String.raw`\max_a[R(s,a) + \gamma\sum_{s'}P(s'\mid s,a)V(s')]`}</M> <em>sums over</em>{" "}
          <M>{String.raw`P`}</M> and reads <M>{String.raw`R`}</M> off a table. Policy evaluation, value iteration,
          RTDP, even the rollouts — all assume you can ask the model &ldquo;if I take <M>a</M> in <M>s</M>, what are
          the odds of each next state, and what reward do I get?&rdquo; That is what <strong>planning</strong> means:
          computing good behaviour from a known model, without ever acting for real.
        </p>
        <p>
          But a robot is not handed the physics of its motors; a trader is not given the market&rsquo;s transition
          probabilities; an agent dropped into a new game does not know the rules&rsquo; consequences in advance.
          When the model is unknown, you cannot sum over <M>P</M> — because you do not have <M>P</M>. All you can do
          is <em>act</em>, and observe what happens.
        </p>

        <h2>The one change that everything else follows from</h2>
        <p>
          The bridge is astonishingly small. Take the Bellman backup and, instead of computing the expectation over
          the model, <em>sample</em> it: take an action, observe the single reward and next state the world actually
          gives you, and nudge your estimate toward that one sample.
        </p>

        <CodeBlock setup={GRIDWORLD_SETUP} fromScratch={code} />
        <CodeOutput>{`DP backup at state 6 (uses the model):    -1.0
TD backup at state 6 (uses one sample):   -0.1`}</CodeOutput>
        <p>
          Both start from <M>{String.raw`V = 0`}</M>. The DP backup computes the exact one-step value in a single
          shot — it takes the <M>{String.raw`\max`}</M> over the model and gets <M>{String.raw`-1.0`}</M> (the best
          immediate reward). The TD backup instead takes <em>one</em> sampled transition and nudges the estimate a
          fraction <M>{String.raw`\alpha = 0.1`}</M> of the way toward it, landing at <M>{String.raw`-0.1`}</M>. They
          are aiming at the <em>same</em> quantity by two routes: the DP backup evaluates the expectation over the
          model exactly; the TD backup estimates it from experience, trading the model for samples and exactness for
          a learning rate. Average enough of those samples and you recover what the model-based backup would have
          computed — the <strong>temporal-difference learning</strong> update.
        </p>
        <MathBlock>{String.raw`\underbrace{V(s) \leftarrow \max_a\Big[R(s,a) + \gamma\!\sum_{s'}\!P(s'\mid s,a)V(s')\Big]}_{\text{planning: sum over the known model}} \qquad\longrightarrow\qquad \underbrace{V(s) \leftarrow V(s) + \alpha\big[r + \gamma V(s') - V(s)\big]}_{\text{learning: one sampled transition}}`}</MathBlock>

        <PredictPrompt
          accent={GOLD}
          prompt="If learning just samples the same Bellman backup, why is it a whole separate (and harder) subject?"
          options={[
            "It isn't — it's trivial once you have planning",
            "Without a model the agent must also GATHER its own data by exploring, so exploration vs exploitation returns, and samples are noisy and correlated",
            "Because sampling is slower than summing",
          ]}
          nudge="Locked in. No model means you must both learn values AND choose actions that collect the right experience."
        />

        <h2>What the next track adds</h2>
        <p>
          Dropping the model brings back challenges planning could ignore:
        </p>
        <ul>
          <li>
            <strong>Exploration.</strong> With no model, the agent must <em>gather</em> its own data — and it can
            only learn about actions it actually tries. The exploration&ndash;exploitation dilemma from the MDP
            track&rsquo;s first chapter comes roaring back.
          </li>
          <li>
            <strong>Sampling, not summing.</strong> Backups use single noisy transitions instead of exact
            expectations, so estimates jitter and need many samples and careful step sizes.
          </li>
          <li>
            <strong>Prediction and control, re-derived.</strong> Monte-Carlo and TD learning solve prediction from
            experience; <strong>SARSA</strong> and <strong>Q-learning</strong> solve control — the same
            evaluate-and-improve dance, now driven by samples.
          </li>
        </ul>

        <Callout color={GOLD} title={<>What you keep</>}>
          Everything conceptual survives the crossing. Value functions, the Bellman equations, generalized policy
          iteration, the contraction that guarantees convergence, greedy improvement — all of it carries directly
          into learning. The Learning track is not a fresh start; it is this track with the model replaced by
          experience. You have already built the machine; the next track unplugs it from the blueprint and runs it in
          the world.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/planning/planning-by-sampling", label: <>← Planning by sampling</> }}
          next={{ href: "/learn/planning/the-throughline", label: <>Next · The throughline →</> }}
        />
      </div>
    </article>
  );
}
