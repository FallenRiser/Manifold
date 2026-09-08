import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { Quiz } from "@/components/Quiz";
import { MaxBiasLab } from "@/components/labs/MaxBiasLab";

export const metadata = {
  title: "Double Q-learning — Manifold",
  description:
    "The fix for maximization bias: keep two independent value estimates and let one pick the best action while the other values it. Decoupling selection from evaluation removes the optimism — and this exact idea powers Double DQN.",
};

const GOLD = "var(--c-rl)";

export default function DoubleQLearning() {
  const code = `import numpy as np
rng = np.random.default_rng(0)
n_actions = 10                         # true value of every action is 0

# Split the SAME sample budget in two: e1 SELECTS the best action, e2 VALUES it.
for n in (2, 10, 40):
    h = n // 2
    e1 = rng.standard_normal((200000, n_actions, h)).mean(axis=2)   # selection estimates
    e2 = rng.standard_normal((200000, n_actions, h)).mean(axis=2)   # evaluation estimates
    single = e1.max(axis=1).mean()                                  # biased single-estimator max
    double = e2[np.arange(200000), e1.argmax(axis=1)].mean()        # value the SELECTED action with e2
    print(f"n={n:>3} total:  single-estimator max {single:+.3f}   double-estimator {double:+.3f}")`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 8 minutes"
        title={<>Double Q-learning</>}
        intro={<>Maximization bias came from one noisy table doing two jobs — <em>choosing</em> the best action and{" "}
          <em>valuing</em> it. The fix is almost too simple: keep two tables, and on each update let one choose while
          the other values. That single decoupling erases the optimism, and the very same trick rescued deep
          Q-learning years later.</>}
      />

      <div className="lesson">
        <h2>Two estimates, checking each other</h2>
        <p>
          The bias is a <em>winner&rsquo;s curse</em>: whichever action the noise inflated most gets both selected{" "}
          <em>and</em> credited with its inflated value. Break the loop by keeping two independent estimates,{" "}
          <M>{String.raw`Q_1`}</M> and <M>{String.raw`Q_2`}</M>, learned from different subsets of experience. Use one
          to pick the best action, the <em>other</em> to evaluate it:
        </p>
        <MathBlock>{String.raw`a^* = \arg\max_{a'} Q_1(s', a'), \qquad \text{target} = r + \gamma\,Q_2(s', a^*).`}</MathBlock>
        <p>
          Because <M>{String.raw`Q_2`}</M> is independent of the selection made by <M>{String.raw`Q_1`}</M>, it has no
          reason to have inflated <em>that particular</em> action — so its value is unbiased for the chosen action. The
          same all-zeros experiment as the last page, now with the two-estimator evaluation, shows the cure:
        </p>

        <CodeBlock fromScratch={code} />
        <CodeOutput>{`n=  2 total:  single-estimator max +1.539   double-estimator -0.004
n= 10 total:  single-estimator max +0.688   double-estimator +0.003
n= 40 total:  single-estimator max +0.344   double-estimator +0.000`}</CodeOutput>
        <p>
          Same data budget, split in two. The single-estimator max carries the full optimistic bias{" "}
          (<M>{String.raw`+1.54`}</M> down to <M>{String.raw`+0.34`}</M>); the double estimator sits essentially on
          zero at every sample size. Decoupling selection from evaluation is the whole fix.
        </p>

        <h2>The algorithm</h2>
        <p>
          Double Q-learning maintains <M>{String.raw`Q_1`}</M> and <M>{String.raw`Q_2`}</M>. On each step, flip a fair
          coin to decide which one to update; the one you update uses <em>itself</em> to choose the greedy next action
          and the <em>other</em> to value it:
        </p>
        <MathBlock>{String.raw`Q_1(s,a) \leftarrow Q_1(s,a) + \alpha\Big[r + \gamma\,Q_2\big(s',\, \arg\max_{a'} Q_1(s',a')\big) - Q_1(s,a)\Big]`}</MathBlock>
        <p>
          (and symmetrically for <M>{String.raw`Q_2`}</M> on the other coin flips). Behaviour uses their sum or
          average for action selection. Everything else — off-policy, one-step, model-free — is unchanged; you have
          simply split the estimator in two.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt="On Sutton's bias MDP (going 'left' is worse, but its value is noisy), what will plain Q-learning and Double Q-learning do early on?"
          options={[
            "Both immediately avoid 'left'",
            "Q-learning is fooled into strongly preferring 'left' for many episodes (maximization bias); Double Q-learning tracks the optimal ~5% from the start",
            "Double Q-learning prefers 'left' more, being more complex",
          ]}
          nudge="Locked in. The overestimated max makes 'left' look great to Q-learning; the decoupled estimate isn't fooled."
        />

        <h2>See the bias, and its cure</h2>
        <p>
          In the classic bias MDP, going <em>left</em> from the start leads to a state whose actions all have slightly
          negative expected reward — but noisy. Q-learning&rsquo;s max makes &ldquo;left&rdquo; look attractive, so it
          heads that way far more than the optimal <M>{String.raw`\varepsilon/2 = 5\%`}</M>. Run it and watch Double
          Q-learning refuse the bait:
        </p>

        <LabFrame
          accent={GOLD}
          tryThis={<>Press <strong>Run experiment</strong>. The red curve (Q-learning) spikes well above the dashed
            optimal line — for dozens of episodes it wrongly picks the bad &ldquo;left&rdquo; action more than half
            the time, purely from maximization bias — then slowly recovers as its estimates sharpen. The gold curve
            (Double Q-learning) hugs the optimal <M>{String.raw`5\%`}</M> throughout. Raise the run count to smooth
            the curves.</>}
          insight={<>Same environment, same exploration; the only difference is whether one noisy table both selects
            and evaluates the max. Q-learning&rsquo;s optimism is not a tuning problem — it is structural, and it is
            worst early in learning when estimates are noisiest. Splitting the estimator removes it at a stroke.</>}
        >
          <MaxBiasLab />
        </LabFrame>

        <Callout color={GOLD} title={<>Why this matters beyond gridworlds</>}>
          Maximization bias does not go away with neural networks — it gets <em>worse</em>, because a function
          approximator&rsquo;s value errors are correlated across actions. <strong>Double DQN</strong> ported this
          exact idea to deep RL: use the online network to <em>select</em> the greedy next action and the slower
          target network to <em>evaluate</em> it. It was one of the most impactful single-line changes in the
          field&rsquo;s history, markedly improving Atari performance. The lesson — <em>never let one noisy estimate
          both choose and grade the winner</em> — is worth carrying everywhere.
        </Callout>

        <Quiz
          accent={GOLD}
          title="Chapter 5 checkpoint"
          questions={[
            {
              q: <>What makes a method off-policy, and what does that unlock?</>,
              options: [
                "It uses a larger discount factor",
                "The target policy (what it learns about) differs from the behaviour policy (how it acts) — enabling learning the optimal policy while exploring, experience replay, and learning from logged/other-agent data",
                "It never explores",
              ],
              answer: 1,
              explain: <>Off-policy decouples the policy learned from the policy followed. That is what lets Q-learning
                learn <M>{String.raw`\pi^*`}</M> from exploratory data, and what makes replay buffers and learning from
                logs possible.</>,
            },
            {
              q: <>Ordinary importance sampling is unbiased. Why is weighted IS usually preferred anyway?</>,
              options: [
                "Weighted IS is also unbiased and always exact",
                "Ordinary IS's per-trajectory ratio is a product that explodes in variance; weighted IS accepts a small (vanishing) bias for far lower variance — ~40× lower in our demo",
                "Weighted IS needs no importance ratios at all",
              ],
              answer: 1,
              explain: <>The product of ratios makes OIS unbiased but wild (std 0.129 vs 0.020 in the demo). WIS
                normalises by the summed weights, trading a vanishing bias for a huge variance reduction.</>,
            },
            {
              q: <>What causes maximization bias, and how does Double Q-learning remove it?</>,
              options: [
                "Too small a learning rate; Double Q-learning raises it",
                "Using one noisy estimate to both SELECT and EVALUATE the best action overestimates (E[max] ≥ max E); Double Q-learning uses two estimates — one to select, one to evaluate — so the evaluation is unbiased",
                "Discounting; Double Q-learning removes γ",
              ],
              answer: 1,
              explain: <>The max of noisy estimates overshoots the true max (Jensen). Splitting selection and
                evaluation across two independent estimators breaks the winner&rsquo;s-curse coupling — the idea behind
                Double DQN.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/learning/maximization-bias", label: <>← Maximization bias</> }}
          next={{ href: "/learn/learning/n-step-returns", label: <>Next · n-step returns →</> }}
        />
      </div>
    </article>
  );
}
