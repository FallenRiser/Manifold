import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { FA_SETUP } from "@/lib/runtimeSetup";
import { Staircase } from "@/components/figures/fa/Staircase";
import { WALK_STATES, WALK_MU, AGG_VS_TRUE } from "@/components/figures/fa/data";

export const metadata = {
  title: "What 'best fit' means now — Manifold",
  description:
    "With a table, 'correct' needed no definition. With fewer weights than states you cannot be right everywhere, so 'best' must say which states matter — and the answer is to weight by how often you actually visit them. Measured on the 1000-state walk, where the centre is visited 135.8x more than the edge.",
};

const GOLD = "var(--c-rl)";

export default function WhatBestFitMeans() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Intuition", color: GOLD }]}
        time="about 9 minutes"
        title={<>What &ldquo;best fit&rdquo; means now</>}
        intro={<>With a table, being correct needed no definition: every state could hold its exact value at the
          same time. With ten weights and a thousand states, some estimates <em>must</em> be wrong — so
          &ldquo;best&rdquo; has to specify which ones you are willing to be wrong about. That specification turns
          out to be a genuine part of the algorithm.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>Errors now compete</h2>
        <p>
          A tabular agent never had to make a trade. Each cell was independent, so getting state 137 right cost
          nothing anywhere else, and &ldquo;the best value function&rdquo; meant the true one.
        </p>
        <p>
          Share the weights and the estimates start pulling against each other. In the ten-group staircase, one
          weight has to serve a hundred states whose true values span a wide range — it cannot satisfy all of them,
          so it must compromise. And a compromise needs a rule for who gets favoured.
        </p>

        <Staircase
          x={WALK_STATES}
          lines={AGG_VS_TRUE}
          mu={WALK_MU}
          ylabel="vπ(s)"
          xlabel="state"
          caption={<>Why the objective needs a weighting. The staircase is wrong everywhere, and it
            is wrong by <em>different amounts</em> in different places — worst at the two ends, where
            the true curve bends most. The shaded strip is how often the walk is actually in each
            state, and it is heaped in the middle. An unweighted error would spend the ten parameters
            fixing the ends; the on-policy weighting spends them where the agent lives. Neither is
            more correct in the abstract, which is precisely why the objective has to say.</>}
        />

        <h2>The objective</h2>
        <p>
          The standard rule is a weighted squared error, called the <strong>value error</strong>:
        </p>
        <MathBlock>{String.raw`\overline{\mathrm{VE}}(\mathbf{w}) \;=\; \sum_{s \in \mathcal{S}} \mu(s)\,\big[v_\pi(s) - \hat v(s,\mathbf{w})\big]^2`}</MathBlock>
        <p>
          It is ordinary least squares with one addition, and the addition is the interesting part.{" "}
          <M>{String.raw`\mu(s)`}</M> is a distribution over states saying <em>how much you care about being right
          in each one</em>. Set it uniform and every state counts equally. But in reinforcement learning there is a
          more natural choice sitting right there: <strong>how often the agent actually visits the state.</strong>
        </p>
        <p>
          That is the <strong>on-policy distribution</strong> — the fraction of time the policy spends in each
          state. The reasoning is blunt: an error in a state you enter constantly will hurt you constantly, and an
          error in a state you almost never reach will almost never cost you anything.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt={<>The walk always starts at state 500 and ends by falling off an end. Roughly how many times
            more often does it visit the centre than state 1?</>}
          options={["About 2x", "About 10x", "About 100x", "Over 1000x"]}
        />

        <h2>Measuring it, and computing the optimum exactly</h2>
        <p>
          State aggregation has a convenient property: the best possible fit is not something you need to search
          for. Each weight serves its group alone, so the optimal value for that weight is just the{" "}
          <M>{String.raw`\mu`}</M>-weighted mean of the true values inside it. We can therefore compute the exact
          optimum under either weighting and compare them directly.
        </p>

        <CodeBlock setup={FA_SETUP} fromScratch={code} />
        <CodeOutput>{`visits to state 500 vs state 1: 135.8x

best fit, every state equally important : [-0.846 -0.66  -0.472 -0.283 -0.094  0.094  0.283  0.472  0.66   0.846]
best fit, weighted by where we go       : [-0.829 -0.651 -0.466 -0.279 -0.086  0.093  0.28   0.467  0.652  0.83 ]

they disagree most in group 0, by 0.0165
VE of the mu-weighted optimum : 0.0544
VE of the uniform optimum     : 0.0548`}</CodeOutput>

        <p>
          <strong>135.8 times.</strong> The walk pours its time into the middle and barely touches the ends — which
          makes sense once you picture it: every episode begins at 500, and reaching state 1 means a long
          improbable drift leftwards without falling off first.
        </p>
        <p>
          And you can read the consequence directly off the two fits. Look at group 0, the leftmost hundred states.
          The uniform optimum puts it at <strong>−0.846</strong>; the <M>{String.raw`\mu`}</M>-weighted optimum
          pulls it to <strong>−0.829</strong>. It has deliberately chosen to fit the far edge <em>worse</em>,
          because the far edge is where the agent hardly ever is, and it spends that slack improving states nearer
          the middle instead.
        </p>

        <Callout color={GOLD} title={<>Read the last two numbers honestly</>}>
          The <M>{String.raw`\mu`}</M>-weighted optimum scores <strong>0.0544</strong> and the uniform one{" "}
          <strong>0.0548</strong>. That is a difference of <strong>0.7%</strong> — and it would be dishonest to
          present that as a dramatic win.
          <br /><br />
          The weighting <em>has</em> to win on its own metric, and it does. But on this problem the margin is
          almost nothing, because <M>{String.raw`\mu`}</M> is fairly flat across the middle and the true value
          function is close to a straight line, so the two fits barely disagree. The textbook emphasis on{" "}
          <M>{String.raw`\mu`}</M> is about what it means and when it <em>can</em> bite — not a promise that it
          always changes your answer.
          <br /><br />
          It bites when visitation is genuinely lopsided: a robot that spends 99% of its time in a corridor and 1%
          near a cliff edge will, under <M>{String.raw`\mu`}</M>, cheerfully be wrong about the cliff. Whether that
          is what you want is a question the objective cannot answer for you.
        </Callout>

        <h2>The part that should still bother you</h2>
        <p>
          There is something circular here worth naming now, because the deadly-triad chapter is built on it.{" "}
          <M>{String.raw`\mu`}</M> is the distribution induced by the policy — so it depends on the policy, which
          in control depends on the value estimates, which depend on the objective, which depends on{" "}
          <M>{String.raw`\mu`}</M>. Everything is defined in terms of everything else.
        </p>
        <p>
          While you evaluate a fixed policy on-policy, this is benign: the loop settles. The moment you learn about
          one policy from data generated by <em>another</em> — off-policy, the setting Q-learning lives in — the
          states you are updating are no longer the states you are visiting, and the weighting silently stops
          matching the thing you are optimising. That mismatch is one of the three ingredients that will, later in
          this track, make a perfectly reasonable algorithm diverge to infinity.
        </p>

        <PrevNext
          prev={{ href: "/learn/function-approximation/generalisation-not-storage", label: <>← Generalisation, not storage</> }}
          next={{ href: "/learn/function-approximation/gradient-descent-on-values", label: <>Next · Gradient descent on values →</> }}
        />
      </div>
    </article>
  );
}

const code = `V_true = walk_true_values()[1:N_STATES + 1]
g = np.array([group_of(s) for s in range(1, N_STATES + 1)])
mu = walk_mu()                          # where the walk actually spends its time

print(f"visits to state 500 vs state 1: {mu[499] / mu[0]:.1f}x")

# The BEST possible 10-group fit is just the weighted mean of the true values
# in each group -- so we can compute the optimum exactly, under either weighting.
best_uniform = np.array([V_true[g == k].mean() for k in range(10)])
best_mu = np.array([np.sum(mu[g == k] * V_true[g == k]) / np.sum(mu[g == k])
                    for k in range(10)])

print()
print("best fit, every state equally important :", np.round(best_uniform, 3))
print("best fit, weighted by where we go       :", np.round(best_mu, 3))
print()
print(f"they disagree most in group {int(np.argmax(np.abs(best_uniform - best_mu)))}, by {np.max(np.abs(best_uniform - best_mu)):.4f}")
print(f"VE of the mu-weighted optimum : {rmse(best_mu[g], V_true, mu):.4f}")
print(f"VE of the uniform optimum     : {rmse(best_uniform[g], V_true, mu):.4f}")`;
