import Link from "next/link";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";

export const metadata = {
  title: "The bias–variance profile of trees — Manifold",
  description:
    "A deep tree is low bias and high variance — flexible enough to fit anything, but so unstable that resampling the data rebuilds it from scratch. That single fact is the reason ensembles exist.",
};

const TREES = "var(--c-trees)";
const GREY = "var(--c-metrics)";

export default function BiasVariancePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 3 · theory", color: GREY }]}
        time="about 7 minutes"
        title={<>The bias–variance profile</>}
        intro={<>
          Every model&rsquo;s test error decomposes into three parts, and each model has a characteristic
          shape across them. A decision tree&rsquo;s shape is distinctive and consequential: very low bias,
          very high variance. Understanding <em>why</em> is the bridge to the entire ensembles family.
        </>}
      />

      <div className="lesson">
        <h2>The decomposition, briefly</h2>
        <p>
          For a prediction <M>{String.raw`\hat{f}(x)`}</M> learned from a random training set, expected
          squared test error splits into:
        </p>
        <MathBlock>{String.raw`\mathbb{E}\big[(y - \hat{f}(x))^2\big] = \underbrace{\big(\text{Bias}[\hat{f}(x)]\big)^2}_{\text{systematic error}} + \underbrace{\text{Var}[\hat{f}(x)]}_{\text{sensitivity to the data}} + \underbrace{\sigma^2}_{\text{irreducible noise}}`}</MathBlock>
        <p>
          <strong>Bias</strong> is how far the model&rsquo;s average prediction sits from the truth — error
          from being too rigid. <strong>Variance</strong> is how much the prediction jumps around as the
          training set is resampled — error from being too sensitive. A model can be crippled by either.
        </p>

        <h2>A grown tree: bias near zero, variance high</h2>
        <p>
          A deep tree has almost <strong>no bias</strong>. It can carve the feature space into arbitrarily
          fine boxes, so its average prediction can match essentially any target shape — there&rsquo;s no
          systematic mismatch left. All of its error is variance and noise.
        </p>
        <p>
          And its <strong>variance is unusually high</strong>, for a specific structural reason: the splits are
          <em> hard</em> and <em>hierarchical</em>. Change a handful of training points and the best split at
          the root can flip to a different feature or threshold. When the root moves, <em>every</em> subproblem
          beneath it is redefined, and the entire tree below reorganises. There&rsquo;s no averaging, no
          smoothing — one different early decision cascades into a completely different model. Retrain a tree
          on a fresh sample from the same distribution and you often get a tree you&rsquo;d struggle to
          recognise, even though its accuracy is similar.
        </p>

        <h2>Depth is the bias–variance dial</h2>
        <p>
          The pruning chapter&rsquo;s U-curve was this decomposition in disguise:
        </p>
        <ul style={ul}>
          <li><strong>Shallow tree</strong> — few boxes, can&rsquo;t capture the structure: <em>high bias, low
            variance</em>. (Depth 1 on the checkerboard: 47% test accuracy — worse than a coin.)</li>
          <li><strong>Deep tree</strong> — one box per point, fits the noise: <em>low bias, high variance</em>.
            (Depth 8: 100% train, ~81% test.)</li>
          <li><strong>The sweet spot</strong> — enough depth to catch the signal, not enough to chase noise —
            minimises their sum. (Around depth 3 here: ~84% test.)</li>
        </ul>
        <p>
          Pruning is just a way of finding that dial setting. But it leaves a frustrating situation: to control
          variance you must add bias by staying shallow, capping the tree&rsquo;s power. Is there a way to kill
          the variance <em>without</em> giving up the low bias?</p>

        <Callout color={TREES} title={<>This is why ensembles exist</>}>
          Yes — and it&rsquo;s the whole idea of the next tracks. Averaging <M>{String.raw`B`}</M> independent,
          identically distributed predictors divides their variance by <M>{String.raw`B`}</M> while leaving the
          bias untouched. Trees are the <em>ideal</em> base learner for this: their bias is already near zero,
          so if you can grow many diverse deep trees and average them, you drive variance down and keep bias
          low — a predictor better than any single tree could be. That&rsquo;s <strong>bagging</strong> and{" "}
          <strong>random forests</strong>. <strong>Boosting</strong> plays the other side: it combines many
          <em> high-bias</em> shallow trees to drive bias down instead. The tree&rsquo;s awkward
          bias–variance profile isn&rsquo;t a flaw to tolerate — it&rsquo;s the raw material the whole family
          is built on.
        </Callout>

        <Quiz
          accent={TREES}
          questions={[
            {
              q: <>How would you describe a fully grown (unpruned) decision tree?</>,
              options: [
                "High bias, low variance",
                "Low bias, high variance",
                "High bias, high variance",
              ],
              answer: 1,
              explain: <>It can fit almost any shape (low bias) but is extremely sensitive to the exact training sample (high variance) — retraining on fresh data yields a very different tree.</>,
            },
            {
              q: <>Why is a tree's variance structurally high compared with, say, a linear model?</>,
              options: [
                "Because it uses entropy",
                "Because hard hierarchical splits cascade — a changed early split reorganises the whole subtree below it",
                "Because it can't handle categorical features",
              ],
              answer: 1,
              explain: <>Splits are hard and hierarchical, so a small data change can flip the root split and redefine every subproblem beneath it. There's no averaging to damp the effect.</>,
            },
            {
              q: <>Averaging B independent trees mainly reduces which term — and why does that make trees ideal base learners?</>,
              options: [
                "Bias — and trees have high bias to remove",
                "Variance — and trees already have near-zero bias to preserve",
                "The irreducible noise σ²",
              ],
              answer: 1,
              explain: <>Averaging i.i.d. predictors cuts variance by ~1/B while leaving bias unchanged. Since a deep tree's error is almost all variance, averaging attacks exactly its weakness and keeps its strength — the basis of random forests.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/decision-trees/why-greedy", label: <>← Why greedy?</> }}
          next={{ href: "/learn/decision-trees/feature-importance", label: <>Next up · Feature importance & reading a tree →</> }}
        />
      </div>
    </article>
  );
}

const ul: React.CSSProperties = { margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
