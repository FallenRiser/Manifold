import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";

export const metadata = {
  title: "Maximization bias — Manifold",
  description:
    "The max of several noisy estimates overestimates the true max — a statistical fact that quietly poisons Q-learning. Why using the same values to both pick and evaluate the best action inflates Q, and by how much.",
};

const GOLD = "var(--c-rl)";

export default function MaximizationBias() {
  const code = `import numpy as np
rng = np.random.default_rng(0)
n_actions = 10

# Ten actions, ALL with true value 0. Estimate each from n noisy samples, then take the max.
for n in (1, 5, 20, 100):
    est = rng.standard_normal((200000, n_actions, n)).mean(axis=2)   # each estimate ~ N(0, 1/n)
    single = est[:, 0].mean()          # one action's estimate: unbiased
    biggest = est.max(axis=1).mean()   # the MAX over the ten estimates
    print(f"n={n:>3} samples/action:  single estimate {single:+.3f}   max estimate {biggest:+.3f}")`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Theory", color: GOLD }]}
        time="about 8 minutes"
        title={<>Maximization bias</>}
        intro={<>Q-learning&rsquo;s power came from a <M>{String.raw`\max`}</M>. That same <M>{String.raw`\max`}</M>{" "}
          hides a systematic flaw: the maximum of several <em>noisy</em> estimates is, on average, larger than the
          true maximum — even when every true value is identical. Q-learning takes that inflated max as a learning
          target, and the optimism seeps through the whole value function.</>}
      />

      <div className="lesson">
        <h2>A purely statistical fact</h2>
        <p>
          Forget RL for a moment. Suppose you have ten options whose true values are <em>all exactly zero.</em> You
          can&rsquo;t see the true values; you estimate each from a few noisy samples. Some estimates land above zero,
          some below — unbiased, individually. Now take the <strong>maximum</strong> of the ten estimates. Which one
          wins? Almost always one that got <em>lucky</em> — an estimate pushed high by noise. So the max is
          systematically positive, even though the best true value is zero. Selecting the maximum and reading off its
          value are the same operation, and that coupling is the bias.
        </p>

        <CodeBlock fromScratch={code} />
        <CodeOutput>{`n=  1 samples/action:  single estimate -0.000   max estimate +1.539
n=  5 samples/action:  single estimate -0.000   max estimate +0.688
n= 20 samples/action:  single estimate +0.000   max estimate +0.344
n=100 samples/action:  single estimate -0.000   max estimate +0.154`}</CodeOutput>
        <p>
          Any single estimate is dead-on zero — unbiased, as promised. But the max is{" "}
          <M>{String.raw`+1.54`}</M> with one sample each, and it stays positive all the way out —{" "}
          <M>{String.raw`+0.15`}</M> even with a hundred samples per action. The bias shrinks as estimates sharpen
          (more data → less noise → less luck to exploit) but it never flips sign: <strong>the max of noisy
          estimates always overshoots the true max.</strong>
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt="Q-learning's target is r + γ·max_a Q(s', a), where Q(s', a) are noisy early estimates. What does this do to the learned values?"
          options={[
            "Nothing — the noise averages out over updates",
            "It systematically overestimates action values, because the max seizes on whichever Q(s',a) noise inflated — and that optimism bootstraps into earlier states",
            "It underestimates values",
          ]}
          nudge="Locked in. The max grabs the luckiest estimate; that inflated target propagates backward through bootstrapping, biasing Q high across the board."
        />

        <h2>How this poisons Q-learning</h2>
        <p>
          Q-learning&rsquo;s target is <M>{String.raw`R_{t+1} + \gamma\max_{a'} Q(S_{t+1}, a')`}</M>. Early in
          training, <M>{String.raw`Q(S_{t+1}, \cdot)`}</M> is a vector of noisy estimates — exactly the setup above.
          The <M>{String.raw`\max`}</M> reliably picks the action whose estimate noise inflated the most, so the
          target is biased upward. Worse, that inflated target is then <em>bootstrapped</em> into the value of the
          previous state, and so on backward — the optimism compounds through the value function. The classic symptom
          is an agent that, early on, is irrationally attracted to actions leading into high-variance regions, because
          their noisy values occasionally look spectacular.
        </p>
        <p>
          The single culprit is that Q-learning uses <strong>the same</strong> estimates <M>{String.raw`Q(s',\cdot)`}</M>{" "}
          both to <em>select</em> which action is best (the <M>{String.raw`\arg\max`}</M>) and to <em>evaluate</em> how
          good it is (the value at that <M>{String.raw`\arg\max`}</M>). When one noisy table plays both roles, the
          selection is biased toward its own overestimates. Decouple those two roles and the bias disappears — the
          idea behind Double Q-learning, next.
        </p>

        <Proof title="why E[max] ≥ max E, strictly, whenever the estimates are noisy" color={GOLD}>
          <p>
            Let <M>{String.raw`X_1, \dots, X_n`}</M> be unbiased estimators of the true values{" "}
            <M>{String.raw`\mu_1, \dots, \mu_n`}</M>, so <M>{String.raw`\mathbb{E}[X_i] = \mu_i`}</M>. Q-learning uses{" "}
            <M>{String.raw`\max_i X_i`}</M> to estimate <M>{String.raw`\max_i \mu_i`}</M>. We show it overestimates.
          </p>
          <p>
            The function <M>{String.raw`f(x_1,\dots,x_n) = \max_i x_i`}</M> is <strong>convex</strong> (a max of
            linear functions). Jensen&rsquo;s inequality for a convex <M>f</M> says{" "}
            <M>{String.raw`\mathbb{E}[f(\mathbf{X})] \ge f(\mathbb{E}[\mathbf{X}])`}</M>, i.e.
          </p>
          <MathBlock>{String.raw`\mathbb{E}\Big[\max_i X_i\Big] \;\ge\; \max_i \mathbb{E}[X_i] \;=\; \max_i \mu_i.`}</MathBlock>
          <p>
            So the expected value of the estimated max is at least the true max — an upward bias. The inequality is{" "}
            <em>strict</em> unless the maximiser is almost surely the same index (a degenerate, noiseless case): with
            genuine noise, different draws crown different winners, and the average of those winners exceeds the true
            best. When several true values are <em>tied</em> — as in our all-zeros experiment, the worst case — every
            unit of the gap is pure bias, which is why it was so large there.
          </p>
          <p>
            The double-estimator fix breaks the coupling. Split the data into two independent estimators{" "}
            <M>{String.raw`X^{A}, X^{B}`}</M>. Use <M>{String.raw`a^* = \arg\max_i X^{A}_i`}</M> to <em>select</em>,
            then report <M>{String.raw`X^{B}_{a^*}`}</M> to <em>evaluate</em>. Because <M>{String.raw`X^B`}</M> is
            independent of the selection, <M>{String.raw`\mathbb{E}[X^{B}_{a^*} \mid a^*] = \mu_{a^*}`}</M> — an
            <em> unbiased</em> value of whichever action was chosen, with none of the winner&rsquo;s-curse inflation.
            (It can slightly <em>under</em>estimate the true max, since <M>{String.raw`a^*`}</M> may not be the true
            argmax, but it removes the systematic optimism — a far better trade in practice.)
          </p>
        </Proof>

        <Callout color={GOLD} title={<>The tension this exposes</>}>
          Q-learning is off-policy and needs no importance sampling — but its <M>{String.raw`\max`}</M> pays a
          different tax: <strong>optimistic bias from selecting and evaluating with one noisy estimate.</strong> The
          bias is worst exactly when it hurts most — early in learning, and in stochastic, high-variance parts of the
          environment. The next page fixes it with almost embarrassing simplicity: keep two estimates and let each
          check the other.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/learning/importance-sampling", label: <>← Importance sampling</> }}
          next={{ href: "/learn/learning/double-q-learning", label: <>Next · Double Q-learning →</> }}
        />
      </div>
    </article>
  );
}
