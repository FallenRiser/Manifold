import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "Choosing & tuning a booster — Manifold",
  description:
    "A disciplined recipe for tuning gradient boosting: fix a low learning rate with early stopping, then set tree size, then the regularizers, then subsampling. The knobs are coupled, so the order matters more than the grid.",
};

const TREES = "var(--c-trees)";

export default function TuningPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 2 · practitioner", color: "var(--c-fundamentals)" }]}
        time="about 8 minutes"
        title={<>Choosing &amp; tuning a booster</>}
        intro={<>
          A random forest is nearly tuning-free; a booster is not. But its knobs are not a shapeless grid to
          brute-force — they have a natural order, because each one changes the right setting of the next. Tune in
          that order and you converge fast.
        </>}
      />

      <div className="lesson">
        <h2>The recipe, in order</h2>
        <ol style={ol}>
          <li>
            <strong>Fix a low learning rate and let early stopping pick the tree count.</strong> Set{" "}
            <code>learning_rate</code> to 0.05 (or 0.1 for quick iteration), <code>n_estimators</code>{" "}
            generously high, and turn on <Link href="/learn/boosting/early-stopping" style={link}>early
            stopping</Link> with a validation set. Now the tree count tunes itself and you never touch it again.
            This one step removes the two most important hyperparameters from the search.
          </li>
          <li>
            <strong>Set tree size — the capacity dial.</strong> Tune <code>max_depth</code> (try 3–8) or, for
            LightGBM, <code>num_leaves</code>. This controls the <Link href="/learn/boosting/tree-knobs" style={link}>interaction
            order</Link> and is the biggest lever on the bias/variance balance. Deeper for data rich in feature
            interactions, shallower for additive signal.
          </li>
          <li>
            <strong>Add the leaf regularisers.</strong> <code>min_child_weight</code> /{" "}
            <code>min_child_samples</code>, and <code>gamma</code> / <code>min_split_gain</code>, stop the trees
            carving out noise-fitting leaves. Raise them if train and validation scores diverge.
          </li>
          <li>
            <strong>Add stochasticity.</strong> <Link href="/learn/boosting/stochastic" style={link}><code>subsample</code></Link>{" "}
            0.5–0.8 and <code>colsample_bytree</code> 0.5–1.0 for a little decorrelation, regularisation, and
            speed.
          </li>
          <li>
            <strong>Tune the explicit penalties last.</strong> <code>reg_lambda</code> (L2) and{" "}
            <code>reg_alpha</code> (L1) are fine-tuning; their best values are dataset-specific (recall{" "}
            <Link href="/learn/boosting/newton-boosting" style={link}>more L2 slightly hurt on covtype</Link>).
          </li>
          <li>
            <strong>Optionally, drop the learning rate further and refit.</strong> Once the shape is right, halving
            the learning rate and doubling the trees buys a last fraction of a percent — the final polish.
          </li>
        </ol>

        <Callout color={TREES} title={<>Why order beats grid</>}>
          Because the knobs are coupled, a full grid wastes most of its budget on nonsensical corners (tiny
          learning rate with huge trees and heavy regularisation). Fixing the learning rate first{" "}
          <em>decouples</em> the rest: with the step size and tree count settled, depth and the regularisers can
          be tuned almost independently. In practice a short randomised or Bayesian search over depth, min-child,
          and subsample — at a fixed low learning rate with early stopping — finds a near-optimal model in a
          fraction of the evaluations a naive grid needs.
        </Callout>

        <h2>Which library?</h2>
        <ul style={ul}>
          <li><strong>Want a strong baseline with zero new dependencies?</strong> scikit-learn&rsquo;s <code>HistGradientBoostingClassifier/Regressor</code> — fast, few knobs, native categorical support.</li>
          <li><strong>Large or wide numeric data, want speed?</strong> <Link href="/learn/boosting/histogram" style={link}>LightGBM</Link>.</li>
          <li><strong>Want the robust, battle-tested standard with the richest tooling?</strong> XGBoost.</li>
          <li><strong>Lots of high-cardinality categoricals?</strong> <Link href="/learn/boosting/catboost" style={link}>CatBoost</Link>.</li>
        </ul>
        <p>
          All four are excellent; the accuracy differences between well-tuned versions are usually smaller than
          the difference between tuned and untuned. The library matters less than the discipline of the recipe.
        </p>

        <h2>Two failure modes to recognise</h2>
        <ul style={ul}>
          <li>
            <strong>Train ≫ validation, validation rising after a dip.</strong> Classic overfitting: lower the
            learning rate, shrink the trees, raise min-child, add subsampling — and trust{" "}
            <Link href="/learn/boosting/early-stopping" style={link}>early stopping</Link>.
          </li>
          <li>
            <strong>Train ≈ validation, both mediocre (like the <Link href="/learn/boosting/gbm-classification" style={link}>default HistGBM on covtype</Link>).</strong>{" "}
            Underfitting: over-eager early stopping or trees too shallow. Deepen the trees, increase patience, or
            allow more rounds.
          </li>
        </ul>

        <Quiz
          title="Can you answer these?"
          accent={TREES}
          questions={[
            {
              q: <>What should you tune first, and why?</>,
              options: [
                "reg_lambda, because regularisation is most important",
                "A low learning rate with early stopping, because it decouples and auto-selects the tree count",
                "max_depth, because capacity dominates",
              ],
              answer: 1,
              explain: <>Fixing a small learning rate and letting early stopping choose n_estimators removes the two biggest hyperparameters and makes the rest of the search well-behaved.</>,
            },
            {
              q: <>Your booster shows training R² 0.99 but validation R² 0.80 and falling. The fix is to…</>,
              options: [
                "Add more trees at the same settings",
                "Lower the learning rate, shrink the trees, raise min-child / subsample, and rely on early stopping",
                "Increase max_depth",
              ],
              answer: 1,
              explain: <>That gap is overfitting; every remedy makes each tree weaker or halts sooner. Deepening trees would make it worse.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/boosting/catboost", label: <>← Categorical features: CatBoost &amp; ordered boosting</> }}
          next={{ href: "/learn/boosting/functional-gradient", label: <>Next up · Boosting as functional gradient descent →</> }}
        />
      </div>
    </article>
  );
}

const ol: React.CSSProperties = { margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.9 };
const ul: React.CSSProperties = { margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.85 };
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
