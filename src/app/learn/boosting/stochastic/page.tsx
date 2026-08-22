import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeOutput } from "@/components/CodeOutput";

export const metadata = {
  title: "Stochastic gradient boosting — Manifold",
  description:
    "Borrowing the forest's best trick: fit each boosting tree on a random subsample of rows, and consider only a random subset of features per split. A dash of randomness decorrelates the trees, regularizes the ensemble, and speeds up training — often for free.",
};

const TREES = "var(--c-trees)";

export default function StochasticPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 2 · practitioner", color: "var(--c-fundamentals)" }]}
        time="about 6 minutes"
        title={<>Stochastic gradient boosting</>}
        intro={<>
          Friedman noticed that boosting could borrow the one idea that makes a random forest work: injected
          randomness. Fit each tree on a random <em>subsample</em> of the data rather than all of it, and the
          ensemble usually gets better, not worse — the method he named <strong>stochastic gradient boosting</strong>.
        </>}
      />

      <div className="lesson">
        <h2>Two kinds of subsampling</h2>
        <ul style={ul}>
          <li>
            <strong>Row subsampling (<code>subsample</code>).</strong> Before fitting each tree, draw a random
            fraction — typically 50–80% — of the training rows, <em>without</em> replacement, and compute that
            tree&rsquo;s pseudo-residuals and splits on the subsample only. Every tree sees a different slice, so
            the trees decorrelate and no single quirk of the data gets over-fit.
          </li>
          <li>
            <strong>Column subsampling (<code>colsample</code>).</strong> Borrowed directly from the{" "}
            <Link href="/learn/random-forests/decorrelating-the-trees" style={link}>random forest</Link>:
            consider only a random subset of features when choosing each split (or each tree). This further
            decorrelates the trees and stops a few dominant features from being chosen in every tree.
          </li>
        </ul>
        <p>
          Note the difference from bagging: a forest draws a bootstrap <em>with</em> replacement and its trees are
          independent; stochastic boosting draws a subsample <em>without</em> replacement and its trees are still
          sequential — the randomness rides on top of the boosting loop, it doesn&rsquo;t replace it.
        </p>

        <h2>The effect, measured</h2>
        <p>California housing, learning rate 0.1, 300 trees, varying only the row subsample:</p>
        <CodeOutput label="test R² vs subsample fraction">{`  subsample = 1.0    R²  0.815   (full-batch — the plain GBM)
  subsample = 0.8    R²  0.813
  subsample = 0.5    R²  0.812`}</CodeOutput>
        <p>
          Here the accuracy is essentially flat — a whisker lower, well within noise. That is the honest picture
          on this particular dataset: subsampling did not buy accuracy. What it <em>did</em> buy is the two things
          that don&rsquo;t show up in a single R² number:
        </p>
        <ul style={ul}>
          <li>
            <strong>Speed.</strong> Fitting each tree on half the rows is roughly twice as fast. On large data
            that alone justifies <code>subsample=0.5</code>.
          </li>
          <li>
            <strong>Regularisation headroom.</strong> The gap between train and test loss narrows, which means you
            can afford a slightly larger learning rate or deeper trees before overfitting bites. On noisier, more
            over-fittable datasets than this one, that headroom turns into a real accuracy gain.
          </li>
        </ul>

        <Callout color={TREES} title={<>A free out-of-bag signal, too</>}>
          When <code>subsample &lt; 1</code>, each tree leaves out some rows, so — exactly as with a forest&rsquo;s{" "}
          <Link href="/learn/random-forests/out-of-bag-error" style={link}>out-of-bag error</Link> — you can
          estimate the improvement each tree makes on data it didn&rsquo;t see. scikit-learn exposes this as{" "}
          <code>oob_improvement_</code>, a cheap proxy for a validation curve that needs no held-out set.
        </Callout>

        <h2>Sensible defaults</h2>
        <p>
          <code>subsample</code> around <strong>0.5–0.8</strong> and <code>colsample</code> around{" "}
          <strong>0.5–1.0</strong> are standard starting points; XGBoost and LightGBM expose both and they are
          among the first knobs to tune after the learning rate. The mental model is simple:{" "}
          <strong>subsampling is the forest&rsquo;s randomness, sprinkled onto boosting</strong> — a little
          decorrelation that costs almost nothing and sometimes helps a lot. It pairs naturally with the other
          structural knobs, which are next.
        </p>

        <PrevNext
          prev={{ href: "/learn/boosting/shrinkage", label: <>← The learning rate &amp; shrinkage</> }}
          next={{ href: "/learn/boosting/tree-knobs", label: <>Next up · Tree structure &amp; the other knobs →</> }}
        />
      </div>
    </article>
  );
}

const ul: React.CSSProperties = { margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.85 };
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
